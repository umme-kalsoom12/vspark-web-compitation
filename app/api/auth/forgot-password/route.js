import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAppUrl, sendPasswordResetEmail } from "../../../lib/mailer";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const appUrl = getAppUrl();

    // Query Supabase to find student profile
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

    // If email is not found in database, return 404 not found
    if (!profile) {
      return NextResponse.json(
        {
          error: "Email not found. No account is registered with this email address.",
          notFound: true,
        },
        { status: 404 }
      );
    }

    const studentName = profile.full_name || "Participant";

    // Dispatch single official branded VSPARK Password Reset email via Nodemailer
    const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(trimmedEmail)}`;
    await sendPasswordResetEmail({
      to: trimmedEmail,
      studentName,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Password reset link sent to ${trimmedEmail}. Please check your inbox.`,
    });
  } catch (err) {
    console.error("Forgot password dispatch error:", err);
    return NextResponse.json(
      { error: "Failed to dispatch password reset email: " + err.message },
      { status: 500 }
    );
  }
}
