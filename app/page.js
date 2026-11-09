"use client";

import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Code2,
  HelpCircle,
  Menu,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const targetDate = new Date("2026-11-18T09:00:00").getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
          hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0"),
          minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"),
          seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0"),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: "Schedule", href: "#schedule" },
    { name: "Awards", href: "#awards" },
    { name: "FAQ", href: "#faq" },
  ];

  const faqs = [
    {
      q: "Who is eligible to participate?",
      a: "Undergraduate and graduate students from any recognized university or institute may participate. Basic proficiency in frontend or full-stack web development is required.",
    },
    {
      q: "What frameworks and libraries are permitted?",
      a: "React, Next.js, Vue, vanilla JavaScript/TypeScript, and modern styling libraries (Tailwind CSS, CSS Modules) are all permitted. Third-party cloud backends (Supabase, Firebase) can be integrated as per project requirements.",
    },
    {
      q: "How will projects be evaluated?",
      a: "Projects are graded according to four standard evaluation criteria: Functional Completeness (35%), Code Quality & Structure (25%), UI/UX Responsiveness (25%), and Innovation / Real-World Utility (15%).",
    },
    {
      q: "Is code submission via GitHub mandatory?",
      a: "Yes. All participants must provide an accessible GitHub repository URL via the dashboard before the final code freeze.",
    },
  ];

  const schedule = [
    { time: "09:00 AM", title: "Registration & Check-In", detail: "Lab seat assignment and participant credential verification." },
    { time: "10:00 AM", title: "Problem Statement Unveiled", detail: "The project brief, wireframe specs, and rubric are published." },
    { time: "01:00 PM", title: "Mid-Sprint Milestone", detail: "Review checkpoint with mentors for architectural alignment." },
    { time: "05:00 PM", title: "Code Freeze & Submission", detail: "The submission portal locks. Final commits pushed to GitHub." },
    { time: "06:15 PM", title: "Evaluation & Winners Announcement", detail: "Faculty jury concludes scoring; results are published live." },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-18 py-1">
            {/* Official VSPARK Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vspark-logo.png"
                alt="VSPARK 2026"
                className="h-11 sm:h-12 w-auto object-contain"
              />
              <span className="hidden sm:inline-block text-[10px] text-slate-500 font-medium leading-tight border-l border-slate-200 pl-2">
                COMSATS Vehari
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <Link
                href="/results"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Result
              </Link>
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/login"
                className="h-9 px-3.5 inline-flex items-center text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="h-9 px-4 inline-flex items-center text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                Register
              </Link>
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                {link.name}
              </a>
            ))}
            <Link
              href="/results"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-blue-600"
            >
              Result
            </Link>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-medium text-white bg-blue-600 rounded-lg"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-14 sm:pt-16 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vspark-logo.png"
            alt="VSPARK 2026"
            className="h-24 sm:h-32 md:h-36 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Registrations Open • Fall 2026 Edition</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          The Web Development Hackathon for Student Builders
        </h1>

        <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Design, architect, and deploy a production-grade web project in a single
          day. Showcase your engineering skills at COMSATS University Vehari.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            Register Now
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/results"
            className="w-full sm:w-auto h-11 px-5 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Trophy size={16} className="text-amber-500" />
            View Results
          </Link>
        </div>

        {/* Countdown */}
        <div className="mt-12 max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Event Begins November 18, 2026
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white border border-slate-200 rounded-lg py-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">{timeLeft.days}</span>
              <span className="block text-[10px] font-medium text-slate-400">Days</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg py-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">{timeLeft.hours}</span>
              <span className="block text-[10px] font-medium text-slate-400">Hours</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg py-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">{timeLeft.minutes}</span>
              <span className="block text-[10px] font-medium text-slate-400">Mins</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg py-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">{timeLeft.seconds}</span>
              <span className="block text-[10px] font-medium text-slate-400">Secs</span>
            </div>
          </div>
        </div>

        {/* Fact Strip */}
        <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div>
            <p className="text-xs text-slate-500 font-medium">Format</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">On-Site Hackathon</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Venue</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">CS Department, Vehari</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Teams</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">Solo or Duo</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Registration Fee</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">Rs. 500 / Participant</p>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Itinerary</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Hackathon Day Schedule</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Wednesday, November 18, 2026. All times in PKT.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
          {schedule.map((item, index) => (
            <div key={index} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
              <div className="flex items-start sm:items-center gap-3">
                <span className="w-20 font-mono text-xs font-bold text-blue-600 shrink-0">
                  {item.time}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Awards Section */}
      <section id="awards" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Recognition</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Competition Awards</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official shields of merit, verified certificates, and internship recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Runner Up */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <span className="text-xs font-semibold text-slate-500">2nd Position</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">First Runner Up</h3>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Silver Shield of Honor</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Certificate of Distinction</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Official Department Commendation</span>
              </li>
            </ul>
          </div>

          {/* Winner */}
          <div className="p-6 rounded-xl border-2 border-blue-600 bg-blue-50/40 relative">
            <span className="text-xs font-bold text-blue-700">1st Position</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Grand Champion</h3>
            <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-blue-600 shrink-0" />
                <span>VSPARK Winner&apos;s Trophy</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-blue-600 shrink-0" />
                <span>Gold Shield & Honor Certificate</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-blue-600 shrink-0" />
                <span>Software House Internship Fast-Track</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-blue-600 shrink-0" />
                <span>Showcase on Department Portal</span>
              </li>
            </ul>
          </div>

          {/* 3rd Place */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <span className="text-xs font-semibold text-slate-500">3rd Position</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Second Runner Up</h3>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Bronze Shield of Merit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Certificate of Accomplishment</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Department Digital Badges</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Help</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 text-xs text-slate-500 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-blue-600" />
            <span className="font-semibold text-slate-700">VSPARK 2026</span>
            <span>•</span>
            <span>Department of Computer Science, COMSATS University Vehari</span>
          </div>
          <div className="flex items-center gap-4 font-medium text-slate-600">
            <Link href="/results" className="hover:text-blue-600">Result</Link>
            <Link href="/login" className="hover:text-blue-600">Student Login</Link>
            <Link href="/admin/login" className="hover:text-blue-600">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
