"use client";

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { startTopLoading, stopTopLoading } from "../../components/TopLoadingBar";

export default function AdminBankPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [bankInfo, setBankInfo] = useState({
    accountTitle: "COMSATS Web Society",
    accountNumber: "0123 4567 8901 23",
    bankName: "Easypaisa / HBL",
    feeAmount: "Rs. 500",
  });

  const fetchBankInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/bank");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setBankInfo({
            accountTitle: data.accountTitle || "COMSATS Web Society",
            accountNumber: data.accountNumber || "0123 4567 8901 23",
            bankName: data.bankName || "Easypaisa / HBL",
            feeAmount: data.feeAmount || "Rs. 500",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load bank details:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankInfo();
  }, [fetchBankInfo]);

  const handleSaveBank = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);
    startTopLoading();

    try {
      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountTitle: bankInfo.accountTitle,
          accountNumber: bankInfo.accountNumber,
          bankName: bankInfo.bankName,
          feeAmount: bankInfo.feeAmount,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update bank details.");
      }

      setMessage({
        text: "Registration Fee & Banking Deposit Details updated successfully.",
        type: "success",
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({
        text: err.message || "Failed to update Bank Details.",
        type: "error",
      });
    } finally {
      setLoading(false);
      stopTopLoading();
    }
  };

  if (initialLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Banking Details...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveBank} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard size={22} className="text-emerald-600" />
            <span>Banking &amp; Deposit Fee Details</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the bank account, mobile wallet number, and registration fee shown to students during sign up.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
        >
          <Save size={14} />
          <span>{loading ? "Saving..." : "Save Bank Details"}</span>
        </button>
      </div>

      {/* Top Banner Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between shadow-2xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Bank Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Account Title
            </label>
            <input
              type="text"
              value={bankInfo.accountTitle}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, accountTitle: e.target.value })
              }
              placeholder="e.g. COMSATS Web Development Society"
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Account Number / IBAN
            </label>
            <input
              type="text"
              value={bankInfo.accountNumber}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, accountNumber: e.target.value })
              }
              placeholder="e.g. 0123 4567 8901 23"
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 font-mono shadow-2xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bank / Mobile Wallet Name
            </label>
            <input
              type="text"
              value={bankInfo.bankName}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, bankName: e.target.value })
              }
              placeholder="e.g. Habib Bank Limited / Easypaisa / JazzCash"
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Registration Fee per Team / Participant
            </label>
            <input
              type="text"
              value={bankInfo.feeAmount}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, feeAmount: e.target.value })
              }
              placeholder="e.g. Rs. 500"
              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-extrabold text-emerald-800"
            />
          </div>
        </div>

        {/* Live Student Preview Card */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Live Student Registration Preview
          </span>
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl max-w-lg space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-700" />
                {bankInfo.bankName || "Bank / Mobile Wallet"}
              </span>
              <span className="font-extrabold text-emerald-800 text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                {bankInfo.feeAmount || "Rs. 500"}
              </span>
            </div>
            <div className="space-y-1 text-slate-700 text-[11px]">
              <p>
                Account Title: <strong>{bankInfo.accountTitle}</strong>
              </p>
              <p className="font-mono">
                Account / IBAN: <strong>{bankInfo.accountNumber}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Save Button */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <span className="text-xs text-slate-500">
          Instantly updates the bank account &amp; fee amount for all new registrations.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Save size={14} />
          <span>{loading ? "Saving Bank Details..." : "Save Bank Details"}</span>
        </button>
      </div>
    </form>
  );
}
