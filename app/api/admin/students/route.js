import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { sendApprovalEmail } from "../../../lib/mailer";
import {
  getPersistentApprovals,
  savePersistentApproval,
  savePersistentResubmissions,
} from "../../../lib/system-settings";

function getApprovalsFilePath() {
  const tmpPath = path.join("/tmp", "student-approvals.json");
  if (fs.existsSync(tmpPath)) return tmpPath;
  const bundlePath = path.join(process.cwd(), "app/lib/student-approvals.json");
  if (fs.existsSync(bundlePath)) return bundlePath;
  return tmpPath;
}

function getSavePath() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join("/tmp", "student-approvals.json");
  }
  return path.join(process.cwd(), "app/lib/student-approvals.json");
}

function getStoredData() {
  try {
    const filePath = getApprovalsFilePath();
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(fileData);
      return {
        approvals: parsed.approvals || {},
        unlockedSubmissions: parsed.unlockedSubmissions || {},
        allowAllResubmissions: Boolean(parsed.allowAllResubmissions),
      };
    }
  } catch (err) {
    console.error("Failed to read student-approvals.json:", err);
  }
  return { approvals: {}, unlockedSubmissions: {}, allowAllResubmissions: false };
}

function saveStoredData(data) {
  try {
    const p = getSavePath();
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  } catch {
    try {
      fs.writeFileSync(
        path.join("/tmp", "student-approvals.json"),
        JSON.stringify(data, null, 2),
        "utf8"
      );
    } catch {
      console.warn("Filesystem write ignored on serverless environment.");
    }
  }
}

export async function GET() {
  const localData = getStoredData();

  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );

    // 1. Fetch persistent approvals from Supabase competition_settings
    const persistent = await getPersistentApprovals(supabase);

    const mergedData = {
      approvals: {
        ...(localData.approvals || {}),
        ...(persistent.approvals || {}),
      },
      unlockedSubmissions: {
        ...(localData.unlockedSubmissions || {}),
        ...(persistent.unlockedSubmissions || {}),
      },
      allowAllResubmissions:
        persistent.allowAllResubmissions || localData.allowAllResubmissions || false,
    };

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && profiles) {
      const serverApprovals = mergedData.approvals || {};
      const enrichedStudents = profiles.map((p) => ({
        ...p,
        status: serverApprovals[p.id] || p.status || "pending",
      }));
      return NextResponse.json({
        ...mergedData,
        students: enrichedStudents,
      });
    }

    return NextResponse.json(mergedData);
  } catch (err) {
    console.error("Failed to query profiles in /api/admin/students GET:", err);
  }

  return NextResponse.json({
    ...localData,
    students: [],
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const data = getStoredData();

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );

    // 1. Action: Toggle Global Resubmission Permission for All Students
    if (body.action === "toggle_all_resubmissions") {
      data.allowAllResubmissions = Boolean(body.allowAll);
      saveStoredData(data);
      await savePersistentResubmissions({ allowAllResubmissions: body.allowAll }, supabase);

      return NextResponse.json({
        success: true,
        allowAllResubmissions: data.allowAllResubmissions,
        message: `Global resubmissions are now ${data.allowAllResubmissions ? "ENABLED" : "LOCKED"}.`,
      });
    }

    // 2. Action: Toggle Resubmission Unlock for a Specific Student
    if (body.action === "toggle_submission_unlock") {
      const { studentId, unlock } = body;
      if (!studentId) {
        return NextResponse.json({ error: "Student ID required" }, { status: 400 });
      }
      if (unlock === false) {
        delete data.unlockedSubmissions[studentId];
      } else {
        data.unlockedSubmissions[studentId] = true;
      }
      saveStoredData(data);
      await savePersistentResubmissions(
        { toggleStudentId: studentId, toggleUnlock: unlock },
        supabase
      );

      return NextResponse.json({
        success: true,
        studentId,
        isUnlocked: Boolean(data.unlockedSubmissions[studentId]),
        message: `Submission for student ${studentId} is now ${data.unlockedSubmissions[studentId] ? "UNLOCKED" : "LOCKED"}.`,
      });
    }

    // 3. Action: Update Student Verification / Approval Status
    const { studentId, status, email, studentName } = body;
    if (!studentId || !status) {
      return NextResponse.json(
        { error: "Student ID and status are required." },
        { status: 400 }
      );
    }

    const normalizedStatus =
      status === "approved" || status === "verified"
        ? "verified"
        : status === "rejected"
        ? "rejected"
        : "pending";

    data.approvals[studentId] = normalizedStatus;
    saveStoredData(data);

    // Save persistently to Supabase competition_settings so all lambdas have it!
    await savePersistentApproval(studentId, normalizedStatus, supabase);

    let recipientEmail = email;
    let recipientName = studentName;

    // Also attempt Supabase sync
    try {
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey
      );

      await supabase
        .from("profiles")
        .update({ status: normalizedStatus })
        .eq("id", studentId);

      // If email/name was not provided in request body, retrieve from profile
      if ((!recipientEmail || !recipientName) && normalizedStatus === "verified") {
        const { data: profData } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", studentId)
          .single();
        if (profData) {
          if (!recipientEmail) recipientEmail = profData.email;
          if (!recipientName) recipientName = profData.full_name;
        }
      }
    } catch (sbErr) {
      console.warn("Supabase profile sync warning:", sbErr);
    }

    // If student is verified/approved, trigger official approval email
    let emailSent = false;
    if (normalizedStatus === "verified" && recipientEmail && recipientEmail.includes("@")) {
      try {
        await sendApprovalEmail({
          to: recipientEmail.trim(),
          studentName: recipientName?.trim() || "Participant",
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("Failed to dispatch approval email:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      studentId,
      status: normalizedStatus,
      emailSent,
    });
  } catch (err) {
    console.error("Error in /api/admin/students:", err);
    return NextResponse.json(
      { error: "Failed to process request: " + err.message },
      { status: 500 }
    );
  }
}
