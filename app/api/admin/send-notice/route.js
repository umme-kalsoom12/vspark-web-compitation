import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { sendBroadcastNotice } from "../../../lib/mailer";

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
    const { subject, message, targetAudience = "verified" } = await request.json();

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Announcement subject is required." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Announcement message content is required." },
        { status: 400 }
      );
    }

    // Connect to Supabase to fetch participants
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );

    const { data: profiles, error: dbError } = await supabase
      .from("profiles")
      .select("id, email, status, full_name");

    if (dbError) {
      console.error("Failed to fetch participant profiles:", dbError);
      return NextResponse.json(
        { error: "Database error while fetching participants: " + dbError.message },
        { status: 500 }
      );
    }

    const serverApprovals = getStoredApprovals();

    // Filter recipients based on audience
    const targetEmails = (profiles || [])
      .filter((p) => {
        if (!p.email || !p.email.includes("@")) return false;

        const effectiveStatus = serverApprovals[p.id] || p.status || "pending";
        const isApproved = effectiveStatus === "verified" || effectiveStatus === "approved";

        if (targetAudience === "verified") {
          return isApproved;
        }

        // 'all' includes everyone registered
        return true;
      })
      .map((p) => p.email.trim());

    // Deduplicate emails
    const uniqueRecipients = Array.from(new Set(targetEmails));

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        {
          error: `No recipient email addresses found for target audience '${targetAudience}'.`,
        },
        { status: 400 }
      );
    }

    const audienceLabel =
      targetAudience === "verified"
        ? "Approved Participants Only"
        : "All Registered Participants";

    // Broadcast email via Gmail Nodemailer using BCC (Vercel-safe, under 2 seconds)
    const result = await sendBroadcastNotice({
      recipients: uniqueRecipients,
      subject: subject.trim(),
      messageBody: message.trim(),
      targetAudience: audienceLabel,
    });

    return NextResponse.json({
      success: true,
      count: uniqueRecipients.length,
      audience: targetAudience,
      messageId: result?.messageId,
    });
  } catch (err) {
    console.error("Error in /api/admin/send-notice:", err);
    return NextResponse.json(
      { error: "Failed to dispatch announcement: " + err.message },
      { status: 500 }
    );
  }
}
