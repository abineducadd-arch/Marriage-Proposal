import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabase,
  isSupabaseConfigured,
  SUPABASE_STORAGE_BUCKET,
  type MediaAssetRow,
  type RomanticNoteRow,
  type SiteSettingRow,
} from "./supabase";
import {
  DEFAULT_PROPOSAL_CONFIG,
  DEFAULT_PERSONAL_DETAILS,
  DEFAULT_PAGE_TWO,
  DEFAULT_SETTINGS,
  type ProposalConfig,
  type PersonalDetails,
  type AdminSettings,
  type VideoMetadata,
  type PageTwoConfig,
} from "./proposal-config";

// ─── AUTHENTICATION HELPERS ──────────────────────────────────────────────────

/**
 * Returns the currently active administrator session, or null if unauthenticated.
 */
export async function getAdminSession(): Promise<Session | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;
    return data.session;
  } catch (err) {
    console.warn("Failed to check Supabase admin session:", err);
    return null;
  }
}

/**
 * Signs in an administrator using email and password via Supabase Auth.
 */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ session: Session | null; user: User | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return {
      session: null,
      user: null,
      error: new Error("Supabase is not configured. Please check your .env credentials."),
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { session: null, user: null, error };
    }

    return { session: data.session, user: data.user, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unexpected error during login.");
    return { session: null, user: null, error };
  }
}

/**
 * Signs out the current administrator.
 */
export async function signOutAdmin(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error: error || null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error("Failed to sign out.") };
  }
}

/**
 * Subscribes to Supabase authentication state changes.
 */
