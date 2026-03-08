# Coursebook

Coursebook is a focused, role-based learning tracker built for one small team: one `admin` (course planner) and one `user` (course executor).

It combines a strict day-by-day course plan with a practical troubleshooting knowledge base called the Helpbook. The app is designed around accountability: courses are scheduled upfront, daily goals are checked off, deadlines are respected, and completed programs are archived with a final GitHub project submission.

## 1. In-Depth Introduction

### What Coursebook Is

Coursebook is a lightweight web app for structured, deadline-driven self-learning. Instead of creating loose to-do lists, the app centers on a formal course lifecycle:

1. Define a course with a fixed start date and duration.
2. Build a content library (links + playlists).
3. Assign daily goals for every day in the course.
4. Track completion day by day.
5. Archive the course after final project submission.

This makes Coursebook suitable for focused learning sprints where consistency matters more than feature bloat.

### Why It Exists

Most learning tools fail in one of two ways:

- They are too flexible, which often leads to delayed decisions and weak execution.
- They are too generic, which means no domain rules for actual course completion.

Coursebook takes the opposite approach. It is opinionated and intentionally constrained:

- Two roles only.
- Fixed course durations.
- Daily commitments.
- Explicit deadlines.
- Irreversible milestones.

That trade-off is deliberate: less flexibility, more completion.

### Design Philosophy

The app favors:

- Operational clarity over complex dashboards.
- Simple flows over multi-layered configuration.
- Visible progress over hidden metadata.
- Predictable constraints over permissive editing.

The UI style reflects this. It uses bold, pixel-inspired typography and high-contrast card layouts to create a deliberate "locked-in" workflow feel.

### Target Use Case

Coursebook is best for:

- A mentor/learner pair.
- A strict self-learning routine.
- A project-based curriculum where final output is a repository.

It is not currently designed for:

- Multi-tenant organizations.
- Teams with many users.
- AI tutoring workflows.
- Public course marketplaces.

### Product Scope (Current)

Included:

- Role-based login (`admin` / `user`).
- Course creation with day-wise planning.
- User checklist completion.
- Course archive workflow.
- Shared helpbook with tags and steps.

Partially implemented / placeholder:

- Admin stats page exists as a route and view shell, but no metrics logic yet.

## 2. How The App Works + Roles, Features, and Tech Stack

### Role Model

The application uses two roles:

- `admin` (Bread-winner in UI): creates and governs course structure.
- `user` (Bread-eater in UI): executes the plan and archives on completion.

Authentication is currently mocked in frontend local storage via `src/lib/fakeAuth.ts`:

- `admin` password: `admin123`
- `user` password: `user123`

This is a development-friendly local auth mechanism and not production-grade identity.

### Route and Access Control

Routing is centralized in `src/App.tsx`.

- Public route: `/` (login)
- Admin routes: `/admin`, `/admin/create-course`, `/admin/courses`, `/admin/courses/:id`, `/admin/helpbook`, `/admin/stats`
- User routes: `/user`, `/user/courses`, `/user/courses/:id`, `/user/helpbook`

A `RequireRole` wrapper checks the role from local storage and redirects if unauthorized.

### Feature Breakdown

#### A. Login Flow

File: `src/pages/LoginPage.tsx`

- Landing hero screen first.
- Role toggle between admin and user.
- Password verification through fake auth.
- Successful login redirects to role dashboard.

#### B. Admin Dashboard

File: `src/pages/AdminHome.tsx`

Admin can:

- Create a new course.
- Open all courses.
- Manage the helpbook.

#### C. Create Course (Core Planner)

File: `src/pages/CreateCourse.tsx`

Two-step creation:

1. Course setup

- Title, description, start date, number of days.
- Build content library using URLs.
- Detect playlist URLs and collect total video count.

2. Daily goals assignment

- Drag content into each day.
- Max 2 URLs per day.
- Playlist allocations are tracked and must be fully distributed.
- Every day must have at least one assigned item.

Save behavior:

- On valid plan, inserts one row in Supabase `courses` table with:
  - metadata (`title`, `description`, `start_date`, `num_days`, `status`)
  - `content_library` JSON
  - `day_plan` JSON

