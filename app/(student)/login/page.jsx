"use client";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CompetitionRulesModal from "../../components/CompetitionRulesModal";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showWhatsAppHelp, setShowWhatsAppHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotNotFound, setForgotNotFound] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setForgotError("Please enter a valid registered email address.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    setForgotNotFound(false);
    startTopLoading();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.notFound || res.status === 404) {
          setForgotNotFound(true);
        }
        throw new Error(data.error || "Failed to send password reset email.");
      }

      setForgotSuccess(
        `Reset link dispatched! Please check your inbox at ${forgotEmail.trim()} (and your spam folder) to set a new password.`
      );
    } catch (err) {
      console.error("Forgot password error:", err);
      setForgotError(err.message || "Failed to send reset link.");
    } finally {
      setForgotLoading(false);
      stopTopLoading();
    }
  };

  async function checkStudentVerification(userId, initialStatus) {
    if (initialStatus === "verified" || initialStatus === "approved") {
      return { isApproved: true, isRejected: false };
    }
    if (initialStatus === "rejected") {
      return { isApproved: false, isRejected: true };
    }
    try {
      const res = await fetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        const serverStatus = data.approvals?.[userId];
        if (serverStatus === "verified" || serverStatus === "approved") {
          return { isApproved: true, isRejected: false };
        }
        if (serverStatus === "rejected") {
          return { isApproved: false, isRejected: true };
        }
      }
    } catch {
      // Ignore network errors
    }
    return { isApproved: false, isRejected: false };
  }

  // If already logged in AND verified, redirect to dashboard. If not verified, sign out.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", session.user.id)
          .maybeSingle();

        const { isApproved } = await checkStudentVerification(session.user.id, profile?.status);

        if (isApproved) {
          router.replace("/dashboard");
        } else {
          await supabase.auth.signOut();
          setCheckingSession(false);
        }
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowWhatsAppHelp(false);
    startTopLoading();

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password.");
        return;
      }

      if (data?.user) {
        // Enforce faculty approval gate
        const { data: profile } = await supabase
          .from("profiles")
          .select("status, full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        const { isApproved, isRejected } = await checkStudentVerification(
          data.user.id,
          profile?.status
        );

        if (!isApproved) {
          await supabase.auth.signOut();
          if (isRejected) {
            setError(
              "Your fee deposit was flagged or rejected by the faculty organizers. Please contact support via WhatsApp to resolve your registration."
            );
          } else {
            setError(
              "Account Pending Approval: Your registration and fee deposit receipt are currently under review by the faculty organizers. You will be able to sign in once approved."
            );
          }
          setShowWhatsAppHelp(true);
          return;
        }

        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
      stopTopLoading();
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-xs text-slate-500 font-medium">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vspark-logo.png"
              alt="VSPARK 2026"
              className="h-11 w-auto object-contain mx-auto mb-1"
            />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 inline-block">
              Student Portal
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Sign In to VSPARK 2026
            </h1>
            <p className="text-xs text-slate-500">
              Enter your student credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-medium space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>

              {showWhatsAppHelp && (
                <div className="pt-1">
                  <a
                    href="https://wa.me/923000000000?text=Hello%20VSPARK%20Organizers!%20My%20account%20is%20pending%20verification.%20Please%20verify%20my%20fee%20deposit."
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                  >
                    <MessageCircle size={13} className="text-emerald-600" /> WhatsApp Organizer Support
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotNotFound(false);
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-9 pr-10 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors font-mono"
                />
                <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                Register Now
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              Accounts must be approved by faculty before sign in is granted.
            </p>
          </div>
        </div>

        {/* Competition Rules & Rubric Quick Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50/80 px-3.5 py-1.5 rounded-full border border-blue-200 transition-colors shadow-2xs cursor-pointer"
          >
            <BookOpen size={13} className="text-blue-600" />
            <span>View Competition Rules &amp; Rubric (100 Marks)</span>
          </button>
        </div>
      </div>

      {/* Forgot Password / Reset Link Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Reset Account Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Receive a secure password reset link via email.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                disabled={forgotLoading}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {forgotError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-700 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-relaxed font-medium">{forgotError}</span>
                </div>
                {forgotNotFound && (
                  <div className="pt-2 pl-6 border-t border-rose-200/60">
                    <Link
                      href="/register"
                      onClick={() => setForgotModalOpen(false)}
                      className="inline-flex items-center gap-1 font-bold text-rose-800 hover:text-rose-950 underline"
                    >
                      Need an account? Register for VSPARK 2026 &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-4 py-2 text-center">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Reset Email Dispatched!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {forgotSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full h-9 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors mt-2"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                      className="w-full h-10 pl-10 pr-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1.5 block">
                    We will send an official reset email with a direct link to change your password.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    disabled={forgotLoading}
                    className="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="h-9 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <KeyRound size={14} />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Competition Rules & Requirements Modal */}
      <CompetitionRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        showAcknowledgeButton={false}
      />
    </div>
  );
}