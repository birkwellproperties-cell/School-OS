# SchoolOS Module Map

**Product:** SchoolOS Enterprise  
**Company:** Tavaro Group LLC  
**Version:** 1.0  
**Status:** Governing module architecture

---

# 1. Purpose

This document defines the SchoolOS business modules, their responsibilities,
dependencies, platform services, mobile experiences, and data ownership.

The module map prevents:

- overlapping ownership
- duplicated business logic
- unclear service boundaries
- direct cross-module database access
- inconsistent mobile experiences
- repeated platform implementations

Each module must identify:

- business purpose
- owned records
- consumed platform services
- upstream dependencies
- downstream dependencies
- permissions
- workflows
- notifications
- reports
- mobile experience

---

# 2. Module Layers

SchoolOS is divided into four layers.

```text
Presentation Layer
├── Executive Command Center
├── Staff Workspaces
├── Parent Portal
├── Student Portal
└── Mobile Workspaces

Business Module Layer
├── Admissions
├── Students and Guardians
├── Academics
├── Attendance
├── Finance
├── Procurement
├── Inventory and Assets
├── Staff and HR
├── Communications
├── Reports
└── Future School Operations

TEP Platform Layer
├── Identity
├── Tenancy
├── Authorization
├── Workflow
├── Tasks
├── Notifications
├── Audit
├── Documents
├── Reporting
├── Search
├── Diagnostics
└── Mobile Runtime

Infrastructure Layer
├── Supabase Auth
├── PostgreSQL
├── Supabase Storage
├── Supabase Realtime
├── Edge Functions
├── Vercel
├── Capacitor
├── Firebase
├── Resend
├── Twilio
└── Payment Providers
```

---

# 3. Command Center

## Purpose

Provides executive visibility across school operations.

## Owns

The Command Center does not own primary business records.

It consumes read models and aggregates from:

```text
Admissions
Students
Attendance
Finance
Procurement
Inventory
Staff
Notifications
Workflows
```

## Core metrics

```text
Enrollment
Applications
Attendance
Fee collection
Outstanding balances
Open approvals
Purchase orders
Low stock
Staff attendance
Operational risk
```

## Consumes TEP services

```text
Reporting
Search
Notifications
Authorization
Diagnostics
Audit
```

## Mobile behavior

Mobile Command Center should show:

- highest-priority KPIs
- urgent approvals
- critical alerts
- recent operational activity
- role-specific quick actions

It should not duplicate the full desktop dashboard.

---

# 4. Admissions Module

## Purpose

Manages the student intake lifecycle from inquiry through enrollment.

## Owns

```text
admission_inquiries
student_applications
application_guardians
application_documents
application_reviews
application_interviews
application_assessments
application_decisions
admission_offers
enrollment_checklists
```

## Depends on

```text
School Configuration
Finance
Students and Guardians
Documents
Workflow
Notifications
Audit
```

## Produces

```text
Approved applicants
Admission offers
Registration requirements
Enrollment conversion requests
Guardian invitations
Registration charges
```

## Consumes TEP services

```text
Authorization
Workflow
Tasks
Notifications
Documents
Audit
Reporting
Search
```

## Key permissions

```text
applications.view
applications.create
applications.edit
applications.review
applications.schedule_interview
applications.record_assessment
applications.approve
applications.reject
applications.issue_offer
applications.enroll
```

## Mobile workspace

Admissions mobile should support:

- application review
- document verification
- interview notes
- assessment results
- approval actions
- applicant search
- status updates

High-risk decisions should require confirmation and active connectivity.

---

# 5. Students and Guardians Module

## Purpose

Manages permanent student identities, enrollment history, households, guardians,
emergency contacts, pickup rights, student documents, and critical alerts.

## Owns

```text
students
student_enrollments
student_status_history
guardians
households
household_members
student_guardians
student_emergency_contacts
student_pickup_authorizations
student_documents
student_medical_alerts
```

## Depends on