#### D. Courses List

File: `src/pages/CoursesList.tsx`

- Loads all courses from Supabase.
- Admin sees all statuses.
- User can toggle active vs archived view using query parameter.

#### E. Course Detail + Daily Execution

File: `src/pages/CourseDetail.tsx`

Displays:

- Course summary cards.
- Content library.
- Day-by-day assigned items.
- Playlist ranges ("vid no. X to Y").

User-only interactions:

- Mark a day complete (persisted in `course_day_checks`).
- Days become locked if checked or if past deadline.
- When all days are complete, user submits GitHub project URL and archives course.

Archive action:

- Updates course status to `archived`.
- Stores `github_project_url`.

#### F. Helpbook

File: `src/pages/Helpbook.tsx`

A collaborative troubleshooting library:

- Create entries with title, one tag, and ordered steps.
- Tag filtering and searchable tag dropdown.
- Edit entries.
- Delete entries (admin only).

This makes recurring blockers reusable rather than repeatedly solved from scratch.

#### G. Stats Page

File: `src/pages/Stats.tsx`

- Route and scaffold are present.
- No metrics logic currently rendered.

### Data Model (Inferred from Code)

The app interacts with three tables.

1. `courses`

- `id` (uuid / primary key)
- `title` (text)
- `description` (text, nullable)
- `start_date` (date)
- `num_days` (int)
- `status` (`active` | `archived`)
- `content_library` (jsonb)
- `day_plan` (jsonb)
- `github_project_url` (text, nullable)
- `created_at` (timestamp)

2. `course_day_checks`

- `id` (uuid / primary key)
- `course_id` (foreign key -> courses.id)
- `day_index` (int)
- `created_at` (timestamp)

3. `helpbook_entries`

- `id` (uuid / primary key)
- `title` (text)
- `tags` (text[])
- `steps` (text[])
- `created_at` (timestamp)

### Tech Stack

Frontend:

- React 19
- React Router DOM 7
- TypeScript 5
- Vite 7

Backend/Data:

- Supabase (Postgres + REST interface)
- `@supabase/supabase-js`

Styling:

- Single global stylesheet (`src/styles/global.css`)
- Custom CSS variables, card system, retro/pixel typographic treatment

Build tooling:

- Node.js + npm
- Vite dev/build pipeline

### Architectural Notes

- Entire app is currently frontend-first.
- Auth is local and mocked; Supabase is used for persistent app data.
- Supabase URL and anon key are currently hardcoded in `src/lib/supabase.ts`.
- No dedicated backend service layer yet.

## 3. How To Set Up The App On Desktop

### Prerequisites

Install:

- Node.js 20+ (recommended current LTS)
- npm (bundled with Node)
- A Supabase project

### Step 1: Get the Source

If you already have the folder, use it directly. Otherwise clone:

```bash
git clone <your-repo-url>
cd coursebook
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Supabase

Current code reads credentials from `src/lib/supabase.ts`.

For safer setup, move this to environment variables:

1. Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

2. Update `src/lib/supabase.ts` to use `import.meta.env` values.

If you keep the current hardcoded file for local testing, ensure the referenced Supabase project is available and policies allow required operations.

### Step 4: Create Required Database Tables (Supabase)

Run SQL in Supabase SQL Editor (adjust types/indexes/policies to your standards):

```sql
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date date not null,
  num_days integer not null check (num_days > 0),
  status text not null check (status in ('active', 'archived')) default 'active',
  content_library jsonb not null default '[]'::jsonb,
  day_plan jsonb not null default '[]'::jsonb,
  github_project_url text,
  created_at timestamptz not null default now()
);

create table if not exists course_day_checks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  day_index integer not null check (day_index > 0),
  created_at timestamptz not null default now(),
  unique (course_id, day_index)
);

create table if not exists helpbook_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tags text[] not null default '{}',
  steps text[] not null default '{}',
  created_at timestamptz not null default now()
);
```

### Step 5: Add Development RLS Policies (If Needed)

If Row-Level Security is enabled, you must create policies that allow the app's anon client to select/insert/update/delete as needed.

Minimal dev-only example:

```sql
alter table courses enable row level security;
alter table course_day_checks enable row level security;
alter table helpbook_entries enable row level security;

