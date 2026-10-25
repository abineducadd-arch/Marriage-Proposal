import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DEFAULT_PROPOSAL_CONFIG,
  type ProposalConfig,
  getDraftConfig,
  getPublishedConfig,
  saveDraftConfig,
  publishConfig,
  discardDraft,
  resetAllToDefaults,
  hasDifferences,
} from "@/lib/proposal-config";
import { publishDraftVideo } from "@/lib/video-storage";
import { AdminDashboard } from "./AdminDashboard";
import { PersonalDetailsEditor } from "./PersonalDetailsEditor";
import { PageTwoMessagesEditor } from "./PageTwoMessagesEditor";
import { ProposalVideoEditor } from "./ProposalVideoEditor";
import { AdminPreview } from "./AdminPreview";
import { AdminSettingsEditor } from "./AdminSettingsEditor";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Heart,
  KeyRound,
  Film,
  Eye,
  Settings,
  Save,
  Send,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  AlertTriangle,
  RotateCcw,
  Cloud,
  CloudOff,
  LogOut,
  Loader2,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getAdminSession,
  signOutAdmin,
  onAuthStateChange,
  fetchProposalDataFromSupabase,
  saveProposalDataToSupabase,
  migrateLocalDataToSupabase,
} from "@/lib/supabase-service";
import { AdminLogin } from "./AdminLogin";
import "./admin.css";

export type AdminSection = "dashboard" | "personal" | "messages" | "video" | "preview" | "settings";

