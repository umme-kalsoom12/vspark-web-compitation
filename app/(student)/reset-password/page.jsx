"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      // Verify if email is registered in profiles
      supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", emailParam.trim())
        .maybeSingle()
        .then(({ data }) => {
          if (!data) {
            setNotFound(true);
            setError("Email not found. No account is registered with this email address.");
          } else {
            setNotFound(false);
            setError("");
          }
        })
        .catch(() => {});
    }
    // Check if user came from a recovery link (active session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
    });
  }, [emailParam]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setNotFound(false);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid registered email address.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    startTopLoading();

    try {
      // 1. Verify email exists in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", email.trim())
        .maybeSingle();

      if (!profile) {
        setError("Email not found. No account is registered with this email address.");
        setNotFound(true);
        return;
      }

      if (hasSession) {
        // User clicked recovery link with active session
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateErr) throw updateErr;
      } else {
        // Fallback: If not logged in, trigger recovery
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/reset-password` }
        );
        if (resetErr) throw resetErr;
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
      stopTopLoading();
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vspark-logo.png"
            alt="VSPARK 2026"
            className="h-10 w-auto mx-auto object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Reset Account Password
          </h1>
          <p className="text-xs text-slate-500">
            Set a new secure password for your VSPARK 2026 student account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-700 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            {notFound && (
              <div className="pt-2 pl-6.5 border-t border-rose-200/60">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 font-bold text-rose-800 hover:text-rose-950 underline"
                >
                  Register for a new account &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {success ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Password Updated Successfully
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your new password has been set. You can now sign in to your student dashboard.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full h-10 px-4 inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Sign In Now <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  className="w-full h-10 pl-10 pr-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full h-10 pl-10 pr-10 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full h-10 pl-10 pr-10 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 px-4 inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  Update Password
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            &larr; Back to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-xs text-slate-500 font-medium">
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
