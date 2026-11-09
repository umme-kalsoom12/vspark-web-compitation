"use client";

import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Trophy,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CompetitionRulesModal from "../components/CompetitionRulesModal";
import { supabase } from "../lib/supabase";

export default function StudentLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Compact Global Student Header */}
      <header className="sticky top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-18 py-1">
            {/* Brand with Official VSPARK Logo */}
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vspark-logo.png"
                alt="VSPARK 2026"
                className="h-11 sm:h-12 w-auto object-contain hover:opacity-95 transition-opacity"
              />
              <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Student Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setRulesModalOpen(true)}
                className="h-8 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800
                  cursor-pointer rounded-lg hover:text-slate-900 hover:bg-slate-50"
              >
                <BookOpen size={13} className="text-blue-600" />
                <span>Rules</span>
              </button>
              <Link
                href="/results"
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname === "/results"
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Trophy size={14} className="text-amber-500" /> Result
              </Link>

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                      pathname === "/dashboard"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>

                  <div className="h-4 w-px bg-slate-200 mx-1"></div>

                  <Link
                    href="/profile"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      pathname === "/profile"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    title="View Profile & Credentials"
                  >
                    <User
                      size={14}
                      className={
                        pathname === "/profile" ? "text-white" : "text-blue-600"
                      }
                    />
                    <span>Profile</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut size={13} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`h-9 px-3.5 inline-flex items-center text-xs font-medium rounded-lg transition-colors ${
                      pathname === "/login"
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className={`h-9 px-4 inline-flex items-center text-xs font-medium rounded-lg transition-colors shadow-xs ${
                      pathname === "/register"
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2">
            <Link
              href="/results"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-slate-700"
            >
              Result
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setRulesModalOpen(true);
              }}
              className="flex items-center gap-2 py-1.5 text-sm font-medium text-slate-700 w-full text-left"
            >
              <BookOpen size={15} className="text-blue-600" />
              <span>Rules</span>
            </button>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm font-medium text-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm font-medium text-slate-700"
                >
                  Profile &amp; Credentials
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left py-1.5 text-sm font-medium text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
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
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 sm:px-6 bg-white text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">VSPARK 2026</span>
            <span>•</span>
            <span>COMSATS University Vehari Campus</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <Link href="/results" className="hover:text-blue-600">
              Result
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-blue-600 text-slate-400"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>

      {/* Global Competition Rules Modal */}
      <CompetitionRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        showAcknowledgeButton={false}
      />
    </div>
  );
}