export function AdminLayout() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication states
  const supabaseConfigured = isSupabaseConfigured();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(supabaseConfigured);
  const [bypassOffline, setBypassOffline] = useState<boolean>(false);

  // Loading & network states
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Initialize draft and published config
  const [draftConfig, setDraftConfig] = useState<ProposalConfig>(() => getDraftConfig());
  const savedDraftRef = useRef<ProposalConfig>(getDraftConfig());
  const [publishedConfig, setPublishedConfig] = useState<ProposalConfig>(() =>
    getPublishedConfig(),
  );

  const [notification, setNotification] = useState<{
    type: "success" | "info" | "warning";
    message: string;
  } | null>(null);

  const isDirty = hasDifferences(draftConfig, savedDraftRef.current);
  const isUnpublished = hasDifferences(draftConfig, publishedConfig);

  // Check Supabase Authentication session on mount
  useEffect(() => {
    if (!supabaseConfigured) {
      setIsCheckingAuth(false);
      return;
    }

    let isMounted = true;
    getAdminSession().then((session) => {
      if (!isMounted) return;
      if (session) {
        setIsAuthenticated(true);
        setAdminUser(session.user);
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
      setIsCheckingAuth(false);
    });

    const unsubscribe = onAuthStateChange((session, user) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(session));
      setAdminUser(user);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [supabaseConfigured]);

  // Load latest settings & romantic notes from Supabase upon authentication
  useEffect(() => {
    if (!isAuthenticated && !bypassOffline) return;
    if (!supabaseConfigured) return;

    let isCancelled = false;
    setIsLoadingSupabase(true);

    fetchProposalDataFromSupabase()
      .then(async (payload) => {
        if (isCancelled || !payload) return;

        if (payload.hasSupabaseData) {
          setPublishedConfig(payload.config);
          setDraftConfig(payload.config);
          savedDraftRef.current = { ...payload.config };
          saveDraftConfig(payload.config);
          publishConfig(payload.config);
        } else {
          // Fresh database: check if localStorage has data to migrate
          const localDraft = getDraftConfig();
          const migration = await migrateLocalDataToSupabase(localDraft);
          if (migration.migrated) {
            showNotification("Existing local settings migrated to Supabase!", "info");
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote proposal config:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingSupabase(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, bypassOffline, supabaseConfigured]);

  // Warn on browser tab close or reload if there are unsaved in-memory changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes in your proposal draft. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const showNotification = (message: string, type: "success" | "info" | "warning" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSaveDraft = () => {
    saveDraftConfig(draftConfig);
    savedDraftRef.current = { ...draftConfig };
    showNotification("Draft changes saved successfully!", "success");
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Publish to Supabase if configured
      if (supabaseConfigured) {
        const res = await saveProposalDataToSupabase(draftConfig, true);
        if (!res.success) {
          showNotification(
            "Error saving to Supabase: " + (res.error || "Unknown error"),
            "warning",
          );
          setIsPublishing(false);
          return;
        }
      }

      // 2. Publish video from draft to published in IndexedDB
      await publishDraftVideo();

      // 3. Publish JSON config locally
      const published = publishConfig(draftConfig);
      setPublishedConfig(published);
      savedDraftRef.current = { ...draftConfig };

      showNotification(
        supabaseConfigured
          ? "✨ Proposal published to Supabase! All changes are now live."
          : "✨ Proposal published! All changes are now live for the recipient.",
        "success",
      );
    } catch (err: unknown) {
      console.error("Publishing error:", err);
      const msg = err instanceof Error ? err.message : "Failed to publish.";
      showNotification("Error publishing: " + msg, "warning");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setIsAuthenticated(false);
    setAdminUser(null);
    showNotification("Signed out successfully.", "info");
  };

  const handleDiscard = () => {
    if (window.confirm("Discard all draft changes and revert to the live published version?")) {
      const reverted = discardDraft();
      setDraftConfig(reverted);
      savedDraftRef.current = { ...reverted };
      showNotification("Draft discarded. Reverted to live published settings.", "info");
    }
  };

  const handleResetAll = async () => {
    if (supabaseConfigured) {
      try {
        await saveProposalDataToSupabase(DEFAULT_PROPOSAL_CONFIG, true);
      } catch (err) {
        console.warn("Could not reset Supabase config:", err);
      }
    }
    const reset = resetAllToDefaults();
    setDraftConfig(reset);
    savedDraftRef.current = { ...reset };
    setPublishedConfig(reset);
    showNotification("All proposal content reset to original defaults.", "info");
  };

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "personal",
      label: "Personal Details",
      icon: <Heart className="w-4 h-4" />,
      ...(draftConfig.personalDetails.recipientName ? { badge: "Ready" } : {}),
    },
    {
      id: "messages",
      label: "Page 2 Messages",
      icon: <KeyRound className="w-4 h-4" />,
      badge: "3 Clues",
    },
    {
      id: "video",
      label: "Proposal Video",
      icon: <Film className="w-4 h-4" />,
      badge: draftConfig.video?.hasVideo ? "Uploaded" : "Placeholder",
    },
    {
      id: "preview",
      label: "Live Preview",
      icon: <Eye className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-pink-50/70">
        <div className="flex flex-col items-center gap-3 text-rose-500">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg animate-pulse shadow-md shadow-rose-500/20">
            ♡
          </div>
          <p className="text-xs font-medium text-muted-foreground animate-pulse">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !bypassOffline) {
    return (
      <AdminLogin
        onSuccess={() => setIsAuthenticated(true)}
        onBypassOffline={() => setBypassOffline(true)}
      />
    );
  }

  return (
    <div className="admin-root flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="admin-header sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ♡
              </div>
              <div>
                <h1 className="font-display font-bold italic text-base sm:text-lg text-foreground leading-tight">
                  Proposal Suite
                </h1>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Administration & Story Personalizer
                </p>
              </div>
            </div>
          </div>

          {/* Status Badges & Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Connection Status Badge */}
            <div className="hidden sm:flex items-center text-xs">
              {supabaseConfigured ? (
                isLoadingSupabase ? (
                  <span className="admin-badge admin-badge-gold" title="Syncing with Supabase">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    Syncing...
                  </span>
                ) : (
                  <span
                    className="admin-badge admin-badge-published flex items-center gap-1.5"
                    title="Connected to Supabase PostgreSQL database"
                  >
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    Cloud Connected
                  </span>
                )
              ) : (
                <span
                  className="admin-badge admin-badge-draft flex items-center gap-1.5"
                  title="Operating in local storage mode"
                >
                  <CloudOff className="w-3 h-3 text-amber-600" />
                  Local Mode
                </span>
              )}
            </div>

            {/* In-Memory Dirty / Saved Status indicator */}
            <div className="hidden sm:flex items-center text-xs">
              {isDirty ? (
                <span className="admin-badge admin-badge-draft" title="You have unsaved changes">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Unsaved Changes
                </span>
              ) : isUnpublished ? (
                <span
                  className="admin-badge admin-badge-gold"
                  title="Draft saved locally, not yet published"
                >
                  <Sparkles className="w-3 h-3" />
                  Draft Saved (Not Live)
                </span>
              ) : (
                <span
                  className="admin-badge admin-badge-published"
                  title="Recipient sees current published configuration"
                >
                  Published & Live
                </span>
              )}
            </div>

            {/* Discard draft if dirty */}
            {isDirty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="hidden md:inline-flex text-xs text-muted-foreground hover:text-destructive gap-1"
                title="Discard uncommitted edits"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </Button>
            )}

            {/* Save Draft Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className={`text-xs gap-1.5 ${isDirty ? "border-amber-400 bg-amber-50/50 text-amber-900 font-semibold" : ""}`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </Button>

            {/* Publish Changes Button */}
            <Button
              type="button"
              size="sm"
              disabled={isPublishing}
              onClick={handlePublish}
              className="btn-admin-gold text-xs gap-1.5 shadow-xs"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Publish Changes</span>
                  <span className="sm:hidden">Publish</span>
                </>
              )}
            </Button>

            {/* Direct Link to Recipient's view */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Open public story in new tab"
            >
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>

            {/* Sign Out Button if Authenticated with Supabase */}
            {supabaseConfigured && isAuthenticated && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden lg:inline-flex text-xs text-muted-foreground hover:text-destructive gap-1"
                title={adminUser?.email ? `Signed in as ${adminUser.email}` : "Sign Out"}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            )}
          </div>
        </div>

        {/* Global Toast / Notification Bar */}
        {notification && (
          <div
            className={`max-w-7xl mx-auto mt-2 p-2.5 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-2 animate-rise ${
              notification.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : notification.type === "warning"
                  ? "bg-amber-50 border border-amber-200 text-amber-900"
                  : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{notification.message}</span>
          </div>
        )}
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col md:flex-row px-4 sm:px-6 py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Navigation
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`admin-nav-item w-full justify-between ${
                activeSection === item.id ? "active" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-normal">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Recipient Target Card in Sidebar */}
          <div className="mt-8 p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-2">
            <div className="font-semibold text-rose-900 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>Recipient Mode</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {draftConfig.personalDetails.recipientName
                ? `Created for ${draftConfig.personalDetails.recipientName} ♡`
                : "Ready to personalize for your partner."}
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px] bg-white gap-1 mt-1"
            >
              <Link to="/">
                <span>View Live Story</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer / Horizontal Bar */}
        {mobileMenuOpen && (
          <div className="md:hidden admin-card p-3 space-y-1 mb-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`admin-nav-item w-full justify-between ${
                  activeSection === item.id ? "active" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-normal">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeSection === "dashboard" && (
            <AdminDashboard
              config={draftConfig}
              isDirty={isDirty}
              onNavigate={(section) => setActiveSection(section)}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
            />
          )}

          {activeSection === "personal" && (
            <PersonalDetailsEditor
              details={draftConfig.personalDetails}
              onChange={(updated) =>
                setDraftConfig({
                  ...draftConfig,
                  personalDetails: updated,
                })
              }
            />
          )}

          {activeSection === "messages" && (
            <PageTwoMessagesEditor
              messages={draftConfig.pageTwo}
              onChange={(updated) =>
                setDraftConfig({
                  ...draftConfig,
                  pageTwo: updated,
                })
              }
            />
          )}

          {activeSection === "video" && (
            <ProposalVideoEditor
              video={draftConfig.video}
              settings={draftConfig.settings}
              onChange={(updated) =>
                setDraftConfig({
                  ...draftConfig,
                  video: updated,
                })
              }
            />
          )}

          {activeSection === "preview" && <AdminPreview isDraft={isUnpublished || isDirty} />}

          {activeSection === "settings" && (
            <AdminSettingsEditor
              settings={draftConfig.settings}
              config={draftConfig}
              onChangeSettings={(updated) =>
                setDraftConfig({
                  ...draftConfig,
                  settings: updated,
                })
              }
              onImportConfig={(imported) => {
                setDraftConfig(imported);
                saveDraftConfig(imported);
                showNotification("Configuration imported and saved to draft!", "success");
              }}
              onResetAll={handleResetAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}
