# Connect Romantic Proposal Website to Supabase

This guide walks you through connecting your romantic proposal website to a persistent Supabase backend for PostgreSQL database storage, administrator authentication, and media storage.

---

## 1. Architecture Overview

Your website uses three core Supabase services:

- **Supabase PostgreSQL**: Stores editable personal details, romantic messages, and video metadata.
- **Supabase Auth**: Authenticates administrators accessing the `/admin` portal.
- **Supabase Storage**: Hosts uploaded proposal video files with public streaming and restricted admin uploads.

### Database Schema

| Table                   | Purpose                                         | Columns                                                                                                         |
| ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `public.site_settings`  | Global content, couple details & admin settings | `id`, `key` (unique), `value` (JSONB), `updated_at`                                                             |
| `public.romantic_notes` | The 3 romantic messages revealed on Page 2      | `id`, `object_key` (unique: `chocolate`, `gift`, `picture`), `title`, `message`, `updated_at`                   |
| `public.media_assets`   | Metadata for uploaded video files               | `id`, `asset_key`, `storage_path`, `original_filename`, `content_type`, `file_size`, `created_at`, `updated_at` |

### Storage Bucket

- **Bucket Name**: `proposal-media`
- **Visibility**: Public (allows public visitors to stream your proposal video)
- **Allowed MIME types**: `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`
- **Max File Size**: 200 MB

---

## 2. Step-by-Step Setup Guide

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account or log in.
2. Click **New Project**, choose an organization, name your project (e.g., `romantic-proposal`), and choose a secure database password.
3. Select the region closest to you or your partner.

---

### Step 2: Apply the SQL Migration

1. In your Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open [`supabase/migrations/20261025000000_create_romantic_proposal_schema.sql`](file:///d:/Antigravity/Marriage/supabase/migrations/20261025000000_create_romantic_proposal_schema.sql).
4. Copy the entire file content, paste it into the Supabase SQL editor, and click **Run**.
5. The script will:
   - Create `site_settings`, `romantic_notes`, and `media_assets` tables.
   - Configure Row Level Security (RLS) on all tables.
   - Create and configure the `proposal-media` Storage bucket.
   - Seed the initial default romantic notes and settings.

---

### Step 3: Configure Environment Variables

1. In your Supabase Dashboard, navigate to **Project Settings** (gear icon) → **API**.
2. Find:
   - **Project URL** (e.g., `https://xyzcompanyproject.supabase.co`)
   - **Project API keys** → `anon` / `public` key
3. In your local project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
   ```
   > [!IMPORTANT]
   > Never use the `service_role` or secret key in `.env`. Only use the `anon` / `public` key. Row-Level Security handles data protection.

---

### Step 4: Create Administrator Account

1. In your Supabase Dashboard, navigate to **Authentication** → **Users**.
2. Click **Add User** → **Create user**.
3. Enter your administrator email and a strong password.
4. Toggle **Auto Confirm User?** to **ON** (or verify via email).
5. Click **Create user**.

---

### Step 5: Test the Complete Admin Workflow

1. Start your local dev server:
   ```bash
   npm run dev
   ```
2. Navigate to [`/admin`](http://localhost:5173/admin).
3. Sign in with the administrator email and password you created in Step 4.
4. You will see the **Cloud Connected** status badge in the top navigation bar.
5. Edit your partner's name, personalized messages, or upload a video.
6. Click **Publish Changes** to push live updates directly to Supabase.
7. Open the public story in an Incognito window:
   - Page 1 shows your personalized welcome dialogue.
   - Page 2 reveals your custom notes under the Chocolate Box, Gift, and Picture.
   - Page 3 features your proposal letter and uploaded video.

---

## 3. Security & Row-Level Security (RLS) Policies

All database tables and storage files are protected by PostgreSQL Row-Level Security:

- **Public Visitors (Anonymous)**:
  - Can only `SELECT` (read) site settings, romantic notes, and media metadata.
  - Can stream videos from the `proposal-media` bucket.
  - **Cannot** insert, update, or delete any data.
- **Authenticated Administrator**:
  - Validated on the backend via Supabase Auth (`auth.role() = 'authenticated'`).
  - Has full permissions to insert, update, and delete settings, notes, and media assets.
- **Storage Upload Policy**:
  - Restricts uploads, replacements, and deletions exclusively to authenticated sessions.
  - Validates file type and size on both frontend and backend.
  - When replacing a video, the old storage object is deleted **only after** the replacement has successfully uploaded and registered in the database.

---

## 4. Offline Resilience & Graceful Fallbacks

- If Supabase is unreachable or unconfigured, the application gracefully falls back to cached local storage without crashing or displaying blank screens.
- Existing custom notes or personal details previously entered in localStorage are automatically migrated to Supabase when a fresh database is connected.