```text
Admissions
School Configuration
Academics
Attendance
Finance
Documents
Notifications
Audit
```

## Produces

```text
Active student records
Enrollment history
Guardian relationships
Portal access relationships
Student lifecycle events
```

## Consumes TEP services

```text
Authorization
Documents
Audit
Notifications
Search
Reporting
Workflow
```

## Key permissions

```text
students.view
students.create
students.edit
students.archive
students.change_status
students.manage_guardians
students.manage_documents
students.view_medical_alerts
students.manage_pickup_authorizations
```

## Mobile workspace

Mobile student records should emphasize:

- identity
- current class
- guardian contacts
- emergency alerts
- attendance summary
- fee balance summary
- quick incident notes
- document capture

Sensitive fields should remain permission-restricted.

---

# 6. School Configuration Module

## Purpose

Defines the academic and operational structure referenced by all school modules.

## Owns

```text
academic_years
terms
departments
grade_levels
class_sections
```

Future ownership:

```text
subjects
programmes
curricula
rooms
school_calendars
```

## Depends on

```text
Tenancy
Authorization
Audit
```

## Produces

```text
Academic context
Class structure
Department structure
Campus structure
Current-term context
```

## Consumes TEP services

```text
Authorization
Audit
Workflow
Reporting
```

## Key permissions

```text
academic_configuration.view
academic_configuration.manage
academic_years.close
terms.manage
departments.manage
grade_levels.manage
class_sections.manage
```

## Mobile workspace

Configuration is primarily desktop and tablet.

Mobile support should allow:

- read-only reference
- urgent status changes
- limited calendar adjustments

Complex setup should remain desktop-optimized.

---

# 7. Academics Module

## Purpose

Manages subjects, curricula, teacher assignments, timetables, lesson plans,
assessments, gradebooks, report cards, and transcripts.

## Owns

Planned records:

```text
subjects
curricula
curriculum_subjects
class_subjects
teaching_assignments
timetables
timetable_periods
lesson_plans
assignments
assessment_definitions
assessment_results
gradebooks
grade_entries
grade_change_history
report_cards
transcripts
```

## Depends on

```text
Students
Staff
School Configuration
Attendance
Documents
Notifications
Audit
```

## Produces

```text
Teaching schedules
Academic results
Progress reports
Report cards
Transcripts
Academic risk signals
```

## Consumes TEP services

```text
Authorization
Workflow
Tasks
Notifications
Documents
Audit
Reporting
Search
```

## Key permissions

```text
academics.view
subjects.manage
timetables.manage
lesson_plans.manage
grades.enter
grades.review
grades.publish
grades.correct
report_cards.publish
transcripts.issue
```

## Mobile workspace

Teacher mobile should support:

- today’s timetable
- class roster
- quick grade entry
- assignment creation
- lesson notes
- report comments

Large-gradebook administration remains desktop-first.

---

# 8. Attendance Module

## Purpose

Manages student and future staff attendance workflows.

## Owns

Planned records:

```text
attendance_sessions
attendance_records
attendance_notes
attendance_corrections
attendance_notifications
attendance_lock_history
```

## Depends on

```text
Students
School Configuration
Academics
Notifications
Audit
```

## Produces

```text
Daily attendance registers
Absence alerts
Late-arrival records
Attendance summaries
Risk signals
```

## Consumes TEP services

```text
Authorization
Workflow
Notifications
Audit
Reporting
Mobile Runtime
```

## Key permissions

```text
attendance.view
attendance.record
attendance.submit
attendance.correct
attendance.unlock
attendance.report
```

## Mobile workspace

Attendance is a mobile-critical workflow.

Mobile attendance should provide:

- class roster
- fast present/absent marking
- bulk actions
- late and excused reasons
- offline-safe draft where appropriate
- submission confirmation
- guardian alert status

---

# 9. Finance Module

## Purpose

Manages student billing, payments, receipts, scholarships, discounts, budgets,
expenses, supplier liabilities, and financial reporting.

