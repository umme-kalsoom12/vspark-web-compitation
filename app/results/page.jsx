"use client";

import {
  Award,
  ChevronLeft,
  Code2,
  ExternalLink,
  Home,
  Medal,
  Search,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResultsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchResults = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from("competition_settings")
        .select("results_published")
        .eq("id", 1)
        .single();

      if (settings?.results_published) {
        setIsPublished(true);

        const { data: results, error } = await supabase
          .from("submissions")
          .select(
            `
            total_marks,
            github_url,
            profiles (
              full_name,
              university_name
            )
          `
          )
          .order("total_marks", { ascending: false });

        if (!error && results) {
          setSubmissions(results);
        }
      }
    } catch (err) {
      console.error("Error loading results:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredResults = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    const name = sub.profiles?.full_name?.toLowerCase() || "";
    const uni = sub.profiles?.university_name?.toLowerCase() || "";
    return name.includes(q) || uni.includes(q);
  });

  const top3 = submissions.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-500">
        Loading results...
      </div>
    );
  }

  // Unpublished State
  if (!isPublished) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-10 font-sans">
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
            <ChevronLeft size={16} /> Home
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vspark-logo.png" alt="VSPARK 2026" className="h-7 w-auto object-contain" />
        </div>

        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Trophy size={22} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Results Under Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Faculty evaluators are currently scoring participant submissions.
            Official results will be published here upon completion.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="h-9 px-4 inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          COMSATS University Vehari Campus
        </div>
      </div>
    );
  }

  // Published State
  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft size={16} /> Back to Homepage
          </Link>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Official Standings Live
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vspark-logo.png"
            alt="VSPARK 2026"
            className="h-9 w-auto object-contain mb-2"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Official Results & Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Validated evaluation marks, participant rankings, and podium winners.
          </p>
        </div>

        {/* Top 3 Podium (Clean cards) */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center order-2 md:order-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">2nd Position</span>
                <p className="font-bold text-sm text-slate-900 mt-1 truncate">
                  {top3[1].profiles?.full_name || "Participant"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {top3[1].profiles?.university_name || "COMSATS"}
                </p>
                <p className="text-lg font-bold text-slate-900 mt-2">
                  {top3[1].total_marks ?? 0} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </p>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="bg-blue-50/60 border-2 border-blue-600 rounded-xl p-4 text-center order-1 md:order-2">
                <span className="text-[11px] font-bold text-blue-700 uppercase">1st • Champion</span>
                <p className="font-bold text-base text-slate-900 mt-1 truncate">
                  {top3[0].profiles?.full_name || "Winner"}
                </p>
                <p className="text-[11px] text-slate-600 truncate">
                  {top3[0].profiles?.university_name || "COMSATS"}
                </p>
                <p className="text-xl font-extrabold text-blue-600 mt-2">
                  {top3[0].total_marks ?? 0} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </p>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center order-3 md:order-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">3rd Position</span>
                <p className="font-bold text-sm text-slate-900 mt-1 truncate">
                  {top3[2].profiles?.full_name || "Participant"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {top3[2].profiles?.university_name || "COMSATS"}
                </p>
                <p className="text-lg font-bold text-slate-900 mt-2">
                  {top3[2].total_marks ?? 0} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Full Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">All Participant Scores</span>
            <div className="relative w-48 sm:w-64">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-4">Participant</th>
                  <th className="py-2.5 px-4">Institution</th>
                  <th className="py-2.5 px-4 text-right">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-center text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {sub.profiles?.full_name || "Participant"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {sub.profiles?.university_name || "COMSATS"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {sub.total_marks ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
