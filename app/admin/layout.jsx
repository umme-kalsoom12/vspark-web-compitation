"use client";

import {
  Award,
  BookOpen,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  FolderCode,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAVIGATION_GROUPS = [
  {
    title: "EVENT SETUP & RULES",
    items: [
      {
        name: "Event Controls",
        href: "/admin/settings",
        icon: SlidersHorizontal,
        color: "text-blue-600",
      },
      {
        name: "Task & Problem Brief",
        href: "/admin/task",
        icon: FileText,
        color: "text-indigo-600",
      },
      {
        name: "Rules & Guidelines",
        href: "/admin/rules",
        icon: BookOpen,
        color: "text-purple-600",
      },
      {
        name: "Banking & Deposit Fee",
        href: "/admin/bank",
        icon: CreditCard,
        color: "text-emerald-600",
      },
    ],
  },
  {
    title: "STUDENTS & COMMUNICATION",
    items: [
      {
        name: "Students",
        href: "/admin/students",
        icon: Users,
        color: "text-sky-600",
      },
      {
        name: "Email Broadcast",
        href: "/admin/emails",
        icon: Mail,
        color: "text-violet-600",
      },
      {
        name: "Evaluations & Grading",
        href: "/admin/evaluations",
        icon: Award,
        color: "text-amber-600",
      },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/admin/login");
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === "/admin/settings") return "Event Controls & Timeline";
    if (pathname === "/admin/task") return "Task & Problem Brief Specifications";
    if (pathname === "/admin/rules") return "Competition Guidelines & Tech Stack";
    if (pathname === "/admin/bank") return "Registration Fee & Banking Details";
    if (pathname.startsWith("/admin/students")) return "Students & Verification";
    if (pathname.startsWith("/admin/emails")) return "Student Email Broadcast & Notices";
    if (pathname.startsWith("/admin/evaluations")) return "Project Evaluations & Grading";
    return "Administrative Console";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vspark-logo.png"
            alt="VSPARK 2026"
            className="h-8 w-auto object-contain"
          />
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Admin Portal
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Professional White Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-50 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } shadow-sm md:shadow-none`}
      >
        {/* Sidebar Header */}
        <div className="h-18 px-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/admin/settings" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vspark-logo.png"
              alt="VSPARK 2026"
              className="h-10 w-auto object-contain"
            />
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
              Faculty
            </span>
          </Link>
          <button
            className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Grouped Categorized Navigation */}
          {NAVIGATION_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={15}
                        className={isActive ? "text-white" : item.color || "text-slate-500"}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Quick Access External Links */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Public Previews
            </p>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={14} className="text-slate-400" />
                <span>Live Landing Page</span>
              </div>
              <ExternalLink size={12} className="text-slate-400" />
            </Link>
            <Link
              href="/results"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Award size={14} className="text-slate-400" />
                <span>Public Results</span>
              </div>
              <ExternalLink size={12} className="text-slate-400" />
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer with Admin Profile & Sign Out */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-[11px] shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate leading-none">
                  Administrator
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5 leading-none">
                  admin@comsats.edu.pk
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out of Admin Console"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Console</span>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-semibold text-slate-900">{getPageTitle()}</span>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}