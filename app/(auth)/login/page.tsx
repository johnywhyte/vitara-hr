"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Proxy will redirect admin → /admin, applicant → /apply
    router.push("/");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-[#FCF5EB] min-h-screen">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-block bg-[#71001D] rounded-lg px-4 py-2 mb-3">
              <p className="text-[9px] text-white/70 uppercase tracking-widest">
                Vitara
              </p>
              <p className="text-sm font-bold text-white">Recruitment Portal</p>
            </div>
          </Link>
          <h1 className="text-lg font-bold text-[#343A40]">Sign In</h1>
          <p className="text-xs text-[#6C757D] mt-0.5">
            Access your application dashboard
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-5">
          {error && (
            <div className="mb-4 p-3 bg-[#FFE5E5] border-l-4 border-[#C0392B] rounded text-xs text-[#C0392B]">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <Label htmlFor="email" required>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password" required>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ADB5BD] hover:text-[#6C757D]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full mt-1">
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-[#E9ECEF]" />
            <span className="text-[10px] text-[#ADB5BD] font-semibold uppercase">
              or
            </span>
            <div className="h-px flex-1 bg-[#E9ECEF]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2 px-4 border border-[#DEE2E6] rounded-md text-sm font-medium text-[#343A40] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Link href="/forgot-password" className="text-xs text-[#6C757D] hover:text-[#71001D] hover:underline">
            Forgot password?
          </Link>
          <p className="text-xs text-[#6C757D]">
            No account?{" "}
            <Link href="/signup" className="text-[#71001D] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      </div>

      {/* ── Right panel: hero image (hidden on mobile) ─────── */}
      <div
        className="hidden lg:flex flex-col justify-end w-[52%] relative bg-cover bg-center"
        style={{ backgroundImage: "url('https://vitara.ag/wp-content/uploads/2025/10/Hero-banner-1-2048x1152.jpg')" }}
      >
        {/* dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative z-10 p-10 pb-12">
          <img
            src="https://vitara.ag/wp-content/uploads/2025/03/Vitara-Logo-FInal-white-1.png"
            alt="Vitara"
            className="h-10 mb-6 object-contain object-left"
          />
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Growing prosperity<br />across rural Ghana.
          </h2>
          <p className="text-sm text-white/75 max-w-sm">
            Join the Vitara team and help connect farming communities to global markets through technology and trade.
          </p>
        </div>
      </div>
    </div>
  );
}
