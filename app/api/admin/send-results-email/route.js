import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendPodiumWinnerEmail, sendResultsGeneralEmail } from "../../../lib/mailer";

export async function POST(request) {
  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );

    // 1. Verify that results are officially published before emailing students
    const { data: compSettings } = await supabase
      .from("competition_settings")
      .select("results_published")
      .eq("id", 1)
      .maybeSingle();

    if (!compSettings?.results_published) {
      return NextResponse.json(
        {
          error:
            "Results are currently locked / hidden. Please turn ON 'Publish Public Results' in Event Controls first, so students can view their marks when they open the results link.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch all submissions ordered by score descending
    const { data: submissions, error: subsError } = await supabase
      .from("submissions")
      .select("id, profile_id, total_marks, github_url, submitted_at")
      .order("total_marks", { ascending: false });

    if (subsError) {
      throw new Error("Failed to load submissions: " + subsError.message);
    }

    // 2. Fetch all student profiles
    const { data: profiles, error: profsError } = await supabase
      .from("profiles")
      .select("id, full_name, email, status");

    if (profsError) {
      throw new Error("Failed to load profiles: " + profsError.message);
    }

    const profileMap = {};
    (profiles || []).forEach((p) => {
      profileMap[p.id] = p;
    });

    // 3. Map submissions to participants
    const scoredParticipants = (submissions || [])
      .map((sub, index) => {
        const profile = profileMap[sub.profile_id];
        return {
          rank: index + 1,
          profileId: sub.profile_id,
          name: profile?.full_name || "Participant",
          email: profile?.email,
          totalMarks: sub.total_marks ?? 0,
          githubUrl: sub.github_url,
        };
      })
      .filter((s) => s.email && s.email.includes("@"));

    // 4. Send Top 3 Podium Winner Emails
    const top3 = scoredParticipants.slice(0, 3);
    const top3Results = [];

    for (const winner of top3) {
      try {
        const info = await sendPodiumWinnerEmail({
          to: winner.email,
          studentName: winner.name,
          rank: winner.rank,
          totalMarks: winner.totalMarks,
          githubUrl: winner.githubUrl,
        });
        top3Results.push({
          email: winner.email,
          rank: winner.rank,
          status: "sent",
          messageId: info?.messageId,
        });
      } catch (err) {
        console.error(`Failed to send podium email to ${winner.email}:`, err);
        top3Results.push({
          email: winner.email,
          rank: winner.rank,
          status: "failed",
          error: err.message,
        });
      }
    }

    // 5. Gather all other student emails for general results announcement
    const top3EmailsSet = new Set(top3.map((w) => w.email.toLowerCase().trim()));
    const otherEmails = (profiles || [])
      .map((p) => p.email?.trim())
      .filter((e) => e && e.includes("@") && !top3EmailsSet.has(e.toLowerCase()));

    const uniqueOtherEmails = Array.from(new Set(otherEmails));

    let generalAnnouncementResult = null;
    if (uniqueOtherEmails.length > 0) {
      try {
        generalAnnouncementResult = await sendResultsGeneralEmail({
          recipients: uniqueOtherEmails,
        });
      } catch (genErr) {
        console.error("General results email dispatch failed:", genErr);
      }
    }

    return NextResponse.json({
      success: true,
      top3WinnersDispatched: top3Results,
      generalRecipientsCount: uniqueOtherEmails.length,
      generalMessageId: generalAnnouncementResult?.messageId || null,
      message: `Results dispatched! Top 3 podium honors sent, and ${uniqueOtherEmails.length} participants notified.`,
    });
  } catch (err) {
    console.error("Error in /api/admin/send-results-email:", err);
    return NextResponse.json(
      { error: "Failed to dispatch results emails: " + err.message },
      { status: 500 }
    );
  }
}
