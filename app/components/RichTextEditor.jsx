"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bold,
  CheckSquare,
  Code,
  Columns,
  Eye,
  FileCode,
  FileEdit,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Info,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from "lucide-react";
import React, { useRef, useState } from "react";
import RichTextRenderer from "./RichTextRenderer";

export default function RichTextEditor({
  value = "",
  onChange,
  label = "Content",
  placeholder = "Write guidelines, instructions or task brief here...",
  minHeight = "240px",
  helperText,
}) {
  const [viewMode, setViewMode] = useState("split"); // "edit" | "preview" | "split"
  const textareaRef = useRef(null);

  // Helper to wrap selected text or insert snippet at cursor
  const insertFormatting = (prefix, suffix = "", defaultPlaceholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || "";
    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newVal =
      currentVal.substring(0, start) + replacement + currentVal.substring(end);

    onChange(newVal);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  // Helper to prepend each line with bullet or number
  const insertLinePrefix = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || "";
    const selectedText = currentVal.substring(start, end);

    if (selectedText.includes("\n")) {
      const transformed = selectedText
        .split("\n")
        .map((line) => (line.trim() ? `${prefix} ${line.replace(/^[-*•\d+.]\s+/, "")}` : line))
        .join("\n");
      const newVal =
        currentVal.substring(0, start) + transformed + currentVal.substring(end);
      onChange(newVal);
    } else {
      const insertion = `\n${prefix} ${selectedText || "Item"}\n`;
      const newVal =
        currentVal.substring(0, start) + insertion + currentVal.substring(end);
      onChange(newVal);
    }

    setTimeout(() => textarea.focus(), 10);
  };

  // Stats calculation
  const wordCount = (value || "").trim() ? (value || "").trim().split(/\s+/).length : 0;
  const charCount = (value || "").length;

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-blue-600 transition-colors">
      {/* MS Word-Style Ribbon Toolbar */}
      <div className="bg-slate-100/90 border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-1.5 text-slate-700 select-none">
        {/* Left Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings Group */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => insertFormatting("# ", "", "Main Title")}
              title="Heading 1 (Main Title)"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Heading1 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("## ", "", "Section Heading")}
              title="Heading 2 (Section)"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Heading2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("### ", "", "Subheading")}
              title="Heading 3 (Subsection)"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Heading3 size={15} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Typography Formatting Group */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => insertFormatting("**", "**", "bold text")}
              title="Bold (Ctrl+B)"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors font-bold"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*", "italic text")}
              title="Italic (Ctrl+I)"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors italic"
            >
              <Italic size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
              title="Underline (Ctrl+U)"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors underline"
            >
              <UnderlineIcon size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("~~", "~~", "strikethrough text")}
              title="Strikethrough"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Strikethrough size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("`", "`", "code")}
              title="Inline Code Badge"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Code size={15} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Lists & Layout */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => insertLinePrefix("-")}
              title="Bullet List"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix("1.")}
              title="Numbered List"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <ListOrdered size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix("- [ ]")}
              title="Interactive Checklist"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <CheckSquare size={15} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Word Callout Boxes & Tables */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => insertFormatting("> 💡 **Note**: ", "\n", "Write important note...")}
              title="Insert Note Box"
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-700 transition-colors flex items-center gap-1 text-xs"
            >
              <Lightbulb size={14} />
              <span className="hidden xl:inline text-[11px] font-medium">Note</span>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("> ⚠️ **Warning**: ", "\n", "Write critical warning...")}
              title="Insert Warning Callout"
              className="p-1.5 hover:bg-amber-50 rounded text-amber-700 transition-colors flex items-center gap-1 text-xs"
            >
              <AlertTriangle size={14} />
              <span className="hidden xl:inline text-[11px] font-medium">Alert</span>
            </button>
            <button
              type="button"
              onClick={() =>
                insertFormatting(
                  "\n| Rubric Item | Weightage | Description |\n| :--- | :--- | :--- |\n| Feature Completeness | 40% | Full specs implemented |\n| Code Architecture | 30% | Modular & documented |\n",
                  ""
                )
              }
              title="Insert Evaluation Table"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <TableIcon size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("\n```javascript\n", "\n```\n", "// Code snippet")}
              title="Code Block"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <FileCode size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("\n---\n", "")}
              title="Horizontal Divider"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Minus size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("[", "](https://example.com)", "link title")}
              title="Insert Hyperlink"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors"
            >
              <LinkIcon size={15} />
            </button>
          </div>
        </div>

        {/* Right View Mode Toggles */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs ml-auto">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              viewMode === "edit"
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileEdit size={13} />
            <span className="hidden sm:inline">Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 rounded font-medium transition-colors hidden md:flex items-center gap-1 ${
              viewMode === "split"
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns size={13} />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              viewMode === "preview"
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye size={13} />
            <span>Student Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="bg-slate-50/50">
        {viewMode === "split" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Editor Pane */}
            <div className="p-3 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Markdown &amp; Text Source</span>
                <span className="font-mono text-slate-400">Ctrl+B for Bold</span>
              </div>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ minHeight }}
                className="w-full p-2.5 font-mono text-xs text-slate-900 bg-transparent border-0 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Live Rendered Document Pane */}
            <div className="p-4 bg-white/95 overflow-y-auto max-h-[550px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <Eye size={12} className="text-blue-600" />
                <span>Live Student View</span>
              </div>
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 min-h-[200px]">
                <RichTextRenderer content={value} />
              </div>
            </div>
          </div>
        ) : viewMode === "edit" ? (
          <div className="p-3 bg-white">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full p-2.5 font-mono text-xs text-slate-900 bg-transparent border-0 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        ) : (
          <div className="p-5 bg-white min-h-[260px] overflow-y-auto max-h-[600px]">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <RichTextRenderer content={value} />
            </div>
          </div>
        )}
      </div>

      {/* Word-Style Document Status Bar */}
      <div className="bg-slate-100/90 border-t border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500 font-sans">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Word-Style Rich Text
          </span>
          <span>•</span>
          <span>
            {helperText || "Formatted live for student dashboards & registration."}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600">
          <span>
            Words: <strong className="text-slate-800">{wordCount}</strong>
          </span>
          <span>•</span>
          <span>
            Characters: <strong className="text-slate-800">{charCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
