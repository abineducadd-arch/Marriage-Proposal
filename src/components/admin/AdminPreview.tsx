import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  ExternalLink,
  Sparkles,
  Layers,
} from "lucide-react";

interface AdminPreviewProps {
  isDraft: boolean;
}

export function AdminPreview({ isDraft }: AdminPreviewProps) {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [previewVersion, setPreviewVersion] = useState<"draft" | "published">(
    isDraft ? "draft" : "published",
  );
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const queryParam = previewVersion === "draft" ? "?preview=true" : "";
  const iframeSrc = `${currentPath}${queryParam}`;

  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    }
  };

  const getDeviceWidthClass = () => {
    switch (device) {
      case "mobile":
        return "max-w-[400px]";
      case "tablet":
        return "max-w-[800px]";
      default:
        return "w-full";
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="admin-card p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Chapter Quick Jumps */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setCurrentPath("/")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              currentPath === "/"
                ? "bg-white text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Page 1: Welcome
          </button>
          <button
            type="button"
            onClick={() => setCurrentPath("/page-2")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              currentPath === "/page-2"
                ? "bg-white text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Page 2: Dark Room
          </button>
          <button
            type="button"
            onClick={() => setCurrentPath("/page-3")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              currentPath === "/page-3"
                ? "bg-white text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Page 3: Proposal & Video
          </button>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevice("desktop")}
            className={`h-8 px-2.5 text-xs gap-1.5 rounded-lg ${
              device === "desktop" ? "bg-white shadow-xs font-semibold" : "text-muted-foreground"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevice("tablet")}
            className={`h-8 px-2.5 text-xs gap-1.5 rounded-lg ${
              device === "tablet" ? "bg-white shadow-xs font-semibold" : "text-muted-foreground"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevice("mobile")}
            className={`h-8 px-2.5 text-xs gap-1.5 rounded-lg ${
              device === "mobile" ? "bg-white shadow-xs font-semibold" : "text-muted-foreground"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </Button>
        </div>

        {/* Version Switcher & Action buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setPreviewVersion("draft")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                previewVersion === "draft"
                  ? "bg-amber-100 text-amber-900 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Draft Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewVersion("published")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                previewVersion === "published"
                  ? "bg-emerald-100 text-emerald-900 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Published Live
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={reloadIframe}
            title="Refresh preview"
            className="h-8 w-8"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
            <a href={iframeSrc} target="_blank" rel="noopener noreferrer">
              <span>Open Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center w-full min-h-[640px] bg-zinc-900/5 rounded-2xl p-4 md:p-6 border border-border/80">
        <div
          className={`transition-all duration-300 w-full ${getDeviceWidthClass()} bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200/80 flex flex-col`}
          style={{ height: "720px" }}
        >
          {/* Mock Browser Header */}
          <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center justify-between text-xs text-muted-foreground select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="bg-white px-3 py-1 rounded-md text-[11px] font-mono border border-zinc-200 text-zinc-600 truncate max-w-xs">
              {window.location.origin}
              {iframeSrc}
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{previewVersion === "draft" ? "Draft Mode" : "Live Recipient Mode"}</span>
            </div>
          </div>

          {/* Actual Embedded Interactive Website */}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="Story Preview"
            className="w-full flex-1 border-0"
          />
        </div>
      </div>
    </div>
  );
}
