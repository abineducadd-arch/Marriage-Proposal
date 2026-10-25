import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Types corresponding to the PostgreSQL tables created in Supabase.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface SiteSettingRow {
  id: string;
  key: string;
  value: Record<string, unknown> | unknown;
  updated_at: string;
}

export interface RomanticNoteRow {
  id: string;
  object_key: string; // 'chocolate' | 'gift' | 'picture'
  title: string;
  message: string;
  updated_at: string;
}

export interface MediaAssetRow {
  id: string;
  asset_key: string;
  storage_path: string;
  original_filename: string | null;
  content_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export const SUPABASE_STORAGE_BUCKET = "proposal-media";

// Read environment variables using index signature access for TypeScript noPropertyAccessFromIndexSignature compliance
const env = import.meta.env as Record<string, string | undefined>;
const rawUrl = (env["VITE_SUPABASE_URL"] || env["NEXT_PUBLIC_SUPABASE_URL"] || "").trim();
const rawKey = (
  env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  env["VITE_SUPABASE_ANON_KEY"] ||
  env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ||
  env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
  ""
).trim();

const isPlaceholderUrl =
  !rawUrl || rawUrl.includes("your-project-id") || !rawUrl.startsWith("http");
const isPlaceholderKey =
  !rawKey || rawKey.includes("your-supabase-publishable") || rawKey.length < 20;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(rawUrl && rawKey && !isPlaceholderUrl && !isPlaceholderKey);
};

let _clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!_clientInstance) {
    _clientInstance = createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return _clientInstance;
}

export const supabase = isSupabaseConfigured() ? getSupabase() : null;
