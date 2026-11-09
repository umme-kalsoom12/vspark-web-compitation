import nodemailer from "nodemailer";

// Resolve App URL with fallbacks
export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }
  return "https://vspark-comp-web.vercel.app";
}

// Create Nodemailer Transporter
export function getTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn("Nodemailer credentials (EMAIL_USER / EMAIL_PASS) missing in environment.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

// Helper: Get logo public URL (avoids MIME file attachments so Gmail does not show attachment download chips)
function getLogoUrl() {
  return `${getAppUrl()}/vspark-logo.png`;
}

// Master Responsive Email Wrapper
function renderEmailShell({ title, previewText, contentHtml, appUrl }) {
  const imgSrc = getLogoUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title || "VSPARK 2026"}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        padding: 12px !important;
      }
      .content-card {
        padding: 24px 18px !important;
      }
      .header-card {
        padding: 28px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <!-- Hidden Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    ${previewText || title}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Branded Top Header Banner -->
          <tr>
            <td class="header-card" align="center" style="background: linear-gradient(135deg, #090d16 0%, #0f172a 100%); padding: 36px 32px 30px; border-radius: 18px 18px 0 0; border: 1px solid #1e293b; border-bottom: none; text-align: center;">
              
              <!-- Official Brand Logo -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block;">
                      <img src="${imgSrc}" alt="VSPARK 2026" width="200" style="display: block; max-height: 52px; width: auto; max-width: 220px; object-fit: contain; margin: 0 auto;" />
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Badge -->
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background: rgba(37, 99, 235, 0.2); color: #93c5fd; border: 1px solid rgba(96, 165, 250, 0.35); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px;">
                  Annual Web Sprint 2026
                </span>
              </div>
              
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px; font-weight: 500; letter-spacing: 0.03em;">
                COMSATS University Islamabad, Vehari Campus
              </p>
            </td>
          </tr>

          <!-- Main White Content Card -->
          <tr>
            <td class="content-card" style="background-color: #ffffff; padding: 36px 34px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 0 18px 18px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td align="center" style="padding: 24px 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 500;">
                Official Portal: <a href="${appUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">${appUrl.replace(/^https?:\/\//, '')}</a>
              </p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                VSPARK 2026 Web Engineering Competition &bull; COMSATS Web Society<br>
                Department of Computer Science &bull; COMSATS University Islamabad, Vehari Campus
              </p>
              <p style="margin: 12px 0 0; color: #cbd5e1; font-size: 10px;">
                You are receiving this communication as a registered participant or administrator of VSPARK 2026.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Send Student Welcome & Pending Verification Email
 */
export async function sendWelcomeEmail({ to, studentName }) {
  const appUrl = getAppUrl();
  const transporter = getTransporter();

  const contentHtml = `
    <!-- Greeting -->
    <h1 style="margin: 0 0 12px; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
      Welcome to VSPARK 2026, ${studentName || "Participant"}!
    </h1>
    <p style="margin: 0 0 20px; color: #475569; font-size: 15px; line-height: 1.6;">
      Thank you for registering for the <strong>VSPARK 2026 Web Engineering Competition</strong> at COMSATS University Islamabad, Vehari Campus. We are thrilled to have you compete alongside the finest student developers!
    </p>

    <!-- Status Callout Box -->
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 10px; padding: 16px 18px; margin: 24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td valign="top" style="padding-right: 10px; width: 24px;">
            <span style="font-size: 20px;">⏳</span>
          </td>
          <td>
            <h2 style="margin: 0 0 4px; color: #92400e; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              Registration Status: Verification in Progress
            </h2>
            <p style="margin: 0; color: #78350f; font-size: 13.5px; line-height: 1.5;">
              Your profile and payment receipt have been safely received. Our organizing committee is currently reviewing your registration. You will receive an official approval email as soon as your verification is complete.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- What Happens Next -->
    <div style="margin: 24px 0;">
      <h2 style="margin: 0 0 12px; color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
        What to expect next:
      </h2>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; color: #334155; font-size: 14px; line-height: 1.5;">
            <strong style="color: #2563eb;">1. Receipt Verification:</strong> Our finance & verification team will validate your deposit receipt against bank records.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #334155; font-size: 14px; line-height: 1.5;">
            <strong style="color: #2563eb;">2. Account Activation:</strong> Once verified, your status will turn to <span style="color: #059669; font-weight: 700;">Verified</span> and your portal access will be granted.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #334155; font-size: 14px; line-height: 1.5;">
            <strong style="color: #2563eb;">3. Competition Kickoff:</strong> When the sprint begins, sign in to view the official task PDF, push commits to GitHub, and submit your project archive.
          </td>
        </tr>
      </table>
    </div>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
        Visit VSPARK Competition Portal &rarr;
      </a>
    </div>

    <!-- Allowed Tech Stack Reminder -->
    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px 16px; margin-top: 24px;">
      <p style="margin: 0; color: #64748b; font-size: 12.5px; line-height: 1.5;">
        <strong style="color: #334155;">Permitted Tech Stack:</strong> React, Next.js, Node.js, Tailwind CSS, TypeScript/JavaScript, Supabase, Firebase. Make sure your local development environment is set up beforehand!
      </p>
    </div>
  `;

  const html = renderEmailShell({
    title: "Registration Received - VSPARK 2026",
    previewText: `Dear ${studentName || "Participant"}, your VSPARK 2026 registration has been received and is pending verification.`,
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Registration Received - VSPARK 2026 (Verification In Progress)",
    html,
  });
}

/**
 * 2. Send Student Approval & Portal Activation Email
 */
export async function sendApprovalEmail({ to, studentName }) {
  const appUrl = getAppUrl();
  const transporter = getTransporter();

  const contentHtml = `
    <!-- Celebration Headline -->
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
        &bull; Official Confirmation &bull;
      </span>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
        Registration Approved! 🎉
      </h1>
      <p style="margin: 0; color: #475569; font-size: 15px;">
        Dear <strong>${studentName || "Participant"}</strong>, you are officially confirmed to compete in VSPARK 2026!
      </p>
    </div>

    <!-- Verified Status Box -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 10px; padding: 16px 18px; margin: 24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td valign="top" style="padding-right: 10px; width: 24px;">
            <span style="font-size: 20px;">✅</span>
          </td>
          <td>
            <h2 style="margin: 0 0 4px; color: #065f46; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              Account Status: Verified & Activated
            </h2>
            <p style="margin: 0; color: #047857; font-size: 13.5px; line-height: 1.5;">
              Your fee payment receipt has been approved by the organizing committee. Your student account is now fully active.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Instructions -->
    <div style="margin: 24px 0;">
      <h2 style="margin: 0 0 12px; color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
        How to access your workspace:
      </h2>
      <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.7;">
        <li>Click the button below to visit the <strong>Student Login Portal</strong>.</li>
        <li>Sign in with your registered email (<code>${to}</code>) and your password.</li>
        <li>Access your competition dashboard, where task specifications and submission links will go live during the competition.</li>
      </ol>
    </div>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin: 32px 0 28px;">
      <a href="${appUrl}/login" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
        Sign In to Student Dashboard &rarr;
      </a>
    </div>

    <!-- Crucial Reminder Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin-top: 24px;">
      <h3 style="margin: 0 0 6px; color: #1e293b; font-size: 13px; font-weight: 700;">
        💡 Important Submission Guidelines:
      </h3>
      <p style="margin: 0; color: #64748b; font-size: 12.5px; line-height: 1.6;">
        When submitting your final project, remember to provide both your GitHub repository URL and upload a compressed project folder archive (.zip). Follow all official guidelines on your dashboard.
      </p>
    </div>
  `;

  const html = renderEmailShell({
    title: "Registration Approved - VSPARK 2026",
    previewText: `Congratulations ${studentName || "Participant"}! Your VSPARK 2026 registration has been approved. Sign in to your dashboard.`,
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Congratulations! Your VSPARK 2026 Registration is Approved",
    html,
  });
}

/**
 * 3. Send Admin Custom Notice / Announcement Email (Broadcast via BCC)
 * Vercel-Safe: Single SMTP call with BCC ensures fast execution (<2s) and 100% student privacy.
 */
export async function sendBroadcastNotice({ recipients, subject, messageBody, targetAudience }) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No recipient email addresses provided.");
  }

  const appUrl = getAppUrl();
  const transporter = getTransporter();

  // Escape HTML characters and format paragraphs
  const safeMessageHtml = messageBody
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n+/g, "</p><p style='margin: 0 0 14px; color: #334155; font-size: 14.5px; line-height: 1.6;'>")
    .replace(/\n/g, "<br>");

  const contentHtml = `
    <!-- Announcement Banner -->
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
        📢 Official Administration Notice
      </div>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
        ${subject}
      </h1>
      <p style="margin: 0; color: #64748b; font-size: 13px;">
        Broadcast to: <strong>${targetAudience || "All Registered Participants"}</strong> &bull; VSPARK 2026 Organizing Committee
      </p>
    </div>

    <!-- Notice Content Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 10px; padding: 22px 20px; margin: 22px 0;">
      <div style="color: #334155; font-size: 14.5px; line-height: 1.65;">
        <p style="margin: 0 0 14px;">${safeMessageHtml}</p>
      </div>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${appUrl}/dashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
        Open Competition Dashboard &rarr;
      </a>
    </div>

    <!-- Support Reminder -->
    <p style="margin: 20px 0 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
      If you have any urgent questions regarding this notice, please reach out to the COMSATS Web Society management team.
    </p>
  `;

  const html = renderEmailShell({
    title: subject,
    previewText: messageBody.slice(0, 140) + "...",
    contentHtml,
    appUrl,
  });

  // Send single BCC message (protects privacy & satisfies Vercel timeout constraints)
  return await transporter.sendMail({
    from: `"VSPARK 2026" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Official sender/admin inbox as primary To
    bcc: recipients, // All students hidden in BCC
    subject: `[VSPARK 2026] ${subject}`,
    html,
  });
}

/**
 * 3.5. Send Task Announcement & Problem Specifications Email (Broadcast via BCC)
 * Dispatches the official problem brief release notification with live dates, code freeze countdown, and dashboard link.
 */
export async function sendTaskAnnouncementEmail({
  recipients,
  competitionTitle,
  startTime,
  endTime,
  taskPdfUrl,
  taskSummary,
  targetAudience,
}) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No recipient email addresses provided.");
  }

  const appUrl = getAppUrl();
  const transporter = getTransporter();
  const eventTitle = competitionTitle || "VSPARK 2026 Web Development Hackathon";

  const contentHtml = `
    <!-- Header Badge -->
    <div style="margin-bottom: 20px; text-align: left;">
      <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
        🚀 Challenge Brief Now Active
      </div>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
        ${eventTitle} — Problem Brief Released!
      </h1>
      <p style="margin: 0; color: #64748b; font-size: 13px;">
        The challenge specifications and submission portal are now live for all participants.
      </p>
    </div>

    <!-- Timeline & Details Card -->
    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 12px; color: #93c5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
        ⏱️ Official Competition Timeline
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color: #ffffff; font-size: 13px;">
        ${
          startTime
            ? `<tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Competition Start:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${new Date(startTime).toLocaleString()}</td>
              </tr>`
            : ""
        }
        ${
          endTime
            ? `<tr>
                <td style="padding: 6px 0; color: #fde68a; width: 140px;">Code Freeze Deadline:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #fde047;">${new Date(endTime).toLocaleString()}</td>
              </tr>`
            : ""
        }
        ${
          taskPdfUrl
            ? `<tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 140px;">PDF Guidelines:</td>
                <td style="padding: 6px 0;"><a href="${taskPdfUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 600;">Download Official PDF &rarr;</a></td>
              </tr>`
            : ""
        }
      </table>
    </div>

    ${
      taskSummary
        ? `<!-- Challenge Brief & Specifications Box -->
           <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 10px; padding: 20px 22px; margin: 20px 0;">
             <p style="margin: 0 0 10px; color: #1e293b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
               📌 Challenge Specifications & Problem Brief:
             </p>
             <div style="margin: 0; color: #334155; font-size: 13.5px; line-height: 1.7; word-break: break-word;">
               ${taskSummary}
             </div>
           </div>`
        : ""
    }

    <!-- Primary Action Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${appUrl}/dashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
        View Full Task &amp; Open Workspace &rarr;
      </a>
    </div>

    <!-- Security & Code Rules Notice -->
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 20px 0; text-align: left;">
      <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.5;">
        🔒 <strong>Important:</strong> Ensure your GitHub repository is public and contains clean code. Submissions lock strictly at the Code Freeze deadline.
      </p>
    </div>
  `;

  const html = renderEmailShell({
    title: `Task Brief Released: ${eventTitle}`,
    previewText: `The challenge specifications and submission portal for ${eventTitle} are now active!`,
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026 Organizing Committee" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    bcc: recipients,
    subject: `🚀 Problem Brief Released: ${eventTitle}`,
    html,
  });
}

/**
 * 4. Send Password Reset / Account Recovery Email to Student
 */
export async function sendPasswordResetEmail({ to, studentName, resetUrl }) {
  const appUrl = getAppUrl();
  const transporter = getTransporter();
  const targetUrl = resetUrl || `${appUrl}/reset-password?email=${encodeURIComponent(to)}`;

  const contentHtml = `
    <!-- Header -->
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
        &bull; Security & Account Access &bull;
      </span>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
        Reset Your Account Password
      </h1>
      <p style="margin: 0; color: #475569; font-size: 15px;">
        Dear <strong>${studentName || "Participant"}</strong>,
      </p>
    </div>

    <!-- Alert Box -->
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 10px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 0; color: #881337; font-size: 13.5px; line-height: 1.5;">
        A password reset request was initiated by the <strong>VSPARK 2026 Competition Administration</strong> for your registered student account (<strong>${to}</strong>).
      </p>
    </div>

    <p style="margin: 16px 0; color: #334155; font-size: 14px; line-height: 1.6;">
      To choose a new secure password and restore full access to your student dashboard, please click the button below:
    </p>

    <!-- Action Button -->
    <div style="text-align: center; margin: 28px 0 24px;">
      <a href="${targetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
        Reset Your Password &rarr;
      </a>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-top: 24px;">
      <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
        <strong>Alternative Direct Link:</strong> If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${targetUrl}" target="_blank" style="color: #2563eb; word-break: break-all;">${targetUrl}</a>
      </p>
    </div>
  `;

  const html = renderEmailShell({
    title: "Reset Your Account Password - VSPARK 2026",
    previewText: `Dear ${studentName || "Participant"}, a password reset was requested by the VSPARK administration for your account.`,
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026" <${process.env.EMAIL_USER}>`,
    to,
    subject: "[Action Required] Reset Your Account Password - VSPARK 2026",
    html,
  });
}

