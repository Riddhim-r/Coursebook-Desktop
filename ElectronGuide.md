# Electron Guide

This document records the full Electron migration process for Coursebook, what Electron is, how the local SQLite setup works, how the Supabase data migration was done, how to test the desktop app, what issues were hit, and the exact points to remember going forward.

It is written from the actual work done in this repository, not as a generic Electron tutorial.

## 1. What Electron Is

Electron is a framework that lets a web app run as a desktop app.

Electron bundles:

- Chromium, which renders the UI like a browser
- Node.js, which gives desktop/backend capabilities like file access and database access

In this project, Electron is what turns the existing React app into a Windows desktop app.

### 1.1 What this means in practice

Before Electron:

- The React app ran in a browser
- Data was stored in Supabase over the internet

After Electron:

- The React app runs inside a desktop app window
- Data is stored locally in a SQLite file on the PC
- The app no longer depends on Supabase for runtime data access

### 1.2 The three layers in this project

The desktop version of Coursebook now has three layers:

1. Renderer process
- This is the React frontend
- It is the UI you see on screen
- Files live mostly in `src/`

2. Main process
- This is Electron's backend/runtime process
- It creates the app window and handles OS-level work
- File: [electron/main.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\main.cjs)

3. Preload bridge
- This safely exposes selected desktop functions from Electron to the React app
- File: [electron/preload.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\preload.cjs)

The app also has:

- Database setup: [electron/db.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\db.cjs)
- Desktop IPC handlers: [electron/ipc.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\ipc.cjs)
- Frontend wrapper around Electron APIs: [src/lib/desktopApi.ts](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\lib\desktopApi.ts)

### 1.3 How requests flow now

The runtime data flow is now:

`React page -> desktopApi -> preload bridge -> Electron IPC -> SQLite`

Before, it was:

`React page -> Supabase`

That is the core architectural change.

## 2. Why Electron Was Chosen

The technical decisions made were:

- Windows only
- Electron as app shell
- SQLite as local database
- Manual installs/updates
- Plain SQLite, no extra encryption

### 2.1 Why Electron

Electron was chosen because:

- it is a straightforward way to convert a React app into a Windows desktop app
- it is easier to work with for a web-first codebase
- it lets the app use local files and SQLite

### 2.2 What “app shell” means

App shell means the desktop runtime that wraps the web UI into a desktop application.

In this project:

- Electron is the app shell
- It opens a native window
- It loads the React frontend inside that window
- It provides access to local desktop resources

### 2.3 Why SQLite

SQLite was chosen because:

- it is fully free
- it runs locally
- it stores data in a single file
- no backend or server is required
- it is a good fit for a single-user desktop app

## 3. What Was Changed In This Repository

### 3.1 New Electron entry point

File: [electron/main.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\main.cjs)

This file:

- starts Electron
- creates the app window
- loads `http://localhost:5173` in dev mode
- loads `dist/index.html` in packaged mode
- initializes the local database
- registers IPC handlers

### 3.2 New preload bridge

File: [electron/preload.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\preload.cjs)

This exposes `window.coursebook` to the frontend with methods like:

- `listCourses`
- `getCourse`
- `createCourse`
- `archiveCourse`
- `listChecks`
- `addCheck`
- `listHelpbook`
- `createHelpbook`
- `updateHelpbook`
- `deleteHelpbook`
- `listPrompts`
- `createPrompt`
- `updatePrompt`
- `deletePrompt`

### 3.3 New SQLite setup

File: [electron/db.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\db.cjs)

This file:

- creates/opens the SQLite database
- stores the DB in Electron's user data path
- creates the local tables if they do not exist

Tables created:

- `courses`
- `course_day_checks`
- `helpbook_entries`
- `ai_prompt_entries`

### 3.4 New IPC handlers

File: [electron/ipc.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\electron\ipc.cjs)

This file is the database backend for the desktop app.

It contains:

- course listing and detail loading
- course creation
- course archive handling
- day-check loading and saving
- helpbook CRUD
- AI prompt CRUD

### 3.5 Frontend desktop API wrapper

File: [src/lib/desktopApi.ts](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\lib\desktopApi.ts)

This gives the React app a single way to talk to Electron.

