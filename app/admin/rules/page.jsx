"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  FileText,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CompetitionRulesModal from "../../components/CompetitionRulesModal";
import RichTextEditor from "../../components/RichTextEditor";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";

const DEFAULT_CHECKLIST_TEXT = `Registration, login, logout, and protected routes work.
Database is connected and full CRUD works.
File upload and retrieval work securely.
At least one external API works, with proper error handling.
App is deployed on public URL (Vercel preferred).
GitHub repository has complete source code.
Full project folder is uploaded (excluding node_modules).
README includes setup steps, env names, and process screenshots.
No real secrets or .env files committed.
Team details and links are ready for jury review.
Everything submitted before the 120-minute deadline.`;

export default function AdminRulesPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [guidelinesInfo, setGuidelinesInfo] = useState({
    allowedTechStack: "React, Next.js, Node.js, Tailwind CSS, TypeScript/JavaScript, Supabase, Firebase",
    competitionGuidelines: "",
    gradingCriteria: "",
    checklist: DEFAULT_CHECKLIST_TEXT,
  });

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/bank");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          let checklistStr = DEFAULT_CHECKLIST_TEXT;
          if (Array.isArray(data.checklist)) {
            checklistStr = data.checklist.join("\n");
          } else if (typeof data.checklist === "string" && data.checklist.trim()) {
            checklistStr = data.checklist;
          }

          setGuidelinesInfo({
            allowedTechStack:
              data.allowedTechStack ||
              "React, Next.js, Node.js, Tailwind CSS, TypeScript/JavaScript, Supabase, Firebase",
            competitionGuidelines: data.competitionGuidelines || "",
            gradingCriteria: data.gradingCriteria || "",
            checklist: checklistStr,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load rules & guidelines:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleLoadPdfDefaults = () => {
    setGuidelinesInfo({
      allowedTechStack:
        "MERN Stack, React, Next.js, Django, Node.js, Tailwind CSS, Supabase, Firebase",
      competitionGuidelines: `**Duration**: Exactly 120 minutes (strict auto-freeze).
**Group Work**: Maximum 2 members per team.
**Submissions**: GitHub repository URL + Project folder upload.
**README**: Setup steps, env variable names & process screenshots required.
**Security**: Never upload real .env keys or passwords.
**Live Verification**: Judges test features and evaluate code live.`,
      gradingCriteria: `1. UI/UX and Responsiveness (10 Marks)
2. Authentication: Register, Login, Protected Routes (15 Marks)
3. Database & Full CRUD Operations (20 Marks)
4. Cloud Storage File Uploads (10 Marks)
5. External API Integration & Real Data (15 Marks)
6. Live Public Deployment: Vercel Preferred (15 Marks)
7. Code Quality, Structure & Validation (5 Marks)
8. Documentation: README & Screenshots (5 Marks)
9. Live Demo & Code Defense with Judges (5 Marks)
Total: 100 Marks`,
      checklist: DEFAULT_CHECKLIST_TEXT,
    });
    setMessage({
      text: "Loaded official Web Development Competition PDF guidelines into the editor. Review and click 'Save Rules & Guidelines' to publish.",
      type: "success",
    });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveRules = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);
    startTopLoading();

    try {
      const checklistArray = guidelinesInfo.checklist
        ? guidelinesInfo.checklist
            .split("\n")
            .map((item) => item.replace(/^[-*•\d+.]\s*/, "").trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedTechStack: guidelinesInfo.allowedTechStack,
          competitionGuidelines: guidelinesInfo.competitionGuidelines,
          gradingCriteria: guidelinesInfo.gradingCriteria,
          checklist: checklistArray,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update guidelines.");
      }

      setMessage({
        text: "Competition Guidelines, Evaluation Rubric & Popup Checklist saved successfully.",
        type: "success",
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({
        text: err.message || "Failed to update Guidelines.",
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
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Rules &amp; Guidelines...
        </p>
      </div>
    );
  }

  // Prepared data object for live modal preview
  const previewModalData = {
    allowedTechStack: guidelinesInfo.allowedTechStack,
    competitionGuidelines: guidelinesInfo.competitionGuidelines,
    gradingCriteria: guidelinesInfo.gradingCriteria,
    checklist: guidelinesInfo.checklist
      ? guidelinesInfo.checklist
          .split("\n")
          .map((item) => item.replace(/^[-*•\d+.]\s*/, "").trim())
          .filter(Boolean)
      : [],
  };

  return (
    <form onSubmit={handleSaveRules} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen size={22} className="text-purple-600" />
            <span>Rules &amp; Guidelines Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure permitted frameworks, rules, 100-mark scoring rubric, and participant checklist displayed on the registration page &amp; modal popup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="h-10 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Preview Rules Popup as Seen by Students"
          >
            <BookOpen size={14} className="text-purple-600" />
            <span>Preview Rules Popup</span>
          </button>

          <button
            type="button"
            onClick={handleLoadPdfDefaults}
            className="h-10 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors cursor-pointer"
            title="Load Official PDF Rules Template"
          >
            <Sparkles size={14} className="text-purple-600" />
            <span>Load PDF Defaults</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="h-10 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            <Save size={14} />
            <span>{loading ? "Saving..." : "Save Rules & Guidelines"}</span>
          </button>
        </div>
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
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
        <div className="space-y-6">
          {/* 1. Tech Stack */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Approved Frameworks &amp; Permitted Tech Stack (Register Page - Card 1)
            </label>
            <input
              type="text"
              value={guidelinesInfo.allowedTechStack}
              onChange={(e) =>
                setGuidelinesInfo({ ...guidelinesInfo, allowedTechStack: e.target.value })
              }
              placeholder="React, Next.js, Node.js, Tailwind CSS, TypeScript/JavaScript, Supabase, Firebase"
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-600 shadow-2xs font-sans"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Comma-separated list of approved frontend, backend, and database technologies.
            </span>
          </div>

          {/* 2. Guidelines & Code Rules */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900">
                2. Competition Guidelines &amp; Code Rules (Register Card 3 &amp; Popup: Rules &amp; Limits Tab)
              </label>
              <span className="text-[10px] text-purple-600 font-semibold">
                Word-Style MS Office Editor with Bold, Lists, Headings
              </span>
            </div>
            <RichTextEditor
              value={guidelinesInfo.competitionGuidelines}
              onChange={(val) =>
                setGuidelinesInfo({ ...guidelinesInfo, competitionGuidelines: val })
              }
              placeholder="Enter code packaging rules, duration, GitHub repo requirements, plagiarism policy..."
              minHeight="220px"
              helperText="Presented on the student registration page box 3 and inside the Rules & Limits tab of the popup."
            />
          </div>

          {/* 3. Grading Criteria / 100-Marks Rubric */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900">
                3. Evaluation &amp; Grading Rubric (Register Card 2 &amp; Popup: 100-Marks Rubric Tab)
              </label>
              <span className="text-[10px] text-purple-600 font-semibold">
                Word-Style MS Office Editor with Bold, Numbering, Marks Weightages
              </span>
            </div>
            <RichTextEditor
              value={guidelinesInfo.gradingCriteria}
              onChange={(val) =>
                setGuidelinesInfo({ ...guidelinesInfo, gradingCriteria: val })
              }
              placeholder="e.g. 1. UI/UX and Responsiveness (10 Marks)\n2. Authentication (15 Marks)..."
              minHeight="220px"
              helperText="Presented on the student registration page box 2 and inside the 100-Marks Rubric tab of the popup."
            />
          </div>

          {/* 4. Pre-Submission Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck2 size={15} className="text-purple-600" />
                <span>4. Pre-Submission Checklist Items (Popup Modal - Checklist Tab)</span>
              </label>
              <span className="text-[10px] text-purple-600 font-semibold">
                One rule/item per line
              </span>
            </div>
            <textarea
              value={guidelinesInfo.checklist}
              onChange={(e) =>
                setGuidelinesInfo({ ...guidelinesInfo, checklist: e.target.value })
              }
              rows={8}
              placeholder="Enter checklist items, one per line..."
              className="w-full p-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 leading-relaxed focus:outline-none focus:border-purple-600 shadow-2xs font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Each line becomes an interactive checklist item with a verified green tick in the student Rules popup.
            </span>
          </div>
        </div>
      </div>

      {/* Action Save Button Footer */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <span className="text-xs text-slate-500">
          Saves and synchronizes rules, 100-marks rubric, and popup checklist across student registration &amp; modal.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Save size={14} />
          <span>{loading ? "Saving Rules..." : "Save Rules & Guidelines"}</span>
        </button>
      </div>

      {/* Rules Modal Live Preview */}
      <CompetitionRulesModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        showAcknowledgeButton={false}
        data={previewModalData}
      />
    </form>
  );
}
