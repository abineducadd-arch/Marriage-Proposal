import { useEffect, useRef, useState } from "react";
import { type VideoMetadata, type AdminSettings } from "@/lib/proposal-config";
import {
  saveVideoBlob,
  getVideoBlob,
  deleteVideo,
  getOrCreateVideoObjectUrl,
} from "@/lib/video-storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  UploadCloud,
  Film,
  Trash2,
  RefreshCw,
  Clock,
  HardDrive,
  FileVideo,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

interface ProposalVideoEditorProps {
  video: VideoMetadata | null;
  settings: AdminSettings;
  onChange: (updated: VideoMetadata | null) => void;
}

const SUPPORTED_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogg"];
const SUPPORTED_MIME_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

export function ProposalVideoEditor({ video, settings, onChange }: ProposalVideoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [externalUrlInput, setExternalUrlInput] = useState<string>(video?.externalUrl || "");
  const [mode, setMode] = useState<"file" | "url">(video?.externalUrl ? "url" : "file");

  // Load preview URL from IndexedDB on mount or when video metadata changes
  useEffect(() => {
    let active = true;

    async function loadCurrentVideo() {
      if (video?.externalUrl) {
        setPreviewUrl(video.externalUrl);
        return;
      }

      if (!video?.hasVideo) {
        setPreviewUrl(null);
        return;
      }

      try {
        const stored = await getVideoBlob("draft");
        if (active && stored?.blob) {
          const urlKey = `draft_preview_${stored.updatedAt}`;
          const url = getOrCreateVideoObjectUrl(urlKey, stored.blob);
          setPreviewUrl(url);
        }
      } catch (err) {
        console.warn("Could not load preview video from storage:", err);
      }
    }

    loadCurrentVideo();

    return () => {
      active = false;
    };
  }, [video?.hasVideo, video?.externalUrl, video?.updatedAt]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation 1: MIME or Extension check
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    const isSupportedExt = SUPPORTED_EXTENSIONS.includes(extension);
    const isSupportedMime = SUPPORTED_MIME_TYPES.includes(file.type);

    if (!isSupportedExt && !isSupportedMime) {
      setErrorMessage(
        `Unsupported video format (${file.type || extension}). Please upload an MP4, WebM, or MOV file.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validation 2: File size check against configured settings
    const maxSizeBytes = settings.maxVideoSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed size is ${settings.maxVideoSizeMB}MB. You can increase this in Settings if needed.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Begin upload progress simulation and IndexedDB save
    setIsUploading(true);
    setUploadProgress(15);

    try {
      // Step 1: Detect video duration using temporary URL
      const tempUrl = URL.createObjectURL(file);
      const duration = await new Promise<number>((resolve) => {
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = tempUrl;
        tempVideo.onloadedmetadata = () => {
          URL.revokeObjectURL(tempUrl);
          resolve(tempVideo.duration || 0);
        };
        tempVideo.onerror = () => {
          URL.revokeObjectURL(tempUrl);
          resolve(0);
        };
      });

      setUploadProgress(50);

      // Step 2: Store file in IndexedDB
      await saveVideoBlob("draft", file, {
        name: file.name,
        size: file.size,
        type: file.type || "video/mp4",
        duration,
      });

      setUploadProgress(85);

      const metadata: VideoMetadata = {
        hasVideo: true,
        name: file.name,
        size: file.size,
        type: file.type || "video/mp4",
        duration,
        updatedAt: Date.now(),
      };

      onChange(metadata);

      setUploadProgress(100);
      setSuccessMessage(`"${file.name}" uploaded successfully!`);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err: unknown) {
      console.error("Video upload error:", err);
      const msg = err instanceof Error ? err.message : "Failed to process and store video.";
      setErrorMessage(msg);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove this proposal video? The original placeholder will be displayed.",
      )
    ) {
      return;
    }

    try {
      await deleteVideo("draft");
      setPreviewUrl(null);
      setExternalUrlInput("");
      onChange(null);
      setSuccessMessage("Video removed. Proposal page restored to default placeholder.");
    } catch (err) {
      console.error("Failed to remove video:", err);
    }
  };

  const handleSaveExternalUrl = () => {
    if (!externalUrlInput.trim()) {
      onChange(null);
      setSuccessMessage("External URL cleared.");
      return;
    }

    const metadata: VideoMetadata = {
      hasVideo: true,
      name: "External Video Stream",
      size: 0,
      type: "video/mp4",
      externalUrl: externalUrlInput.trim(),
      updatedAt: Date.now(),
    };

    onChange(metadata);
    setSuccessMessage("External video URL saved successfully!");
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "Duration detecting...";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Upload & Controls Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="admin-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display italic text-foreground flex items-center gap-2">
                <Film className="w-5 h-5 text-rose-500" />
                Proposal Video
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a special video message played on the interdimensional tablet in Chapter 3.
              </p>
            </div>

            <div className="flex bg-muted/60 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`px-3 py-1 rounded-md transition-all ${
                  mode === "file"
                    ? "bg-white text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`px-3 py-1 rounded-md transition-all ${
                  mode === "url"
                    ? "bg-white text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                External URL
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === "file" ? (
            /* File Upload Mode */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
                onChange={handleFileSelect}
                className="hidden"
              />

              {video?.hasVideo && !video.externalUrl ? (
                /* Video already selected */
                <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white rounded-xl shadow-xs border border-amber-200">
                        <FileVideo className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm truncate max-w-xs sm:max-w-md">
                          {video.name}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5" />
                            {formatFileSize(video.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(video.duration)}
                          </span>
                          <span className="uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted">
                            {video.type.replace("video/", "")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveVideo}
                        disabled={isUploading}
                        className="text-xs gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-2 pt-2 border-t border-amber-200/50">
                      <div className="flex justify-between text-xs font-medium text-foreground">
                        <span>Uploading & Processing into Storage...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              ) : (
                /* Upload Dropzone */
                <div onClick={() => fileInputRef.current?.click()} className="video-dropzone group">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200/60 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">
                    Click to browse and upload proposal video
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Supports MP4, WebM, and MOV up to {settings.maxVideoSizeMB}MB.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-rose-100/80 text-rose-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    Stored safely in browser IndexedDB (never Base64 in config)
                  </div>

                  {isUploading && (
                    <div className="mt-6 max-w-md mx-auto space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* External URL Mode */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="externalVideoUrl"
                  className="font-medium text-foreground flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Direct Video URL (MP4 / WebM stream)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="externalVideoUrl"
                    placeholder="https://example.com/videos/proposal.mp4"
                    value={externalUrlInput}
                    onChange={(e) => setExternalUrlInput(e.target.value)}
                    className="bg-background/80"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveExternalUrl}
                    className="btn-admin-primary shrink-0"
                  >
                    Apply URL
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this if your video is hosted on AWS S3, Cloudinary, Dropbox, or a custom CDN.
                </p>
              </div>

              {video?.externalUrl && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveVideo}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remove external link
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Guidelines */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-2">
            <h5 className="font-semibold text-foreground">
              Recommendations for your proposal video:
            </h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Keep the video between 1 to 3 minutes for the best emotional impact.</li>
              <li>Landscape (16:9) format looks spectacular inside the story tablet screen.</li>
              <li>
                When no video is uploaded, the existing romantic storybook placeholder is shown.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Live Playable Preview Column */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
        <div className="admin-card p-5 border-rose-200/60 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-sm text-foreground">Story Tablet Player Preview</h3>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                previewUrl ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
              }`}
            >
              {previewUrl ? "Custom Video Active" : "Using Storybook Placeholder"}
            </span>
          </div>

          <div className="mt-4 preview-tablet-frame">
            <div className="preview-tablet-screen">
              {previewUrl ? (
                <video
                  key={previewUrl}
                  controls
                  playsInline
                  src={previewUrl}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-white space-y-2">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-300">
                    ▶
                  </div>
                  <p className="font-hand text-lg text-rose-200">A little message just for you ♡</p>
                  <p className="text-[11px] text-zinc-400">Your special video will appear here.</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Responsive player automatically scales for iPhone, Android, and Desktop screens.
          </p>
        </div>
      </div>
    </div>
  );
}
