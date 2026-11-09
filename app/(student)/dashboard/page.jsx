"use client";

import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileArchive,
  FileText,
  GitBranch,
  KeyRound,
  Lock,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Unlock,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CompetitionRulesModal from "../../components/CompetitionRulesModal";
import RichTextRenderer from "../../components/RichTextRenderer";
import {
  startTopLoading,
  stopTopLoading,
} from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";

function parseUploadError(error, responseStatus) {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return {
      title: "Network Connection Offline",
      description:
        "Your computer is not connected to the internet. Please check your WiFi, ethernet cable, or mobile connection and try again.",
    };
  }

  const errMsg = (error?.message || "").toString();

  if (
    errMsg.toLowerCase().includes("failed to fetch") ||
    errMsg.toLowerCase().includes("networkerror") ||
    errMsg.toLowerCase().includes("network error") ||
    errMsg.toLowerCase().includes("timeout") ||
    errMsg.toLowerCase().includes("abort")
  ) {
    return {
      title: "Network Failure / Request Timeout",
      description:
        "Could not communicate with the server due to an unstable internet connection or request timeout. Please verify your connection and re-try submitting.",
    };
  }

  if (
    responseStatus === 403 ||
    errMsg.includes("403") ||
    errMsg.toLowerCase().includes("locked") ||
    errMsg.toLowerCase().includes("finalized")
  ) {
    return {
      title: "Submission Access Restricted (403)",
      description:
        errMsg.replace(/^Error:\s*/i, "") ||
        "Code submissions are locked or your account requires faculty resubmission approval. Please contact the administrator.",
    };
  }

  if (
    responseStatus === 413 ||
    errMsg.includes("413") ||
    errMsg.toLowerCase().includes("payload too large") ||
    errMsg.toLowerCase().includes("entity too large")
  ) {
    return {
      title: "Project Size Exceeds Limit (413)",
      description:
        "Your project directory is too large. Please make sure build folders like node_modules, .next, and dist are excluded, or upload as a compressed .zip archive.",
    };
  }

  if (
    errMsg.toLowerCase().includes("storage") ||
    errMsg.toLowerCase().includes("bucket")
  ) {
    return {
      title: "Cloud Storage Upload Failed",
      description:
        "Cloud storage service rejected the file upload: " +
        errMsg.replace(/^Error:\s*/i, ""),
    };
  }

  return {
    title: "Submission Error",
    description:
      errMsg.replace(/^Error:\s*/i, "") ||
      "An unexpected error occurred while processing your submission. Please try again or reach out to the faculty team.",
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [isResubmissionAllowed, setIsResubmissionAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [githubUrl, setGithubUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedZip, setSelectedZip] = useState(null);
  const [stagedDownloadUrl, setStagedDownloadUrl] = useState(null);
  const [folderUploadError, setFolderUploadError] = useState(null);
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Confirmation Modal and Collaborator Checkbox state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasConfirmedRules, setHasConfirmedRules] = useState(false);
  const [copiedEvaluatorEmail, setCopiedEvaluatorEmail] = useState(false);
  const EVALUATOR_GITHUB_EMAIL = "vehari.webcomp@gmail.com";

  // Live Broadcast Announcement
  const [announcement, setAnnouncement] = useState(null);
  const [dismissAnnouncement, setDismissAnnouncement] = useState(false);

  // Profile & Password Change Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");

  // Competition Rules & Terms Modal State
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("profile") === "true") {
        setProfileModalOpen(true);
      }
      if (params.get("rules") === "true") {
        setRulesModalOpen(true);
      } else {
        // Automatic popup on sign-in / first dashboard visit
        const ack = localStorage.getItem("vspark_rules_acknowledged");
        if (!ack) {
          setRulesModalOpen(true);
        }
      }
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeSuccess("");

    if (!oldPassword) {
      setPasswordChangeError("Please enter your current (old) password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New password and confirmation do not match.");
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordChangeError(
        "New password must be different from your current password.",
      );
      return;
    }

    setPasswordChangeLoading(true);

    try {
      // 1. Verify old password by signing in
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
          "Current (old) password is incorrect. Please verify and try again.",
        );
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPasswordChangeSuccess("Your password has been changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordChangeError(err.message || "Failed to update password.");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkAuthAndSettings = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }
      setSession(session);

      // Verify participant profile & approval status
      const { data: profile } = await supabase
        .from("profiles")
        .select("status, full_name, email")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
      }

      let isApproved =
        profile?.status === "verified" || profile?.status === "approved";

      let isUnlocked = false;
      try {
        const appRes = await fetch("/api/admin/students");
        if (appRes.ok) {
          const appData = await appRes.json();
          const serverStatus = appData.approvals?.[session.user.id];
          if (serverStatus === "verified" || serverStatus === "approved") {
            isApproved = true;
          }
          if (
            appData.allowAllResubmissions ||
            appData.unlockedSubmissions?.[session.user.id]
          ) {
            isUnlocked = true;
          }
        }
      } catch (e) {
        console.warn("Approvals & Resubmission check warning:", e);
      }

      setIsResubmissionAllowed(isUnlocked);

      if (!isApproved) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const { data: settingsData } = await supabase
        .from("competition_settings")
        .select("*")
        .eq("id", 1)
        .single();

      setSettings(settingsData);

      // Fetch live announcement broadcast & settings
      try {
        const bankRes = await fetch("/api/bank");
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData?.announcement?.enabled && bankData?.announcement?.text) {
            setAnnouncement(bankData.announcement.text);
          }
        }
      } catch {
        // Non-critical
      }

      const { data: subData } = await supabase
        .from("submissions")
        .select("*")
        .eq("profile_id", session.user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setExistingSubmission(subData);
        setGithubUrl(subData.github_url || "");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndSettings();
  }, [checkAuthAndSettings]);

  const handleFolderSelect = async (e) => {
    const rawFileList = e.target.files;
    if (!rawFileList || rawFileList.length === 0) return;

    // Immediately trigger the animated loading indicator in the upload dropzone
    setIsProcessingFolder(true);
    setUploadProgressText("Reading and staging clean project files...");
    setFolderUploadError(null);
    setSelectedFiles([]);
    setSelectedZip(null);
    setStagedDownloadUrl(null);

    try {
      const rawFiles = Array.from(rawFileList);
      let zipToUpload = null;
      let filesToUpload = [];

      if (
        rawFiles.length === 1 &&
        rawFiles[0].name.toLowerCase().endsWith(".zip")
      ) {
        zipToUpload = rawFiles[0];
        setSelectedZip(rawFiles[0]);
      } else {
        filesToUpload = rawFiles.filter((file) => {
          const rawPath = file.webkitRelativePath || file.name;
          const normalized = rawPath.replace(/\\/g, "/");
          const parts = normalized.split("/");
          return !parts.some((part) => {
            const lower = part.toLowerCase();
            return (
              lower === "node_modules" ||
              lower === ".next" ||
              lower === ".git" ||
              lower === ".turbo" ||
              lower === "build" ||
              lower === "dist" ||
              lower.startsWith(".env") ||
              lower === ".ds_store"
            );
          });
        });
        setSelectedFiles(filesToUpload);
      }

      setUploadProgressText("Uploading code archive to cloud storage...");
      startTopLoading();

      // Perform real-time upload to server & cloud storage immediately on folder selection
      const formData = new FormData();
      formData.append("action", "stage_upload_only");
      formData.append("userId", session.user.id);
      if (zipToUpload) {
        formData.append("zipFile", zipToUpload);
      } else {
        filesToUpload.forEach((file) => {
          formData.append("files", file, file.webkitRelativePath || file.name);
        });
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const parsed = parseUploadError(
          new Error(data.error || "Failed to upload project files."),
          res.status,
        );
        setFolderUploadError(parsed.description);
        setSelectedFiles([]);
        setSelectedZip(null);
        return;
      }

      if (data.downloadUrl) {
        setStagedDownloadUrl(data.downloadUrl);
      }
    } catch (err) {
      console.error("Folder upload error:", err);
      const parsed = parseUploadError(err, null);
      setFolderUploadError(parsed.description);
      setSelectedFiles([]);
      setSelectedZip(null);
    } finally {
      setIsProcessingFolder(false);
      stopTopLoading();
    }
  };

  const handleOpenReviewModal = (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setMessage({
        type: "error",
        title: "Missing Repository URL",
        text: "Please provide a valid GitHub repository URL before submitting.",
      });
      return;
    }
    setHasConfirmedRules(false);
    setShowConfirmModal(true);
  };

  const executeFinalSubmission = async () => {
    if (!hasConfirmedRules) return;
    setUploading(true);
    setMessage(null);
    startTopLoading();

    try {
      const formData = new FormData();
      if (stagedDownloadUrl) {
        formData.append("preUploadedUrl", stagedDownloadUrl);
      } else if (selectedZip) {
        formData.append("zipFile", selectedZip);
      } else {
        selectedFiles.forEach((file) => {
          formData.append("files", file, file.webkitRelativePath || file.name);
        });
      }
      formData.append("githubUrl", githubUrl.trim());
      formData.append("userId", session.user.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(
          `Server returned HTTP ${res.status}. Submission could not be confirmed.`,
        );
      }

      if (!res.ok) {
        const errDetail = parseUploadError(
          new Error(data.error || `Upload failed with HTTP ${res.status}`),
          res.status,
        );
        setMessage({
          type: "error",
          title: errDetail.title,
          text: errDetail.description,
        });
        setShowConfirmModal(false);
        return;
      }

      // Also ensure client record sync
      try {
        await supabase.from("submissions").upsert(
          {
            profile_id: session.user.id,
            github_url: githubUrl.trim(),
            drive_folder_url:
              data.downloadUrl ||
              (existingSubmission ? existingSubmission.drive_folder_url : null),
            submitted_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" },
        );
      } catch (upsertErr) {
        console.warn("Client sync fallback:", upsertErr);
      }

      setMessage({
        type: "success",
        title: existingSubmission
          ? "Resubmission Successful"
          : "Project Submitted Successfully",
        text: existingSubmission
          ? "Your updated project has been submitted and automatically locked for evaluation."
          : "Your project has been successfully uploaded and locked for faculty evaluation.",
      });

      // Clear staged files and close modal
      setSelectedFiles([]);
      setSelectedZip(null);
      setStagedDownloadUrl(null);
      setShowConfirmModal(false);

      // AUTOMATIC RE-LOCK: Immediately lock the resubmission so view returns to locked state
      setIsResubmissionAllowed(false);

      // Refresh existing submission state
      const { data: subData } = await supabase
        .from("submissions")
        .select("*")
        .eq("profile_id", session.user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setExistingSubmission(subData);
      }
    } catch (error) {
      const errDetail = parseUploadError(error, null);
      setMessage({
        type: "error",
        title: errDetail.title,
        text: errDetail.description,
      });
      setShowConfirmModal(false);
    } finally {
      setUploading(false);
      stopTopLoading();
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4 max-w-6xl mx-auto space-y-6">
        <div className="h-24 bg-white border border-slate-200 rounded-xl p-6 animate-pulse flex items-center justify-between">
          <div className="space-y-2 w-1/3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
          <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-white border border-slate-200 rounded-xl p-6 animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-100 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-5/6"></div>
              <div className="h-3 bg-slate-100 rounded w-4/6"></div>
            </div>
          </div>
          <div className="lg:col-span-5 h-96 bg-white border border-slate-200 rounded-xl p-6 animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-10 bg-slate-100 rounded-lg"></div>
            <div className="h-28 bg-slate-50 rounded-lg"></div>
            <div className="h-10 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const startTime = settings?.start_time ? new Date(settings.start_time) : null;
  const endTime = settings?.end_time ? new Date(settings.end_time) : null;
  const isSubmissionOpenFlag = settings?.is_submission_open !== false;

  const isBeforeStart = startTime ? currentTime < startTime : false;
  const isPastDeadline = endTime ? currentTime > endTime : false;

  // Submissions are strictly locked if either deadline has passed or admin turned submission off
  const isClosed = !isSubmissionOpenFlag || isPastDeadline;
  const isPreEvent = !isClosed && isBeforeStart;
  const isActive = isSubmissionOpenFlag && !isPastDeadline && !isPreEvent;

  const calculateCountdown = (targetDate) => {
    if (!targetDate) return { h: "00", m: "00", s: "00" };
    const diff = targetDate - currentTime;
    if (diff <= 0) return { h: "00", m: "00", s: "00" };
    const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const m = String(
      Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    ).padStart(2, "0");
    const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
    return { h, m, s };
  };

  const remainingActive = calculateCountdown(endTime);
  const remainingPre = calculateCountdown(startTime);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 font-sans selection:bg-blue-600 selection:text-white">
      {/* Live Announcement Broadcast Banner */}
      {announcement && !dismissAnnouncement && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 shadow-sm flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Organizer Announcement
              </p>
              <p className="text-xs sm:text-sm font-medium mt-0.5 leading-snug">
                {announcement}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissAnnouncement(true)}
            className="text-white/70 hover:text-white p-1 rounded transition-colors shrink-0"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* State 1: Upcoming */}
      {isPreEvent && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Competition Brief Unlocks Soon
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Problem statements and submission portal unlock on: <br />
              <span className="font-semibold text-slate-700">
                {startTime.toLocaleString()}
              </span>
            </p>
          </div>

          <div className="inline-flex gap-2 font-mono text-center pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              <span className="text-lg font-bold text-slate-900">
                {remainingPre.h}
              </span>
              <span className="block text-[9px] text-slate-400 font-sans">
                Hours
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              <span className="text-lg font-bold text-slate-900">
                {remainingPre.m}
              </span>
              <span className="block text-[9px] text-slate-400 font-sans">
                Mins
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              <span className="text-lg font-bold text-slate-900">
                {remainingPre.s}
              </span>
              <span className="block text-[9px] text-slate-400 font-sans">
                Secs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* State 2: Closed */}
      {isClosed && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
            <Lock size={22} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {endTime
                ? `Concluded: ${endTime.toLocaleString()}`
                : "Submissions Concluded"}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
              Code Freeze In Effect — Submissions Locked
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              The competition deadline has concluded. All submissions are
              finalized and cannot be modified or re-uploaded. Faculty
              evaluators are currently scoring projects.
            </p>
          </div>

          {existingSubmission ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-200/60 pb-2">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Your Final Submitted Project
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(existingSubmission.submitted_at).toLocaleString()}
                </span>
              </div>

              {existingSubmission.github_url && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    GitHub Repository
                  </span>
                  <a
                    href={existingSubmission.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline block truncate font-mono text-[11px] mt-0.5"
                  >
                    {existingSubmission.github_url}
                  </a>
                </div>
              )}

              {existingSubmission.drive_folder_url && (
                <div className="pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Uploaded Code Package
                  </span>
                  <a
                    href={existingSubmission.drive_folder_url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                  >
                    <FileArchive size={13} className="text-emerald-600" />{" "}
                    Download Uploaded Code (.zip)
                  </a>
                </div>
              )}

              {existingSubmission.total_marks > 0 && (
                <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-emerald-900">
                    <span>Evaluated Score</span>
                    <span className="text-sm font-mono">
                      {existingSubmission.total_marks} / 100
                    </span>
                  </div>
                  {existingSubmission.admin_feedback && (
                    <p className="text-[11px] text-emerald-800 italic pt-0.5">
                      Evaluator Remarks: &quot;
                      {existingSubmission.admin_feedback}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl max-w-md mx-auto leading-relaxed">
              No code submission was recorded for your account before the
              deadline. Submissions are now closed.
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/results"
              className="h-9 px-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Trophy size={14} /> View Final Results
            </Link>
          </div>
        </div>
      )}

      {/* State 3: Active Workspace */}
      {isActive && (
        <div className="space-y-6">
          {/* Competition Schedule & Real-Time Countdown Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Submissions Live
                </span>
                <span className="text-xs text-blue-200/70">•</span>
                <span className="text-xs text-blue-200 font-medium">
                  Competition Active
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                {settings?.title || "VSPARK 2026 Web Development Hackathon"}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-1 text-xs">
                {startTime && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={14} className="text-blue-400 shrink-0" />
                    <span>
                      Start:{" "}
                      <strong className="text-white font-semibold">
                        {startTime.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        •{" "}
                        {startTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </div>
                )}
                {endTime && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock size={14} className="text-amber-400 shrink-0" />
                    <span>
                      Code Freeze:{" "}
                      <strong className="text-amber-300 font-semibold">
                        {endTime.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        •{" "}
                        {endTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 pt-0.5">
                🔒 Submissions lock strictly at deadline. Any unsubmitted code
                cannot be uploaded after countdown hits zero.
              </p>
            </div>

            {/* Live Countdown Ticker */}
            {endTime && (
              <div className="flex items-center gap-2.5 shrink-0 bg-white/10 backdrop-blur-xs p-3 sm:p-4 rounded-xl border border-white/10 self-start md:self-center font-mono">
                <div className="text-center px-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider block">
                    {remainingActive.h}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-blue-200 font-sans block">
                    Hours
                  </span>
                </div>
                <span className="text-xl font-bold text-blue-300 animate-pulse">
                  :
                </span>
                <div className="text-center px-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider block">
                    {remainingActive.m}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-blue-200 font-sans block">
                    Minutes
                  </span>
                </div>
                <span className="text-xl font-bold text-blue-300 animate-pulse">
                  :
                </span>
                <div className="text-center px-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-wider block">
                    {remainingActive.s}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-blue-200 font-sans block">
                    Seconds
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Task Description */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Challenge Problem Brief & Guidelines
                </h2>
                {settings?.task_pdf_url && (
                  <a
                    href={settings.task_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    download={`VSPARK_Task_${(userProfile?.full_name || "Student").replace(/[^a-zA-Z0-9]/g, "_")}_${(session?.user?.email || "").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
                  >
                    <Download size={13} /> Official PDF Guide
                  </a>
                )}
              </div>

              <div className="pt-1">
                <RichTextRenderer content={settings?.task_description} />
              </div>
            </div>

            {/* Right: Submission Form or Confirmed State Card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud size={16} className="text-emerald-600" />
                  Project Submission
                </h2>
                {existingSubmission && !isResubmissionAllowed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 size={12} /> Finalized & Locked
                  </span>
                ) : existingSubmission && isResubmissionAllowed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <Unlock size={12} /> Resubmission Unlocked
                  </span>
                ) : null}
              </div>

              {/* Status or Diagnostic Error Alert Banner */}
              {message && (
                <div
                  className={`p-4 rounded-xl text-xs border shadow-2xs space-y-1 animate-in fade-in ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : "bg-red-50 text-red-900 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {message.type === "success" ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 shrink-0"
                      />
                    ) : (
                      <AlertCircle
                        size={16}
                        className="text-red-600 shrink-0"
                      />
                    )}
                    <span>
                      {message.title ||
                        (message.type === "success"
                          ? "Success"
                          : "Submission Failed")}
                    </span>
                  </div>
                  <p className="leading-relaxed pl-6 text-slate-700">
                    {message.text}
                  </p>
                </div>
              )}

              {/* Case 1: Locked Submission Card (Student already submitted & NOT unlocked by admin) */}
              {existingSubmission && !isResubmissionAllowed ? (
                <div className="space-y-4 pt-1">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-slate-900">
                          Final Submission Recorded — Locked
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(
                          existingSubmission.submitted_at,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Submitted GitHub Repository
                        </span>
                        <a
                          href={existingSubmission.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono font-medium text-blue-600 hover:underline inline-flex items-center gap-1.5 truncate max-w-full mt-0.5"
                        >
                          <GitBranch
                            size={13}
                            className="shrink-0 text-slate-400"
                          />
                          <span className="truncate">
                            {existingSubmission.github_url}
                          </span>
                          <ExternalLink size={11} className="shrink-0" />
                        </a>
                      </div>

                      {existingSubmission.drive_folder_url && (
                        <div className="pt-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Uploaded Code Package
                          </span>
                          <a
                            href={existingSubmission.drive_folder_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <FileArchive
                              size={14}
                              className="text-emerald-600"
                            />
                            Download My Clean Code (.zip)
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Evaluator Feedback if available */}
                    {existingSubmission.total_marks > 0 && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold text-emerald-900">
                          <span>Evaluated Score</span>
                          <span className="text-sm font-mono">
                            {existingSubmission.total_marks} / 100
                          </span>
                        </div>
                        {existingSubmission.admin_feedback && (
                          <p className="text-[11px] text-emerald-800 italic pt-0.5">
                            Evaluator Remark: &quot;
                            {existingSubmission.admin_feedback}&quot;
                          </p>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Lock size={13} className="text-slate-500" />
                        <span>Submission Finalized</span>
                      </div>
                      <p className="leading-relaxed">
                        Your project is permanently recorded for evaluation. If
                        you need to make changes or fix an upload issue, please
                        contact your faculty administrator to request a
                        resubmission unlock.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Case 2: Submission Form (First submission OR Resubmission Granted by Admin) */
                <form onSubmit={handleOpenReviewModal} className="space-y-4">
                  {/* Resubmission Granted Notice */}
                  {existingSubmission && isResubmissionAllowed && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold text-emerald-950">
                        <Unlock
                          size={14}
                          className="text-emerald-600 shrink-0"
                        />
                        <span>Resubmission Permission Granted</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        A faculty administrator has unlocked your submission.
                        You can update your GitHub repository URL and upload
                        revised source code below. Submitting will update your
                        official entry.
                      </p>
                    </div>
                  )}

                  {/* Evaluator Collaborator Notice on Dashboard */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <GitBranch size={14} className="text-blue-600" />
                        Evaluator Access Required
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Mandatory
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Ensure your GitHub repository is set to{" "}
                      <strong>Public</strong>, OR invite the faculty evaluator
                      email below as a collaborator before submitting:
                    </p>
                    <div className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-2 font-mono text-xs">
                      <span className="text-blue-900 font-semibold truncate select-all">
                        {EVALUATOR_GITHUB_EMAIL}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(EVALUATOR_GITHUB_EMAIL);
                          setCopiedEvaluatorEmail(true);
                          setTimeout(
                            () => setCopiedEvaluatorEmail(false),
                            2000,
                          );
                        }}
                        className="h-6 px-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        {copiedEvaluatorEmail ? (
                          <>
                            <Check size={12} className="text-emerald-600" />{" "}
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      required
                      disabled={uploading}
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/project"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  {/* Project Folder or Zip Archive Dropzone with Uploading State */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Project Folder or Zip Archive{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>

                    {isProcessingFolder ? (
                      /* Active Real-Time Uploading Indicator right as user selects folder */
                      <div className="border border-blue-400 bg-blue-50/90 rounded-xl p-5 text-center space-y-2.5 shadow-2xs animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                          <RefreshCw
                            size={20}
                            className="animate-spin text-blue-600"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-blue-950">
                            Uploading Project Code Package...
                          </p>
                          <p className="text-[11px] text-blue-700 max-w-xs mx-auto">
                            {uploadProgressText ||
                              "Compressing clean files and uploading to secure cloud storage..."}
                          </p>
                        </div>
                        <div className="w-full bg-blue-200/80 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                          <div className="h-full bg-blue-600 animate-loading-bar"></div>
                        </div>
                      </div>
                    ) : uploading ? (
                      /* Active Finalizing Indicator during submission */
                      <div className="border border-blue-400 bg-blue-50/90 rounded-xl p-5 text-center space-y-2.5 shadow-2xs animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                          <RefreshCw
                            size={20}
                            className="animate-spin text-blue-600"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-blue-950">
                            Finalizing & Recording Submission...
                          </p>
                          <p className="text-[11px] text-blue-700 max-w-xs mx-auto">
                            Recording project metadata and locking entry for
                            evaluation.
                          </p>
                        </div>
                        <div className="w-full bg-blue-200/80 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                          <div className="h-full bg-blue-600 animate-loading-bar"></div>
                        </div>
                      </div>
                    ) : (
                      /* Default File Selection Area */
                      <div className="relative border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100/50 rounded-lg p-5 text-center transition-colors cursor-pointer">
                        <input
                          type="file"
                          webkitdirectory="true"
                          directory="true"
                          multiple
                          disabled={uploading || isProcessingFolder}
                          onChange={handleFolderSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <UploadCloud
                          size={20}
                          className="text-slate-400 mx-auto mb-1.5"
                        />
                        <p className="text-xs font-medium text-slate-700">
                          Click to stage project code folder or .zip
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          node_modules, .next, .git, and .env are automatically
                          excluded
                        </p>
                      </div>
                    )}

                    {/* Real-time Upload Error Feedback */}
                    {folderUploadError && (
                      <div className="mt-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle
                            size={15}
                            className="text-red-600 shrink-0"
                          />
                          <span>Code Upload Failed</span>
                        </div>
                        <p className="text-[11px] text-red-700 leading-relaxed pl-5">
                          {folderUploadError}
                        </p>
                      </div>
                    )}

                    {/* Staged / Uploaded Success Confirmation */}
                    {!uploading &&
                      !isProcessingFolder &&
                      (stagedDownloadUrl ||
                        selectedZip ||
                        selectedFiles.length > 0) && (
                        <div className="mt-2.5 text-xs text-emerald-900 font-medium flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-600 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-emerald-950 text-xs">
                                Code Archive Uploaded to Cloud
                              </p>
                              <p className="text-[11px] text-emerald-700">
                                {selectedZip
                                  ? `Direct archive verified: ${selectedZip.name} (${(selectedZip.size / (1024 * 1024)).toFixed(2)} MB)`
                                  : `${selectedFiles.length} clean code files uploaded & staged`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFiles([]);
                              setSelectedZip(null);
                              setStagedDownloadUrl(null);
                              setFolderUploadError(null);
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-red-600 px-2 py-1 rounded transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={uploading || isProcessingFolder}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingFolder ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Uploading Code Package...</span>
                        </>
                      ) : uploading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Finalizing Submission...</span>
                        </>
                      ) : existingSubmission && isResubmissionAllowed ? (
                        <span>Confirm & Update Submission</span>
                      ) : (
                        <span>Confirm & Submit Project</span>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      🔒 Once submitted, your project is locked unless
                      resubmission is unlocked by admin.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation & Collaborator Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {existingSubmission
                    ? "Resubmission Check"
                    : "Final Submission Check"}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {existingSubmission
                    ? "Confirm Project Resubmission"
                    : "Confirm Project Submission"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Submission Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Participant:</span>
                  <span className="font-semibold text-slate-800">
                    {userProfile?.full_name || "Participant"} (
                    {session?.user?.email})
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 border-t border-slate-200/60 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    GitHub Repository to be evaluated:
                  </span>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono font-medium text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    <GitBranch size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{githubUrl}</span>
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-slate-600">
                  <span>Code Archive:</span>
                  <span className="font-medium text-slate-800">
                    {selectedZip
                      ? `${selectedZip.name} (${(selectedZip.size / (1024 * 1024)).toFixed(2)} MB)`
                      : selectedFiles.length > 0
                        ? `${selectedFiles.length} clean code files staged`
                        : "Repository link only (No local archive)"}
                  </span>
                </div>
              </div>

              {/* Evaluator Collaborator Box */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-blue-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <GitBranch size={13} className="text-blue-600" />
                    Faculty Evaluator GitHub Access
                  </span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Please verify that your GitHub repo is <strong>Public</strong>
                  , OR you have added the faculty evaluator email as a
                  collaborator:
                </p>
                <div className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-2 font-mono text-xs">
                  <span className="text-blue-900 font-semibold truncate select-all">
                    {EVALUATOR_GITHUB_EMAIL}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(EVALUATOR_GITHUB_EMAIL);
                      setCopiedEvaluatorEmail(true);
                      setTimeout(() => setCopiedEvaluatorEmail(false), 2000);
                    }}
                    className="h-6 px-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    {copiedEvaluatorEmail ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mandatory Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={uploading}
                  checked={hasConfirmedRules}
                  onChange={(e) => setHasConfirmedRules(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0 disabled:opacity-50"
                />
                <span className="text-[11px] text-amber-950 leading-relaxed">
                  {existingSubmission
                    ? "I confirm that evaluator access is granted to my repository, and I understand that submitting this update will replace my previous project submission for faculty evaluation."
                    : "I confirm that evaluator access is granted to my repository, and I understand that after submitting, this project is permanently finalized and cannot be modified or re-uploaded without admin permission."}
                </span>
              </label>

              {/* In-Modal Upload Progress Indicator if uploading */}
              {uploading && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-900 animate-pulse">
                  <RefreshCw
                    size={14}
                    className="animate-spin text-blue-600 shrink-0"
                  />
                  <span>
                    Uploading files to storage and recording submission...
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={uploading}
                className="flex-1 h-10 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeFinalSubmission}
                disabled={!hasConfirmedRules || uploading}
                className="flex-1 h-10 inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Finalizing & Uploading...</span>
                  </>
                ) : existingSubmission ? (
                  <span>Update & Submit Project</span>
                ) : (
                  <span>Final Submit Project</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile & Change Password Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Participant Profile & Security
                  </h3>
                  <p className="text-xs text-slate-500">
                    View your registration details and update your account
                    password.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Full Name
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {userProfile?.full_name || "Participant"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </span>
                <span className="text-xs font-semibold text-slate-800 font-mono">
                  {session?.user?.email}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  University / Campus
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {userProfile?.university_name ||
                    "COMSATS University Islamabad, Vehari Campus"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Registration Status
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified &amp; Active
                </span>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound size={16} className="text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Change Account Password
                </h4>
              </div>

              {passwordChangeError && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-emerald-600"
                  />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                {/* Old Password Field */}
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
                      placeholder="Enter your current password"
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

                {/* New Password Field */}
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

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full h-9 pl-3 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    disabled={passwordChangeLoading}
                    className="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={
                      passwordChangeLoading || !oldPassword || !newPassword
                    }
                    className="h-9 px-5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    {passwordChangeLoading ? (
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
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Competition Rules & Marks Modal */}
      <CompetitionRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        onAcknowledge={() => setRulesModalOpen(false)}
        showAcknowledgeButton={true}
      />
    </div>
  );
}
