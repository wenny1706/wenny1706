# DG Content Engine

The private Digital Geekz tool for running social ghostwriting for 4–10 clients.

Every client workspace runs on the Digital Geekz framework, always in this order:

**LISTEN → PLAN → CREATE → PUBLISH → LEARN**

Version 1 is an organiser. There is no AI generation inside the tool and nothing
here costs money to run. Drafts are written in Claude chat and pasted in.

---

## What is built so far

| Phase | What it covers | Status |
|-------|----------------|--------|
| 1 | Setup, login, database, clients, voice vault | ✅ done |
| 2 | LISTEN notes, PLAN pillars + monthly map, CREATE kanban | to do |
| 3 | Dashboard calendar, status board, needs-attention strip | to do |
| 4 | PUBLISH feed planner + queue, LEARN reports, .docx export, hook library | to do |
| 5 | Mobile polish, empty states, how-to screen | to do |

## Setting it up

1. **Supabase** — create a free project, then paste `supabase/schema.sql` into
   the SQL Editor and run it. Create one user (yourself) under Authentication → Users.
2. **Keys** — copy `.env.example` to `.env.local` and fill in the project URL and
   the anon key from Supabase → Project Settings → API.
3. **Run it** — `npm install` then `npm run dev`, and open http://localhost:3000
4. **Deploy** — import the repo on Vercel, set the same two environment variables
   there, and deploy. Environment variables must exist *before* the build, so if
   you add them afterwards, redeploy.

## Ground rules for future work

- Branding is fixed: background `#121212`, accent `#E8BE5C`, secondary `#F3E3B3`.
  No purple gradients, no generic dashboard look. This tool is shown to clients.
- The five stage names are Digital Geekz IP. Never rename them.
- Single user. No signup page, no client logins.
- Out of scope for v1: AI calls, auto-posting, client logins, automatic analytics,
  payments. The place where AI generation will plug in later is commented in
  `src/lib/types.ts`.
