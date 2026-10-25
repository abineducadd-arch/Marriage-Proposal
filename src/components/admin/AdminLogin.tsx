import { useState } from "react";
import { signInAdmin } from "@/lib/supabase-service";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
  onBypassOffline?: () => void;
}

export function AdminLogin({ onSuccess, onBypassOffline }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await signInAdmin(email, password);
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error.message || "Invalid administrator credentials.");
      return;
    }

    if (result.session) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-pink-50/70">
      {/* Background ambient sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Header Motif */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 text-white shadow-lg shadow-rose-500/20 text-2xl font-bold mb-1">
            ♡
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold italic text-foreground tracking-tight">
            Proposal Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to personalize your romantic adventure & proposal details
          </p>
        </div>

        {/* Card */}
        <div className="admin-card p-6 sm:p-8 backdrop-blur-md bg-white/95 border border-rose-200/70 shadow-xl shadow-rose-950/5 space-y-6">
          {!supabaseConfigured ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Supabase Credentials Required</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your project is ready to connect with Supabase. Set{" "}
                  <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">
                    VITE_SUPABASE_URL
                  </code>{" "}
                  and{" "}
                  <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">
                    VITE_SUPABASE_PUBLISHABLE_KEY
                  </code>{" "}
                  in your{" "}
                  <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">
                    .env
                  </code>{" "}
                  file.
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Setup Steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-muted-foreground/90">
                  <li>Create a project on Supabase.com</li>
                  <li>
                    Copy <code className="font-mono">.env.example</code> to{" "}
                    <code className="font-mono">.env</code>
                  </li>
                  <li>
                    Run the SQL migration in <code className="font-mono">supabase/migrations/</code>
                  </li>
                  <li>Create an admin user in Authentication → Users</li>
                </ol>
              </div>

              {onBypassOffline && (
                <div className="pt-2 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBypassOffline}
                    className="w-full text-xs text-muted-foreground hover:text-foreground gap-2"
                  >
                    <span>Continue with Local/Offline Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-rise"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-email"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Admin Email</span>
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@love.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-sm bg-white/70"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 text-sm bg-white/70 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-admin-gold h-10 text-sm font-semibold gap-2 mt-2 shadow-sm"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enter Proposal Suite</span>
                  </>
                )}
              </Button>

              <div className="pt-3 text-center">
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500/30" />
                  <span>Protected by Supabase Row-Level Security</span>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Back to Public View Link */}
        <div className="text-center mt-5">
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>← Return to Public Proposal Story</span>
          </a>
        </div>
      </div>
    </div>
  );
}
