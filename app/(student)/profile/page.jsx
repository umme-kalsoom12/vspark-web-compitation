"use client";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";

export default function StudentProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setSession(session);

      try {
        // Fetch student profile
        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profData) {
          setProfile(profData);
        }

        // Fetch submission status
        const { data: subData } = await supabase
          .from("submissions")
          .select("*")
          .eq("profile_id", session.user.id)
          .maybeSingle();

        if (subData) {
          setSubmission(subData);
        }
      } catch (err) {
        console.warn("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!oldPassword) {
      setPassError("Please provide your current (old) password.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    if (oldPassword === newPassword) {
      setPassError("New password must be different from your current password.");
      return;
    }

    setPassLoading(true);
    startTopLoading();

    try {
      // 1. Verify old password first by authenticating
      const studentEmail = session?.user?.email;
      if (!studentEmail) {
        throw new Error("No active student session detected.");
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: studentEmail,
        password: oldPassword,
      });

      if (verifyError) {
        throw new Error(
          "Current (old) password is incorrect. Please verify and try again."
        );
      }

      // 2. Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPassSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassError(err.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
      stopTopLoading();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-xs text-slate-500 font-medium">
        <RefreshCw size={18} className="animate-spin text-blue-600 mr-2" />
        Loading profile credentials...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/results"
            className="h-8 px-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Trophy size={13} className="text-amber-500" /> Result
          </Link>
          <button
            onClick={handleSignOut}
            className="h-8 px-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            {(profile?.full_name || session?.user?.email || "P")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {profile?.full_name || "Participant"}
              </h1>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck size={12} /> Verified Participant
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <Mail size={12} className="text-slate-400" />
              {session?.user?.email}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 size={12} className="text-slate-400" />
              {profile?.university_name || "COMSATS University Islamabad, Vehari Campus"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Registration & Credentials */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Registration Information
              </h2>
              <p className="text-[11px] text-slate-500">
                Your verified participant credentials
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="font-semibold text-slate-900">
                {profile?.full_name || "Participant"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-mono text-slate-900">
                {session?.user?.email}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Phone / WhatsApp</span>
              <span className="font-mono text-slate-900">
                {profile?.phone_no || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">University / Campus</span>
              <span className="text-slate-900 text-right max-w-[200px] truncate">
                {profile?.university_name || "COMSATS University"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Payment Receipt</span>
              {profile?.payment_receipt_url ? (
                <a
                  href={profile.payment_receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  View Receipt <ExternalLink size={11} />
                </a>
              ) : (
                <span className="text-slate-400">Verified</span>
              )}
            </div>
          </div>

          {/* Project Submission Summary */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Submission Status
            </span>
            {submission ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Project Submitted
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleDateString()
                      : "Completed"}
                  </span>
                </div>
                {submission.github_url && (
                  <a
                    href={submission.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    <GitBranch size={11} /> {submission.github_url}
                  </a>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800">
                <span className="font-semibold">Pending Submission:</span> Upload your project code on the dashboard before code freeze.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Change Password Security */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <KeyRound size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Change Password
              </h2>
              <p className="text-[11px] text-slate-500">
                Update credentials by providing current and new passwords
              </p>
            </div>
          </div>

          {passError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current (Old) Password
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-9 pl-3 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-9 pl-3 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-9 pl-3 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading || !oldPassword || !newPassword}
              className="w-full h-9 inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {passLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Verifying &amp; Updating...
                </>
              ) : (
                <>
                  <KeyRound size={13} />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