Instead of calling Supabase, pages now call:

- `desktopApi.listCourses()`
- `desktopApi.createCourse(...)`
- `desktopApi.listHelpbook()`
- `desktopApi.listPrompts()`

### 3.6 Type declarations for the bridge

File: [src/types/electron.d.ts](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\types\electron.d.ts)

This tells TypeScript that `window.coursebook` exists in the Electron app.

### 3.7 App pages migrated away from Supabase

These pages were changed to use local Electron APIs instead of Supabase:

- [src/pages/CoursesList.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\pages\CoursesList.tsx)
- [src/pages/CreateCourse.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\pages\CreateCourse.tsx)
- [src/pages/CourseDetail.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\pages\CourseDetail.tsx)
- [src/pages/UserCourseLibrary.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\pages\UserCourseLibrary.tsx)
- [src/pages/Helpbook.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\pages\Helpbook.tsx)
- [src/pages/AiPrompts.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\pages\AiPrompts.tsx)

### 3.8 Supabase runtime removed

The runtime Supabase client file was removed:

- [src/lib/supabase.ts](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\lib\supabase.ts)

The Supabase JS dependency was also removed from the app runtime path.

Important: this removed runtime dependency, not historical data. Existing data remained in Supabase until migrated separately.

## 4. How Electron Was Set Up

### 4.1 Dependencies added

`package.json` was updated to include:

- `electron`
- `electron-builder`
- `better-sqlite3`
- `concurrently`
- `wait-on`

File: [package.json](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\package.json)

### 4.2 Scripts added

Current scripts:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run dev:renderer`
- `npm run dev:electron`
- `npm run dev:desktop`
- `npm run build:desktop`
- `npm run migrate:data`
- `npm run verify:data`

### 4.3 What each important script does

`npm run dev:desktop`

- starts the Vite frontend server
- waits for it to come up
- starts Electron
- opens the desktop app in dev mode

`npm run build:desktop`

- runs the normal frontend production build
- then packages Electron into Windows app output

`npm run migrate:data`

- runs the one-time migration from Supabase into local SQLite

`npm run verify:data`

- reads the local SQLite file and prints counts/titles so the migrated data can be verified

## 5. How Routing Was Made To Work In Desktop Mode

Electron packaged apps load files using `file://`, not `http://localhost:5173`.

That caused two production problems that had to be fixed:

1. Asset URLs were absolute
- they looked like `/assets/...`
- that works in browser dev/server mode
- it breaks in packaged Electron with `file://`

2. BrowserRouter was being used in packaged mode
- BrowserRouter assumes normal web-server routes
- packaged Electron should use hash-based routing

### 5.1 Fixes applied

File: [vite.config.ts](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\vite.config.ts)

- `base: './'` was added so built assets become relative

File: [src/main.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\main.tsx)

- the app now uses:
  - `HashRouter` in Electron
  - `BrowserRouter` in normal browser mode

This was done using:

- `const Router = window.coursebook ? HashRouter : BrowserRouter`

### 5.2 Why this matters

Without those two fixes, packaged Electron opened but showed a blank pink window. That happened during this migration and was traced to the packaged build pathing/routing behavior.

## 6. How Supabase Data Was Migrated To Local SQLite

### 6.1 Important clarification

The desktop conversion itself did not move any data automatically.

The following are separate steps:

1. Convert app runtime from Supabase to SQLite
2. Migrate existing Supabase data into SQLite

Both were done, but in two different phases.

### 6.2 What was migrated

A one-time migration script was added:

- [scripts/migrate-supabase-to-sqlite.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\scripts\migrate-supabase-to-sqlite.cjs)

This script:

- fetches rows from Supabase REST endpoints
- opens the local Electron SQLite DB
- creates schema if needed
- writes the rows into local SQLite
- supports `--reset` to clear local data first

### 6.3 Source connection used

The old Supabase URL and anon key were recovered from the git history of this repository because the runtime file had already been deleted.

Recovered source:

- URL: `https://zwfhkgijtagpzuqvusfu.supabase.co`
- Anon key: recovered from old `src/lib/supabase.ts`

### 6.4 Why the migration script runs with Electron

The migration script was switched to run through Electron:

