# SchoolOS Mobile Product Standard

SchoolOS mobile support is part of the core product definition.

## Required widths

- 360px
- 390px
- 768px
- 1024px
- 1440px

## Mobile acceptance requirements

Every page must:

- Render without accidental horizontal overflow
- Support touch interaction
- Use interactive targets of at least 44px
- Keep critical actions visible
- Use mobile-friendly forms
- Handle virtual keyboard behavior
- Provide loading, empty, and error states
- Use cards or prioritized fields instead of compressed tables
- Support browser back behavior
- Preserve unfinished form data where practical

## Role-specific navigation

### Teacher

- Today
- Attendance
- Classes
- Students
- More

### Parent

- Home
- Children
- Fees
- Messages
- More

### Student

- Home
- Timetable
- Assignments
- Results
- More

### Operations

- Tasks
- Approvals
- Receive
- Inventory
- More

## Android baseline

The Android application will use Capacitor.

Required early validation:

- App launches correctly
- Navigation works
- Authentication persists
- Back button behaves correctly
- File picker works
- Camera access works
- Push notification registration works
- Safe-area insets are respected
- Forms remain usable with the keyboard open