"use client";

import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  GitBranch,
  Layers,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminEvaluations() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGraded, setFilterGraded] = useState("all"); // "all" | "pending" | "graded"

  // Detailed Rubric Scoring Modal
  const [activeRubricSub, setActiveRubricSub] = useState(null);
  const [rubricScores, setRubricScores] = useState({
    functional: 0,
    architecture: 0,
    design: 0,
    innovation: 0,
  });
  const [feedbackNote, setFeedbackNote] = useState("");
  const [savingRubric, setSavingRubric] = useState(false);
  const [sendingResultsEmails, setSendingResultsEmails] = useState(false);
  const [resultsEmailMessage, setResultsEmailMessage] = useState(null);
  const [resultsPublished, setResultsPublished] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          `
          *,
          profiles (
            full_name,
            university_name,
            email
          )
        `
        )
        .order("submitted_at", { ascending: false });

      if (!error && data) {
        setSubmissions(data);
      }

      const { data: comp } = await supabase
        .from("competition_settings")
        .select("results_published")
        .eq("id", 1)
        .maybeSingle();

      if (comp) {
        setResultsPublished(Boolean(comp.results_published));
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleUpdateMarks = async (submissionId, newMarks, feedbackText = null) => {
    setUpdatingId(submissionId);

    let validMarks = parseInt(newMarks, 10);
    if (isNaN(validMarks)) validMarks = 0;
    if (validMarks < 0) validMarks = 0;
    if (validMarks > 100) validMarks = 100;

    const payload = { total_marks: validMarks };
    if (feedbackText !== null) {
      payload.admin_feedback = feedbackText.trim();
    }

    try {
      const { error } = await supabase
        .from("submissions")
        .update(payload)
        .eq("id", submissionId);

      if (!error) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId ? { ...sub, ...payload } : sub
          )
        );
        setSavedSuccessId(submissionId);
        setTimeout(() => setSavedSuccessId(null), 2000);
      }
    } catch (err) {
      console.error("Failed to update marks:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openRubricModal = (sub) => {
    setActiveRubricSub(sub);
    setFeedbackNote(sub.admin_feedback || "");

    const currentMarks = sub.total_marks || 0;
    if (currentMarks > 0) {
      // Approximate breakdown
      const f = Math.round(currentMarks * 0.35);
      const a = Math.round(currentMarks * 0.25);
      const d = Math.round(currentMarks * 0.25);
      const inv = Math.max(0, currentMarks - (f + a + d));
      setRubricScores({
        functional: Math.min(35, f),
        architecture: Math.min(25, a),
        design: Math.min(25, d),
        innovation: Math.min(15, inv),
      });
    } else {
      setRubricScores({ functional: 0, architecture: 0, design: 0, innovation: 0 });
    }
  };

  const handleSaveRubric = async () => {
    if (!activeRubricSub) return;
    setSavingRubric(true);
    const total =
      (parseInt(rubricScores.functional, 10) || 0) +
      (parseInt(rubricScores.architecture, 10) || 0) +
      (parseInt(rubricScores.design, 10) || 0) +
      (parseInt(rubricScores.innovation, 10) || 0);

    await handleUpdateMarks(activeRubricSub.id, total, feedbackNote);
    setSavingRubric(false);
    setActiveRubricSub(null);
  };

  const handleExportResultsCSV = () => {
    if (submissions.length === 0) return;
    const sorted = [...submissions].sort((a, b) => (b.total_marks || 0) - (a.total_marks || 0));
    const headers = [
      "Rank",
      "Participant Name",
      "Email Address",
      "University / Institution",
      "Total Marks (out of 100)",
      "Evaluator Remarks",
      "GitHub Repo URL",
      "Code Zip Download URL",
      "Submitted At",
    ];

    const rows = sorted.map((s, idx) => [
      `"${idx + 1}"`,
      `"${s.profiles?.full_name || ""}"`,
      `"${s.profiles?.email || ""}"`,
      `"${s.profiles?.university_name || ""}"`,
      `"${s.total_marks || 0}"`,
      `"${(s.admin_feedback || "").replace(/"/g, '""')}"`,
      `"${s.github_url || ""}"`,
      `"${s.drive_folder_url || ""}"`,
      `"${s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `vspark_final_grading_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDispatchResultsEmails = async () => {
    if (!resultsPublished) {
      alert(
        "Results are currently locked / hidden!\n\nPlease turn ON 'Publish Public Results' in Event Controls first, so students can view their standings and the leaderboard when they open the email link."
      );
      return;
    }

    const confirmed = window.confirm(
      "Dispatch final results emails to participants?\n\n• Top 3 Podium Winners will receive individual celebratory awards emails (1st, 2nd, 3rd place) with their score.\n• All other participants will receive an official notification to check the leaderboard at /results.\n\nProceed?"
    );
    if (!confirmed) return;

    setSendingResultsEmails(true);
    setResultsEmailMessage(null);

    try {
      const res = await fetch("/api/admin/send-results-email", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch results emails.");
      }

      setResultsEmailMessage({
        type: "success",
        text: data.message || "Results emails successfully dispatched!",
      });
      setTimeout(() => setResultsEmailMessage(null), 8000);
    } catch (err) {
      console.error("Results email error:", err);
      setResultsEmailMessage({
        type: "error",
        text: err.message || "Failed to send results emails.",
      });
    } finally {
      setSendingResultsEmails(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    const studentName = sub.profiles?.full_name?.toLowerCase() || "";
    const uniName = sub.profiles?.university_name?.toLowerCase() || "";
    const matchesSearch = studentName.includes(q) || uniName.includes(q);

    if (!matchesSearch) return false;
    const isGraded = (sub.total_marks || 0) > 0;
    if (filterGraded === "graded") return isGraded;
    if (filterGraded === "pending") return !isGraded;
    return true;
  });

  const gradedCount = submissions.filter((s) => (s.total_marks || 0) > 0).length;
  const pendingCount = submissions.length - gradedCount;
  const maxScore = submissions.reduce((max, s) => Math.max(max, s.total_marks || 0), 0);
  const avgScore =
    gradedCount > 0
      ? (
          submissions
            .filter((s) => (s.total_marks || 0) > 0)
            .reduce((acc, s) => acc + (s.total_marks || 0), 0) / gradedCount
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Project Evaluations & Grading
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect submitted repositories, download packaged code archives, and award scores using the 100-point rubric.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="flex flex-col items-start sm:items-end gap-1">
            <button
              type="button"
              onClick={handleDispatchResultsEmails}
              disabled={submissions.length === 0 || sendingResultsEmails}
              className={`h-9 px-3.5 inline-flex items-center gap-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 ${
                resultsPublished
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
              }`}
            >
              {sendingResultsEmails ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Dispatching Results...
                </>
              ) : (
                <>
                  <Megaphone size={14} /> Email Results to Students
                </>
              )}
            </button>
            <span
              className={`text-[10px] font-bold ${
                resultsPublished ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {resultsPublished ? "● Results are Live on Portal" : "○ Results Hidden in Event Controls"}
            </span>
          </div>

          <button
            onClick={handleExportResultsCSV}
            disabled={submissions.length === 0}
            className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export Graded Results (CSV)
          </button>
        </div>
      </div>

      {/* Results Email Status Toast / Banner */}
      {resultsEmailMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            resultsEmailMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {resultsEmailMessage.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{resultsEmailMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Submissions
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {submissions.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Graded Projects
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">
            {gradedCount}{" "}
            <span className="text-xs font-normal text-slate-400">
              ({submissions.length > 0 ? Math.round((gradedCount / submissions.length) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Average Score
          </p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">
            {avgScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Highest Score
          </p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">
            {maxScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name or university..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilterGraded("all")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterGraded === "all"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setFilterGraded("pending")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterGraded === "pending"
                ? "bg-white text-amber-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterGraded("graded")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterGraded === "graded"
                ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Graded ({gradedCount})
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Participant & Institution</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Submitted Source Code</th>
                <th className="py-3 px-4">Rubric & Feedback</th>
                <th className="py-3 px-4 text-right">Award Score (0–100)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Loading submissions...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No matching project submissions found.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">
                        {sub.profiles?.full_name || "Participant"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {sub.profiles?.university_name || "COMSATS University Vehari"}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {sub.github_url && (
                          <a
                            href={sub.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            <GitBranch size={13} className="text-slate-500" /> GitHub Repository
                          </a>
                        )}

                        {sub.drive_folder_url ? (
                          <a
                            href={sub.drive_folder_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                          >
                            <FileArchive size={13} className="text-emerald-600" /> Download Code (.zip)
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            GitHub only
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => openRubricModal(sub)}
                        className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                      >
                        <Sliders size={12} />
                        {sub.admin_feedback ? "Edit Rubric & Note" : "Grade via Rubric"}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={sub.total_marks || 0}
                          onBlur={(e) => handleUpdateMarks(sub.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateMarks(sub.id, e.currentTarget.value);
                            }
                          }}
                          className="w-16 h-8 text-center text-xs font-bold bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 transition-colors font-mono"
                        />
                        <div className="w-16 text-left text-[11px]">
                          {updatingId === sub.id ? (
                            <span className="text-blue-600 font-semibold">Saving...</span>
                          ) : savedSuccessId === sub.id ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> Saved
                            </span>
                          ) : (
                            <span className="text-slate-400">/ 100</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Rubric & Feedback Modal */}
      {activeRubricSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evaluation Rubric & Remarks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Participant: <span className="font-semibold text-slate-800">{activeRubricSub.profiles?.full_name}</span> ({activeRubricSub.profiles?.university_name || "COMSATS"})
                </p>
              </div>
              <button
                onClick={() => setActiveRubricSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rubric Criteria Sliders / Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Functional Completeness (Core Features)</span>
                  <span className="font-bold text-blue-600">{rubricScores.functional} / 35</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={rubricScores.functional}
                  onChange={(e) =>
                    setRubricScores({ ...rubricScores, functional: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Code Architecture & Cleanliness</span>
                  <span className="font-bold text-blue-600">{rubricScores.architecture} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rubricScores.architecture}
                  onChange={(e) =>
                    setRubricScores({ ...rubricScores, architecture: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>UI/UX & Mobile Responsiveness</span>
                  <span className="font-bold text-blue-600">{rubricScores.design} / 25</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rubricScores.design}
                  onChange={(e) =>
                    setRubricScores({ ...rubricScores, design: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Innovation & Presentation</span>
                  <span className="font-bold text-blue-600">{rubricScores.innovation} / 15</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={rubricScores.innovation}
                  onChange={(e) =>
                    setRubricScores({ ...rubricScores, innovation: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-xs font-bold text-blue-900">
                <span>Calculated Total Score:</span>
                <span className="text-base font-mono">
                  {(parseInt(rubricScores.functional, 10) || 0) +
                    (parseInt(rubricScores.architecture, 10) || 0) +
                    (parseInt(rubricScores.design, 10) || 0) +
                    (parseInt(rubricScores.innovation, 10) || 0)}{" "}
                  / 100
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Evaluator Remarks & Feedback Note (Visible to Student)
                </label>
                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="e.g. Excellent UI components, clean modular architecture. Minor bug on mobile navigation."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveRubricSub(null)}
                className="h-8 px-3.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingRubric}
                onClick={handleSaveRubric}
                className="h-8 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-60"
              >
                {savingRubric ? "Saving..." : "Apply Rubric & Save Marks"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}