## Owns

Planned records:

```text
chart_of_accounts
fiscal_periods
fee_categories
fee_structures
fee_structure_items
student_invoices
student_invoice_items
student_payments
payment_allocations
receipts
credit_notes
refunds
discounts
scholarships
student_scholarships
budgets
budget_lines
expenses
supplier_invoices
supplier_payments
general_ledger_entries
bank_accounts
bank_transactions
reconciliations
```

## Depends on

```text
Students
Admissions
Procurement
Staff and HR
School Configuration
Audit
Workflow
Notifications
```

## Produces

```text
Invoices
Balances
Receipts
Budget availability
Payment status
Financial statements
Collection forecasts
```

## Consumes TEP services

```text
Authorization
Workflow
Tasks
Notifications
Documents
Audit
Reporting
Integrations
```

## Key permissions

```text
finance.view
fees.manage
invoices.create
invoices.issue
payments.record
payments.reverse
receipts.issue
discounts.approve
scholarships.manage
budgets.manage
expenses.approve
ledger.view
financial_reports.export
```

## Mobile workspace

Mobile finance should support:

- payment lookup
- receipt confirmation
- balance review
- approval tasks
- collection summary
- parent payment workflows

Ledger maintenance and reconciliation remain desktop-first.

---

# 10. Procurement Module

## Purpose

Manages sourcing from purchase request through supplier payment authorization.

## Owns

Planned records:

```text
suppliers
supplier_contacts
supplier_categories
purchase_requests
purchase_request_items
procurement_approvals
request_for_quotations
rfq_suppliers
supplier_quotations
supplier_quotation_items
quotation_evaluations
supplier_awards
purchase_orders
purchase_order_items
goods_received_notes
goods_received_items
inspection_records
procurement_exceptions
supplier_performance_records
```

## Depends on

```text
Finance
Inventory
Assets
Departments
Workflow
Notifications
Documents
Audit
```

## Produces

```text
Approved requests
Supplier awards
Purchase orders
Goods receipts
Invoice-match evidence
Supplier performance metrics
```

## Consumes TEP services

```text
Authorization
Workflow
Tasks
Notifications
Documents
Audit
Reporting
Search
Mobile Runtime
```

## Key permissions

```text
procurement.view
procurement.request
procurement.review
procurement.approve
rfq.create
quotations.record
quotations.evaluate
supplier_awards.approve
purchase_orders.create
purchase_orders.approve
goods_receipts.record
inspections.record
procurement.close
```

## Mobile workspace

Procurement mobile should support:

- request submission
- approval queue
- quotation review summary
- goods receipt
- inspection photos
- delivery discrepancies
- supplier lookup

Sensitive awards and approvals require active connectivity.

---

# 11. Inventory and Assets Module

## Purpose

Manages consumables, stock locations, stock movements, fixed assets,
maintenance, transfers, counts, depreciation, and disposal.

## Owns

Planned records:

```text
inventory_categories
inventory_items
inventory_locations
inventory_balances
inventory_transactions
stock_counts
stock_count_items
inventory_adjustments
inventory_transfers
assets
asset_categories
asset_assignments
asset_transfers
asset_maintenance
work_orders
asset_depreciation
asset_disposals
warranties
```

## Depends on

```text
Procurement
Finance
Staff
Departments
Documents
Audit
Workflow
```

## Produces

```text
Stock availability
Low-stock alerts
Asset register
Maintenance schedules
Inventory valuation
Asset lifecycle history
```

## Consumes TEP services

```text
Authorization
Workflow
Tasks
Notifications
Documents
Audit
Reporting
Mobile Runtime
Search
```

## Key permissions

```text
inventory.view
inventory.receive
inventory.issue
inventory.transfer
inventory.adjust
inventory.count
assets.view
assets.create
assets.assign
assets.transfer
assets.maintain
assets.dispose
```

## Mobile workspace

