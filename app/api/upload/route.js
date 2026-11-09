import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import path from "path";
import { getPersistentApprovals } from "../../lib/system-settings";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    const userId = formData.get("userId");
    const githubUrl = formData.get("githubUrl");
    const preUploadedUrl = formData.get("preUploadedUrl");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Full submission requires a valid GitHub URL
    if (action !== "stage_upload_only" && !githubUrl) {
      return NextResponse.json(
        { error: "GitHub repository URL is required." },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      token
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        : undefined
    );

    // 1. Enforce strict Code Freeze & deadline lock on server
    const { data: compSettings } = await supabase
      .from("competition_settings")
      .select("is_submission_open, end_time")
      .eq("id", 1)
      .maybeSingle();

    if (compSettings) {
      const isPastDeadline =
        compSettings.end_time && new Date() > new Date(compSettings.end_time);
      if (!compSettings.is_submission_open || isPastDeadline) {
        return NextResponse.json(
          {
            error:
              "Code submissions are locked. The deadline has concluded and projects are finalized for grading.",
          },
          { status: 403 }
        );
      }
    }

    // 2. Enforce faculty verification & rejection check
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();

    // Check persistent approvals from Supabase competition_settings
    let persistentData = { approvals: {}, unlockedSubmissions: {}, allowAllResubmissions: false };
    try {
      persistentData = await getPersistentApprovals(supabase);
    } catch (e) {
      console.warn("Persistent approvals read warning in upload:", e);
    }

    const serverStatus = persistentData.approvals?.[userId];
    const effectiveStatus = serverStatus || userProfile?.status || "verified";

    // If faculty explicitly rejected/flagged the participant:
    if (effectiveStatus === "rejected" || userProfile?.status === "rejected") {
      return NextResponse.json(
        {
          error:
            "Your registration was flagged or rejected by the faculty committee. You cannot upload code.",
        },
        { status: 403 }
      );
    }

    const isStudentUnlocked = Boolean(persistentData.unlockedSubmissions?.[userId]);
    const isAllResubmissionsAllowed = Boolean(persistentData.allowAllResubmissions);

    // Check if user already has an existing submission record
    const { data: existing } = await supabase
      .from("submissions")
      .select("id, drive_folder_url")
      .eq("profile_id", userId)
      .maybeSingle();

    if (existing && !isStudentUnlocked && !isAllResubmissionsAllowed) {
      return NextResponse.json(
        {
          error:
            "A submission has already been recorded for your account. Submissions are finalized and cannot be modified. If you need to resubmit, please contact the faculty administrator to unlock your submission.",
        },
        { status: 403 }
      );
    }

    let downloadUrl = preUploadedUrl || null;

    // Check if a pre-packaged zip file was uploaded directly or folder files were provided
    const directZip = formData.get("zipFile");
    const files = formData.getAll("files");

    if (directZip && directZip.size > 0) {
      const buffer = Buffer.from(await directZip.arrayBuffer());
      const fileName = `submissions/${userId}_${Date.now()}.zip`;

      const { error: uploadError } = await supabase.storage
        .from("task-files")
        .upload(fileName, buffer, {
          contentType: "application/zip",
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error("Failed to upload zip file to storage: " + uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("task-files")
        .getPublicUrl(fileName);

      downloadUrl = urlData.publicUrl;
    } else if (files && files.length > 0 && files[0].name) {
      // Multiple files were sent -> Package them into a clean zip
      const zip = new JSZip();
      let fileCount = 0;

      for (const file of files) {
        const path = file.webkitRelativePath || file.name;
        const normalized = path.replace(/\\/g, "/");
        const parts = normalized.split("/");

        // Skip unwanted directories, build artifacts, and sensitive files
        const isExcluded = parts.some((part) => {
          const lower = part.toLowerCase();
          return (
            lower === "node_modules" ||
            lower === ".next" ||
            lower === ".git" ||
            lower === ".turbo" ||
            lower === "build" ||
            lower === "dist" ||
            lower.startsWith(".env") ||
            lower === ".ds_store"
          );
        });

        if (isExcluded) {
          continue;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        zip.file(normalized, buffer);
        fileCount++;
      }

      if (fileCount > 0) {
        const zipBuffer = await zip.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const fileName = `submissions/${userId}_${Date.now()}.zip`;

        const { error: uploadError } = await supabase.storage
          .from("task-files")
          .upload(fileName, zipBuffer, {
            contentType: "application/zip",
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase Storage Error:", uploadError);
          throw new Error("Failed to upload project zip: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from("task-files")
          .getPublicUrl(fileName);

        downloadUrl = urlData.publicUrl;
      }
    }

    // Action 1: If caller requested folder archive upload only, return downloadUrl immediately
    if (action === "stage_upload_only") {
      return NextResponse.json({
        success: true,
        downloadUrl,
        message: "Code package uploaded to cloud storage successfully.",
      });
    }

    // Action 2: Final submission
    if (existing) {
      // Update existing submission (resubmission granted by faculty)
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          github_url: githubUrl.trim(),
          drive_folder_url: downloadUrl || existing.drive_folder_url,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      // AUTOMATIC RE-LOCK: Once resubmitted, automatically lock this student's submission again
      try {
        if (fs.existsSync(approvalsPath)) {
          const fileContent = JSON.parse(fs.readFileSync(approvalsPath, "utf8"));
          if (fileContent.unlockedSubmissions && fileContent.unlockedSubmissions[userId]) {
            delete fileContent.unlockedSubmissions[userId];
            fs.writeFileSync(approvalsPath, JSON.stringify(fileContent, null, 2), "utf8");
          }
        }
      } catch (lockErr) {
        console.warn("Failed to auto-relock student submission:", lockErr);
      }
    } else {
      // First-time submission
      const { error: insertError } = await supabase
        .from("submissions")
        .insert([
          {
            profile_id: userId,
            github_url: githubUrl.trim(),
            drive_folder_url: downloadUrl,
          },
        ]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      isLocked: true,
      message: existing
        ? "Project resubmitted successfully and automatically locked for evaluation."
        : "Project submitted successfully and locked for evaluation.",
    });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during submission." },
      { status: 500 }
    );
  }
}