create policy "dev all courses" on courses for all using (true) with check (true);
create policy "dev all checks" on course_day_checks for all using (true) with check (true);
create policy "dev all helpbook" on helpbook_entries for all using (true) with check (true);
```

Use stricter, role-aware policies for production.

### Step 6: Start the App

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`).

### Step 7: Build for Production

```bash
npm run build
npm run preview
```

### Step 8: Change the Windows App Icon

If you want to change the packaged Electron app icon on Windows:

1. Create a large square PNG source image, preferably `512x512` or `1024x1024`. use the site [iconConverter](https://www.icoconverter.com/)
2. Convert that PNG to .ico and add it to `build/icon.ico`.
3. While creating the `.ico`, ensure it includes these sizes:
   - `16x16`
   - `32x32`
   - `48x48`
   - `64x64`
   - `128x128`
   - `256x256`
4. Make sure `256x256` is included. Electron Builder will reject the icon if that size is missing.
5. Close all running `Coursebook.exe` windows before rebuilding.
6. Delete the old unpacked desktop build output:

```bash
Remove-Item -Recurse -Force .\dist\win-unpacked
```

7. Rebuild the desktop app:

```bash
npm run build:desktop
```

Notes:

- Use `.ico` for the Windows desktop app icon, not `.jpg`.
- If rebuild fails with `EBUSY` for `dist\win-unpacked`, the old app or that folder is still open somewhere.
- The browser tab icon is separate from the desktop app icon.

### Default Local Login Credentials

- Admin: role `admin`, password `admin123`
- User: role `user`, password `user123`

### Recommended Setup Improvements Before Production

- Replace fake auth with Supabase Auth.
- Move hardcoded credentials to `.env`.
- Add stricter RLS policies.
- Add schema migrations in version control.

## 4. Future Plans For This App

### Near-Term (High Impact)

1. Real authentication and authorization

- Replace local storage fake auth with Supabase Auth.
- Enforce role checks server-side.

2. Complete the Stats module

- Per-course completion %
- On-time vs late completion metrics
- Weekly streak visibility

3. Strengthen workflow consistency

- Align rules text and implementation around check-off reversibility.
- Add server-side validation for assignment constraints.

4. Improve developer operations

- Add `.env.example`
- Add migration scripts for schema and policies
- Add seed data script for demo mode

### Mid-Term

1. Better learning analytics

- Daily velocity
- Playlist completion burn-down
- Course-level risk signals (missed deadlines, unassigned days)

2. Better Helpbook ergonomics

- Multi-tag per entry
- Rich text or markdown steps
- Duplicate detection for repeated solutions

3. Better course management

- Course templates
- Draft mode before final lock
- Cloning archived courses as new plans

### Long-Term

1. Multi-user expansion

- More than one user per admin
- Team views and permissions

2. External integrations

- GitHub API validation for final project URL
- Calendar reminders for deadlines

3. Quality and reliability

- Unit + integration + E2E tests
- Error boundaries and telemetry
- Performance budget and bundle monitoring

## Project Structure (Current)

```text
src/
  components/
    LogoutButton.tsx
    PageHeader.tsx
    TopNav.tsx
  lib/
    fakeAuth.ts
    supabase.ts
    types.ts
  pages/
    AdminHome.tsx
    CourseDetail.tsx
    CoursesList.tsx
    CreateCourse.tsx
    Helpbook.tsx
    LoginPage.tsx
    NotFound.tsx
    Stats.tsx
    UserHome.tsx
  styles/
    global.css
  App.tsx
  main.tsx
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build locally

## Known Limitations

- Authentication is frontend-only and not secure for production.
- Supabase credentials are currently committed in code (`src/lib/supabase.ts`).
- Stats page is currently a scaffold.
- Business rules are partly UI-enforced; server-side validation is limited.

## License

No license file is currently included in this repository. Add one if you plan to distribute or open-source this project.
