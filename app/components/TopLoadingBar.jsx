"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// Global helpers that any component or fetch call can invoke
export function startTopLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vspark:top-loading:start"));
  }
}

export function stopTopLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vspark:top-loading:stop"));
  }
}

export default function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const startProgress = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + Math.random() * 15;
        if (prev < 70) return prev + Math.random() * 8;
        if (prev < 88) return prev + Math.random() * 3;
        return prev;
      });
    }, 200);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress(100);

    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 350);
    }, 250);
  };

  // Trigger when pathname or searchParams change
  useEffect(() => {
    // When path updates, complete loading
    completeProgress();
  }, [pathname, searchParams]);

  // Listen to custom global events & intercept internal link clicks
  useEffect(() => {
    const handleStart = () => startProgress();
    const handleStop = () => completeProgress();

    window.addEventListener("vspark:top-loading:start", handleStart);
    window.addEventListener("vspark:top-loading:stop", handleStop);

    // Intercept clicks on links that trigger navigation
    const handleClick = (e) => {
      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, anchor hash, or target="_blank"
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }

      // If navigating to a different pathname
      if (href !== window.location.pathname) {
        startProgress();
      }
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("vspark:top-loading:start", handleStart);
      window.removeEventListener("vspark:top-loading:stop", handleStop);
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none transition-opacity duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Sky Blue YouTube-Style Progress Bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 transition-all duration-300 ease-out relative"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 12px #38bdf8, 0 0 5px #0284c7",
        }}
      >
        {/* Leading Tip Glow Tracer Dot */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white/90 shadow-[0_0_10px_#ffffff]" />
      </div>
    </div>
  );
}
