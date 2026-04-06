# EduNest ERP — Photo Uploads & Avatar Display

## Current State

- `College.logoUrl` (Text) and `User.photoUrl` (Text) fields exist in Motoko stable storage and store base64 data URLs.
- `uploadCollegeLogo(token, collegeId, logoDataUrl)` and `uploadUserPhoto(token, userId, photoDataUrl)` backend functions are fully implemented.
- `login()` returns `photoUrl` in its response; `AuthContext` stores it in the `AuthUser` object and localStorage.
- SuperAdminDashboard: College logo upload exists as a separate button per row (UploadLogoDialog). Admin photo upload also exists as a separate button per row (UploadUserPhotoDialog). Both are post-creation, not inline in the Add forms.
- AdminDashboard (RoleUsersTab): Photo upload exists per row for Teacher, FeeManager, Principal via UploadUserPhotoDialog. NO photo upload for Students anywhere in AdminStudents.tsx.
- Navbar: Shows user photo avatar (or initials fallback) in the top-right profile button and dropdown — already implemented.
- Sidebar: Shows ONLY initials in the bottom user info area — no photo rendering at all.

## Requested Changes (Diff)

### Add
- Photo upload field in the Add College form (Super Admin) — inline logo upload when creating a college.
- Photo upload field in the Add Admin form (Super Admin) — inline photo upload when creating an admin.
- Photo upload field in Add Student form (Admin) — inline photo upload when adding a student.
- Photo upload field in Add Teacher form (Admin) — inline photo upload when adding a teacher.
- Photo upload field in Add Fee Manager form (Admin) — inline photo upload when adding a fee manager.
- Photo column + upload button in the All Students table (AdminStudents.tsx) — students list was missing photo display entirely.
- User photo avatar in the Sidebar bottom user info section (replaces initials-only circle).

### Modify
- Add College form: add optional logo image field (FileReader → base64), call uploadCollegeLogo after createCollege if logo provided.
- Add Admin form: add optional photo image field, call uploadUserPhoto after createUser if photo provided.
- AdminStudents.tsx AddStudentTab: add optional photo field, call uploadUserPhoto after createUser+addStudentRecord if photo provided.
- AdminDashboard AddUserDialog (Teacher/FeeManager/Principal): add optional photo field, call uploadUserPhoto after createUser if photo provided.
- Sidebar bottom user section: render photo avatar (w-8 h-8 rounded-full object-cover) if user.photoUrl is truthy, else keep initials fallback.
- All Students table: add Photo column showing avatar (w-9 h-9 rounded-full) with photo or initials, plus an Upload Photo button per row.

### Remove
- Nothing removed.

## Implementation Plan

1. **Sidebar avatar**: Update `Sidebar.tsx` bottom user section to render `<img>` if `user.photoUrl` exists, else initials.
2. **Add College form (SuperAdmin)**: Add an optional image file input to AddCollegeDialog. After `createCollege` succeeds, if a file was selected, call `uploadCollegeLogo`.
3. **Add Admin form (SuperAdmin)**: Add an optional image file input to AddAdminDialog. After `createUser` succeeds, if a file was selected, call `uploadUserPhoto`.
4. **Add User form (Admin — Teacher/FeeManager/Principal)**: Add an optional image file input to AddUserDialog. After `createUser` succeeds, if a file was selected, call `uploadUserPhoto`.
5. **Add Student form (Admin)**: Add an optional image file input to AddStudentTab. After createUser+addStudentRecord, if a file was selected, call `uploadUserPhoto`.
6. **Students table**: Add Photo column to AllStudentsTab showing avatar + UploadUserPhotoDialog button per row (same pattern as teacher/staff tabs).
7. All inline photo fields share the same UI pattern: a small clickable area showing preview or a camera icon placeholder, with `accept="image/*"` file input.
