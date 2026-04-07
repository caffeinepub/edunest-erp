# EduNest ERP — UX Simplification & All-Clickable Dashboard Fix

## Current State

The app has 6 role-based dashboards (Super Admin, Admin, Student, Teacher, Fee Manager, Principal). The core backend is fully functional (login, colleges, users, students, departments, courses, fees, notices). However:

- **Many sidebar nav items are stubs** — attendance, assignments, exams, documents, notes click but show nothing (silently fall through to the default dashboard view)
- **Hardcoded department/course lists** in AdminStudents.tsx — don't use the college's actual departments/courses
- **UI is complex and dense** — forms have too many required fields, tables have too many columns, information hierarchy is poor
- **window.confirm() used** for deletions — not accessible
- **Missing footer/tag copy** from spec in some places
- **Notifications bell** is a UI stub — shows nothing
- **Teacher notice** target role is hardcoded to "student"
- **Principal has no actions** — purely read-only with no management capability
- **Student sections** (attendance, assignments, exams, documents) show the default dashboard instead of a proper UI

## Requested Changes (Diff)

### Add
- **Student Dashboard**: Working sections for Attendance (view own attendance summary), Assignments (view assignments posted by teachers), Exams (view exam schedule), Documents (view uploaded notices/announcements as documents)
- **Teacher Dashboard**: Working sections for Attendance (mark student attendance by entering present/absent), Notes (post study notes as notices targeting students), Assignments (post assignment notices), Exams (post exam schedule notices)
- **Principal Dashboard**: Add action to post college-wide notices from their dashboard
- **Admin Students**: Replace hardcoded department/course dropdowns with dynamic fetch from college's actual departments/courses
- **Confirmation dialogs**: Replace all window.confirm() with proper shadcn AlertDialog
- **Empty states**: Every section that can be empty shows a helpful empty state with an icon and message
- **Teacher notice target**: Add a "Target Audience" dropdown (All, Students, Teachers, Fee Managers, Principals)
- **Notifications panel**: Show recent notices from the college as "notifications" in the bell dropdown

### Modify
- **Sidebar nav items**: Every item must render a proper section UI — no silent fallthrough
- **Student Attendance**: Show a simple table/list with date, subject, status (present/absent) — seeded from notices or shown as a placeholder with a clear "No records yet" message
- **Student Assignments**: Show a card list of assignments (from notices with type="assignment"), or a clear empty state
- **Student Exams**: Show a schedule list (from notices with keyword "exam"), or clear empty state
- **Student Documents**: Show list of all notices/announcements as downloadable text documents
- **Teacher sections**: Each stub section renders a proper form or list
- **All forms**: Simplify field labels, add placeholder hints, group related fields, use clear section headings
- **All tables**: Add search/filter where missing, show empty states, limit columns to most important
- **Footer**: Ensure ALL pages show "© 2026. Made by Vikas Sirvi | Powered by Motoko on the Internet Computer"
- **Login page**: Add "Decentralized ERP" badge below the login button

### Remove
- window.confirm() calls — replaced with AlertDialog components
- Silent fallthrough sections (sections that render nothing)

## Implementation Plan

1. **StudentDashboard.tsx** — implement all 5 sections: dashboard (overview), attendance (view table from notices filtered by title containing "Attendance"), assignments (notices filtered by targetRole=student and title containing "Assignment"), exams (notices filtered by title containing "Exam"), documents (all notices shown as document cards with download-as-text option), fees (already works)

2. **TeacherDashboard.tsx** — implement all 5 sections: dashboard (overview), attendance (post attendance notice form — select date, subject, enter roll numbers present), notes (post notice with targetRole=student), assignments (post assignment notice — title, description, due date), exams (post exam schedule notice — subject, date, time, venue), notices (view all notices already works)

3. **PrincipalDashboard.tsx** — add a "Post Notice" action button on the notices section so principal can also create college-wide notices

4. **AdminStudents.tsx** — replace hardcoded DEPARTMENTS/COURSES arrays with `listDepartments(token, collegeId)` and `listCourses(token, collegeId)` fetched on mount; populate the Add Student form dropdowns dynamically

5. **Navbar.tsx** — notifications bell now fetches `listNotices(token, collegeId)` and shows the 5 most recent as notification items with title + time

6. **All dashboards** — replace every `window.confirm()` with an inline AlertDialog

7. **Login.tsx** — add "Decentralized ERP" badge

8. **DashboardLayout.tsx** / footer — ensure full footer copy everywhere

9. **Visual polish** — consistent card styles, loading spinners on every async action, success/error toast messages using sonner, clear empty state illustrations with icons, better button hierarchy (primary/secondary/danger)
