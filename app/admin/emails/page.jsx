"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Megaphone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";
import { cleanTaskDescription } from "../../lib/system-settings";

function formatEventDate(dateStr) {
  if (!dateStr) return "Not Scheduled";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Not Scheduled";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function AdminEmailsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Competition Task Details
  const [compData, setCompData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    task_pdf_url: "",
    task_description: "",
  });

  // Students Data
  const [students, setStudents] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);

  // 1. Task Announcement Email State
  const [taskAudience, setTaskAudience] = useState("verified");
  const [sendingTask, setSendingTask] = useState(false);

  // 2. Custom Notice Email State
  const [noticeSubject, setNoticeSubject] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeAudience, setNoticeAudience] = useState("verified");
  const [sendingNotice, setSendingNotice] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      startTopLoading();

      // 1. Load competition settings
      const { data: comp } = await supabase
        .from("competition_settings")
        .select("title, start_time, end_time, task_pdf_url, task_description")
        .eq("id", 1)
        .single();

      if (comp) {
        setCompData({
          title: comp.title || "VSPARK 2026 Web Development Hackathon",
          start_time: comp.start_time || "",
          end_time: comp.end_time || "",
          task_pdf_url: comp.task_pdf_url || "",
          task_description: cleanTaskDescription(comp.task_description || ""),
        });
      }

      // 2. Load student list directly from Supabase profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, status, created_at")
        .order("created_at", { ascending: false });

      if (pErr) {
        console.error("Failed to load profiles from Supabase:", pErr);
      }

      // 3. Fetch server approvals to ensure 100% accuracy with Vercel state
      let serverApprovals = {};
      try {
        const appRes = await fetch("/api/admin/students");
        if (appRes.ok) {
          const appData = await appRes.json();
          serverApprovals = appData.approvals || {};
        }
      } catch (e) {
        console.warn("Failed to load server approvals:", e);
      }

      const list = (profiles || []).map((p) => {
        const effectiveStatus = serverApprovals[p.id] || p.status || "pending";
        return {
          ...p,
          status: effectiveStatus,
        };
      });

      setStudents(list);
      const verified = list.filter(
        (s) => s.status === "verified" || s.status === "approved"
      ).length;
      setVerifiedCount(verified);
    } catch (err) {
      console.error("Failed to load email page data:", err);
    } finally {
      setInitialLoading(false);
      stopTopLoading();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 7000);
  };

  // Handler: Send Task Announcement Email (Manual Dispatch)
  const handleSendTaskAnnouncement = async (e) => {
    e.preventDefault();
    const count = taskAudience === "verified" ? verifiedCount : students.length;
    if (count === 0) {
      showNotification(
        "error",
        `No recipients available for audience: '${taskAudience}'. Total registered students: ${students.length}, Approved: ${verifiedCount}.`
      );
      return;
    }

    const audienceLabel =
      taskAudience === "verified" ? "approved students" : "all registered students";
    const confirmed = window.confirm(
      `Send official Task Announcement email to ${count} ${audienceLabel}?\n\nThis will email the competition title, start time, code freeze deadline, and full challenge specifications.`
    );
    if (!confirmed) return;

    setSendingTask(true);
    startTopLoading();
    try {
      const res = await fetch("/api/admin/send-task-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAudience: taskAudience }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch task announcement email.");
      }

      showNotification(
        "success",
        `🎉 Task Announcement email successfully sent to ${data.count} student(s)!`
      );
    } catch (err) {
      showNotification("error", err.message || "Failed to dispatch email.");
    } finally {
      setSendingTask(false);
      stopTopLoading();
    }
  };

  // Handler: Send Custom Notice Email
  const handleSendCustomNotice = async (e) => {
    e.preventDefault();
    if (!noticeSubject.trim() || !noticeMessage.trim()) {
      showNotification("error", "Please provide both an email subject line and message body.");
      return;
    }

    const count = noticeAudience === "verified" ? verifiedCount : students.length;
    if (count === 0) {
      showNotification(
        "error",
        `No recipients available for audience: '${noticeAudience}'. Total registered students: ${students.length}, Approved: ${verifiedCount}.`
      );
      return;
    }

    const audienceLabel =
      noticeAudience === "verified" ? "approved students" : "all registered students";
    const confirmed = window.confirm(
      `Broadcast notice "${noticeSubject}" to ${count} ${audienceLabel}?`
    );
    if (!confirmed) return;

    setSendingNotice(true);
    startTopLoading();
    try {
      const res = await fetch("/api/admin/send-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: noticeSubject,
          message: noticeMessage,
          targetAudience: noticeAudience,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send broadcast notice.");
      }

      showNotification(
        "success",
        `📢 Custom Announcement successfully sent to ${data.count} student(s)!`
      );
      setNoticeSubject("");
      setNoticeMessage("");
    } catch (err) {
      showNotification("error", err.message || "Failed to send broadcast.");
    } finally {
      setSendingNotice(false);
      stopTopLoading();
    }
  };

  if (initialLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Connecting to Email Services &amp; Loading Student Counts...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Mail size={17} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Student Email Broadcast
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10">
            Dispatch official task release announcements and custom broadcast notices to students.
          </p>
        </div>

        {/* Live Audience Counter Badges */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 self-start sm:self-auto shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs">
            <Users size={14} className="text-slate-500" />
            <span className="font-bold text-slate-900">{students.length}</span>
            <span className="text-slate-500">Total Students</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="font-bold text-emerald-700">{verifiedCount}</span>
            <span className="text-slate-500">Approved</span>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-2xs text-xs font-medium animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* SECTION 1: Manual Task Release Announcement Email */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Task &amp; Problem Brief Release Email
                </h2>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider">
                  Manual Send
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send the official challenge release email containing the competition title, start time, code freeze deadline, and full task specifications.
              </p>
            </div>
          </div>
          <Link
            href="/admin/task"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 hover:underline self-end sm:self-auto shrink-0"
          >
            Edit Task Brief &rarr;
          </Link>
        </div>

        {/* Live Event Data Snapshot Preview */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={12} className="text-indigo-500" />
            <span>Task Data That Will Be Sent to Students:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Title */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Challenge Title</span>
              <p className="font-bold text-slate-900 truncate">
                {compData.title || "VSPARK 2026 Web Development Hackathon"}
              </p>
            </div>

            {/* Start Time */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Calendar size={11} className="text-blue-500" /> Competition Start
              </span>
              <p className="font-bold text-slate-800">
                {formatEventDate(compData.start_time)}
              </p>
            </div>

            {/* Code Freeze Deadline */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Clock size={11} className="text-amber-500" /> Code Freeze Deadline
              </span>
              <p className="font-bold text-amber-900">
                {formatEventDate(compData.end_time)}
              </p>
            </div>
          </div>

          {/* PDF URL Info */}
          {compData.task_pdf_url ? (
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50/60 border border-indigo-200 rounded-lg px-3 py-2">
              <FileText size={14} className="shrink-0" />
              <span className="truncate">
                Attached PDF: <strong className="font-mono">{compData.task_pdf_url}</strong>
              </span>
              <a
                href={compData.task_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 font-semibold hover:underline shrink-0 text-[11px]"
              >
                View PDF <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              No PDF uploaded. Students will view the specifications directly on their online student dashboard.
            </p>
          )}
        </div>

        {/* Task Email Recipient Selector & Send Button */}
        <form onSubmit={handleSendTaskAnnouncement} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Recipient Audience
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  taskAudience === "verified"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="taskAudience"
                  value="verified"
                  checked={taskAudience === "verified"}
                  onChange={() => setTaskAudience("verified")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    Approved Students Only ({verifiedCount})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sends to all {verifiedCount} verified students with approved fee deposits.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  taskAudience === "all"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="taskAudience"
                  value="all"
                  checked={taskAudience === "all"}
                  onChange={() => setTaskAudience("all")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    All Registered Students ({students.length})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sends to all {students.length} accounts, including pending verifications.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500">
              ⚡ Click the button below when you are ready to send the task notification to students.
            </p>

            <button
              type="submit"
              disabled={
                sendingTask ||
                (taskAudience === "verified" ? verifiedCount === 0 : students.length === 0)
              }
              className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendingTask ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Dispatching Task Announcement...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>
                    Send Task Announcement Email (
                    {taskAudience === "verified" ? verifiedCount : students.length} Students)
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Custom Notice & Announcement Broadcast */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Broadcast Custom Notice or Announcement
              </h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Custom Message
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Send ad-hoc announcements like event starting alerts, zoom meeting links, or venue updates.
            </p>
          </div>
        </div>

        {/* Quick Subject Presets */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Subject Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              "🚨 Final 30 Minutes: Complete Your GitHub Repository Submission!",
              "🚀 VSPARK 2026 Web Hackathon is Officially Starting!",
              "💡 Submission Guidelines Reminder & Code Freeze Deadline",
              "🏆 Competition Submissions Closed: Evaluation Process Underway",
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNoticeSubject(preset)}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors text-left cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendCustomNotice} className="space-y-4">
          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={noticeSubject}
              onChange={(e) => setNoticeSubject(e.target.value)}
              placeholder="e.g. Urgent Update: Competition Starting in 1 Hour"
              className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs font-medium"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notice Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              placeholder="Write your announcement details here. Line breaks and bullet points are preserved in the student's email."
              className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs font-sans leading-relaxed"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Audience
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  noticeAudience === "verified"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium ring-1 ring-blue-600"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="noticeAudience"
                  value="verified"
                  checked={noticeAudience === "verified"}
                  onChange={() => setNoticeAudience("verified")}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    Approved Students Only ({verifiedCount})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sends to all {verifiedCount} verified participants.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  noticeAudience === "all"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium ring-1 ring-blue-600"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="noticeAudience"
                  value="all"
                  checked={noticeAudience === "all"}
                  onChange={() => setNoticeAudience("all")}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    All Registered Students ({students.length})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sends to all {students.length} accounts.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={
                sendingNotice ||
                !noticeSubject.trim() ||
                !noticeMessage.trim() ||
                (noticeAudience === "verified" ? verifiedCount === 0 : students.length === 0)
              }
              className="h-10 px-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendingNotice ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Broadcasting Notice...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>
                    Dispatch Broadcast (
                    {noticeAudience === "verified" ? verifiedCount : students.length} Students)
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
