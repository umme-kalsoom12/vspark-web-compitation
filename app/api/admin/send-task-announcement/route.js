import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { sendTaskAnnouncementEmail } from "../../../lib/mailer";
import { cleanTaskDescription } from "../../../lib/system-settings";

function getApprovalsFilePath() {
  const tmpPath = path.join("/tmp", "student-approvals.json");
  if (fs.existsSync(tmpPath)) return tmpPath;
  const bundlePath = path.join(process.cwd(), "app/lib/student-approvals.json");
  if (fs.existsSync(bundlePath)) return bundlePath;
  return tmpPath;
}

function getStoredApprovals() {
  try {
    const filePath = getApprovalsFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return parsed.approvals || {};
    }
  } catch (err) {
    console.error("Failed to read student-approvals.json:", err);
  }
  return {};
}

export async function POST(request) {
  try {
    const { targetAudience = "verified" } = await request.json().catch(() => ({}));

    // Connect to Supabase
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );

    // 1. Fetch current competition task details
    const { data: compSettings, error: compErr } = await supabase
      .from("competition_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (compErr) {
      throw new Error("Failed to fetch competition settings: " + compErr.message);
    }

    // 2. Fetch student profiles
    const { data: profiles, error: dbError } = await supabase
      .from("profiles")
      .select("id, email, status, full_name");

    if (dbError) {
      throw new Error("Failed to fetch student profiles: " + dbError.message);
    }

    const serverApprovals = getStoredApprovals();

    // 3. Filter recipients
    const targetEmails = (profiles || [])
      .filter((p) => {
        if (!p.email || !p.email.includes("@")) return false;
        const effectiveStatus = serverApprovals[p.id] || p.status || "pending";
        const isApproved = effectiveStatus === "verified" || effectiveStatus === "approved";

        if (targetAudience === "verified") {
          return isApproved;
        }
        return true;
      })
      .map((p) => p.email.trim());

    const uniqueRecipients = Array.from(new Set(targetEmails));

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        {
          error: `No recipient emails found for audience '${targetAudience}'. Ensure students have registered.`,
        },
        { status: 400 }
      );
    }

    // 4. Send official Task Announcement Email via Nodemailer BCC
    const cleanDesc = cleanTaskDescription(compSettings.task_description || "");

    const mailResult = await sendTaskAnnouncementEmail({
      recipients: uniqueRecipients,
      competitionTitle: compSettings.title || "VSPARK 2026 Web Development Hackathon",
      startTime: compSettings.start_time,
      endTime: compSettings.end_time,
      taskPdfUrl: compSettings.task_pdf_url,
      taskSummary: cleanDesc,
      targetAudience,
    });

    return NextResponse.json({
      success: true,
      count: uniqueRecipients.length,
      messageId: mailResult?.messageId,
      message: `Task Announcement email successfully dispatched to ${uniqueRecipients.length} students.`,
    });
  } catch (err) {
    console.error("Task announcement email dispatch error:", err);
    return NextResponse.json(
      { error: "Failed to dispatch task announcement email: " + err.message },
      { status: 500 }
    );
  }
}
