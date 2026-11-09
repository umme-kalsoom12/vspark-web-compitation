import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAppUrl, sendPasswordResetEmail } from "../../../lib/mailer";

export async function POST(request) {
  try {
    const { studentId, email, studentName } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl();
    const trimmedEmail = email.trim().toLowerCase();

    // Verify student account exists in Supabase
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .ilike("email", trimmedEmail)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Email not found. No student account matches this email address." },
        { status: 404 }
      );
    }

    const recipientName = studentName || profile.full_name || "Participant";

    // Dispatch single official branded VSPARK Password Reset email via Nodemailer
    const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(trimmedEmail)}`;
    const mailInfo = await sendPasswordResetEmail({
      to: trimmedEmail,
      studentName: recipientName,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      email: email.trim(),
      messageId: mailInfo?.messageId,
      message: `Password reset email dispatched to ${email.trim()}.`,
    });
  } catch (err) {
    console.error("Error in /api/admin/send-password-reset:", err);
    return NextResponse.json(
      { error: "Failed to dispatch password reset email: " + err.message },
      { status: 500 }
    );
  }
}
