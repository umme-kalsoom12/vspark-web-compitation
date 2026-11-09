"use client";

import {
  AlertCircle,
  Award,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Scale,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CompetitionRulesModal from "../../components/CompetitionRulesModal";
import RichTextRenderer from "../../components/RichTextRenderer";
import {
  startTopLoading,
  stopTopLoading,
} from "../../components/TopLoadingBar";
import { supabase } from "../../lib/supabase";

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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Dynamic competition specifications loaded from admin
  const [competitionDetails, setCompetitionDetails] = useState({
    accountTitle: "COMSATS Web Society",
    accountNumber: "0123 4567 8901 23",
    bankName: "Easypaisa / HBL",
    feeAmount: "Rs. 500",
    allowedTechStack:
      "React, Next.js, Node.js, Tailwind CSS, TypeScript/JavaScript, Supabase, Firebase",
    competitionGuidelines: "",
    gradingCriteria: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    university: "",
    password: "",
    receiptUrl: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        setCheckingSession(false);
      }
    });

    // Fetch dynamic specifications & deposit instructions
    fetch("/api/bank")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setCompetitionDetails({
            accountTitle: data.accountTitle || "COMSATS Web Society",
            accountNumber: data.accountNumber || "0123 4567 8901 23",
            bankName: data.bankName || "Easypaisa / HBL",
            feeAmount: data.feeAmount || "Rs. 500",
            allowedTechStack:
              data.allowedTechStack ||
              "React, Next.js, Node.js, Tailwind CSS, TypeScript/JavaScript, Supabase, Firebase",
            competitionGuidelines: data.competitionGuidelines || "",
            gradingCriteria: data.gradingCriteria || "",
          });
        }
      })
      .catch((err) =>
        console.error("Failed to load competition details:", err),
      );
  }, [router]);

  const handleChange = (e) => {
    if (e.target.name === "email" && isAlreadyRegistered) {
      setIsAlreadyRegistered(false);
      setError("");
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckEmail = async () => {
    const emailToTest = formData.email?.trim().toLowerCase();
    if (!emailToTest || !emailToTest.includes("@")) return;

    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", emailToTest)
        .maybeSingle();

      if (existing) {
        setIsAlreadyRegistered(true);
        setError(
          "This email address is already registered. Please sign in or reset your password.",
        );
      }
    } catch {
      // Ignore background check failure
    }
  };

  const handleCopyAccount = () => {
    if (competitionDetails.accountNumber) {
      navigator.clipboard.writeText(competitionDetails.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsAlreadyRegistered(false);

    if (!agreeTerms) {
      setError(
        "Please read and accept the Competition Rules and Terms of Participation before registering.",
      );
      return;
    }

    setLoading(true);
    startTopLoading();

    const emailTrimmed = formData.email.trim().toLowerCase();

    try {
      // 1. Proactive DB check: Check if email already exists in profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", emailTrimmed)
        .maybeSingle();

      if (existingProfile) {
        setError(
          "This email address is already registered. Please sign in to access your account, or reset your password.",
        );
        setIsAlreadyRegistered(true);
        return;
      }

      // 2. Auth signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailTrimmed,
        password: formData.password,
      });

      if (authError) {
        const errMsg = authError.message?.toLowerCase() || "";
        if (
          errMsg.includes("already registered") ||
          errMsg.includes("already in use") ||
          errMsg.includes("already exists") ||
          authError.code === "user_already_exists"
        ) {
          setError(
            "This email address is already registered. Please sign in to access your account, or reset your password.",
          );
          setIsAlreadyRegistered(true);
          return;
        }

        if (authError.message.includes("rate limit")) {
          throw new Error(
            "Email rate limit reached. Please disable email confirmation in Supabase Auth settings.",
          );
        }
        throw authError;
      }

      // 3. Supabase empty identities check (indicates user already exists with email confirmations on)
      if (
        authData?.user &&
        Array.isArray(authData.user.identities) &&
        authData.user.identities.length === 0
      ) {
        setError(
          "This email address is already registered. Please sign in to access your account, or reset your password.",
        );
        setIsAlreadyRegistered(true);
        return;
      }

      if (authData.user) {
        // Enforce pending status by default until admin approves
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: formData.fullName.trim(),
            email: emailTrimmed,
            phone_no: formData.phone.trim(),
            university_name: formData.university.trim(),
            payment_receipt_url: formData.receiptUrl.trim() || null,
            status: "pending",
          },
        ]);

        if (profileError) {
          if (
            profileError.code === "23505" ||
            profileError.message?.toLowerCase().includes("duplicate key") ||
            profileError.message?.toLowerCase().includes("already exists")
          ) {
            setError(
              "This email address is already registered. Please sign in to access your account, or reset your password.",
            );
            setIsAlreadyRegistered(true);
            return;
          }
          throw profileError;
        }

        // Trigger branded welcome & pending verification email via Nodemailer
        try {
          await fetch("/api/email/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailTrimmed,
              fullName: formData.fullName.trim(),
            }),
          });
        } catch (mailErr) {
          console.warn("Welcome email dispatch notice:", mailErr);
        }
      }

      // Explicitly sign out so unverified user cannot bypass verification
      await supabase.auth.signOut();
      setRegistrationComplete(true);
    } catch (err) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
      stopTopLoading();
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-xs text-slate-500 font-medium">
        Checking session...
      </div>
    );
  }

  // Registration Success / Awaiting Approval Screen
  if (registrationComplete) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldCheck size={28} />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Registration Status: Pending Approval
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight pt-1">
              Application Submitted Successfully
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Thank you for registering for <strong>VSPARK 2026</strong>. Your
              details and fee deposit receipt are currently under review by the
              faculty organizers.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" /> What
              happens next?
            </p>
            <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                Organizers verify your payment slip against the deposit records.
              </li>
              <li>
                Once verified, your account status is updated to{" "}
                <strong>Approved</strong>.
              </li>
              <li>
                You can then sign in using your email and password to access
                your dashboard.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/login"
              className="flex-1 h-10 inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Go to Sign In Page
            </Link>
            <a
              href="https://wa.me/923000000000?text=Hello%20VSPARK%20Organizers!%20I%20have%20registered%20and%20submitted%20my%20fee%20slip.%20Kindly%20verify%20my%20account."
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              <MessageCircle size={14} /> WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const techStackList = competitionDetails.allowedTechStack
    ? competitionDetails.allowedTechStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vspark-logo.png"
          alt="VSPARK 2026"
          className="h-14 w-auto object-contain mx-auto"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1">
            <Clock size={12} /> 120 Minutes (2 Hours)
          </span>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
            <Award size={12} /> 100 Marks Total
          </span>
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-flex items-center gap-1">
            <Users size={12} /> Max 2 Members / Team
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Participant Registration &amp; Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Please review the official Web Development Competition rules, required
          features, and 100-mark evaluation criteria before submitting your team
          registration.
        </p>

        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="h-8.5 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            <BookOpen size={13} /> View Competition Rules &amp; Rubric
          </button>
        </div>
      </div>

      {/* Pre-Registration Information Cards (Admin Editable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Allowed Tech Stack */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs border-b border-slate-100 pb-2.5">
            <Code2 size={16} className="text-blue-600" />
            <span>Permitted Technologies</span>
          </div>
          <p className="text-[12.5px] text-slate-600 leading-relaxed">
            Participants are permitted to build with the following approved
            frontend, backend, and cloud technologies:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {techStackList.map((tech) => (
              <span
                key={tech}
                className="text-[12px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[12px] text-slate-700 leading-relaxed mt-1">
            <strong className="text-slate-900 font-bold">AI Tools:</strong>{" "}
            ChatGPT, Claude, Gemini, Cursor are allowed (code comprehension
            required).
          </div>
        </div>

        {/* Card 2: Grading Criteria */}
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
            {(competitionDetails.gradingCriteria
              ? competitionDetails.gradingCriteria
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
              : [
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
                ]
            ).map((line, idx) => {
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

        {/* Card 3: Key Guidelines */}
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
            {(competitionDetails.competitionGuidelines
              ? competitionDetails.competitionGuidelines
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
              : [
                  "Duration: Exactly 120 minutes (strict auto-freeze).",
                  "Group Work: Maximum 2 members per team.",
                  "Submissions: GitHub repository URL + Project folder upload.",
                  "README: Setup steps, env variable names & process screenshots required.",
                  "Security: Never upload real .env keys or passwords.",
                  "Live Verification: Judges test features and evaluate code live.",
                ]
            ).map((line, idx) => {
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
      </div>

      {/* Main Registration Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Team / Participant Information
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All fields marked with an asterisk (*) are required.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs shadow-2xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
            {isAlreadyRegistered && (
              <div className="pt-2 pl-6.5 border-t border-red-200/60 flex flex-wrap items-center gap-3 text-[11px]">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 font-bold text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors shadow-2xs"
                >
                  Sign In to Your Account &rarr;
                </Link>
                <Link
                  href="/login?forgot=1"
                  className="text-red-700 hover:text-red-950 underline font-semibold"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name / Team Lead *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ali Ahmed"
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <User
                  size={14}
                  className="absolute left-3 top-3 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleCheckEmail}
                  placeholder="ali@university.edu.pk"
                  className={`w-full h-10 pl-9 pr-3 text-xs bg-white border ${
                    isAlreadyRegistered
                      ? "border-red-400 focus:border-red-600 ring-1 ring-red-500/20"
                      : "border-slate-300 focus:border-blue-600"
                  } rounded-lg text-slate-900 focus:outline-none transition-colors`}
                />
                <Mail
                  size={14}
                  className={`absolute left-3 top-3 ${
                    isAlreadyRegistered ? "text-red-500" : "text-slate-400"
                  }`}
                />
              </div>
              {isAlreadyRegistered && (
                <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>Email is already registered.</span>
                  <Link href="/login" className="underline font-bold ml-1">
                    Sign in here &rarr;
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                WhatsApp Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0300 1234567"
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <Phone
                  size={14}
                  className="absolute left-3 top-3 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                University / Institution *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="COMSATS University Vehari"
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <Building2
                  size={14}
                  className="absolute left-3 top-3 text-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Create Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full h-10 pl-9 pr-10 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors font-mono"
              />
              <Lock
                size={14}
                className="absolute left-3 top-3 text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Fee Deposit Instructions Card */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <CreditCard size={15} className="text-blue-600" />
                Fee Deposit Details ({competitionDetails.feeAmount})
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {competitionDetails.bankName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-blue-100">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  Account Title
                </span>
                <span className="font-semibold text-slate-800">
                  {competitionDetails.accountTitle}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  Account / IBAN
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 truncate">
                    {competitionDetails.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    title="Copy Account Number"
                    className="text-blue-600 hover:text-blue-800 p-0.5"
                  >
                    {copiedAccount ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Slip Screenshot URL{" "}
                <span className="text-slate-400 font-normal">
                  (Optional or Drive/Postimg link)
                </span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="receiptUrl"
                  value={formData.receiptUrl}
                  onChange={handleChange}
                  placeholder="https://postimg.cc/... or Google Drive link"
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors font-mono"
                />
                <LinkIcon
                  size={14}
                  className="absolute left-3 top-3 text-slate-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Upload your payment screenshot to Google Drive or Postimg and
                paste the link here.
              </span>
            </div>
          </div>

          {/* Mandatory Terms & Rules Agreement */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I have read, understood, and agree to follow the{" "}
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="font-bold text-blue-600 hover:text-blue-800 underline inline cursor-pointer"
                >
                  Competition Rules &amp; Guidelines
                </button>{" "}
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already registered and approved?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Interactive Rules Modal */}
      <CompetitionRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        onAcknowledge={() => {
          setAgreeTerms(true);
          setShowRulesModal(false);
        }}
        showAcknowledgeButton={true}
      />
    </div>
  );
}
