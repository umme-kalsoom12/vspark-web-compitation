// Official Competition Rules, Marks Distribution, and Participant Checklist
// Sourced directly from official Web Development Competition specification.

export const COMPETITION_OVERVIEW = {
  title: "Web Development Competition",
  subtitle: "Rules, Marks and Submission Guidelines",
  totalMarks: 100,
  durationMinutes: 120,
  durationHours: 2,
  maxTeamMembers: 2,
  description:
    "Build a working web application and submit it with your source code and a live link. Please read all rules carefully before you start.",
};

export const COMPETITION_RULES_SECTIONS = [
  {
    categoryNumber: "2.1",
    categoryTitle: "Participation and Time",
    rules: [
      {
        number: 1,
        title: "Duration",
        details: "You have exactly 120 minutes (2 hours) to complete the task.",
        badge: "Strict Timer",
      },
      {
        number: 2,
        title: "Group Work",
        details: "Each group can have a maximum of 2 members.",
        badge: "Max 2 Members",
      },
      {
        number: 3,
        title: "Deadline",
        details: "Submissions and the live URL must be sent before the deadline.",
        badge: "Auto-Freeze",
      },
    ],
  },
  {
    categoryNumber: "2.2",
    categoryTitle: "Technology and Tools",
    rules: [
      {
        number: 4,
        title: "Technologies",
        details:
          "MERN Stack, React, Next.js, Django, and other approved web technologies are allowed.",
        badge: "Full-Stack Permitted",
      },
      {
        number: 5,
        title: "AI Tools",
        details:
          "You may use ChatGPT, Gemini, Claude, Cursor, and similar tools. You must fully understand and be able to explain all generated code.",
        badge: "AI Permitted",
      },
    ],
  },
  {
    categoryNumber: "2.3",
    categoryTitle: "Technical Requirements",
    rules: [
      {
        number: 6,
        title: "Task Features",
        details: "Build all features given in the official task statement.",
        badge: "Mandatory",
      },
      {
        number: 7,
        title: "Authentication",
        details: "Use Firebase Authentication (or an approved alternative such as Supabase Auth).",
        badge: "15 Marks",
      },
      {
        number: 8,
        title: "Database",
        details: "Use a real database to store your data with full CRUD functionality.",
        badge: "20 Marks",
      },
      {
        number: 9,
        title: "Cloud Storage",
        details: "Use Supabase Storage (or an approved alternative) for file uploads.",
        badge: "10 Marks",
      },
      {
        number: 10,
        title: "External API",
        details: "Use at least one external API and show that it really works with error handling.",
        badge: "15 Marks",
      },
      {
        number: 11,
        title: "Deployment",
        details: "Deploy the app and give a public URL. Vercel is preferred.",
        badge: "15 Marks",
      },
    ],
  },
  {
    categoryNumber: "2.4",
    categoryTitle: "Submission & Packaging",
    rules: [
      {
        number: 12,
        title: "GitHub Repository",
        details: "Submit your GitHub repository URL with the complete source code.",
        badge: "Public / Shared",
      },
      {
        number: 13,
        title: "Google Drive / Code Archive",
        details:
          "Upload the complete project folder (excluding node_modules) or ZIP to the organizer platform/Drive.",
        badge: "Clean Code",
      },
      {
        number: 14,
        title: "README Documentation",
        details:
          "Include setup steps, technologies, integrations, and deployment details. Note: Screenshots of each process must be included in the README.",
        badge: "Screenshots Req.",
      },
      {
        number: 15,
        title: "Student Details",
        details:
          "Provide your name, registration number, GitHub URL, live URL, and Drive/file location.",
        badge: "Identity",
      },
      {
        number: 16,
        title: "Code Consistency",
        details: "GitHub repository and the uploaded folder must contain the exact same complete project.",
        badge: "Integrity",
      },
    ],
  },
  {
    categoryNumber: "2.5",
    categoryTitle: "Security and Honesty",
    rules: [
      {
        number: 17,
        title: "No Secrets in Commits",
        details:
          "Do not upload .env files with real production keys, passwords, or private credentials. Include .env.example with variable names.",
        badge: "Security",
      },
      {
        number: 18,
        title: "Live Checking",
        details: "Judges will conduct live interactive testing of login, database, file upload, API, and deployment.",
        badge: "Live Testing",
      },
      {
        number: 19,
        title: "Integrity & Code Defense",
        details:
          "Do not copy others or fake features. AI code is allowed, but you must thoroughly understand and defend it during questioning.",
        badge: "Academic Honesty",
      },
      {
        number: 20,
        title: "Final Marking",
        details:
          "Marks are awarded strictly according to the official 100-mark rubric based on verified, working features.",
        badge: "100 Marks Rubric",
      },
    ],
  },
];

