# Wildewood COO Dashboard

A single-screen morning command center for running Wildewood Education. Open it
with your coffee and see, in one place:

- **📧 Emails to reply to** — the important/starred unread mail sitting in your Gmail inbox
- **📅 Pending schedules** — sessions awaiting confirmation (imported from TeachWorks)
- **👥 Students** — new students, who still needs their instructor looped in, whose notes aren't filled out, and College Launch updates owed
- **💡 Ideas & Projects** — a parking lot so long-term ideas stop living in your head
- **🔔 Reminders** — recurring ops like inventory counts and KPI reviews
- **📈 KPIs** — the numbers you watch, with targets and progress bars
- **📄 Google Docs** — your recently edited docs (student notes, College Launch updates), one click away
- **✨ Smart Suggestions** — a reasoning engine that reads everything above and tells you what actually needs attention first

## How the "Smart Suggestions" work today

The suggestion engine runs **fully locally** — no AI API key required. It applies
the judgment a COO uses each morning: what's overdue, what's blocking someone
else's work (e.g. a new student whose instructor hasn't been emailed), and
patterns worth noticing (a spiking cancellation rate, an overloaded instructor,
a project that's gone quiet).

It's built behind a clean seam (`src/lib/ai/`) so that when you're ready, we can
swap the local rules for **Claude-powered** suggestions without changing
anything else — same input (a snapshot of your operations), same output (ranked
suggestions). Set `AI_PROVIDER=claude` and add an `ANTHROPIC_API_KEY` when that
day comes.

## Tech stack

- **Next.js 14** (App Router, Server Actions) + **TypeScript** + **Tailwind**
- **NextAuth** with Google OAuth (read-only Gmail + Drive)
- **Prisma** + **Postgres** (serverless: Neon / Vercel Postgres / Supabase)
- Deployed on **Vercel**

---

## Setup

### 1. Database (serverless Postgres)

Create a free Postgres database (any of these work):

- [Neon](https://neon.tech) — recommended, generous free tier
- Vercel Postgres (Storage tab in your Vercel project)
- [Supabase](https://supabase.com)

Copy the **pooled** connection string into `DATABASE_URL` and the **direct**
(non-pooled) string into `DIRECT_URL`. (Neon and Supabase both give you both.)

### 2. Google OAuth credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (e.g. "Wildewood Dashboard").
3. **APIs & Services → Library** → enable both **Gmail API** and **Google Drive API**.
4. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Add your email as a **Test user** (this lets it work immediately without Google's full review).
   - Scopes: you can leave the defaults; the app requests Gmail + Drive read-only at sign-in.
5. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI:
     - Local: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://YOUR-APP.vercel.app/api/auth/callback/google`
6. Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

> **About Google verification:** While the app is in "Testing" mode it works
> right away for any account you add as a Test user (e.g. yours). To remove the
> "unverified app" warning and allow other staff, you'll later submit the app
> for Google's verification — that's a documented next step, not needed for you
> to start using it.

### 3. Environment variables

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

Generate a NextAuth secret:

```bash
openssl rand -base64 32
```

Set `ALLOWED_EMAILS` to your address so only you can sign in.

### 4. Run locally

```bash
npm install
npx prisma db push   # creates the tables in your database
npm run dev          # http://localhost:3000
```

### 5. Deploy to Vercel

1. Push this repo to GitHub (already done).
2. In Vercel, **Add New Project** → import the repo.
3. Add all the environment variables from your `.env` (set `NEXTAUTH_URL` to your
   Vercel URL, e.g. `https://wildewood-dashboard.vercel.app`).
4. Deploy. The build runs `prisma generate && next build` automatically.
5. After the first deploy, run the table creation once. Either:
   - Run `npx prisma db push` locally (pointed at the same `DATABASE_URL`), **or**
   - Use a one-off Vercel build step.
6. Add the production redirect URI to your Google OAuth client (step 2.5).

---

## Using TeachWorks (no API needed)

This dashboard reads **TeachWorks report exports** rather than its API.

1. In TeachWorks, open a report — **Students** or **Calendar/Lessons**.
2. Apply your filters / date range and **export as CSV**.
3. On the dashboard, click **Import TeachWorks** and upload the file.

The importer auto-detects whether it's a students or schedule export and matches
columns by name (so "Student Name", "student_name", and "StudentName" all work).
Re-importing **updates** existing records instead of creating duplicates (it
de-dupes on the TeachWorks ID when present, otherwise on student name).

---

## Project structure

```
src/
  app/
    page.tsx              Dashboard (server component — assembles all widgets)
    import/page.tsx       TeachWorks CSV import
    login/page.tsx        Google sign-in
    actions.ts            All server actions (CRUD + import + email dismiss)
    api/auth/...          NextAuth route
  components/
    widgets/              One file per dashboard card
    Header.tsx, ui.tsx    Shell + shared UI primitives
  lib/
    auth.ts               NextAuth + Google OAuth config (token refresh)
    google.ts             Gmail + Drive helpers
    teachworks.ts         CSV parsing + column mapping
    data.ts               DB queries + snapshot builder for the AI engine
    ai/                   Suggestion engine (local rules today, Claude-ready)
    prisma.ts, session.ts Infra
prisma/schema.prisma      Data model
```

## Roadmap / next steps

- **Claude-powered suggestions** — flip `AI_PROVIDER` to `claude` (the seam is built).
- **Google verification** — to drop the "unverified app" screen and add staff.
- **Email actions** — reply/snooze from inside the dashboard (needs `gmail.modify` scope).
- **Scheduled TeachWorks sync** — if you later want it, automate the export step.
