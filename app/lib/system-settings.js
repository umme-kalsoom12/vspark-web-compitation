export const DEFAULT_SYSTEM_SETTINGS = {
  accountTitle: "COMSATS Web Society",
  accountNumber: "0123 4567 8901 23",
  bankName: "Easypaisa / HBL",
  feeAmount: "Rs. 500",
  announcement: {
    enabled: false,
    text: "Welcome to VSPARK 2026! Problem specifications and guidelines are now active.",
  },
  allowedTechStack:
    "MERN Stack, React, Next.js, Django, Node.js, Tailwind CSS, Supabase, Firebase",
  competitionGuidelines:
    "1. Total Marks: 100 | Time Allowed: 120 minutes (2 hours) | Teams: Max 2 members.\n2. Permitted Technologies: MERN Stack, React, Next.js, Django, and other approved web technologies.\n3. AI Tools Allowed: ChatGPT, Gemini, Claude, Cursor (must be able to explain all generated code).\n4. Core Features: Real Auth, Database CRUD, Cloud Storage file uploads, External API, and Public Deployment.\n5. Submissions: GitHub repository + Project folder upload + Comprehensive README with screenshots.\n6. Security & Integrity: No committed .env secrets; judges will test live features and conduct live code defense.",
  gradingCriteria:
    "1. UI/UX and Responsiveness (10 Marks): Clean layout, easy navigation, works on mobile.\n2. Authentication (15 Marks): Register, login, logout, protected routes.\n3. Database and CRUD (20 Marks): Real data stored; Create, Read, Update, Delete work.\n4. Cloud Storage (10 Marks): File upload and retrieval work securely.\n5. External API (15 Marks): Real API calls, data parsed well, errors handled.\n6. Deployment (15 Marks): Public URL works end-to-end (Vercel preferred).\n7. Code Quality (5 Marks): Organized code, validation, error handling.\n8. Documentation (5 Marks): README with setup steps, variables, and screenshots of each process.\n9. Live Demo (5 Marks): Interactive demo and code defense with judges.",
  checklist: [
    "Registration, login, logout, and protected routes work.",
    "Database is connected and full CRUD works.",
    "File upload and retrieval work securely.",
    "At least one external API works, with proper error handling.",
    "App is deployed on public URL (Vercel preferred).",
    "GitHub repository has complete source code.",
    "Full project folder is uploaded (excluding node_modules).",
    "README includes setup steps, env names, and process screenshots.",
    "No real secrets or .env files committed.",
    "Team details and links are ready for jury review.",
    "Everything submitted before the 120-minute deadline.",
  ],
};

const MARKER_START = "<!-- VSPARK_CONFIG_START -->";
const MARKER_END = "<!-- VSPARK_CONFIG_END -->";

export function cleanTaskDescription(desc) {
  if (!desc) return "";
  return desc
    .replace(/<!-- VSPARK_CONFIG_START -->[\s\S]*?<!-- VSPARK_CONFIG_END -->/g, "")
    .trim();
}

export function extractConfigFromDescription(desc) {
  if (!desc) return null;
  const match = desc.match(
    /<!-- VSPARK_CONFIG_START -->([\s\S]*?)<!-- VSPARK_CONFIG_END -->/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    console.warn("Failed to parse config from description:", err);
    return null;
  }
}

export function embedConfigInDescription(desc, config) {
  const clean = cleanTaskDescription(desc);
  return `${clean}\n\n${MARKER_START}${JSON.stringify(config)}${MARKER_END}`;
}

export async function getPersistentApprovals(supabaseClient) {
  try {
    const sb = supabaseClient;
    if (!sb) return { approvals: {}, unlockedSubmissions: {}, allowAllResubmissions: false };
    const { data: row } = await sb
      .from("competition_settings")
      .select("task_description")
      .eq("id", 1)
      .maybeSingle();

    const config = extractConfigFromDescription(row?.task_description) || {};
    return {
      approvals: config.approvals || {},
      unlockedSubmissions: config.unlockedSubmissions || {},
      allowAllResubmissions: Boolean(config.allowAllResubmissions),
    };
  } catch (err) {
    console.warn("Failed to get persistent approvals:", err);
    return { approvals: {}, unlockedSubmissions: {}, allowAllResubmissions: false };
  }
}

export async function savePersistentApproval(studentId, status, supabaseClient) {
  try {
    const sb = supabaseClient;
    if (!sb || !studentId) return null;
    const { data: row } = await sb
      .from("competition_settings")
      .select("task_description")
      .eq("id", 1)
      .maybeSingle();

    const config = extractConfigFromDescription(row?.task_description) || {};
    const approvals = { ...(config.approvals || {}) };
    approvals[studentId] = status;

    const updatedConfig = {
      ...config,
      approvals,
    };
    const finalDesc = embedConfigInDescription(row?.task_description || "", updatedConfig);
    await sb
      .from("competition_settings")
      .update({ task_description: finalDesc })
      .eq("id", 1);

    return updatedConfig;
  } catch (err) {
    console.error("Failed to save persistent approval:", err);
    return null;
  }
}

export async function savePersistentResubmissions(
  { allowAllResubmissions, toggleStudentId, toggleUnlock },
  supabaseClient
) {
  try {
    const sb = supabaseClient;
    if (!sb) return null;
    const { data: row } = await sb
      .from("competition_settings")
      .select("task_description")
      .eq("id", 1)
      .maybeSingle();

    const config = extractConfigFromDescription(row?.task_description) || {};
    const unlocked = { ...(config.unlockedSubmissions || {}) };

    if (toggleStudentId) {
      if (toggleUnlock === false) {
        delete unlocked[toggleStudentId];
      } else {
        unlocked[toggleStudentId] = true;
      }
    }

    const updatedConfig = {
      ...config,
      unlockedSubmissions: unlocked,
      allowAllResubmissions:
        allowAllResubmissions !== undefined
          ? Boolean(allowAllResubmissions)
          : Boolean(config.allowAllResubmissions),
    };
    const finalDesc = embedConfigInDescription(row?.task_description || "", updatedConfig);
    await sb
      .from("competition_settings")
      .update({ task_description: finalDesc })
      .eq("id", 1);

    return updatedConfig;
  } catch (err) {
    console.error("Failed to save persistent resubmissions:", err);
    return null;
  }
}
