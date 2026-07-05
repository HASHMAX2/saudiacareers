import { useState } from "react";

const TINTS = [
  { bg: "var(--accent-subtle)", fg: "var(--accent)" },
  { bg: "var(--gold-bg)", fg: "var(--gold-ink)" },
  { bg: "var(--green-bg)", fg: "var(--green)" },
  { bg: "var(--purple-bg)", fg: "var(--purple-ink)" },
  { bg: "var(--pink-bg)", fg: "var(--pink-ink)" },
  { bg: "var(--teal-bg)", fg: "var(--teal-ink)" },
];

function tint(index) {
  return TINTS[index % TINTS.length];
}

function initials(name) {
  const parts = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name.slice(0, 2).toUpperCase();
}

function guessDomain(companyName) {
  return companyName
    .toLowerCase()
    .replace(/\b(pvt|ltd|llc|inc|co|corp|group|contracting|technologies|tech|hospitality|financial|digital|energy|retail|consulting|consultancy|services|solutions|healthcare)\b/g, "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "") + ".com";
}

export function LogoTile({ name, size = 46, radius = 11, index = 0, domain }) {
  const [failed, setFailed] = useState(false);
  const t = tint(index);
  const resolvedDomain = domain || guessDomain(name);
  const logoUrl = `https://logo.clearbit.com/${resolvedDomain}`;

  if (failed) {
    return (
      <div
        className="grid place-items-center shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: t.bg,
          color: t.fg,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: size * 0.33,
        }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ borderRadius: radius }}
      onError={() => setFailed(true)}
    />
  );
}

export { initials, tint };
