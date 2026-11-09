"use client";

import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileCheck,
  Filter,
  GitBranch,
  KeyRound,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Unlock,
  UploadCloud,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [unlockedSubmissions, setUnlockedSubmissions] = useState({});
  const [allowAllResubmissions, setAllowAllResubmissions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "verified" | "pending" | "submitted" | "receipt"
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [globalToggling, setGlobalToggling] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Email Notice Broadcast State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeSubject, setNoticeSubject] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeAudience, setNoticeAudience] = useState("verified"); // "verified" | "all"
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState(null);
  const [noticeError, setNoticeError] = useState("");

  // Single Student Direct Email State
  const [directEmailStudent, setDirectEmailStudent] = useState(null);
  const [directSubject, setDirectSubject] = useState("");
  const [directMessage, setDirectMessage] = useState("");
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directError, setDirectError] = useState("");
  const [resettingPasswordId, setResettingPasswordId] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // 1. Fetch server-side approvals and resubmission permissions
      let serverApprovals = {};
      try {
        const appRes = await fetch("/api/admin/students");
        if (appRes.ok) {
          const appData = await appRes.json();
          serverApprovals = appData.approvals || {};
          setUnlockedSubmissions(appData.unlockedSubmissions || {});
          setAllowAllResubmissions(Boolean(appData.allowAllResubmissions));
        }
      } catch (e) {
        console.warn("Failed to load server approvals:", e);
      }

      // 2. Fetch all student submissions
      try {
        const { data: subsData } = await supabase
          .from("submissions")
          .select("id, profile_id, github_url, drive_folder_url, submitted_at, total_marks");

        const subMap = {};
        (subsData || []).forEach((sub) => {
          subMap[sub.profile_id] = sub;
        });
        setSubmissions(subMap);
      } catch (subErr) {
        console.warn("Failed to load submissions:", subErr);
      }

      if (!error && data) {
        // Normalize status: both "approved" and "verified" are treated as "verified"
        const merged = data.map((s) => {
          const override = serverApprovals[s.id];
          let finalStatus = override || s.status || "pending";
          if (finalStatus === "approved") finalStatus = "verified";
          return {
            ...s,
            status: finalStatus,
          };
        });
        setStudents(merged);
      }
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleUpdateStatus = async (studentId, newStatus) => {
    setUpdatingId(studentId);
    try {
      const studentObj = students.find((s) => s.id === studentId);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      );

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          status: newStatus,
          email: studentObj?.email,
          studentName: studentObj?.full_name,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status on server.");
      }

      const data = await res.json();
      if (newStatus === "verified" && data.emailSent) {
        setStatusMessage({
          type: "success",
          text: `Student ${studentObj?.full_name || studentId} marked as Verified. Approval email sent to ${studentObj?.email}!`,
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchStudents();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendNotice = async (e) => {
    if (e) e.preventDefault();
    if (!noticeSubject.trim() || !noticeMessage.trim()) {
      setNoticeError("Please enter both a subject line and the message body.");
      return;
    }

    setSendingNotice(true);
    setNoticeError("");
    setNoticeSuccess(null);

    try {
      const res = await fetch("/api/admin/send-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: noticeSubject.trim(),
          message: noticeMessage.trim(),
          targetAudience: noticeAudience,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email notice.");
      }

      setNoticeSuccess(
        `Announcement successfully sent to ${data.count} student(s)!`
      );
      setTimeout(() => {
        setNoticeModalOpen(false);
        setNoticeSuccess(null);
        setNoticeSubject("");
        setNoticeMessage("");
      }, 2500);
    } catch (err) {
      console.error("Failed to send notice:", err);
      setNoticeError(err.message || "Failed to send announcement email.");
    } finally {
      setSendingNotice(false);
    }
  };

  const handleSendDirectEmail = async (e) => {
    if (e) e.preventDefault();
    if (!directSubject.trim() || !directMessage.trim() || !directEmailStudent?.email) {
      setDirectError("Please enter both a subject line and the message content.");
      return;
    }

    setSendingDirect(true);
    setDirectError("");

    try {
      const res = await fetch("/api/admin/send-direct-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: directEmailStudent.email,
          studentName: directEmailStudent.full_name,
          subject: directSubject.trim(),
          message: directMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch email.");
      }

      setStatusMessage({
        type: "success",
        text: `Email successfully delivered to ${directEmailStudent.email}!`,
      });
      setTimeout(() => setStatusMessage(null), 5000);

      setDirectEmailStudent(null);
      setDirectSubject("");
      setDirectMessage("");
    } catch (err) {
      console.error("Direct email failed:", err);
      setDirectError(err.message || "Failed to send email to student.");
    } finally {
      setSendingDirect(false);
    }
  };

  const handleSendPasswordReset = async (student) => {
    if (!student?.email) {
      alert("No email address found for this student.");
      return;
    }

    const confirmed = window.confirm(
      `Send an official password reset email to ${student.full_name || "this student"} (${student.email})?`
    );
    if (!confirmed) return;

    setResettingPasswordId(student.id);
    try {
      const res = await fetch("/api/admin/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          email: student.email,
          studentName: student.full_name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch password reset.");
      }

      setStatusMessage({
        type: "success",
        text: `Password reset email dispatched to ${student.email}!`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error("Password reset error:", err);
      alert("Error sending password reset: " + err.message);
    } finally {
      setResettingPasswordId(null);
    }
  };

  const handleToggleUnlock = async (studentId, currentUnlocked) => {
    setActionLoadingId(studentId);
    setStatusMessage(null);
    try {
      const nextUnlockState = !currentUnlocked;
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_submission_unlock",
          studentId,
          unlock: nextUnlockState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle student resubmission permission.");
      }

      setUnlockedSubmissions((prev) => {
        const updated = { ...prev };
        if (nextUnlockState) {
          updated[studentId] = true;
        } else {
          delete updated[studentId];
        }
        return updated;
      });

      setStatusMessage({
        type: "success",
        text: data.message || `Student submission ${nextUnlockState ? "unlocked for resubmission" : "relocked"}.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Error toggling student resubmission unlock:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update resubmission permission.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAllResubmissions = async () => {
    setGlobalToggling(true);
    setStatusMessage(null);
    try {
      const nextGlobalState = !allowAllResubmissions;
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_all_resubmissions",
          allowAll: nextGlobalState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update global resubmissions.");
      }

      setAllowAllResubmissions(nextGlobalState);
      setStatusMessage({
        type: "success",
        text: nextGlobalState
          ? "🔓 Global resubmission enabled: All students can now edit and re-upload their project submissions."
          : "🔒 Global resubmission locked: Student submissions are now read-only unless granted individual unlocks.",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error("Error toggling global resubmissions:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update global resubmission settings.",
      });
    } finally {
      setGlobalToggling(false);
    }
  };

  const formatWhatsApp = (phone, name) => {
    if (!phone) return "#";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "92" + cleaned.substring(1);
    }
    const message = encodeURIComponent(
      `Hello ${name || "Student"}! Regarding your VSPARK 2026 Web Development Hackathon registration at COMSATS University Vehari:`
    );
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.university_name?.toLowerCase().includes(q) ||
      s.phone_no?.includes(q);

    if (!matchesSearch) return false;

    const currentStatus = s.status || "pending";
    if (filterTab === "verified") return currentStatus === "verified";
    if (filterTab === "pending") return currentStatus === "pending";
    if (filterTab === "submitted") return !!submissions[s.id];
    if (filterTab === "receipt") return !!s.payment_receipt_url;
    return true;
  });

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = [
      "Student ID",
      "Full Name",
      "Email Address",
      "Phone Number",
      "University / Institution",
      "Verification Status",
      "Submission Status",
      "GitHub Repository",
      "Receipt URL",
      "Registration Date",
    ];
    const rows = students.map((s) => {
      const sub = submissions[s.id];
      return [
        `"${s.id || ""}"`,
        `"${s.full_name || ""}"`,
        `"${s.email || ""}"`,
        `"${s.phone_no || ""}"`,
        `"${s.university_name || ""}"`,
        `"${s.status || "pending"}"`,
        `"${sub ? "Submitted" : "Not Submitted"}"`,
        `"${sub?.github_url || ""}"`,
        `"${s.payment_receipt_url || ""}"`,
        `"${s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}"`,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `vspark_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const verifiedCount = students.filter((s) => s.status === "verified").length;
  const pendingCount = students.filter((s) => !s.status || s.status === "pending").length;
  const submittedCount = Object.keys(submissions).length;
  const withReceiptCount = students.filter((s) => !!s.payment_receipt_url).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Students & Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student approvals, review submitted repositories, and unlock resubmissions per student or globally.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNoticeModalOpen(true)}
            className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            <Megaphone size={14} /> Broadcast Notice
          </button>

          <button
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Global Resubmission Master Control Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 border border-blue-900/40 rounded-xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Resubmission Permissions
            </span>
            {allowAllResubmissions ? (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Globally Open
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
                Strict Code Freeze
              </span>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white">
            {allowAllResubmissions
              ? "All Students Currently Allowed to Resubmit Code"
              : "Submissions Locked — Individual Student Resubmission Override"}
          </h2>
          <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
            {allowAllResubmissions
              ? "Students who already submitted can modify their GitHub repository and upload new code packages. Toggle OFF to re-enable strict freeze."
              : "Once a student submits, their project is locked permanently. You can open resubmission globally for everyone using the switch on the right, or unlock individual students in the table below."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={handleToggleAllResubmissions}
            disabled={globalToggling}
            className={`h-10 px-4 inline-flex items-center gap-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
              allowAllResubmissions
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            } disabled:opacity-50`}
          >
            {globalToggling ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : allowAllResubmissions ? (
              <Lock size={14} />
            ) : (
              <Unlock size={14} />
            )}
            <span>
              {allowAllResubmissions
                ? "Lock All Resubmissions"
                : "Allow All Resubmissions"}
            </span>
          </button>
        </div>
      </div>

      {/* Status Alert Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 shadow-2xs animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Registered
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {students.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Verified / Approved
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">
            {verifiedCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Projects Submitted
          </p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">
            {submittedCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Fee Receipts
          </p>
          <p className="text-xl font-bold text-indigo-700 mt-0.5">
            {withReceiptCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, university or phone..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === "all"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setFilterTab("verified")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === "verified"
                ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setFilterTab("submitted")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === "submitted"
                ? "bg-white text-blue-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Submitted ({submittedCount})
          </button>
          <button
            onClick={() => setFilterTab("pending")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === "pending"
                ? "bg-white text-amber-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab("receipt")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === "receipt"
                ? "bg-white text-indigo-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            With Slip ({withReceiptCount})
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Email</th>
                <th className="py-3 px-4">Fee Slip</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Project Submission</th>
                <th className="py-3 px-4 text-center w-28">Actions & Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No matching students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const status = student.status || "pending";
                  const sub = submissions[student.id];
                  const isIndividuallyUnlocked = Boolean(unlockedSubmissions[student.id]);
                  const canResubmit = isIndividuallyUnlocked || allowAllResubmissions;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student & Email */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {student.full_name || "Student"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {student.email}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {student.university_name || "COMSATS University Vehari"}
                        </p>
                      </td>

                      {/* Fee Slip */}
                      <td className="py-3 px-4">
                        {student.payment_receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(student.payment_receipt_url)}
                            className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                          >
                            <Eye size={12} /> View Slip
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No slip attached
                          </span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {status === "verified" ? (
                            <span className="h-6 px-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200">
                              <CheckCircle2 size={11} className="text-emerald-600" /> Verified
                            </span>
                          ) : status === "rejected" ? (
                            <span className="h-6 px-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 rounded-full border border-red-200">
                              <XCircle size={11} className="text-red-600" /> Incomplete
                            </span>
                          ) : (
                            <span className="h-6 px-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 rounded-full border border-amber-200">
                              Pending
                            </span>
                          )}

                          {/* Quick 1-Click Verification Toggle Buttons */}
                          <div className="flex items-center gap-1 ml-1">
                            {status !== "verified" && (
                              <button
                                type="button"
                                disabled={updatingId === student.id}
                                onClick={() => handleUpdateStatus(student.id, "verified")}
                                title="Approve Student"
                                className="h-6 px-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                              >
                                Approve
                              </button>
                            )}

                            {status !== "rejected" && (
                              <button
                                type="button"
                                disabled={updatingId === student.id}
                                onClick={() => handleUpdateStatus(student.id, "rejected")}
                                title="Reject / Flag Incomplete"
                                className="h-6 px-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors"
                              >
                                Flag
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project Submission & Resubmission Unlock Control: All in a single horizontal row */}
                      <td className="py-3 px-4">
                        {sub ? (
                          <div className="flex items-center gap-2 flex-nowrap">
                            {/* GitHub Link Button with explicit text */}
                            {sub.github_url ? (
                              <a
                                href={sub.github_url}
                                target="_blank"
                                rel="noreferrer"
                                title={sub.github_url}
                                className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors shrink-0"
                              >
                                <GitBranch size={12} className="text-blue-500" />
                                <span>GitHub Link</span>
                                <ExternalLink size={10} className="text-blue-400" />
                              </a>
                            ) : null}

                            {/* Project Zip Button with explicit text */}
                            {sub.drive_folder_url ? (
                              <a
                                href={sub.drive_folder_url}
                                target="_blank"
                                rel="noreferrer"
                                download
                                title="Download Staged Code Zip"
                                className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors shrink-0"
                              >
                                <Download size={12} className="text-emerald-600" />
                                <span>Project Zip</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic shrink-0">
                                No Zip
                              </span>
                            )}

                            {/* Inline Resubmission Status / Toggle */}
                            <div className="shrink-0 pl-0.5">
                              {allowAllResubmissions ? (
                                <span className="h-7 px-2 inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
                                  🔓 Global Open
                                </span>
                              ) : isIndividuallyUnlocked ? (
                                <div className="inline-flex items-center gap-1">
                                  <span className="h-7 px-1.5 inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
                                    🔓 Unlocked
                                  </span>
                                  <button
                                    type="button"
                                    disabled={actionLoadingId === student.id}
                                    onClick={() => handleToggleUnlock(student.id, true)}
                                    className="h-7 px-2 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                                    title="Lock submission to prevent further edits"
                                  >
                                    Relock
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={actionLoadingId === student.id}
                                  onClick={() => handleToggleUnlock(student.id, false)}
                                  className="h-7 px-2.5 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                                  title="Allow this student to edit and resubmit their project"
                                >
                                  Unlock Resubmit
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 italic">
                              Not submitted yet
                            </span>
                            {canResubmit && (
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                Resubmit Allowed
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions: Contact & Admin Email Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* WhatsApp Chat */}
                          {student.phone_no ? (
                            <a
                              href={formatWhatsApp(student.phone_no, student.full_name)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Chat with ${student.full_name || "Participant"} on WhatsApp (${student.phone_no})`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xs hover:scale-110 active:scale-95 transition-all"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                              </svg>
                            </a>
                          ) : null}

                          {/* Direct Custom Email to Student */}
                          <button
                            type="button"
                            onClick={() => {
                              setDirectEmailStudent(student);
                              setDirectSubject("Important Notice regarding your VSPARK 2026 Participation");
                              setDirectMessage("");
                              setDirectError("");
                            }}
                            title={`Send direct custom email to ${student.full_name || "student"} (${student.email})`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-2xs hover:scale-110 active:scale-95 transition-all"
                          >
                            <Mail size={13} />
                          </button>

                          {/* Trigger Password Reset Email */}
                          <button
                            type="button"
                            disabled={resettingPasswordId === student.id}
                            onClick={() => handleSendPasswordReset(student)}
                            title={`Send password reset email to ${student.email}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-2xs hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {resettingPasswordId === student.id ? (
                              <RefreshCw size={12} className="animate-spin text-amber-600" />
                            ) : (
                              <KeyRound size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Deposit Receipt</h3>
                <p className="text-[11px] text-slate-500">Student fee confirmation screenshot</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-96 overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="max-h-full max-w-full rounded object-contain"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <a
                href={selectedReceipt}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <ExternalLink size={13} /> Open Full Size
              </a>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="h-8 px-3.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement / Notice Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Broadcast Official Email Notice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatch branded VSPARK 2026 announcements directly to student inboxes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNoticeModalOpen(false);
                  setNoticeError("");
                  setNoticeSuccess(null);
                }}
                disabled={sendingNotice}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {noticeSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{noticeSuccess}</span>
              </div>
            )}

            {noticeError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-800">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{noticeError}</span>
              </div>
            )}

            <form onSubmit={handleSendNotice} className="space-y-4">
              {/* Audience Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Recipient Audience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      noticeAudience === "verified"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium ring-1 ring-blue-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value="verified"
                      checked={noticeAudience === "verified"}
                      onChange={() => setNoticeAudience("verified")}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Approved Only</div>
                      <div className="text-[11px] text-slate-500">
                        {verifiedCount} verified student{verifiedCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      noticeAudience === "all"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium ring-1 ring-blue-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value="all"
                      checked={noticeAudience === "all"}
                      onChange={() => setNoticeAudience("all")}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">All Registered</div>
                      <div className="text-[11px] text-slate-500">
                        {students.length} total student{students.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Subject Line
                  </label>
                  <span className="text-[10px] text-slate-400">Prefix [VSPARK 2026] auto-added</span>
                </div>
                <input
                  type="text"
                  value={noticeSubject}
                  onChange={(e) => setNoticeSubject(e.target.value)}
                  placeholder="e.g., Event Kickoff: Competition Starts in 15 Minutes!"
                  required
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
                />

                {/* Quick Subject Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                  {[
                    "Event Starting Soon: Guidelines & Access",
                    "Task Statement Released: You May Begin",
                    "1 Hour Remaining: Final Code Push Reminder",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNoticeSubject(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Message Content */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Notice Message
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {noticeMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  placeholder="Type your official announcement here. Paragraphs and line breaks will be preserved in the formatted email..."
                  required
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 resize-none font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  disabled={sendingNotice}
                  className="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotice || !noticeSubject.trim() || !noticeMessage.trim()}
                  className="h-9 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {sendingNotice ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Dispatching Email...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Notice Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct 1-on-1 Student Email Modal */}
      {directEmailStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail size={19} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Send Direct Email
                  </h3>
                  <p className="text-xs text-slate-500">
                    To: <span className="font-semibold text-slate-800">{directEmailStudent.full_name || "Student"}</span> ({directEmailStudent.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDirectEmailStudent(null);
                  setDirectError("");
                }}
                disabled={sendingDirect}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {directError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{directError}</span>
              </div>
            )}

            <form onSubmit={handleSendDirectEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={directSubject}
                  onChange={(e) => setDirectSubject(e.target.value)}
                  placeholder="e.g., Follow-up regarding your project repository"
                  required
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message Body
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {directMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Write your custom message here. Paragraph breaks and formatting are preserved..."
                  required
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDirectEmailStudent(null)}
                  disabled={sendingDirect}
                  className="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingDirect || !directSubject.trim() || !directMessage.trim()}
                  className="h-9 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {sendingDirect ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
