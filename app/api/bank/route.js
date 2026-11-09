import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  DEFAULT_SYSTEM_SETTINGS,
  embedConfigInDescription,
  extractConfigFromDescription,
} from "../../lib/system-settings";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Optional local file fallback (safely in /tmp on serverless or ignored)
function getSafeTmpFilePath() {
  return path.join(
    process.env.VERCEL || process.env.NODE_ENV === "production" ? "/tmp" : process.cwd(),
    "bank-settings.json"
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: row } = await supabase
      .from("competition_settings")
      .select("task_description")
      .eq("id", 1)
      .maybeSingle();

    const storedConfig = extractConfigFromDescription(row?.task_description);

    const merged = {
      ...DEFAULT_SYSTEM_SETTINGS,
      ...(storedConfig || {}),
    };

    return NextResponse.json(merged);
  } catch (err) {
    console.warn("API /bank GET fallback to defaults:", err.message);
    return NextResponse.json(DEFAULT_SYSTEM_SETTINGS);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    // 1. Fetch current settings row from Supabase
    const { data: current } = await supabase
      .from("competition_settings")
      .select("task_description")
      .eq("id", 1)
      .maybeSingle();

    const existingConfig =
      extractConfigFromDescription(current?.task_description) || DEFAULT_SYSTEM_SETTINGS;

    const updated = {
      ...existingConfig,
      approvals: existingConfig.approvals || {},
      unlockedSubmissions: existingConfig.unlockedSubmissions || {},
      allowAllResubmissions: Boolean(existingConfig.allowAllResubmissions),
      accountTitle:
        body.accountTitle !== undefined
          ? body.accountTitle.trim()
          : existingConfig.accountTitle,
      accountNumber:
        body.accountNumber !== undefined
          ? body.accountNumber.trim()
          : existingConfig.accountNumber,
      bankName:
        body.bankName !== undefined
          ? body.bankName.trim()
          : existingConfig.bankName,
      feeAmount:
        body.feeAmount !== undefined
          ? body.feeAmount.trim()
          : existingConfig.feeAmount,
      allowedTechStack:
        body.allowedTechStack !== undefined
          ? body.allowedTechStack.trim()
          : existingConfig.allowedTechStack,
      competitionGuidelines:
        body.competitionGuidelines !== undefined
          ? body.competitionGuidelines.trim()
          : existingConfig.competitionGuidelines,
      gradingCriteria:
        body.gradingCriteria !== undefined
          ? body.gradingCriteria.trim()
          : existingConfig.gradingCriteria,
      checklist:
        body.checklist !== undefined
          ? body.checklist
          : existingConfig.checklist || DEFAULT_SYSTEM_SETTINGS.checklist,
      announcement: body.announcement
        ? {
            enabled: Boolean(body.announcement.enabled),
            text:
              body.announcement.text !== undefined
                ? body.announcement.text.trim()
                : existingConfig.announcement?.text || "",
          }
        : existingConfig.announcement,
    };

    // 2. Persist safely in Supabase (100% persistent on Vercel without filesystem errors)
    const newDescription = embedConfigInDescription(
      current?.task_description || "",
      updated
    );

    const { error: updateError } = await supabase
      .from("competition_settings")
      .update({ task_description: newDescription })
      .eq("id", 1);

    if (updateError) {
      throw updateError;
    }

    // 3. Best-effort safe write to /tmp or local cache (never crashes on read-only environments)
    try {
      const safePath = getSafeTmpFilePath();
      fs.writeFileSync(safePath, JSON.stringify(updated, null, 2), "utf-8");
    } catch {
      // Intentionally ignore filesystem write errors in serverless containers
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error("Error updating bank/system settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings: " + (err.message || err) },
      { status: 500 }
    );
  }
}