export function onAuthStateChange(
  callback: (session: Session | null, user: User | null) => void,
): () => void {
  const client = getSupabase();
  if (!client) return () => {};

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// ─── DATA FETCHING & MAPPING ────────────────────────────────────────────────

export interface FetchedProposalPayload {
  config: ProposalConfig;
  videoAsset: MediaAssetRow | null;
  hasSupabaseData: boolean;
}

/**
 * Fetches site settings, romantic notes, and media metadata from Supabase.
 * Returns a complete ProposalConfig merged with defaults, or null on network failure.
 */
export async function fetchProposalDataFromSupabase(): Promise<FetchedProposalPayload | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    // Parallel fetch: site_settings, romantic_notes, media_assets
    const [settingsRes, notesRes, mediaRes] = await Promise.all([
      client.from("site_settings").select("*"),
      client.from("romantic_notes").select("*"),
      client
        .from("media_assets")
        .select("*")
        .eq("asset_key", "proposal_video")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (settingsRes.error) {
      console.warn("Error fetching site_settings from Supabase:", settingsRes.error.message);
    }
    if (notesRes.error) {
      console.warn("Error fetching romantic_notes from Supabase:", notesRes.error.message);
    }
    if (mediaRes.error) {
      console.warn("Error fetching media_assets from Supabase:", mediaRes.error.message);
    }

    const settingsRows = (settingsRes.data as SiteSettingRow[] | null) || [];
    const notesRows = (notesRes.data as RomanticNoteRow[] | null) || [];
    const mediaRow = ((mediaRes.data as MediaAssetRow[] | null) || [])[0] || null;

    const hasAnyRecords = settingsRows.length > 0 || notesRows.length > 0 || Boolean(mediaRow);
    if (!hasAnyRecords) {
      return {
        config: DEFAULT_PROPOSAL_CONFIG,
        videoAsset: null,
        hasSupabaseData: false,
      };
    }

    // Map site_settings
    let personalDetails: PersonalDetails = { ...DEFAULT_PERSONAL_DETAILS };
    let adminSettings: AdminSettings = { ...DEFAULT_SETTINGS };
    let savedVideoMeta: VideoMetadata | null = null;
    let isPublished = true;

    for (const row of settingsRows) {
      if (row.key === "personal_details" && typeof row.value === "object" && row.value !== null) {
        personalDetails = {
          ...DEFAULT_PERSONAL_DETAILS,
          ...(row.value as unknown as Partial<PersonalDetails>),
        };
      } else if (row.key === "settings" && typeof row.value === "object" && row.value !== null) {
        adminSettings = {
          ...DEFAULT_SETTINGS,
          ...(row.value as unknown as Partial<AdminSettings>),
        };
      } else if (row.key === "video_meta" && typeof row.value === "object" && row.value !== null) {
        savedVideoMeta = row.value as unknown as VideoMetadata;
      } else if (
        row.key === "proposal_config" &&
        typeof row.value === "object" &&
        row.value !== null
      ) {
        const val = row.value as unknown as Partial<ProposalConfig>;
        if (val.personalDetails && !settingsRows.some((r) => r.key === "personal_details")) {
          personalDetails = { ...DEFAULT_PERSONAL_DETAILS, ...val.personalDetails };
        }
        if (val.settings && !settingsRows.some((r) => r.key === "settings")) {
          adminSettings = { ...DEFAULT_SETTINGS, ...val.settings };
        }
        if (val.isPublished !== undefined) {
          isPublished = val.isPublished;
        }
      }
    }

    // Map romantic_notes
    const pageTwo: PageTwoConfig = {
      chocolate: { ...DEFAULT_PAGE_TWO.chocolate },
      gift: { ...DEFAULT_PAGE_TWO.gift },
      picture: { ...DEFAULT_PAGE_TWO.picture },
    };

    for (const note of notesRows) {
      if (note.object_key === "chocolate") {
        pageTwo.chocolate = { title: note.title, clue: note.message };
      } else if (note.object_key === "gift") {
        pageTwo.gift = { title: note.title, clue: note.message };
      } else if (note.object_key === "picture") {
        pageTwo.picture = { title: note.title, clue: note.message };
      }
    }

    // Construct video metadata if media_assets row exists
    let video: VideoMetadata | null = savedVideoMeta;
    if (mediaRow) {
      const publicUrl = getProposalVideoPublicUrl(mediaRow.storage_path);
      video = {
        hasVideo: true,
        name: mediaRow.original_filename || "proposal-video.mp4",
        size: Number(mediaRow.file_size || 0),
        type: mediaRow.content_type || "video/mp4",
        externalUrl: publicUrl,
        updatedAt: new Date(mediaRow.updated_at).getTime(),
      };
    }

    const config: ProposalConfig = {
      personalDetails,
      pageTwo,
      video,
      settings: adminSettings,
      version: 1,
      updatedAt: Date.now(),
      isPublished,
    };

    return {
      config,
      videoAsset: mediaRow,
      hasSupabaseData: true,
    };
  } catch (err) {
    console.error("fetchProposalDataFromSupabase fatal error:", err);
    return null;
  }
}

// ─── SAVING & PERSISTING TO SUPABASE ─────────────────────────────────────────

/**
 * Saves proposal settings and romantic notes to Supabase PostgreSQL.
 * Uses atomic upserts to prevent loss of existing data and ensure idempotent updates.
 */
export async function saveProposalDataToSupabase(
  config: ProposalConfig,
  isPublished = true,
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      error: "Supabase connection is not available. Please verify your environment configuration.",
    };
  }

  try {
    // 1. Prepare site_settings upserts
    const settingsPayloads = [
      {
        key: "personal_details",
        value: config.personalDetails as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      {
        key: "settings",
        value: config.settings as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      {
        key: "video_meta",
        value: (config.video || {}) as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      {
        key: "proposal_config",
        value: {
          personalDetails: config.personalDetails,
          settings: config.settings,
          video: config.video,
          version: config.version,
          isPublished,
          updatedAt: Date.now(),
        } as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
    ];

    // 2. Prepare romantic_notes upserts
    const notesPayloads = [
      {
        object_key: "chocolate",
        title: config.pageTwo.chocolate.title,
        message: config.pageTwo.chocolate.clue,
        updated_at: new Date().toISOString(),
      },
      {
        object_key: "gift",
        title: config.pageTwo.gift.title,
        message: config.pageTwo.gift.clue,
        updated_at: new Date().toISOString(),
      },
      {
        object_key: "picture",
        title: config.pageTwo.picture.title,
        message: config.pageTwo.picture.clue,
        updated_at: new Date().toISOString(),
      },
    ];

    // 3. Execute upserts
    const [settingsResult, notesResult] = await Promise.all([
      client.from("site_settings").upsert(settingsPayloads, { onConflict: "key" }),
      client.from("romantic_notes").upsert(notesPayloads, { onConflict: "object_key" }),
    ]);

    if (settingsResult.error) {
      throw new Error(`Failed to save site settings: ${settingsResult.error.message}`);
    }
    if (notesResult.error) {
      throw new Error(`Failed to save romantic notes: ${notesResult.error.message}`);
    }

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save proposal data to Supabase.";
    console.error("saveProposalDataToSupabase error:", message);
    return { success: false, error: message };
  }
}

// ─── STORAGE & VIDEO MANAGEMENT ─────────────────────────────────────────────

/**
 * Returns the public URL for a file stored in the proposal-media bucket.
 */
export function getProposalVideoPublicUrl(storagePath: string): string {
  const client = getSupabase();
  if (!client || !storagePath) return "";

  const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export interface VideoUploadResult {
  success: boolean;
  asset?: MediaAssetRow;
  publicUrl?: string;
  error?: string;
}

/**
 * Uploads a video file to Supabase Storage and records metadata in media_assets.
 * Ensures that if replacing an existing video, the old file is NOT deleted until
 * the replacement upload and database insert have both succeeded.
 */
export async function uploadProposalVideoToSupabase(
  file: File,
  previousStoragePath?: string | null,
  maxSizeMB = 100,
): Promise<VideoUploadResult> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      error: "Supabase client is not available for video upload.",
    };
  }

  // 1. Validation
  const supportedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  const supportedExtensions = [".mp4", ".webm", ".mov", ".ogg"];

  if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(extension)) {
    return {
      success: false,
      error: `Unsupported video format (${file.type || extension}). Please upload an MP4, WebM, or MOV file.`,
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      success: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${maxSizeMB}MB.`,
    };
  }

  // 2. Generate unique storage path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueStoragePath = `videos/proposal_${Date.now()}_${sanitizedName}`;

  try {
    // 3. Upload file to Supabase Storage
    const { error: uploadError } = await client.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(uniqueStoragePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 4. Record metadata in media_assets table
    const mediaPayload = {
      asset_key: "proposal_video",
      storage_path: uniqueStoragePath,
      original_filename: file.name,
      content_type: file.type || "video/mp4",
      file_size: file.size,
      updated_at: new Date().toISOString(),
    };

    const { data: insertedAsset, error: dbError } = await client
      .from("media_assets")
      .insert(mediaPayload)
      .select()
      .single();

    if (dbError) {
      // Clean up newly uploaded file if metadata insertion fails
      await client.storage.from(SUPABASE_STORAGE_BUCKET).remove([uniqueStoragePath]);
      throw new Error(`Database registration failed: ${dbError.message}`);
    }

    const publicUrl = getProposalVideoPublicUrl(uniqueStoragePath);

    // 5. Safe replacement cleanup:
    // Only now that the new video is safely uploaded and recorded in the database,
    // delete the old video file if one was previously stored
    if (previousStoragePath && previousStoragePath !== uniqueStoragePath) {
      try {
        await client.storage.from(SUPABASE_STORAGE_BUCKET).remove([previousStoragePath]);
        // Also remove older media_assets rows for the previous path
        await client.from("media_assets").delete().eq("storage_path", previousStoragePath);
      } catch (cleanErr) {
        console.warn("Could not delete previous video file from storage:", cleanErr);
      }
    }

    return {
      success: true,
      asset: insertedAsset as MediaAssetRow,
      publicUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video upload failed unexpectedly.";
    console.error("uploadProposalVideoToSupabase error:", message);
    return { success: false, error: message };
  }
}

/**
 * Removes a proposal video from both Supabase Storage and media_assets.
 */
export async function removeProposalVideoFromSupabase(
  storagePath: string,
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: "Supabase client not available." };
  }

  try {
    // 1. Remove file from storage
    if (storagePath) {
      const { error: storageError } = await client.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([storagePath]);
      if (storageError) {
        console.warn("Storage deletion warning:", storageError.message);
      }
    }

    // 2. Remove record from media_assets
    const { error: dbError } = await client
      .from("media_assets")
      .delete()
      .eq("asset_key", "proposal_video");

    if (dbError) {
      console.warn("Database media_assets deletion warning:", dbError.message);
    }

    // 3. Clear video_meta in site_settings
    await client.from("site_settings").upsert([
      {
        key: "video_meta",
        value: {},
        updated_at: new Date().toISOString(),
      },
    ]);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove video.";
    return { success: false, error: message };
  }
}

// ─── LOCAL STORAGE MIGRATION ────────────────────────────────────────────────

export interface LocalMigrationResult {
  migrated: boolean;
  reason?: string | undefined;
}

/**
 * Migrates existing customized data from localStorage into Supabase.
 * Checks whether user has customized details or notes locally, and if Supabase is still empty,
 * automatically copies them to Supabase so no data is lost.
 */
export async function migrateLocalDataToSupabase(
  localConfig: ProposalConfig,
): Promise<LocalMigrationResult> {
  if (!isSupabaseConfigured()) {
    return { migrated: false, reason: "Supabase not configured." };
  }

  try {
    const existing = await fetchProposalDataFromSupabase();
    if (!existing) {
      return { migrated: false, reason: "Could not connect to Supabase." };
    }

    // If Supabase already has customized data, do not overwrite
    const supabaseHasData =
      Boolean(existing.config.personalDetails.recipientName.trim()) ||
      Boolean(existing.config.personalDetails.senderName.trim()) ||
      Boolean(existing.videoAsset);

    if (supabaseHasData) {
      return { migrated: false, reason: "Supabase already contains customized proposal data." };
    }

    // Check if localConfig has any customizations worth migrating
    const localHasCustomData =
      Boolean(localConfig.personalDetails.recipientName.trim()) ||
      Boolean(localConfig.personalDetails.senderName.trim()) ||
      Boolean(localConfig.personalDetails.greeting.trim()) ||
      Boolean(localConfig.personalDetails.introMessage.trim()) ||
      Boolean(localConfig.personalDetails.anniversaryDate.trim()) ||
      Boolean(localConfig.personalDetails.closingMessage.trim()) ||
      localConfig.pageTwo.chocolate.title !== DEFAULT_PAGE_TWO.chocolate.title ||
      localConfig.pageTwo.chocolate.clue !== DEFAULT_PAGE_TWO.chocolate.clue ||
      localConfig.pageTwo.gift.title !== DEFAULT_PAGE_TWO.gift.title ||
      localConfig.pageTwo.gift.clue !== DEFAULT_PAGE_TWO.gift.clue ||
      localConfig.pageTwo.picture.title !== DEFAULT_PAGE_TWO.picture.title ||
      localConfig.pageTwo.picture.clue !== DEFAULT_PAGE_TWO.picture.clue;

    if (!localHasCustomData) {
      return { migrated: false, reason: "No local customizations detected to migrate." };
    }

    // Save local config into Supabase
    const result = await saveProposalDataToSupabase(localConfig, true);
    if (result.success) {
      return { migrated: true };
    } else {
      return { migrated: false, reason: result.error ?? "Failed to save to database." };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Migration failed.";
    return { migrated: false, reason: msg };
  }
}
