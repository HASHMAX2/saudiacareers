import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let storageClient;

function getClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase storage is not configured");
  }

  storageClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return storageClient;
}

export async function uploadPrivateFile(path, fileBody, contentType) {
  const { data, error } = await getClient()
    .storage.from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, fileBody, { contentType, upsert: false });
  if (error) throw error;
  return data.path;
}

export async function removePrivateFile(path) {
  const { error } = await getClient()
    .storage.from(env.SUPABASE_STORAGE_BUCKET)
    .remove([path]);
  if (error) throw error;
}

export async function createSignedDownloadUrl(path, expiresInSeconds = 3600) {
  const { data, error } = await getClient()
    .storage.from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds, { download: true });
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadPrivateFile(path) {
  const { data, error } = await getClient()
    .storage.from(env.SUPABASE_STORAGE_BUCKET)
    .download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}
