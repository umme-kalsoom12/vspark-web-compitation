"use client";

import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  FileCheck2,
  Lock,
  Scale,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

function renderFormattedText(text) {
  if (!text) return null;
  const tokenRegex =
    /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*\s*[\s\S]*?\s*\*\*|\*[^*]+\*|<(?:strong|b)>.*?<\/(?:strong|b)>|<(?:em|i)>.*?<\/(?:em|i)>|<u>.*?<\/u>)/i;

  const elements = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const match = remaining.match(tokenRegex);
    if (!match) {
      elements.push(remaining);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      elements.push(remaining.slice(0, matchIndex));
    }

    const token = match[0];
    keyIdx++;

    if (token.startsWith("**") && token.endsWith("**")) {
      const inner = token.slice(2, -2).trim();
      elements.push(
        <strong key={`b-${keyIdx}`} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    } else if (/^<(?:strong|b)>.*?<\/(?:strong|b)>$/i.test(token)) {
      const inner = token
        .replace(/^<(?:strong|b)>/i, "")
        .replace(/<\/(?:strong|b)>$/i, "")
        .trim();
      elements.push(
        <strong key={`b-${keyIdx}`} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      elements.push(
        <em key={`em-${keyIdx}`} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    } else if (/^<(?:em|i)>.*?<\/(?:em|i)>$/i.test(token)) {
      const inner = token
        .replace(/^<(?:em|i)>/i, "")
        .replace(/<\/(?:em|i)>$/i, "");
      elements.push(
        <em key={`em-${keyIdx}`} className="italic text-slate-800">
          {inner}
        </em>
      );
    } else if (token.startsWith("<u>") && token.endsWith("</u>")) {
      elements.push(
        <span key={`u-${keyIdx}`} className="underline underline-offset-2">
          {token.slice(3, -4)}
        </span>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      elements.push(
        <code
          key={`c-${keyIdx}`}
          className="font-mono text-[11px] bg-slate-100 text-blue-700 px-1 py-0.5 rounded border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      elements.push(token);
    }

    remaining = remaining.slice(matchIndex + token.length);
  }

  return elements;
}

const DEFAULT_RUBRIC_LINES = [
  "UI/UX and Responsiveness (10 Marks)",
  "Authentication: Register, Login, Protected Routes (15 Marks)",
  "Database & Full CRUD Operations (20 Marks)",
  "Cloud Storage File Uploads (10 Marks)",
  "External API Integration & Real Data (15 Marks)",
  "Live Public Deployment: Vercel Preferred (15 Marks)",
  "Code Quality, Structure & Validation (5 Marks)",
  "Documentation: README & Screenshots (5 Marks)",
  "Live Demo & Code Defense with Judges (5 Marks)",
  "Total: 100 Marks",
];

const DEFAULT_RULES_LINES = [
  "Duration: Exactly 120 minutes (strict auto-freeze).",
  "Group Work: Maximum 2 members per team.",
  "Submissions: GitHub repository URL + Project folder upload.",
  "README: Setup steps, env variable names & process screenshots required.",
  "Security: Never upload real .env keys or passwords.",
  "Live Verification: Judges test features and evaluate code live.",
];

const DEFAULT_CHECKLIST_ITEMS = [
  "Registration, login, logout, and protected routes work.",
  "Database is connected and full CRUD works.",
  "File upload and retrieval work securely.",
  "At least one external API works, with proper error handling.",
  "App is deployed on public URL (Vercel preferred).",
  "GitHub repository has complete source code.",
  "Full project folder is uploaded (excluding node_modules).",
  "README includes setup steps, env names, and process screenshots.",
  "No real secrets or .env files committed.",
  "Team details and links are ready for jury review.",
  "Everything submitted before the 120-minute deadline.",
];

export default function CompetitionRulesModal({
  isOpen,
  onClose,
  onAcknowledge,
  showAcknowledgeButton = true,
  data = null,
}) {
  const [activeSegment, setActiveSegment] = useState("rubric"); // "rubric" | "rules" | "checklist"
  const [fetchedData, setFetchedData] = useState(null);

  // Fetch dynamic rules from admin config if not passed directly
  useEffect(() => {
    if (data) {
      setFetchedData(data);
      return;
    }
    if (isOpen && !fetchedData) {
      fetch("/api/bank")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json) setFetchedData(json);
        })
        .catch((err) => console.error("Failed to load rules for modal:", err));
    }
  }, [isOpen, data, fetchedData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRules = data || fetchedData;

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vspark_rules_acknowledged", "true");
        localStorage.setItem("vspark_rules_acknowledged_at", new Date().toISOString());
      } catch {
        // Ignore local storage error
      }
    }
    if (onAcknowledge) {
      onAcknowledge();
    } else if (onClose) {
      onClose();
    }
  };

  // Parse Rubric Lines (Exact match to Register Page Box 2)
  const rubricLines = currentRules?.gradingCriteria
    ? currentRules.gradingCriteria
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    : DEFAULT_RUBRIC_LINES;

  // Parse Rules Lines (Exact match to Register Page Box 3)
  const rulesLines = currentRules?.competitionGuidelines
    ? currentRules.competitionGuidelines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    : DEFAULT_RULES_LINES;

  // Extract checklist items dynamically
  let checklistItems = DEFAULT_CHECKLIST_ITEMS;
  if (currentRules?.checklist) {
    if (Array.isArray(currentRules.checklist)) {
      checklistItems = currentRules.checklist;
    } else if (typeof currentRules.checklist === "string") {
      checklistItems = currentRules.checklist
        .split("\n")
        .map((l) => l.replace(/^[-*•\d+.]\s*/, "").trim())
        .filter(Boolean);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Sleek App-Style Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
              <BookOpen size={20} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Web Development Competition
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                120 Minutes (2 Hours) • 100 Marks • Maximum 2 Members
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Native Segmented Pill Control */}
        <div className="px-5 pt-3 pb-2 bg-white">
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveSegment("rubric")}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSegment === "rubric"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              <Scale size={13} />
              <span>100-Marks Rubric</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSegment("rules")}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSegment === "rules"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              <ShieldCheck size={13} />
              <span>Rules &amp; Limits</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSegment("checklist")}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSegment === "checklist"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              <FileCheck2 size={13} />
              <span>Checklist</span>
            </button>
          </div>
        </div>

        {/* Content Body - Unified Clean List Design */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 bg-slate-50/30">
          {/* SEGMENT 1: 100-MARKS RUBRIC (100% SAME DESIGN AS REGISTER BOX 2) */}
          {activeSegment === "rubric" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Scale size={16} className="text-emerald-600" />
                  <span>Evaluation &amp; Grading (100 Pts)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                  100 Pts
                </span>
              </div>
              <div className="text-[12.5px] text-slate-700 leading-relaxed font-sans space-y-2">
                {rubricLines.map((line, idx) => {
                  const cleanText = line.replace(/^\d+[\.\)]\s*/, "");
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-[12.5px] text-slate-700 leading-snug"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10.5px] flex items-center justify-center shrink-0 border border-blue-200 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <span>{renderFormattedText(cleanText)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEGMENT 2: RULES & LIMITS (100% SAME DESIGN AS REGISTER BOX 3) */}
          {activeSegment === "rules" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <BookOpen size={16} className="text-purple-600" />
                  <span>Rules &amp; Submission Freeze</span>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono">
                  120 Mins
                </span>
              </div>
              <div className="text-[12.5px] text-slate-700 leading-relaxed font-sans space-y-2">
                {rulesLines.map((line, idx) => {
                  const cleanText = line.replace(/^\d+[\.\)]\s*/, "");
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-[12.5px] text-slate-700 leading-snug"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10.5px] flex items-center justify-center shrink-0 border border-purple-200 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <span>{renderFormattedText(cleanText)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEGMENT 3: CHECKLIST */}
          {activeSegment === "checklist" && (
            <div className="space-y-3">
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2">
                <p className="text-xs font-bold text-slate-900">
                  Pre-Submission Participant Checklist:
                </p>
                <div className="space-y-1.5 pt-1">
                  {checklistItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-2.5 text-[12px] text-slate-700"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11.5px] text-amber-900 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Reminder:</strong> Do not upload <code>.env</code> files containing secret keys. Submissions lock at 120 minutes.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Clean App Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Official Web Development Competition Guidelines
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            {showAcknowledgeButton && (
              <button
                type="button"
                onClick={handleAccept}
                className="h-9 px-5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Check size={14} />
                <span>I Understand &amp; Agree</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