Inventory mobile should support:

- barcode and QR scanning
- goods receipt
- stock issue
- stock transfer
- stock count
- asset assignment
- maintenance photos
- work-order completion

This is a mobile-critical operations workspace.

---

# 12. Staff and HR Module

## Purpose

Manages employment identity, assignments, leave, attendance, payroll,
qualifications, performance, and professional development.

## Owns

```text
staff
positions
staff_assignments
staff_employment_history
staff_documents
staff_qualifications
```

Future records:

```text
leave_types
leave_balances
leave_requests
leave_approvals
staff_attendance_records
timesheets
payroll_periods
payroll_runs
payroll_items
salary_components
performance_reviews
training_records
```

## Depends on

```text
School Configuration
Finance
Documents
Workflow
Notifications
Audit
```

## Produces

```text
Active workforce
Assignment history
Leave status
Payroll obligations
Qualification alerts
Staffing metrics
```

## Consumes TEP services

```text
Authorization
Workflow
Tasks
Notifications
Documents
Audit
Reporting
Search
```

## Key permissions

```text
staff.view
staff.manage
staff.assign
staff.documents.manage
staff.qualifications.verify
leave.request
leave.approve
payroll.view
payroll.manage
performance.manage
```

## Mobile workspace

Staff mobile should support:

- personal profile
- leave requests
- attendance
- assigned tasks
- documents
- announcements
- payslip access where permitted

HR administration remains desktop-first.

---

# 13. Communications Module

## Purpose

Manages announcements, direct messages, broadcasts, templates, communication
preferences, consent, and delivery reporting.

## Owns

Planned records:

```text
announcements
announcement_audiences
messages
message_threads
message_participants
broadcasts
broadcast_recipients
communication_templates
communication_consents
```

## Depends on

```text
Students
Guardians
Staff
Notifications
Documents
Audit
```

## Produces

```text
Announcements
Messages
Broadcast requests
Communication history
Audience engagement
```

## Consumes TEP services

```text
Notifications
Authorization
Documents
Audit
Reporting
Search
Integrations
```

## Key permissions

```text
communications.view
announcements.create
announcements.publish
messages.send
broadcasts.create
broadcasts.approve
communication_templates.manage
```

## Mobile workspace

Mobile communication should support:

- announcements
- secure messaging
- push notifications
- read receipts
- attachment access
- role-specific inboxes

---

# 14. Reports Module

## Purpose

Provides school-specific report definitions and analytical read models.

## Owns

The SchoolOS Reports module owns:

```text
School-specific report definitions
Education-specific filters
School dashboards
Academic read models
Finance read models
Operational read models
```

TEP owns the generic report execution and export framework.

## Depends on

All business modules.

## Produces

```text
Operational reports
Academic reports
Financial reports
Procurement reports
Inventory reports
Executive dashboards
Scheduled reports
```

## Consumes TEP services

```text
Reporting
Authorization
Documents
Notifications
Audit
Search
```

## Mobile workspace

Mobile reports should prioritize:

- summaries
- alerts
- saved reports
- PDF viewing
- scheduled report access

Complex report building remains desktop-first.

---

# 15. Settings Module

## Purpose

Provides product and tenant administration.

## Owns

SchoolOS-specific configuration screens for:

```text
School profile
Campuses
Academic calendar
Role management
Communication settings
Payment settings
Integrations
Subscription
Diagnostics
Backup and recovery
Mobile application settings
```

Primary data remains owned by the relevant TEP or business module.

## Consumes TEP services

```text
Identity
Tenancy
Authorization
Diagnostics
Backup and Recovery
Integrations
Audit
```

## Key permissions

```text
settings.view
settings.manage
users.manage
permissions.manage
integrations.manage
billing.manage
diagnostics.view
backup.create
recovery.manage
```

## Mobile workspace

Settings mobile should provide:

- personal preferences
- notification preferences
- password and security controls
- tenant switching
- limited administrative settings

