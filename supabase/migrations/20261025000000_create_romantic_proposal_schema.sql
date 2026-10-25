-- ==============================================================================
-- ROMANTIC PROPOSAL WEBSITE — SUPABASE DATABASE SCHEMA MIGRATION
-- ==============================================================================
-- Creates persistent PostgreSQL tables, Row-Level Security (RLS) policies,
-- storage bucket configuration, and initial seed data for the romantic proposal.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE: site_settings
-- Stores global website configuration, personal details, settings, and proposal metadata.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for high-speed lookups by setting key
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings (key);

-- 3. TABLE: romantic_notes
-- Stores the 3 romantic messages and titles revealed on Page 2 for
-- Chocolate Box, Gift Box, and Framed Picture.
CREATE TABLE IF NOT EXISTS public.romantic_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for object_key lookups
CREATE INDEX IF NOT EXISTS idx_romantic_notes_object_key ON public.romantic_notes (object_key);

-- 4. TABLE: media_assets
-- Stores metadata and storage references for uploaded media (e.g., proposal video).
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for media lookups
CREATE INDEX IF NOT EXISTS idx_media_assets_asset_key ON public.media_assets (asset_key);
CREATE INDEX IF NOT EXISTS idx_media_assets_storage_path ON public.media_assets (storage_path);

-- 5. AUTOMATIC updated_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_romantic_notes_updated_at ON public.romantic_notes;
CREATE TRIGGER set_romantic_notes_updated_at
  BEFORE UPDATE ON public.romantic_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER set_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Mandatory: Database is not publicly writable.
-- Visitors can read only what they need to experience the proposal.
-- Only authenticated administrators can insert, update, or delete content.

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romantic_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- 6.1 site_settings Policies
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated admin full access to site settings" ON public.site_settings;
CREATE POLICY "Authenticated admin full access to site settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6.2 romantic_notes Policies
DROP POLICY IF EXISTS "Public can view romantic notes" ON public.romantic_notes;
CREATE POLICY "Public can view romantic notes"
  ON public.romantic_notes
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated admin full access to romantic notes" ON public.romantic_notes;
CREATE POLICY "Authenticated admin full access to romantic notes"
  ON public.romantic_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6.3 media_assets Policies
DROP POLICY IF EXISTS "Public can view media assets metadata" ON public.media_assets;
CREATE POLICY "Public can view media assets metadata"
  ON public.media_assets
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated admin full access to media assets" ON public.media_assets;
CREATE POLICY "Authenticated admin full access to media assets"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. SUPABASE STORAGE BUCKET: proposal-media
-- Create public bucket for video hosting if it does not already exist.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-media',
  'proposal-media',
  true,
  209715200, -- 200MB maximum file size
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

-- Storage RLS Policies
-- Allow anyone to read/stream proposal media
DROP POLICY IF EXISTS "Public can view proposal media" ON storage.objects;
CREATE POLICY "Public can view proposal media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'proposal-media');

-- Allow only authenticated admin users to upload, update, or delete media files
DROP POLICY IF EXISTS "Admin upload proposal media" ON storage.objects;
CREATE POLICY "Admin upload proposal media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proposal-media');

DROP POLICY IF EXISTS "Admin update proposal media" ON storage.objects;
CREATE POLICY "Admin update proposal media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proposal-media')
  WITH CHECK (bucket_id = 'proposal-media');

DROP POLICY IF EXISTS "Admin delete proposal media" ON storage.objects;
CREATE POLICY "Admin delete proposal media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'proposal-media');

-- 8. INITIAL SEED DATA
-- Preserves existing default romantic messages and settings without losing data.

-- Seed default site settings
INSERT INTO public.site_settings (key, value)
VALUES
  ('personal_details', '{
    "senderName": "",
    "recipientName": "",
    "recipientNickname": "",
    "greeting": "",
    "anniversaryDate": "",
    "introMessage": "",
    "closingMessage": ""
  }'::jsonb),
  ('settings', '{
    "maxVideoSizeMB": 100
  }'::jsonb),
  ('proposal_config', '{
    "personalDetails": {
      "senderName": "",
      "recipientName": "",
      "recipientNickname": "",
      "greeting": "",
      "anniversaryDate": "",
      "introMessage": "",
      "closingMessage": ""
    },
    "settings": {
      "maxVideoSizeMB": 100
    },
    "version": 1,
    "isPublished": true
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed default romantic notes with original text
INSERT INTO public.romantic_notes (object_key, title, message)
VALUES
  (
    'chocolate',
    'A Little Sweetness for You',
    'They say chocolate makes life sweeter, but you make my entire world sweeter just by being in it. If I could give you one chocolate for every moment you''ve made me smile, this box would never be big enough. ❤️'
  ),
  (
    'gift',
    'A Little Gift from My Heart',
    'If I could wrap up all the happiness you''ve brought into my life, it would be the most beautiful gift in the world. But even that wouldn''t be enough to show you how special you are to me. You are a gift I never want to stop unwrapping, one beautiful day at a time. 💝'
  ),
  (
    'picture',
    'A Picture Worth a Thousand Feelings',
    'Some pictures capture a moment, but some people make every moment worth remembering. If I could freeze one thing in time, it would be every little moment with you. And if I could choose my favourite view in the whole world, it would always be you. ❤️'
  )
ON CONFLICT (object_key) DO NOTHING;