- `npm run migrate:data` -> `electron scripts/migrate-supabase-to-sqlite.cjs`

Why:

- `better-sqlite3` is a native module
- native modules are sensitive to which runtime they are built for
- running through Electron avoids Node/Electron ABI mismatches during migration

### 6.5 Migration command

The actual command used:

```bash
npm run migrate:data -- --reset
```

### 6.6 Actual migration result in this repository

The migration completed successfully with:

- `courses`: 1
- `course_day_checks`: 0
- `helpbook_entries`: 5
- `ai_prompt_entries`: 0

Verified sample course:

- `Data Science Basics`

### 6.7 Verification script

A separate verification script was added:

- [scripts/verify-local-db.cjs](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\scripts\verify-local-db.cjs)

It confirms:

- local DB path
- row counts
- sample titles

Verification command:

```bash
npm run verify:data
```

## 7. How To Test The Electron App

There are two main ways to test it.

### 7.1 Dev mode

Command:

```bash
npm run dev:desktop
```

What happens:

1. Vite starts
2. React is served on `http://localhost:5173`
3. Electron opens a desktop window
4. That desktop window loads the React app

Important:

- In dev mode, Electron uses the live Vite server
- This is for development and debugging
- The browser URL exists, but it is not the real desktop app

### 7.2 Packaged app

Commands/build outputs:

```bash
npm run build:desktop
```

Expected outputs:

- `dist\win-unpacked\Coursebook.exe`
- `dist\Coursebook Setup 0.0.0.exe`

Use the unpacked app for quick testing:

```powershell
.\dist\win-unpacked\Coursebook.exe
```

Or install the installer:

```powershell
.\dist\Coursebook Setup 0.0.0.exe
```

### 7.3 What to verify

Test these in the Electron window:

1. Login works
- admin: `admin123`
- user: `user123`

2. Courses load
- `Data Science Basics` should appear after migration

3. Helpbook loads
- 5 migrated entries should appear

4. AI Prompts load
- currently 0 entries were migrated

5. Create/edit/delete still works

6. Close and reopen app
- data should still be there

### 7.4 The correct persistence test

Do not use a normal browser tab to test persistence.

The correct test is:

1. Open Electron app
2. Add/edit data in Electron window
3. Close Electron app
4. Open Electron app again
5. Check the same data inside Electron

That tests SQLite persistence correctly.

## 8. Important Points To Remember

### 8.1 Browser tab and Electron window are not the same thing

This came up during testing and is critical.

In dev mode:

- the Electron app loads `http://localhost:5173`
- opening that URL in Chrome/Edge manually opens the frontend only

The browser tab is not the desktop app.

Why:

- the browser does not have Electron attached
- the browser does not have `window.coursebook`
- the browser cannot talk to local SQLite

So:

- Electron window = real app
- browser tab = frontend only, not authoritative

### 8.2 Electron storage and browser storage are separate

Even if both look Chromium-based:

- Electron window has its own storage
- Chrome/Edge has separate storage

So login/session state and local app APIs do not automatically match between them.

### 8.3 `npm run build` can wipe desktop outputs

This also happened during testing.

`npm run build` only creates the web build in `dist`.

That means it can wipe:

- `dist\win-unpacked`
- installer outputs

So after running plain `npm run build`, the desktop app files may be gone.

To recreate them, run:

```bash
npm run build:desktop
```

### 8.4 Keep the app closed while rebuilding

If `dist\win-unpacked\Coursebook.exe` is open, Vite/Electron packaging may fail because files are locked.

This happened when `dist\win-unpacked` was busy/locked during build.

### 8.5 SQLite does not support Supabase-style RLS

This is important to remember.

Supabase/Postgres RLS was not migrated because SQLite does not have that feature.

Instead, for this desktop app:

- role checks live in the app logic
- DB-level constraints still exist
- but Supabase-style row-level security policies do not exist locally

## 9. Location Of App And Database On The PC

### 9.1 Local database location

Current local database file:

`C:\Users\riddh\AppData\Roaming\Coursebook\coursebook.db`

This is where migrated local app data now lives.

### 9.2 Why data is stored there

Electron uses a per-user application data directory.

That is better than storing the DB next to the `.exe` because:

