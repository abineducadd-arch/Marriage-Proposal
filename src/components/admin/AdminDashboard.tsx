import { type ProposalConfig, DEFAULT_PAGE_TWO } from "@/lib/proposal-config";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Sparkles,
  KeyRound,
  Film,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Save,
  AlertTriangle,
  Gift,
  Image as ImageIcon,
} from "lucide-react";

interface AdminDashboardProps {
  config: ProposalConfig;
  isDirty: boolean;
  onNavigate: (section: "personal" | "messages" | "video" | "preview" | "settings") => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function AdminDashboard({
  config,
  isDirty,
  onNavigate,
  onSaveDraft,
  onPublish,
}: AdminDashboardProps) {
  const { personalDetails, pageTwo, video } = config;

  const isPersonalConfigured = Boolean(
    personalDetails.recipientName.trim() || personalDetails.senderName.trim(),
  );

  const customizedMessagesCount = [
    pageTwo.chocolate.clue !== DEFAULT_PAGE_TWO.chocolate.clue ||
      pageTwo.chocolate.title !== DEFAULT_PAGE_TWO.chocolate.title,
    pageTwo.gift.clue !== DEFAULT_PAGE_TWO.gift.clue ||
      pageTwo.gift.title !== DEFAULT_PAGE_TWO.gift.title,
    pageTwo.picture.clue !== DEFAULT_PAGE_TWO.picture.clue ||
      pageTwo.picture.title !== DEFAULT_PAGE_TWO.picture.title,
  ].filter(Boolean).length;

  const coupleTitle = personalDetails.recipientName
    ? personalDetails.senderName
      ? `${personalDetails.senderName} & ${personalDetails.recipientName}`
      : `For ${personalDetails.recipientName}`
    : "Romantic Proposal Creator";

  return (
    <div className="space-y-8">
      {/* Welcome & Publishing Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50/50 to-orange-50/30 p-6 sm:p-8 border border-rose-200/60 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalization Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold italic text-foreground">
              {coupleTitle} ♡
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Customize the romantic adventure, edit clues, upload your proposal video, and preview
              before publishing.
            </p>
          </div>

          {/* Quick Publish / Save Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate("preview")}
              className="btn-admin-outline text-xs gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Story
            </Button>

            <Button
              type="button"
              onClick={onSaveDraft}
              className="btn-admin-primary text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </Button>

            <Button type="button" onClick={onPublish} className="btn-admin-gold text-xs gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Publish Changes
            </Button>
          </div>
        </div>

        {/* Status Callout Bar */}
        <div className="mt-6 pt-5 border-t border-rose-200/50 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Status:</span>
            {isDirty ? (
              <span className="admin-badge admin-badge-draft">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Unsaved Draft Changes
              </span>
            ) : config.isPublished ? (
              <span className="admin-badge admin-badge-published">
                <CheckCircle2 className="w-3 h-3" />
                All Changes Published & Live
              </span>
            ) : (
              <span className="admin-badge admin-badge-gold">
                <Clock className="w-3 h-3" />
                Draft Saved (Ready to Publish)
              </span>
            )}
          </div>

          <div className="text-muted-foreground">
            Last updated:{" "}
            {new Date(config.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Personal Details */}
        <div className="admin-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Personal Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPersonalConfigured
                  ? `${personalDetails.recipientName || "Recipient"} & ${personalDetails.senderName || "Sender"}`
                  : "Using generic defaults"}
              </p>
            </div>
            <div className="pt-2 text-xs">
              {isPersonalConfigured ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Personalized
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Not personalized yet</span>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("personal")}
            className="w-full text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 justify-between px-2"
          >
            <span>Edit details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Card 2: Page 2 Messages */}
        <div className="admin-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Page 2 Clues</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                3 interactive discovery objects
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-900 font-medium">
                🍫 Chocolate
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-900 font-medium">
                🎁 Gift
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-900 font-medium">
                🖼️ Picture
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("messages")}
            className="w-full text-xs text-amber-800 hover:text-amber-900 hover:bg-amber-50 justify-between px-2"
          >
            <span>
              {customizedMessagesCount > 0
                ? `${customizedMessagesCount} notes customized`
                : "Edit clues"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Card 3: Proposal Video */}
        <div className="admin-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Proposal Video</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Played on the tablet at the end
              </p>
            </div>
            <div className="pt-2 text-xs">
              {video?.hasVideo ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Custom Video Uploaded
                </span>
              ) : (
                <span className="text-muted-foreground">Default placeholder active</span>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("video")}
            className="w-full text-xs text-purple-700 hover:text-purple-800 hover:bg-purple-50 justify-between px-2"
          >
            <span>{video?.hasVideo ? "Change video" : "Upload video"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Card 4: Story Preview */}
        <div className="admin-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Live Experience</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ready for testing & delivery</p>
            </div>
            <div className="pt-2 text-xs">
              <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                Public URL: / (Isolated)
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("preview")}
            className="w-full text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 justify-between px-2"
          >
            <span>Preview in dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Story Flow Visual Checklist */}
      <div className="admin-card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div>
            <h3 className="text-lg font-bold font-display italic text-foreground">
              Romantic Story Experience Flow
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any stage below to jump directly to its customizer.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
            3-Chapter Adventure
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chapter 1 */}
          <div
            onClick={() => onNavigate("personal")}
            className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/60 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Chapter 1
              </span>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">Mochi's Storybook Welcome</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mochi welcomes {personalDetails.recipientName || "your partner"} with a personalized
              greeting and invites them to begin exploring.
            </p>
            <div className="text-xs text-rose-700 font-medium pt-2">Personalize greetings →</div>
          </div>

          {/* Chapter 2 */}
          <div
            onClick={() => onNavigate("messages")}
            className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/60 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Chapter 2
              </span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">
              The Mysterious Dark Room & Clues
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recipient moves the flashlight to find the light switch, then discovers the chocolate,
              gift, and picture notes.
            </p>
            <div className="text-xs text-amber-800 font-medium pt-2">
              Edit the 3 romantic notes →
            </div>
          </div>

          {/* Chapter 3 */}
          <div
            onClick={() => onNavigate("video")}
            className="p-5 rounded-2xl bg-purple-50/40 border border-purple-200/60 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Chapter 3
              </span>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">
              Mission Control, Proposal & Video
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Interdimensional AI briefing, proposal letter with the question, Yes/No interaction,
              and the personal video tablet.
            </p>
            <div className="text-xs text-purple-800 font-medium pt-2">
              Upload custom proposal video →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
