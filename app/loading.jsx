export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
      {/* Top Fixed Accent Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 z-50 overflow-hidden">
        <div className="h-full w-full bg-blue-600 animate-loading-bar"></div>
      </div>

      {/* Branded Logo */}
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vspark-logo.png"
          alt="VSPARK 2026"
          className="h-10 w-auto object-contain animate-pulse"
        />
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-slate-800 tracking-tight">
          Loading Dashboard...
        </p>
        <p className="text-[11px] text-slate-400">
          Syncing portal data and competition settings
        </p>
      </div>

      {/* Content Skeleton Placeholders */}
      <div className="w-full max-w-md pt-4 space-y-2.5">
        <div className="h-3 bg-slate-200/70 rounded-full w-3/4 mx-auto animate-pulse"></div>
        <div className="h-2.5 bg-slate-100 rounded-full w-1/2 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}