- it is the normal desktop-app pattern
- updates do not wipe user data
- the install folder can change while data remains stable

### 9.3 Packaged app output location

After a successful desktop build, app files are generated under:

`C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\dist`

Important outputs:

- `dist\win-unpacked\Coursebook.exe`
- `dist\Coursebook Setup 0.0.0.exe`

### 9.4 What the `AppData\Roaming\Coursebook` folder contains

During testing, a screenshot was shown from a folder containing:

- `Cache`
- `IndexedDB`
- `Local Storage`
- `Session Storage`
- `Preferences`
- `coursebook`

That folder is the Electron app data folder, not the packaged app folder.

It contains:

- Electron/Chromium runtime storage
- local app browser-like storage
- the SQLite DB file

It does not contain the packaged `.exe`.

## 10. Full Process We Went Through

This section documents the actual sequence followed in this project.

### 10.1 Product decision stage

The desktop strategy was clarified first:

- Windows only
- Electron chosen as app shell
- SQLite chosen as local DB
- manual updates
- plain SQLite, no extra encryption
- local DB data separated from app files

### 10.2 App cleanup and feature work before desktop conversion

Before and during desktop preparation, several application changes were made:

- Rulebook feature removed completely
- dashboard reminder panels removed
- AI Prompts feature added
- Helpbook step editing improved
- custom confirmation dialogs added to replace browser-native confirms

These happened before/during the desktop migration and remain part of the current app behavior.

### 10.3 Electron scaffolding added

These pieces were added:

- Electron main process
- preload bridge
- IPC handlers
- SQLite DB layer
- desktop API wrapper
- Electron TypeScript declarations

### 10.4 Supabase runtime replaced

The app pages were converted from:

- direct Supabase client usage

to:

- local Electron-backed desktop API usage

### 10.5 Desktop packaging setup added

`package.json` was updated with:

- Electron runtime entry
- build scripts
- packaging config for Windows NSIS

### 10.6 Desktop build created successfully

At one point, `npm run build:desktop` succeeded and generated:

- unpacked app
- Windows installer

### 10.7 Data migration performed afterward

The Supabase data was then migrated into:

`C:\Users\riddh\AppData\Roaming\Coursebook\coursebook.db`

### 10.8 Data verified locally

The local DB was read and verified successfully:

- 1 course
- 5 Helpbook entries
- 0 AI prompts

### 10.9 Packaged app blank screen issue discovered

The packaged `.exe` opened but only showed a blank pink window.

That led to diagnosing:

- broken absolute asset paths in production
- wrong router type for packaged Electron

### 10.10 Production build fix applied

The fix was:

- `base: './'` in Vite
- `HashRouter` in Electron packaged mode

After that, the app needed to be rebuilt with:

```bash
npm run build:desktop
```

while keeping the old running `.exe` closed.

## 11. Challenges Faced And How They Were Solved

### 11.1 Packaging failed due to symlink privileges

Issue:

- `electron-builder` failed while extracting `winCodeSign`
- Windows reported symlink privilege errors

Cause:

- Developer Mode / elevated privileges were needed

Resolution:

- build was rerun from admin context
- after that, packaging succeeded

### 11.2 PowerShell execution policy blocked npm script

Issue:

- running `npm run migrate:data` failed due to PowerShell execution policy

Resolution:

- the command was rerun through `cmd /c ...`

### 11.3 Native module mismatch for `better-sqlite3`

Issue:

- `better-sqlite3` was compiled for Electron, but the migration was being run under plain Node

Error type:

- Node module version mismatch / `ERR_DLOPEN_FAILED`

Resolution:

1. rebuild `better-sqlite3` for Node
2. run migration
3. rebuild `better-sqlite3` back for Electron
4. change the migration script to run with Electron afterward

This is why:

- `migrate:data` now runs through `electron`

### 11.4 Packaged app showed a blank pink window

Issue:

- `Coursebook.exe` opened but showed a blank pink window

Cause:

1. Vite built absolute asset paths like `/assets/...`
2. `BrowserRouter` was used in packaged mode

Resolution:

