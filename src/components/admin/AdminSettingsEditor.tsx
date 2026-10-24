import { useRef, useState } from "react";
import {
  type AdminSettings,
  type ProposalConfig,
  exportConfigAsJSON,
  parseImportedConfig,
} from "@/lib/proposal-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  HardDrive,
  Share2,
} from "lucide-react";

interface AdminSettingsEditorProps {
  settings: AdminSettings;
  config: ProposalConfig;
  onChangeSettings: (updated: AdminSettings) => void;
  onImportConfig: (imported: ProposalConfig) => void;
  onResetAll: () => void;
}

export function AdminSettingsEditor({
  settings,
  config,
  onChangeSettings,
  onImportConfig,
  onResetAll,
}: AdminSettingsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const publicStoryUrl = typeof window !== "undefined" ? window.location.origin + "/" : "/";

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(publicStoryUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn("Could not copy link:", err);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportConfigAsJSON(config);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const recipient = config.personalDetails.recipientName || "proposal";
    link.download = `romantic-proposal-${recipient.toLowerCase().replace(/\s+/g, "-")}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseImportedConfig(text);
        onImportConfig(parsed);
        setImportStatus("Configuration imported successfully!");
        setTimeout(() => setImportStatus(null), 3500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid JSON structure.";
        alert("Failed to import configuration: " + msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all proposal settings, romantic notes, and details to factory defaults? This action cannot be undone.",
    );
    if (confirmed) {
      onResetAll();
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Shareable Link Card */}
      <div className="admin-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Recipient Experience Link</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This is the secret link you will share with your partner. The admin bar will not
              appear for them.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            readOnly
            value={publicStoryUrl}
            className="bg-muted/40 font-mono text-xs sm:text-sm text-foreground"
          />
          <Button
            type="button"
            onClick={copyShareLink}
            className="btn-admin-primary shrink-0 gap-1.5"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedLink ? "Link Copied!" : "Copy Secret Link"}</span>
          </Button>
        </div>
      </div>

      {/* Upload Size Configuration */}
      <div className="admin-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Media & Upload Limits</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure maximum video upload size for browser IndexedDB storage.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <Label htmlFor="maxVideoSize" className="font-medium text-foreground">
              Maximum Video Upload Limit (MB)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxVideoSize"
                type="number"
                min={10}
                max={500}
                step={10}
                value={settings.maxVideoSizeMB}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    maxVideoSizeMB: Math.max(10, parseInt(e.target.value) || 100),
                  })
                }
                className="bg-background/80 w-36"
              />
              <span className="text-sm font-semibold text-muted-foreground">Megabytes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Default is 100MB. Videos up to 250MB are comfortably stored in modern browser
              IndexedDB.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">Storage note:</div>
            <p>
              Video files are stored as binary Blobs in client IndexedDB storage. They never bloat
              localStorage or turn into slow Base64 strings.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Backup & Migration */}
      <div className="admin-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Backup & Migration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export and import story configurations as clean JSON files.
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportJSON}
            className="text-xs gap-2"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Export Config JSON</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs gap-2"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Import Config JSON</span>
          </Button>
        </div>
      </div>

      {/* Factory Reset Danger Zone */}
      <div className="admin-card p-6 md:p-8 space-y-4 border-destructive/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive">Factory Reset</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reset all personal details, Page 2 clues, and settings back to the website's original
              defaults.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleResetConfirm}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
