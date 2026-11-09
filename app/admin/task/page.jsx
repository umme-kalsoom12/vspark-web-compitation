"use client";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RichTextEditor from "../../components/RichTextEditor";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";
import { cleanTaskDescription, embedConfigInDescription } from "../../lib/system-settings";
import { supabase } from "../../lib/supabase";

export default function AdminTaskPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [taskSettings, setTaskSettings] = useState({
    title: "",
    task_pdf_url: "",
    task_description: "",
  });

  const [systemConfig, setSystemConfig] = useState(null);

  const fetchTaskSettings = useCallback(async () => {
    try {
      // 1. Fetch competition settings from Supabase
      const { data, error } = await supabase
        .from("competition_settings")
        .select("title, task_pdf_url, task_description")
        .eq("id", 1)
        .single();

      if (data && !error) {
        setTaskSettings({
          title: data.title || "",
          task_pdf_url: data.task_pdf_url || "",
          task_description: cleanTaskDescription(data.task_description || ""),
        });
      }

      // 2. Fetch system config
      const bankRes = await fetch("/api/bank");
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        setSystemConfig(bankData);
      }
    } catch (err) {
      console.error("Failed to load task specifications:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaskSettings();
  }, [fetchTaskSettings]);

  const handleSaveTaskBrief = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);
    startTopLoading();

    try {
      const finalDescription = embedConfigInDescription(
        taskSettings.task_description,
        systemConfig || {}
      );

      const { error: sbErr } = await supabase
        .from("competition_settings")
        .update({
          title: taskSettings.title.trim() || "VSPARK 2026 Web Development Hackathon",
          task_pdf_url: taskSettings.task_pdf_url.trim() || null,
          task_description: finalDescription,
        })
        .eq("id", 1);

      if (sbErr) throw sbErr;

      setMessage({
        text: "Challenge Problem Brief & Specifications saved successfully.",
        type: "success",
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({
        text: err.message || "Failed to save Problem Brief.",
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
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Task Brief &amp; Specifications...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveTaskBrief} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-indigo-600" />
            <span>Task &amp; Problem Brief</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the competition title, official PDF guidelines, and problem specifications document.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
        >
          <Save size={14} />
          <span>{loading ? "Saving..." : "Save Challenge Brief"}</span>
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

      {/* Main Task Editor Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Competition Title
            </label>
            <input
              type="text"
              value={taskSettings.title}
              onChange={(e) =>
                setTaskSettings({ ...taskSettings, title: e.target.value })
              }
              placeholder="e.g. VSPARK 2026 Web Development Hackathon"
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Official PDF Guidelines URL <span className="text-slate-400 font-normal">(Optional download link for students)</span>
            </label>
            <input
              type="url"
              value={taskSettings.task_pdf_url}
              onChange={(e) =>
                setTaskSettings({ ...taskSettings, task_pdf_url: e.target.value })
              }
              placeholder="https://drive.google.com/... or https://..."
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Problem Requirements &amp; Task Brief (MS Word-Style Document)
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold">
                Word-style ribbon formatting with live student preview
              </span>
            </div>
            <RichTextEditor
              value={taskSettings.task_description}
              onChange={(val) =>
                setTaskSettings({ ...taskSettings, task_description: val })
              }
              placeholder="Enter problem specifications, user stories, required modules, API requirements, and grading criteria..."
              minHeight="340px"
              helperText="Rendered with high-contrast formatting in student workspace."
            />
          </div>
        </div>
      </div>

      {/* Informational Callout: How to announce the task */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950">
              Ready to announce this task to students?
            </h4>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Saving here updates the challenge specifications. To notify students via email with all task details, use the Email Broadcast section.
            </p>
          </div>
        </div>

        <Link
          href="/admin/emails"
          className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-xl shadow-2xs transition-colors shrink-0"
        >
          <span>Go to Email Broadcast</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Action Save Button */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <span className="text-xs text-slate-500">
          Saves the challenge title, PDF link, and full problem document for participants.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Save size={14} />
          <span>{loading ? "Saving Brief..." : "Save Challenge Brief"}</span>
        </button>
      </div>
    </form>
  );
}