/**
 * 5. Send Direct 1-on-1 Custom Email from Admin to a Single Student
 */
export async function sendDirectStudentEmail({ to, studentName, subject, messageBody }) {
  const appUrl = getAppUrl();
  const transporter = getTransporter();

  const safeMessageHtml = messageBody
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n+/g, "</p><p style='margin: 0 0 14px; color: #334155; font-size: 14.5px; line-height: 1.6;'>")
    .replace(/\n/g, "<br>");

  const contentHtml = `
    <!-- Header -->
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
        &bull; Official Faculty / Admin Communication &bull;
      </span>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
        ${subject}
      </h1>
      <p style="margin: 0; color: #475569; font-size: 15px;">
        Dear <strong>${studentName || "Participant"}</strong>,
      </p>
    </div>

    <!-- Message Content Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 10px; padding: 22px 20px; margin: 22px 0;">
      <div style="color: #334155; font-size: 14.5px; line-height: 1.65;">
        <p style="margin: 0 0 14px;">${safeMessageHtml}</p>
      </div>
    </div>

    <!-- Direct Action Button -->
    <div style="text-align: center; margin: 28px 0 20px;">
      <a href="${appUrl}/dashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
        Open Student Dashboard &rarr;
      </a>
    </div>

    <p style="margin: 18px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
      If you need to respond to this communication, you may contact the organizing team or reply to this email.
    </p>
  `;

  const html = renderEmailShell({
    title: subject,
    previewText: messageBody.slice(0, 140) + "...",
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026 Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[VSPARK 2026] ${subject}`,
    html,
  });
}

/**
 * 6. Send Podium Winner Celebration Email (Rank 1, 2, or 3)
 */
export async function sendPodiumWinnerEmail({ to, studentName, rank, totalMarks }) {
  const appUrl = getAppUrl();
  const transporter = getTransporter();

  const rankTitles = {
    1: { medal: "🥇", label: "1st Place Winner (Gold Champion)", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    2: { medal: "🥈", label: "2nd Place Runner-Up (Silver Trophy)", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
    3: { medal: "🥉", label: "3rd Place Podium Winner (Bronze Trophy)", color: "#b45309", bg: "#ffedd5", border: "#fed7aa" },
  };

  const rankInfo = rankTitles[rank] || {
    medal: "🏆",
    label: `Rank #${rank} Winner`,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  };

  const contentHtml = `
    <!-- Celebration Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: ${rankInfo.bg}; color: ${rankInfo.color}; border: 1px solid ${rankInfo.border}; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 18px; border-radius: 9999px; margin-bottom: 14px;">
        ${rankInfo.medal} Official Winner Announcement ${rankInfo.medal}
      </span>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">
        Congratulations, ${studentName || "Champion"}!
      </h1>
      <p style="margin: 0; color: #475569; font-size: 16px;">
        You have secured <strong>${rankInfo.label}</strong> in VSPARK 2026!
      </p>
    </div>

    <!-- Podium Honors Card -->
    <div style="background: linear-gradient(135deg, #090d16 0%, #1e1b4b 100%); border-radius: 14px; padding: 26px 22px; text-align: center; color: #ffffff; margin: 24px 0; border: 1px solid #312e81;">
      <div style="font-size: 40px; margin-bottom: 6px;">${rankInfo.medal}</div>
      <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 800; color: #f8fafc; letter-spacing: 0.02em;">
        ${rankInfo.label}
      </h2>
      <div style="margin-top: 14px; display: inline-block; background: rgba(255, 255, 255, 0.12); padding: 8px 20px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <span style="font-size: 13px; color: #94a3b8; font-weight: 600;">Final Validated Score:</span>
        <span style="font-size: 16px; font-weight: 800; color: #38bdf8; margin-left: 6px;">${totalMarks ?? 0} / 100</span>
      </div>
    </div>

    <p style="margin: 18px 0; color: #334155; font-size: 14.5px; line-height: 1.65;">
      On behalf of COMSATS University Islamabad, Vehari Campus, the Department of Computer Science, and the COMSATS Web Society, we commend your exceptional problem-solving, architectural design, and software craftsmanship.
    </p>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 24px;">
      <a href="${appUrl}/results" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
        View Official Leaderboard & Rankings &rarr;
      </a>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12.5px; line-height: 1.5; text-align: center;">
      Details regarding the physical award ceremony, certificates of excellence, and awards distribution will be shared shortly by event administration.
    </p>
  `;

  const html = renderEmailShell({
    title: `🏆 Congratulations! You Won ${rankInfo.label} - VSPARK 2026`,
    previewText: `Dear ${studentName || "Champion"}, congratulations on securing ${rankInfo.label} in VSPARK 2026!`,
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🏆 Congratulations! You Won ${rankInfo.label} - VSPARK 2026`,
    html,
  });
}

/**
 * 7. Send General Results Announcement to All Other Participants (via BCC)
 */
export async function sendResultsGeneralEmail({ recipients }) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return null;
  }

  const appUrl = getAppUrl();
  const transporter = getTransporter();

  const contentHtml = `
    <!-- Announcement Headline -->
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
        &bull; Competition Concluded &bull;
      </span>
      <h1 style="margin: 0 0 10px; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
        Official Results & Rankings Are Live! 📢
      </h1>
      <p style="margin: 0; color: #475569; font-size: 15px;">
        The evaluation for the <strong>VSPARK 2026 Web Engineering Competition</strong> has officially concluded.
      </p>
    </div>

    <!-- Status Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 10px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 10px; color: #1e293b; font-size: 14px; font-weight: 600;">
        All submitted repositories have been graded across the 100-point rubric:
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #475569; font-size: 13.5px; line-height: 1.6;">
        <li>Core Functionality &amp; Completeness (35 Pts)</li>
        <li>System Architecture &amp; State Management (25 Pts)</li>
        <li>UI/UX Design, Polish &amp; Responsiveness (25 Pts)</li>
        <li>Innovation, Performance &amp; Git Hygiene (15 Pts)</li>
      </ul>
    </div>

    <p style="margin: 18px 0; color: #334155; font-size: 14px; line-height: 1.6;">
      We extend our heartfelt gratitude to every participant for showcasing great enthusiasm, engineering talent, and dedication. Check your score, ranking, and the podium champions on the official results page.
    </p>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0 24px;">
      <a href="${appUrl}/results" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
        Check Official Leaderboard &rarr;
      </a>
    </div>

    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
      COMSATS Web Society &bull; Department of Computer Science &bull; COMSATS University Islamabad, Vehari Campus
    </p>
  `;

  const html = renderEmailShell({
    title: "Official VSPARK 2026 Results Announced!",
    previewText: "The official results and leaderboard for VSPARK 2026 are now live. View your ranking and score.",
    contentHtml,
    appUrl,
  });

  return await transporter.sendMail({
    from: `"VSPARK 2026" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    bcc: recipients,
    subject: "📢 Official VSPARK 2026 Results & Leaderboard Announced!",
    html,
  });
}
