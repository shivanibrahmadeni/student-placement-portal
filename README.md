# Student Placement and Career Portal — CareerSpring

A polished, responsive college placement portal built with HTML, CSS, Vanilla JavaScript, Node.js, Express, and Supabase PostgreSQL.

## What it solves

Students often need to check multiple sources to find opportunities, keep track of applications, and present their skills. CareerSpring brings those tasks into one student-friendly workspace.

## Features

- Modern dashboard with opportunity, application, interview, and profile-strength summaries
- Job and internship cards with keyword search and filters for type and location
- Application workflow with duplicate-application prevention
- Application tracker with status labels and status update controls
- Editable student career profile, skills, education, LinkedIn, and summary
- Responsive layout for desktop, tablet, and mobile
- Express REST API, validation, security headers, and consistent JSON errors
- Supabase PostgreSQL schema with constraints, indexes, foreign keys, and timestamps
- **Demo mode:** starts without credentials using sample data so you can rehearse the presentation
- **Supabase mode:** configure the server environment to persist records in PostgreSQL

> Classroom MVP note: the starter includes a single shared student workspace, not production multi-user authentication. Do not deploy it publicly with real student data until Supabase Auth, per-user authorization, and corresponding RLS policies are implemented.

## Technology stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: Supabase PostgreSQL
- Security basics: Helmet, request-size limit, server-only credentials, input validation

## Folder structure

```text
student-placements-career-portal/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## Prerequisites

Install:
- Node.js 20 or newer: https://nodejs.org/
- Visual Studio Code: https://code.visualstudio.com/
- Git (optional for running, needed for GitHub): https://git-scm.com/

Verify Node and npm in a terminal:

```bash
node -v
npm -v
```

## Run quickly for your presentation

1. Extract the ZIP file.
2. Open the `student-placements-career-portal` folder in VS Code.
3. Open Terminal → New Terminal.
4. Move into the backend folder:

   ```bash
   cd backend
   ```

5. Install packages:

   ```bash
   npm install
   ```

6. Start the server:

   ```bash
   npm run dev
   ```

7. Open **http://localhost:5000** in your browser.

The terminal should say the API is ready and `Mode: DEMO (in-memory sample data)`. In demo mode, the app is usable immediately. Data is kept in server memory and resets when the server restarts. Keep the terminal running while presenting.

## Connect Supabase for persistent data

### 1. Create a project

1. Visit https://supabase.com/ and sign in.
2. Create a new project and keep its database password private.
3. Open Project Settings → API (or API Keys, depending on dashboard layout).
4. Copy the Project URL and the **service_role / secret key** for server-side use only.

### 2. Create tables and sample job listings

1. Open your Supabase project.
2. Open **SQL Editor** → **New query**.
3. Open `database/schema.sql`, copy all SQL, paste it into the editor, and click **Run**.
4. Open **Table Editor** and confirm that `profiles`, `jobs`, and `applications` exist and that `jobs` contains six sample listings.

### 3. Configure the backend

1. Copy `backend/.env.example` to a new file named `backend/.env`.
2. Put your real values in that file:

   ```env
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
   ALLOWED_ORIGIN=
   ```

3. Save the file and restart the server (`Ctrl+C`, then `npm run dev`).
4. The terminal should report `Mode: Supabase PostgreSQL`.
5. Open http://localhost:5000 and try editing the profile or applying for a role.

**Never** paste the service-role key into `frontend/app.js`, HTML, CSS, screenshots, a public repository, or a presentation. Keep `backend/.env` private. `.env.example` is safe to commit because it contains placeholders.

## API reference

All routes return JSON.

| Method | Path | Purpose | Request body | Main responses |
|---|---|---|---|---|
| GET | `/api/health` | Check server and mode | — | `200` |
| GET | `/api/bootstrap` | Load jobs, profile, and applications | — | `200` |
| PUT | `/api/profile` | Validate and save the student profile | `fullName`, `email`, `course`, `graduationYear`, `skills`, `linkedin`, `summary` | `200`, `400` |
| POST | `/api/applications` | Apply for an open role; blocks duplicates | `jobId`, `coverNote` | `201`, `400`, `404`, `409` |
| PATCH | `/api/applications/:id` | Update an application status | `status` | `200`, `400`, `404` |

The current classroom starter has no login endpoint and treats the profile/status workspace as a shared demo. Do not use it for real multi-student data before adding verified authentication and ownership checks.

## Architecture

```text
Browser (HTML/CSS/Vanilla JS)
        │ fetch() / JSON
        ▼
Node.js + Express REST API
        │ @supabase/supabase-js (server-side key)
        ▼
Supabase PostgreSQL
  profiles · jobs · applications
```

## Test checklist

- [ ] Open `/api/health`; expect `ok: true`.
- [ ] Confirm six opportunities appear.
- [ ] Search `frontend`; only matching roles should remain.
- [ ] Filter by Internship and Hyderabad.
- [ ] Submit an application; it should appear in My applications.
- [ ] Try applying to the same role again; it should be blocked.
- [ ] Change an application status; the label and summary counts should update.
- [ ] Edit the profile and save; profile strength and preview should update.
- [ ] Try a blank name; the form should ask for a name.
- [ ] Resize the browser to mobile width; navigation and cards should adapt.
- [ ] In Supabase mode, confirm changes appear in the relevant tables.

## Troubleshooting

**`npm` is not recognized:** install Node.js, close and reopen VS Code, then check `node -v` and `npm -v`.

**`EADDRINUSE: address already in use :::5000`:** another server already uses port 5000. Stop the other terminal with Ctrl+C or set another port in `backend/.env`, such as `PORT=5001`, then open that port in your browser.

**Page opens but API fails:** ensure the backend terminal is still running and visit `/api/health`.

**Supabase mode does not start:** verify the Project URL and server-side service-role key in `backend/.env`, check that `database/schema.sql` ran successfully, and restart Node.

**Database relation does not exist:** open Supabase SQL Editor and run `database/schema.sql`.

**Duplicate application message:** the database has a unique constraint on `(student_id, job_id)`; one student can apply once per role.

**Profile does not persist after restart:** the app is likely in demo mode. Confirm the terminal reports Supabase mode and verify environment variable names.

## GitHub upload

From the root project directory:

```bash
git init
git status
git add .
git status
git commit -m "Build Student Placement and Career Portal"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your own GitHub repository. Check `git status` before committing and ensure `.env` and `node_modules/` are not staged. `.gitignore` does not remove a secret that was already committed; rotate exposed credentials immediately.

## Future improvements

- Supabase Auth with verified email and role-based access
- Dedicated recruiter and placement-cell dashboards
- Per-student application privacy and row-level authorization
- Resume upload and interview scheduling
- Placement analytics and CSV reports
- Automated integration tests and deployment configuration

## Academic project scope

This is a functional presentation-ready MVP. Demo mode is designed for a quick local presentation; Supabase mode demonstrates real PostgreSQL persistence after credentials and schema are configured. The project has not been connected to your personal Supabase instance automatically.
