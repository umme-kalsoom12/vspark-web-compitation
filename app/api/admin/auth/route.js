import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.ADMIN_EMAIL || "admin@comsats.edu.pk";
    const expectedPassword = process.env.ADMIN_PASSWORD || "secure_admin_pass_2026";

    if (
      email?.trim().toLowerCase() === expectedEmail.toLowerCase() &&
      password === expectedPassword
    ) {
      const response = NextResponse.json({
        success: true,
        message: "Authentication successful",
      });

      // Set HTTP-only secure cookie for admin session (valid for 24 hours)
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid admin email or password." },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "An error occurred during authentication: " + err.message },
      { status: 500 }
    );
  }
}
