"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Lock,
  Megaphone,
  Save,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";

function safeFormatDatetimeLocal(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function AdminEventControlsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Event Controls & Timeline State
  const [eventSettings, setEventSettings] = useState({
    start_time: "",
    end_time: "",
    is_submission_open: true,
    results_published: false,
  });

  // Live Announcement Banner State
  const [announcementInfo, setAnnouncementInfo] = useState({
    enabled: false,
    text: "",
  });

  // Global Resubmission Setting
  const [allowAllResubmissions, setAllowAllResubmissions] = useState(false);

  const fetchEventSettings = useCallback(async () => {
    try {
      // 1. Fetch competition settings from Supabase
      const { data, error } = await supabase
        .from("competition_settings")
        .select("start_time, end_time, is_submission_open, results_published")
        .eq("id", 1)
        .single();

      if (data && !error) {
        setEventSettings({
          start_time: safeFormatDatetimeLocal(data.start_time),
          end_time: safeFormatDatetimeLocal(data.end_time),
          is_submission_open: Boolean(data.is_submission_open),
          results_published: Boolean(data.results_published),
        });
      }

      // 2. Fetch live announcement info
      const bankRes = await fetch("/api/bank");
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        if (bankData?.announcement) {
          setAnnouncementInfo(bankData.announcement);
        }
      }

      // 3. Fetch global resubmission status
      const appRes = await fetch("/api/admin/students");
      if (appRes.ok) {
        const appData = await appRes.json();
        setAllowAllResubmissions(Boolean(appData.allowAllResubmissions));
      }
    } catch (err) {
      console.error("Failed to load event controls:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventSettings();
  }, [fetchEventSettings]);

  const handleSaveControls = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);
    startTopLoading();

    try {
      // 1. Update competition_settings row
      const { error: sbErr } = await supabase
        .from("competition_settings")
        .update({
          start_time: eventSettings.start_time
            ? new Date(eventSettings.start_time).toISOString()
            : null,
          end_time: eventSettings.end_time
            ? new Date(eventSettings.end_time).toISOString()
            : null,
          is_submission_open: eventSettings.is_submission_open,
          results_published: eventSettings.results_published,
        })
        .eq("id", 1);

      if (sbErr) throw sbErr;

      // 2. Update announcement broadcast via /api/bank
      await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement: announcementInfo }),
      });

      // 3. Update global resubmission switch
      await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_all_resubmissions",
          allowAll: allowAllResubmissions,
        }),
      });

      setMessage({
        text: "Event Controls, Timeline & Broadcast updated successfully.",
        type: "success",
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({
        text: err.message || "Failed to update Event Controls.",
        type: "error",
      });
    } finally {
      setLoading(false);
      stopTopLoading();
    }
  };

  if (initialLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Event Controls...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveControls} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-blue-600" />
            <span>Event Controls &amp; Timeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live submission portal status, deadline code freeze, public results, and announcements.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
        >
          <Save size={14} />
          <span>{loading ? "Saving..." : "Save Event Controls"}</span>
        </button>
      </div>

      {/* Top Banner Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between shadow-2xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Master Operational Switches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Portal Submission Status */}
        <div
          onClick={() =>
            setEventSettings({
              ...eventSettings,
              is_submission_open: !eventSettings.is_submission_open,
            })
          }
          className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 ${
            eventSettings.is_submission_open
              ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
              : "bg-rose-50/60 border-rose-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Submission Portal
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {eventSettings.is_submission_open ? "PORTAL LIVE & OPEN" : "PORTAL LOCKED"}
              </h3>
            </div>
            {eventSettings.is_submission_open ? (
              <ToggleRight size={32} className="text-emerald-600" />
            ) : (
              <ToggleLeft size={32} className="text-rose-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {eventSettings.is_submission_open
              ? "Verified students can upload project zip files & GitHub repositories."
              : "Submissions are closed. Students will see the code freeze locked screen."}
          </p>
        </div>

        {/* 2. Publish Public Results */}
        <div
          onClick={() =>
            setEventSettings({
              ...eventSettings,
              results_published: !eventSettings.results_published,
            })
          }
          className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 ${
            eventSettings.results_published
              ? "bg-amber-50/70 border-amber-300 shadow-xs"
              : "bg-slate-100/70 border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Public Results
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {eventSettings.results_published ? "RESULTS PUBLISHED" : "RESULTS HIDDEN"}
              </h3>
            </div>
            {eventSettings.results_published ? (
              <ToggleRight size={32} className="text-amber-600" />
            ) : (
              <ToggleLeft size={32} className="text-slate-400" />
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {eventSettings.results_published
              ? "Rankings, scores, and podium honors are visible publicly on /results."
              : "Results page shows 'Evaluating in Progress' banner until released."}
          </p>
        </div>

        {/* 3. Global Resubmissions Switch */}
        <div
          onClick={() => setAllowAllResubmissions(!allowAllResubmissions)}
          className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 ${
            allowAllResubmissions
              ? "bg-blue-50/70 border-blue-300 shadow-xs"
              : "bg-slate-100/70 border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Resubmissions
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {allowAllResubmissions ? "RESUBMISSIONS OPEN" : "LOCKED AFTER SUBMIT"}
              </h3>
            </div>
            {allowAllResubmissions ? (
              <ToggleRight size={32} className="text-blue-600" />
            ) : (
              <ToggleLeft size={32} className="text-slate-400" />
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {allowAllResubmissions
              ? "All participants are permitted to replace/resubmit their project."
              : "Projects lock immediately upon initial submission (individual unlocks available)."}
          </p>
        </div>
      </div>

      {/* Timeline & Countdown Windows */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Competition Start &amp; Code Freeze Timeline
            </h3>
            <p className="text-[11px] text-slate-500">
              Defines the official start window and exact countdown deadline for all participants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Competition Start Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={eventSettings.start_time}
              onChange={(e) =>
                setEventSettings({ ...eventSettings, start_time: e.target.value })
              }
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-2xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Students see a countdown unlocking the problem brief until this moment.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Code Freeze Deadline (Strict Lock)
            </label>
            <input
              type="datetime-local"
              value={eventSettings.end_time}
              onChange={(e) =>
                setEventSettings({ ...eventSettings, end_time: e.target.value })
              }
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-2xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Submissions automatically terminate when this countdown timer reaches zero.
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Announcement Broadcast Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Megaphone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Broadcast Announcement to Students
              </h3>
              <p className="text-[11px] text-slate-500">
                Instantly broadcast urgent notices at the top of all participant dashboards.
              </p>
            </div>
          </div>

          <div
            onClick={() =>
              setAnnouncementInfo({
                ...announcementInfo,
                enabled: !announcementInfo.enabled,
              })
            }
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <span className="text-xs font-bold text-slate-700">
              {announcementInfo.enabled ? "BROADCAST: ACTIVE" : "BROADCAST: MUTED"}
            </span>
            {announcementInfo.enabled ? (
              <ToggleRight size={30} className="text-indigo-600" />
            ) : (
              <ToggleLeft size={30} className="text-slate-300" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Announcement Message Text
          </label>
          <input
            type="text"
            value={announcementInfo.text}
            onChange={(e) =>
              setAnnouncementInfo({ ...announcementInfo, text: e.target.value })
            }
            placeholder="e.g. ⚠️ 30 Minutes remaining until Code Freeze! Make sure your GitHub repos are public."
            className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">
              Visible live across all active student dashboards when enabled.
            </span>
            <Link
              href="/admin/emails"
              className="font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              Go to Email Broadcast &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Action Save Button */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <span className="text-xs text-slate-500">
          Updates portal lock status, countdown deadline, and live banners in real-time.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Save size={14} />
          <span>{loading ? "Saving Controls..." : "Save Event Controls"}</span>
        </button>
      </div>
    </form>
  );
}
