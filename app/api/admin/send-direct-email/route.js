import { NextResponse } from "next/server";
import { sendDirectStudentEmail } from "../../../lib/mailer";

export async function POST(request) {
  try {
    const { to, studentName, subject, message } = await request.json();

    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "A valid recipient email address is required." },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Email subject is required." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Email message content is required." },
        { status: 400 }
      );
    }

    const mailInfo = await sendDirectStudentEmail({
      to: to.trim(),
      studentName: studentName?.trim() || "Participant",
      subject: subject.trim(),
      messageBody: message.trim(),
    });

    return NextResponse.json({
      success: true,
      recipient: to.trim(),
      messageId: mailInfo?.messageId,
      message: `Direct email sent to ${to.trim()}.`,
    });
  } catch (err) {
    console.error("Error in /api/admin/send-direct-email:", err);
    return NextResponse.json(
      { error: "Failed to dispatch direct email: " + err.message },
      { status: 500 }
    );
  }
}
