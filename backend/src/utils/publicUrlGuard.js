import dns from "node:dns/promises";
import net from "node:net";
import { ApiError } from "./ApiError.js";

// SA-05: the scraped-job "recrawl" health check makes a server-side request
// to an admin-supplied URL with no restriction on where it can point. This
// rejects loopback/private-network/link-local/cloud-metadata addresses (and
// non-http(s) schemes) before any fetch is issued, so the feature can't be
// used to probe internal infrastructure or a cloud metadata endpoint.
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function isBlockedIpv4(address) {
  const [a, b] = address.split(".").map(Number);
  if (a === 127) return true; // loopback
  if (a === 10) return true; // RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT / shared address space
  if (a === 0) return true;
  return false;
}

function isBlockedIpv6(address) {
  const lower = address.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7 unique local
  if (lower.startsWith("::ffff:")) return isBlockedIpv4(lower.slice(7)); // IPv4-mapped IPv6
  return false;
}

function isBlockedIp(address) {
  return net.isIPv4(address) ? isBlockedIpv4(address) : isBlockedIpv6(address);
}

const UNREACHABLE_MESSAGE = "That address can't be reached from this server.";

// Throws if the URL isn't a public http(s) address. Resolves hostnames via
// DNS so a public-looking domain that resolves to a private/internal IP is
// still caught, not just literal IPs typed directly.
export async function assertPublicHttpUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ApiError(422, "That URL isn't valid.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError(422, "Only http(s) URLs are allowed.");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) throw new ApiError(422, UNREACHABLE_MESSAGE);

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new ApiError(422, UNREACHABLE_MESSAGE);
    return;
  }

  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ApiError(422, "That domain couldn't be resolved.");
  }
  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    throw new ApiError(422, UNREACHABLE_MESSAGE);
  }
}
