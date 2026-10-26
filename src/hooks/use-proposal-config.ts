import { useEffect, useState } from "react";
import {
  CONFIG_CHANGE_EVENT,
  DEFAULT_PROPOSAL_CONFIG,
  getDraftConfig,
  getPublishedConfig,
  publishConfig,
  type ProposalConfig,
} from "@/lib/proposal-config";
import {
  getVideoBlob,
  getOrCreateVideoObjectUrl,
  revokeVideoObjectUrl,
  type VideoTarget,
} from "@/lib/video-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchProposalDataFromSupabase } from "@/lib/supabase-service";

export interface UseProposalConfigOptions {
  preview?: boolean;
  loadVideo?: boolean;
}

export function useProposalConfig(options?: UseProposalConfigOptions) {
  // Determine if preview mode is active from options or query parameter ?preview=true
  const isPreviewMode = () => {
    if (typeof options?.preview === "boolean") return options.preview;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("preview") === "true";
    }
    return false;
  };

  const [preview] = useState<boolean>(isPreviewMode);
  const [config, setConfig] = useState<ProposalConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_PROPOSAL_CONFIG;
    return preview ? getDraftConfig() : getPublishedConfig();
  });

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);

  // Sync config whenever storage, Supabase, or custom event fires
  useEffect(() => {
    let isCancelled = false;

    const updateFromLocal = () => {
      const latest = preview ? getDraftConfig() : getPublishedConfig();
      setConfig(latest);
    };

    updateFromLocal();

    // If Supabase is configured, fetch the persistent backend version
    if (isSupabaseConfigured()) {
      fetchProposalDataFromSupabase()
        .then((payload) => {
          if (isCancelled || !payload || !payload.hasSupabaseData) return;
          setConfig(payload.config);
          // Keep local cache synchronized for instant subsequent visits
          if (!preview) {
            publishConfig(payload.config);
          }
        })
        .catch((err) => {
          console.warn("Could not retrieve proposal config from Supabase, using local cache:", err);
        });
    }

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ scope: string; config: ProposalConfig }>;
      if (
        customEvent.detail?.scope === "all" ||
        (preview
          ? customEvent.detail?.scope === "draft"
          : customEvent.detail?.scope === "published")
      ) {
        updateFromLocal();
      }
    };

    window.addEventListener(CONFIG_CHANGE_EVENT, handleCustomChange);
    window.addEventListener("storage", updateFromLocal);

    return () => {
      isCancelled = true;
      window.removeEventListener(CONFIG_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener("storage", updateFromLocal);
    };
  }, [preview]);

  // Load video blob from IndexedDB or use external URL (deferred if loadVideo is false)
  const shouldLoadVideo = options?.loadVideo ?? true;

  useEffect(() => {
    let cancelled = false;

    async function loadVideo() {
      if (!shouldLoadVideo) {
        return;
      }

      // If an external URL is set, use it directly
      if (config.video?.externalUrl) {
        setVideoSrc(config.video.externalUrl);
        return;
      }

      if (!config.video?.hasVideo) {
        setVideoSrc(null);
        return;
      }

      setIsLoadingVideo(true);
      try {
        const target: VideoTarget = preview ? "draft" : "published";
        const stored = await getVideoBlob(target);

        if (cancelled) return;

        if (stored?.blob) {
          const urlKey = `${target}_${stored.updatedAt}`;
          const url = getOrCreateVideoObjectUrl(urlKey, stored.blob);
          setVideoSrc(url);
        } else {
          setVideoSrc(null);
        }
      } catch (err) {
        console.warn("Failed to load video:", err);
        if (!cancelled) setVideoSrc(null);
      } finally {
        if (!cancelled) setIsLoadingVideo(false);
      }
    }

    loadVideo();

    return () => {
      cancelled = true;
    };
  }, [shouldLoadVideo, config.video?.hasVideo, config.video?.externalUrl, config.video?.updatedAt, preview]);


  return {
    config,
    preview,
    videoSrc,
    isLoadingVideo,
  };
}
