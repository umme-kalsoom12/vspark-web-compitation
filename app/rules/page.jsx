"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  ExternalLink,
  FileCheck2,
  FileText,
  Github,
  Globe,
  KeyRound,
  Layers,
  Printer,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  COMPETITION_OVERVIEW,
  COMPETITION_RULES_SECTIONS,
  EVALUATION_PROCESS,
  MARKS_DISTRIBUTION,
  PARTICIPANT_CHECKLIST,
} from "../lib/competitionRulesData";

export default function CompetitionRulesPage() {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (idx) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans selection:bg-blue-600 selection:text-white pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Portal
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vspark-logo.png"
                alt="VSPARK 2026"
                className="h-8 w-auto object-contain"
              />
              <span className="text-xs font-bold text-slate-900 hidden sm:inline-block">
                Rules &amp; Marks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              type="button"
              className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Print Rules Document"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print Document</span>
            </button>

            <Link
              href="/register"
              className="h-8 px-3.5 inline-flex items-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Register Now
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <Clock size={13} /> Time: {COMPETITION_OVERVIEW.durationMinutes} Minutes (2 Hours)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Award size={13} /> Total: {COMPETITION_OVERVIEW.totalMarks} Marks
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              <Users size={13} /> Maximum {COMPETITION_OVERVIEW.maxTeamMembers} Members Per Group
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {COMPETITION_OVERVIEW.title}
            </h1>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
              {COMPETITION_OVERVIEW.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl pt-1">
              {COMPETITION_OVERVIEW.description}
            </p>
          </div>
        </div>

        {/* Section 1: Overview Callout */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <BookOpen size={18} className="text-blue-600" />
            <span>1. Overview</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Build a working web application and submit it with your source code and a live link. Please read all rules carefully before you start.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Total Marks</span>
              <span className="font-bold text-slate-900 text-sm font-mono">100 Marks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Time Allowed</span>
              <span className="font-bold text-slate-900 text-sm font-mono">120 Minutes (2 hours)</span>
            </div>
          </div>
        </section>

        {/* Section 2: Rules and Regulations */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              <span>2. Rules and Regulations</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              20 Strict Guidelines
            </span>
          </div>

          <div className="space-y-4">
            {COMPETITION_RULES_SECTIONS.map((sec) => (
              <div
                key={sec.categoryNumber}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
              >
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded font-bold">
                      {sec.categoryNumber}
                    </span>
                    <span>{sec.categoryTitle}</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-2.5 px-4 w-12 text-center">No.</th>
                        <th className="py-2.5 px-4 w-44">Rule</th>
                        <th className="py-2.5 px-4">Details &amp; Requirements</th>
                        <th className="py-2.5 px-4 w-32 text-right">Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sec.rules.map((rule) => (
                        <tr key={rule.number} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400 text-center">
                            {rule.number}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {rule.title}
                          </td>
                          <td className="py-3 px-4 text-slate-600 leading-relaxed">
                            {rule.details}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {rule.badge && (
                              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                {rule.badge}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Marks Distribution */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Scale size={20} className="text-emerald-600" />
                <span>3. Marks Distribution (100 Points Total)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Evaluation rubrics are transparent and applied identically to every participant team.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-mono">
              Max Score: 100
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4 w-52">Criterion</th>
                  <th className="py-3 px-4">What Is Checked by Evaluator</th>
                  <th className="py-3 px-4 w-28 text-right">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MARKS_DISTRIBUTION.map((item) => (
                  <tr key={item.no} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-center">
                      {item.no}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.criterion}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      {item.whatIsChecked}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-3 py-1 rounded-md border border-slate-200 inline-block">
                        {item.marks} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={3} className="py-4 px-4 text-right uppercase text-xs tracking-wider">
                    Total Possible Marks
                  </td>
                  <td className="py-4 px-4 text-right text-emerald-700 font-mono text-base font-extrabold">
                    100
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Section 4: How Your Work Is Checked */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>4. How Your Work Is Checked</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Judges verify features systematically during evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {EVALUATION_PROCESS.map((proc, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center font-mono">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-slate-800 text-xs">
                    {proc.title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                  {proc.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Participant Checklist */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileCheck2 size={18} className="text-emerald-600" />
                <span>5. Participant Checklist</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tick each requirement before your final submission.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
              {Object.values(checkedItems).filter(Boolean).length} / {PARTICIPANT_CHECKLIST.length} completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PARTICIPANT_CHECKLIST.map((item, idx) => {
              const isChecked = Boolean(checkedItems[idx]);
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs"
                      : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                      isChecked
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-xs leading-relaxed font-medium ${
                      isChecked ? "line-through opacity-85" : ""
                    }`}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Mandatory Security Rule:</p>
              <p className="leading-relaxed">
                Never commit real API keys, Supabase service roles, or database passwords in public GitHub repositories. Use <code>.env.example</code> with dummy placeholders. Submissions lock permanently when the timer hits zero.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 print:hidden shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">
              Ready to Join VSPARK 2026?
            </h3>
            <p className="text-xs text-slate-300">
              Register your team, review problem statements, and submit your project before the code freeze.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-10 px-4 inline-flex items-center text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="h-10 px-5 inline-flex items-center text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              Participant Registration
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