- set `base: './'` in [vite.config.ts](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\vite.config.ts)
- switch to `HashRouter` in Electron via [src/main.tsx](C:\Users\riddh\Desktop\Apps\Coursebook\coursebook\src\main.tsx)

### 11.5 `dist` contents were confusing

Issue:

- `dist` later only showed the web build
- packaged Electron outputs seemed missing

Cause:

- running `npm run build` after `npm run build:desktop` recreated `dist` and removed packaged outputs

Resolution:

- rerun `npm run build:desktop`
- do not assume `dist` always contains both outputs

### 11.6 Build failed because `win-unpacked` was locked

Issue:

- rebuild failed with `EBUSY`/locked `dist\win-unpacked`

Cause:

- old `Coursebook.exe` was still running

Resolution:

- close the app completely
- rebuild again

## 12. FAQ

### 12.1 Did data automatically transfer from Supabase to SQLite during conversion?

No.

The app conversion and data migration are two separate steps.

The app was first converted to use SQLite locally.
Then a separate migration script moved the existing Supabase data into SQLite.

### 12.2 Were RLS policies migrated too?

No.

Supabase RLS is a Postgres feature. SQLite does not have the same mechanism.

For this desktop app:

- runtime security is handled in app logic
- SQLite stores the data
- Supabase/Postgres RLS policies do not exist locally

### 12.3 Why did the browser not show the migrated data?

Because opening `http://localhost:5173` in Chrome/Edge opens only the frontend.

The browser does not have:

- Electron preload bridge
- `window.coursebook`
- local SQLite access

So the browser is not the real app in desktop mode.

### 12.4 Is the desktop app the Electron window or the browser tab?

The desktop app is the Electron window.

The browser tab is only the frontend server during development.

### 12.5 What is the unpacked app?

The unpacked app is the packaged desktop app without installation.

Example path:

`dist\win-unpacked\Coursebook.exe`

It is the easiest way to test the desktop app directly.

### 12.6 What is the installer output?

The installer is the generated Windows setup `.exe`.

Example path:

`dist\Coursebook Setup 0.0.0.exe`

Use this for normal installation.

### 12.7 Can the app icon be changed later?

Yes.

The desktop app icon can be changed later by adding a folder `build` in the root folder of the app and then adding an `.ico` file and rebuilding the app.

### 12.8 Can the code be changed after the app has become a desktop app?

Yes.

The app is still built from source code in this repository.

Normal workflow:

1. change code
2. test with `npm run dev:desktop`
3. rebuild with `npm run build:desktop`

### 12.9 Is the app frozen forever after desktop conversion?

No.

Desktop conversion changes packaging and runtime, not whether the project can be edited.

### 12.10 What is the “app binary”?

App binary means the actual executable program file, such as:

- `Coursebook.exe`

## 13. What To Do Going Forward

### 13.1 For normal development

Use:

```bash
npm run dev:desktop
```

### 13.2 For production packaging

Use:

```bash
npm run build:desktop
```

### 13.3 For rerunning data migration

Use:

```bash
npm run migrate:data -- --reset
```

### 13.4 For checking the local DB

Use:

```bash
npm run verify:data
```

### 13.5 Safe test routine

Use this order:

1. `npm run dev:desktop`
2. log in
3. verify migrated data
4. add/edit one test entry
5. close app
6. reopen app
7. verify persistence

## 14. Additional Important Notes

### 14.1 Current migration status snapshot

At the time of writing:

- local SQLite DB exists
- migration completed successfully
- data verification confirmed:
  - 1 course
  - 5 Helpbook entries
  - 0 AI prompts

### 14.2 Current packaged-app issue state

The blank packaged window was diagnosed and code fixes were applied, but the packaged app must be rebuilt after those fixes while the old running app is closed.

Required next action when testing the packaged `.exe`:

1. close all running `Coursebook.exe` windows
2. run:

```bash
npm run build:desktop
```

3. then run:

```powershell
.\dist\win-unpacked\Coursebook.exe
```

### 14.3 Important mental model

The key mental model for this repository now is:

- React renders the UI
- Electron hosts the app window and OS integration
- SQLite stores the data locally
- Supabase is no longer the runtime backend
- the browser URL in dev mode is not the real desktop app

That model explains almost every behavior seen during the migration and testing process.
