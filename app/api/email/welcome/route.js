import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "../../../lib/mailer";

export async function POST(request) {
  try {
    const { email, fullName } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    // Dispatch welcome email asynchronously
    const info = await sendWelcomeEmail({
      to: email.trim(),
      studentName: fullName?.trim() || "Participant",
    });

    return NextResponse.json({
      success: true,
      messageId: info?.messageId,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    // Return friendly error response without crashing client registration
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
