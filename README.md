

https://github.com/user-attachments/assets/fbf5b671-37e3-4f38-978f-58c30fe4a80b





<div align="center">

<br />

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Highlights &amp; Architecture](#-key-highlights--architecture)
3. [Feature Showcase](#-feature-showcase)
   - [Student Workspace](#1-student-workspace)
   - [Admin Control Hub &amp; Jury Panel](#2-admin-control-hub--jury-panel)
   - [Rules &amp; Guidelines Synchronization](#3-rules--guidelines-synchronization)
4. [Official 100-Marks Evaluation Rubric](#-official-100-marks-evaluation-rubric)
5. [Tech Stack](#-tech-stack)
6. [Folder &amp; Directory Structure](#-folder--directory-structure)
7. [Getting Started &amp; Local Setup](#-getting-started--local-setup)
   - [Prerequisites](#prerequisites)
   - [Installation](#step-by-step-installation)
   - [Environment Variables (.env.local)](#environment-variables-configuration)
   - [Supabase Database Schema Setup](#supabase-database-schema-setup)
8. [Production Deployment (Vercel)](#-production-deployment-vercel)
9. [Security, Integrity &amp; Rules](#-security-integrity--rules)
10. [Faculty &amp; Organizing Committee](#-faculty--organizing-committee)

<br />

---

## 🚀 Project Overview

**VSPARK 2026** is an enterprise-grade Web Development Hackathon platform engineered specifically for collegiate coding tournaments. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**, and **Supabase**, this portal facilitates the entire lifecycle of a high-stakes, timed software competition:

- **Seamless Team Registration:** Bank fee payment slip intake, allowed tech stacks brief, and automated email dispatch upon submission.
- **Verification Gatekeeper:** Student accounts remain strictly pending until faculty organizers review deposit slips and approve participants.
- **120-Minute Live Countdown with Auto-Freeze:** Strict countdown synchronization prevents post-deadline code commits and submissions.
- **Automated Code Upload & Validation:** Accepts GitHub repository URLs alongside clean source archives (`node_modules`, `.next`, and `.git` automatically filtered).
- **Faculty 100-Point Scoring Jury Panel:** Evaluators grade projects across 9 rubric dimensions, record private comments, and publish instant results.
- **Dynamic Rules & Guidelines Engine:** Admin Word-style rich text editor with real-time Apple/Linear styled popup modal and registration card synchronization.

<br />

---

## 🌟 Key Highlights & Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │              VSPARK 2026 Core                │
                  │             Next.js 16 + React 19            │
                  └───────┬──────────────────────────────┬───────┘
                          │                              │
         ┌────────────────┴─────────────┐ ┌──────────────┴──────────────┐
         │       Student Workspace      │ │    Admin & Jury Dashboard   │
         │  • Dynamic Tech Stack Cards  │ │  • Real-Time Timer Control  │
         │  • Auto-Freeze 120min Clock  │ │  • Student Approval System  │
         │  • GitHub & Archive Upload   │ │  • 100-Pt Rubric Evaluation │
         │  • Live Rules Modal (Tabs)   │ │  • MS Office Word Editor    │
         │  • Broadcast Announcements   │ │  • Nodemailer Direct Email  │
         └──────────────┬───────────────┘ └──────────────┬──────────────┘
                        │                                │
                        └───────────────┬────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │   Supabase Cloud Platform   │
                         │  • PostgreSQL DB (Profiles) │
                         │  • Task Files & Code Zip    │
                         │  • Persistent Approvals     │
                         │  • Auth & Session Security  │
                         └─────────────────────────────┘
```

<br />

---

## ⚡ Feature Showcase

### 1. Student Workspace

- **Instant Session & Approval Gate:** Unverified users are greeted with a clear "Pending Review" status screen with direct WhatsApp Organizer support.
- **120-Minute Countdown Auto-Freeze:** A clock ticks down to zero; once the deadline arrives, the submission form locks automatically.
- **Submission Safeguards:**
  - Mandatory public GitHub repository verification.
  - Code packaging validator (prevents uploading gigabytes of `node_modules`).
  - README with process screenshots requirement notice.
  - Secret scanning alert (prohibits real `.env` keys in source files).
- **Live Broadcast Announcement:** Real-time alert marquee at the top of the workspace for urgent instructions from faculty.
- **Interactive Rules Popup:** Persistent navbar button opening a multi-tab dialog featuring the **100-Marks Rubric**, **Rules & Limits**, and a **Pre-Submission Checklist** with green checkboxes.

### 2. Admin Control Hub & Jury Panel

- **Timer & Competition Control (`/admin/settings`):** Set competition start time, duration, extend time dynamically, or trigger emergency freeze.
- **Task Brief Management (`/admin/task`):** Publish task statements, problem scenarios, API contracts, and downloadable PDF problem statements.
- **Student Verification Center (`/admin/students`):** Review registered teams, inspect fee receipt URLs, and verify or reject accounts with automated email triggers.
- **Jury Evaluation Sheet (`/admin/evaluations`):**
  - Dynamic score inputs matching the official 100-mark distribution.
  - Automatic cumulative total calculation.
  - Judge comments and feedback recording.
  - One-click standings publication to `/results`.
- **Email Dispatcher (`/admin/emails`):** Branded email notifications powered by Nodemailer for announcements, results, and password resets.

### 3. Rules & Guidelines Synchronization

- **Single Source of Truth:** Admin changes made in `/admin/rules` instantly reflect across:
  1. The 3 summary cards on the student registration page (`/register`).
  2. The interactive 3-tab popup modal (`CompetitionRulesModal`).
- **Word-Style MS Office Rich Text Editor:** Supports headings, bold typography, bullet points, numbered lists, tables, and callouts.
- **Deployment-Proof Persistence:** All approvals, timer settings, and rules persist inside Supabase without resetting on Vercel deployments.

<br />

---

## 🎯 Official 100-Marks Evaluation Rubric

Every participating team is evaluated live by faculty judges based on the following official 100-point distribution:

|        #        | Evaluation Criterion                      |     Max Marks     | Description & Key Focus                                                             |
| :-------------: | :---------------------------------------- | :---------------: | :---------------------------------------------------------------------------------- |
|  **01**  | **UI/UX & Mobile Responsiveness**   | **10 Pts** | Clean visual hierarchy, mobile layout, accessibility, intuitive navigation.         |
|  **02**  | **Authentication & Security**       | **15 Pts** | Registration, login, logout, password hashing, and protected route guards.          |
|  **03**  | **Database & Full CRUD Operations** | **20 Pts** | Persistent data storage with working Create, Read, Update, and Delete flows.        |
|  **04**  | **Cloud Storage File Uploads**      | **10 Pts** | Secure file upload, storage bucket configuration, and image retrieval.              |
|  **05**  | **External API Integration**        | **15 Pts** | Real-world API integration, async data fetching, error state handling.              |
|  **06**  | **Live Public Deployment**          | **15 Pts** | Working public URL (Vercel, Render, Netlify) with zero runtime errors.              |
|  **07**  | **Code Quality & Architecture**     | **05 Pts** | Modular structure, clean code, input validation, separation of concerns.            |
|  **08**  | **Documentation & README**          | **05 Pts** | Setup instructions, env guide, process screenshots, and GitHub structure.           |
|  **09**  | **Live Demo & Code Defense**        | **05 Pts** | Live jury demonstration; explaining architecture and answering technical questions. |
| **TOTAL** | **Cumulative Maximum Score**        | **100 Pts** | **Final Hackathon Standing**                                                  |

<br />

---

## 🛠️ Tech Stack

### Core Frameworks & Libraries

- **Language & Runtime:** JavaScript (ESNext), Node.js (v18.x or v20.x+)
- **Framework:** [Next.js 16.4.4](https://nextjs.org/) (App Router, Turbopack, Dynamic Server Routes)
- **UI Engine:** [React 19.3.0](https://react.dev/)
- **Styling:** [Tailwind CSS v4.0](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Archiving & Compression:** [JSZip](https://stuk.github.io/jszip/)

### Backend Services & Cloud Infrastructure

- **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL Database, Storage Buckets, Row Level Security)
- **Email Infrastructure:** [Nodemailer](https://nodemailer.com/) (Gmail SMTP / Custom SMTP)
- **Hosting & Deployment:** [Vercel](https://vercel.com/) (Edge Middleware, Serverless Functions)

<br />

---

## 📁 Folder & Directory Structure

```plaintext
mid-term-project/
├── app/
│   ├── (student)/                  # Student Portal Group
│   │   ├── dashboard/              # 120-Min Timed Workspace & Submissions
│   │   ├── layout.jsx              # Student Navigation Header & Rules Modal
│   │   ├── login/                  # Student Sign-In & Verification Check
│   │   ├── profile/                # Participant Profile & Password Change
│   │   ├── register/               # Registration & Dynamic Guidelines Cards
│   │   ├── reset-password/         # Forgot Password Flow
│   │   ├── results/                # Public Leaderboard & Published Results
│   │   ├── rules/                  # Dedicated Rules Reference Page
│   │   └── terms/                  # Terms of Participation Page
│   ├── admin/                      # Faculty Admin Dashboard
│   │   ├── bank/                   # Bank Deposit Details Manager
│   │   ├── emails/                 # Mass Email & Notice Dispatcher
│   │   ├── evaluations/            # 100-Point Scoring Jury Panel
│   │   ├── login/                  # Secure Admin Authentication
│   │   ├── rules/                  # Rules & 100-Marks Rubric Rich Text Editor
│   │   ├── settings/               # Competition Timer & Auto-Freeze Controls
│   │   ├── students/               # Student Approvals & Resubmission Unlocks
│   │   └── task/                   # Problem Statement & Task Attachments
│   ├── api/                        # Next.js Serverless API Endpoints
│   │   ├── admin/                  # Admin Verification & Evaluation Endpoints
│   │   ├── bank/                   # Settings, Guidelines & Persistent Sync
│   │   ├── email/                  # Welcome & Notification Email Handlers
│   │   └── upload/                 # Project Code Archive Uploader
│   ├── components/                 # Shared UI Components
│   │   ├── CompetitionRulesModal.jsx # Multi-Tab Segmented Rules Popup
│   │   ├── RichTextEditor.jsx      # MS Word-Style Ribbon Toolbar Editor
│   │   ├── RichTextRenderer.jsx    # Markdown & HTML Typography Renderer
│   │   └── TopLoadingBar.jsx       # Smooth Progress Bar Indicator
│   └── lib/                        # Business Logic & Helpers
│       ├── mailer.js               # Nodemailer Transporter Configuration
│       ├── supabase.js             # Supabase Client Initializer
│       └── system-settings.js      # Persistent Database Settings Parser
├── public/                         # Static Assets (Logos, Icons, Badges)
│   └── vspark-logo.png             # Official VSPARK 2026 Branding
├── .env.local                      # Environment Variables (Ignored by Git)
├── middleware.js                   # Route Protection & Cookie Session Guards
├── package.json                    # Project Dependencies & Scripts
└── README.md                       # Master Documentation
```

<br />

---

## 💻 Getting Started & Local Setup

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** `v18.17.0` or higher (Recommended: `v20.x+`)
- **npm**, **yarn**, or **pnpm**
- A **Supabase** account (Free Tier works out of the box)

---

### Step-by-Step Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mwaseem3703/umme-mid-project.git
   cd umme-mid-project
   ```
2. **Install project dependencies:**

   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:

   ```bash
   cp .env.example .env.local
   ```

   _(Or create a new file named `.env.local` and add the variables listed below)_.
4. **Run the local development server:**

   ```bash
   npm run dev
   ```
5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the portal.

---

### Environment Variables Configuration

Copy and fill the following keys inside your `.env.local`:

```env
# ==============================================================================
# 1. SUPABASE DATABASE & AUTHENTICATION CONFIGURATION
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
VITE_SUPABASE_BUCKET=task-files

# ==============================================================================
# 2. FACULTY / ADMIN CREDENTIALS (CUSTOM SESSION AUTH)
# ==============================================================================
ADMIN_EMAIL=admin@comsats.edu.pk
ADMIN_PASSWORD=your_secure_admin_password_2026

# ==============================================================================
# 3. NODEMAILER / GMAIL SMTP CONFIGURATION
# ==============================================================================
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-google-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==============================================================================
# 4. (OPTIONAL) GOOGLE DRIVE API SERVICE ACCOUNT (FOR BACKUPS)
# ==============================================================================
GOOGLE_DRIVE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PARENT_FOLDER_ID=your-google-drive-folder-id
```

> [!TIP]
> **Generating Google App Password:** If using Gmail for Nodemailer, go to **Google Account** → **Security** → **2-Step Verification** → **App Passwords**, generate a 16-character key for "Mail", and paste it into `EMAIL_PASS`.

---

### Supabase Database Schema Setup

In your Supabase Dashboard, open the **SQL Editor** and run the following script to create the necessary tables and buckets:

```sql
-- 1. Profiles Table (Stores registered participants)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    university_name TEXT,
    fee_receipt_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Competition Settings Table (Timer, Task Description, Rules & Approvals)
CREATE TABLE IF NOT EXISTS public.competition_settings (
    id BIGINT PRIMARY KEY,
    start_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 120,
    is_active BOOLEAN DEFAULT true,
    task_description TEXT,
    task_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial row for competition settings
INSERT INTO public.competition_settings (id, duration_minutes, is_active, task_description)
VALUES (1, 120, true, 'VSPARK 2026 Web Development Task Statement')
ON CONFLICT (id) DO NOTHING;

-- 3. Submissions Table (Stores student code submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    student_name TEXT,
    github_url TEXT NOT NULL,
    archive_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Evaluations Table (Stores faculty scores and comments)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score NUMERIC(5,2) DEFAULT 0,
    feedback TEXT,
    evaluator_name TEXT,
    is_published BOOLEAN DEFAULT false,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Storage Bucket for Task & Code Files
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', true)
ON CONFLICT (id) DO NOTHING;
```

<br />

---

## 🌐 Production Deployment (Vercel)

This application is fully optimized for **Vercel** serverless deployment with Turbopack.

1. **Push your code to GitHub / GitLab**.
2. **Import Project into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your cloned repository.
3. **Configure Environment Variables in Vercel**:
   - Add all variables from `.env.local` into **Project Settings → Environment Variables**.
   - Set `NEXT_PUBLIC_APP_URL` to your production domain (`https://vspark-comp-web.vercel.app`).
4. **Deploy**:
   - Click **Deploy**. Vercel will build all 32 routes with zero errors.
   - **Live Production URL:** [https://vspark-comp-web.vercel.app/](https://vspark-comp-web.vercel.app/)

<br />

---

## 🔒 Security, Integrity & Rules

1. **Strict Academic Integrity:** Submissions containing plagiarized code or pre-built commercial templates are disqualified by judges.
2. **Zero Leaked Secrets Policy:** Committing live database passwords or real `.env` secret keys in source files results in an automatic score deduction.
3. **Clean Code Archives:** The in-browser submission packager excludes heavy files (`node_modules`, `.next`, build artifacts) before pushing to Supabase Storage.
4. **Row Level Security (RLS):** Supabase database tables enforce strict access controls; students can only view published results and their own submissions.

<br />

---

## 🏛️ Faculty & Organizing Committee

Developed for and organized by:

- **Institution:** [COMSATS University Islamabad, Vehari Campus](https://vehari.comsats.edu.pk/)
- **Department:** Department of Computer Science
- **Event:** **VSPARK 2026** — National Web Development Competition & Hackathon

---

<div align="center">
  <sub>Built with ❤️ for passionate student developers and future engineers.</sub>
</div>