export const MARKS_DISTRIBUTION = [
  {
    no: 1,
    criterion: "UI/UX and Responsiveness",
    whatIsChecked: "Clean layout, easy navigation, modern typography, works seamlessly on mobile devices.",
    marks: 10,
    accent: "blue",
  },
  {
    no: 2,
    criterion: "Authentication",
    whatIsChecked: "User registration, login, logout, password controls, and protected route access guards.",
    marks: 15,
    accent: "indigo",
  },
  {
    no: 3,
    criterion: "Database and CRUD",
    whatIsChecked: "Real database connectivity; Create, Read, Update, and Delete operations fully work.",
    marks: 20,
    accent: "emerald",
  },
  {
    no: 4,
    criterion: "Cloud Storage",
    whatIsChecked: "File/asset upload and retrieval work securely via cloud storage bucket.",
    marks: 10,
    accent: "amber",
  },
  {
    no: 5,
    criterion: "External API Integration",
    whatIsChecked: "Real third-party API calls, data is parsed and displayed well, errors and loading states handled.",
    marks: 15,
    accent: "violet",
  },
  {
    no: 6,
    criterion: "Live Deployment",
    whatIsChecked: "Public URL works without crashing and the app runs end-to-end (Vercel preferred).",
    marks: 15,
    accent: "sky",
  },
  {
    no: 7,
    criterion: "Code Quality & Structure",
    whatIsChecked: "Organized modular code, input validation, clean directory structure, proper error handling.",
    marks: 5,
    accent: "teal",
  },
  {
    no: 8,
    criterion: "Documentation & README",
    whatIsChecked: "Comprehensive README, setup steps, environment variable names, screenshots of each process.",
    marks: 5,
    accent: "pink",
  },
  {
    no: 9,
    criterion: "Live Demo & Jury Defense",
    whatIsChecked: "Participant can live-demo the application and clearly explain architectural decisions to judges.",
    marks: 5,
    accent: "rose",
  },
];

export const EVALUATION_PROCESS = [
  {
    title: "GitHub and Google Drive Code Review",
    detail: "Jury verifies repository commits, folder structure, code cleanliness, and README instructions.",
  },
  {
    title: "Live Testing of Public URL",
    detail: "Evaluation on live Vercel/cloud deployment to verify real-world responsiveness and accessibility.",
  },
  {
    title: "Real Feature Verification",
    detail: "Jury actively signs up, tests CRUD database transactions, uploads files to storage, and checks API responses.",
  },
  {
    title: "Security & Secret Leak Audit",
    detail: "Audit ensuring no exposed .env credentials, hardcoded passwords, or insecure endpoints.",
  },
  {
    title: "Short Live Demo with Questions",
    detail: "2-3 minute defense where students demonstrate features and answer juror questions about their code.",
  },
];

export const PARTICIPANT_CHECKLIST = [
  "Registration, login, logout, and protected routes work.",
  "Database is connected and full CRUD works.",
  "File upload and retrieval work.",
  "At least one external API works, with error handling.",
  "App is deployed and the public URL works.",
  "GitHub repository has the complete code.",
  "Full project folder is uploaded to Google Drive / organizer platform.",
  "README is complete and includes environment variable names.",
  "Screenshots of each process are included in the README.",
  "No real secrets or .env files uploaded.",
  "Name, registration number, and all links are ready.",
  "Everything is submitted before the 120-minute deadline.",
];