Complex tenant administration remains desktop-first.

---

# 16. Parent Portal

## Purpose

Provides guardians with relationship-scoped access.

## Access source

Parent access is derived from:

```text
Verified profile
Active guardian identity
Active student_guardians relationship
Relationship-specific permissions
School portal status
```

## Primary capabilities

```text
Child overview
Attendance
Grades and report cards
Invoices and balances
Payments and receipts
Announcements
Messages
Consent forms
Documents
Pickup permissions
```

## Consumes TEP services

```text
Identity
Authorization
Notifications
Documents
Search
Mobile Runtime
```

## Mobile priority

The Parent Portal is mobile-first.

---

# 17. Teacher Workspace

## Purpose

Provides teachers with daily operational tools.

## Primary capabilities

```text
Today’s timetable
Class rosters
Attendance
Lesson plans
Assignments
Grade entry
Student notes
Messages
Tasks
Announcements
```

## Access source

Teacher access is derived from:

```text
Active staff record
Active teaching assignment
Active school membership
Required permissions
Current academic context
```

## Mobile priority

The Teacher Workspace is mobile-critical.

---

# 18. Student Portal

## Purpose

Provides students with self-service academic and administrative access.

## Primary capabilities

```text
Timetable
Assignments
Results
Attendance
Announcements
Messages
Documents
Fee information where permitted
```

## Access source

Student access is relationship-based and self-scoped.

## Mobile priority

The Student Portal is mobile-first.

---

# 19. Future Operational Modules

Future modules include:

```text
Transport
Health
Discipline and Welfare
Library
Cafeteria
Boarding
Facilities
Security and Visitors
Extracurricular Activities
Alumni
```

Each future module must follow this same ownership template before implementation.

---

# 20. Cross-Module Rules

Business modules must not directly mutate another module’s owned tables without
an approved service boundary.

Examples:

```text
Admissions requests student conversion through StudentService.
Procurement requests stock receipt through InventoryService.
Finance records supplier liability from approved procurement evidence.
Attendance requests guardian alerts through NotificationService.
Academics publishes report cards through DocumentService.
```

Read-only reporting access may use approved views or read models.

---

# 21. Event Dependencies

Modules should publish domain events for important completed actions.

Examples:

```text
school.application.submitted
school.application.approved
school.student.enrolled
school.attendance.register_submitted
school.invoice.issued
school.payment.recorded
school.purchase_order.approved
school.goods_receipt.completed
school.inventory.low_stock_detected
school.asset.maintenance_due
```

Subscribers must not assume event delivery replaces database truth.

---

# 22. Mobile Classification

Each module is classified as:

```text
Mobile-first
Mobile-critical
Mobile-supported
Desktop-first
```

Recommended classification:

```text
Parent Portal                 Mobile-first
Student Portal                Mobile-first
Teacher Workspace             Mobile-critical
Attendance                    Mobile-critical
Inventory and Assets          Mobile-critical
Procurement Receiving         Mobile-critical
Admissions Review             Mobile-supported
Students                      Mobile-supported
Finance Operations            Mobile-supported
Academics Administration      Desktop-first
School Configuration          Desktop-first
Reports Builder               Desktop-first
Tenant Administration         Desktop-first
```

All modules must still render correctly at supported mobile widths.

---

# 23. Module Completion Standard

A module is not complete until it includes:

```text
Database schema
Constraints and indexes
RLS
Permissions
Service boundary
Business rules
Audit events
Workflow integration
Notification integration
Desktop UI
Tablet UI
Mobile UI
Loading states
Empty states
Error states
Tests
Reports
Documentation
Build verification
```

---

# 24. Initial Implementation Priority

```text
1. TEP foundation
2. School configuration
3. Admissions
4. Students and guardians
5. Attendance
6. Finance foundation
7. Procurement
8. Inventory and assets
9. Academics
10. Staff and HR
11. Communications
12. Portals
13. Reports and intelligence
```