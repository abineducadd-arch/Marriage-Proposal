import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, X } from "lucide-react";

export function PreviewBanner({ preview }: { preview: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (!preview || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/90 backdrop-blur-md text-amber-100 text-xs py-2 px-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold">Story Preview Mode (Draft)</span>
        <span className="hidden sm:inline text-amber-200/80">
          — Testing your personalized proposal experience
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 font-medium bg-amber-700/80 hover:bg-amber-700 text-white px-2.5 py-1 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Back to Admin Panel</span>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-300 hover:text-white p-0.5"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
