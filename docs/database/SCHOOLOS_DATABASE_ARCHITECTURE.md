# SchoolOS Database Architecture Specification

**Product:** SchoolOS Enterprise  
**Company:** Tavaro Group LLC  
**Version:** 1.0  
**Status:** Governing architecture  
**Database:** PostgreSQL through Supabase

---

# 1. Purpose

This specification defines the production database architecture for SchoolOS Enterprise.

It establishes:

- Tenant ownership
- Naming conventions
- Table boundaries
- Entity relationships
- Lifecycle rules
- Audit requirements
- Row Level Security strategy
- Index strategy
- Migration standards
- Data retention standards
- Module ownership

No production table should be introduced without identifying:

1. The owning module
2. The tenant scope
3. The required permissions
4. The audit behavior
5. The lifecycle state
6. The RLS policy
7. The required indexes
8. The deletion or archival strategy

---

# 2. Database Principles

SchoolOS data architecture will follow these principles:

- PostgreSQL is the source of truth.
- All production tables use UUID primary keys.
- Tenant isolation is enforced through Row Level Security.
- Frontend filtering is never treated as authorization.
- Financial and academic history is preserved.
- Critical records are reversed or superseded rather than deleted.
- Important state transitions are append-only or historically recorded.
- Database constraints enforce valid states.
- Business modules interact through explicit service boundaries.
- Denormalization is permitted only for justified performance or reporting needs.
- All timestamps are stored in UTC using `timestamptz`.
- Money is stored using `numeric`, never floating-point types.

---

## 3. Naming Conventions

## Tables

Use lowercase plural snake case:

```text
schools
student_applications
purchase_order_items
attendance_records

```

### Columns

Use lowercase snake case.

Examples:

```text
school_id
created_at
admission_number
payment_status
```

### Primary Keys

Every production table uses:

```sql
id uuid primary key default gen_random_uuid()
```

### Foreign Keys

Foreign key columns end with `_id`.

Examples:

```text
organization_id
school_id
campus_id
student_id
guardian_id
purchase_order_id
```

### Boolean Fields

Use explicit positive names.

Examples:

```text
is_active
is_primary
is_required
is_boarding
```

Avoid names such as:

```text
active
primary
enabled_flag
```

### Timestamp Fields

Standard timestamp fields include:

```text
created_at
updated_at
archived_at
deleted_at
submitted_at
approved_at
completed_at
```

### User Reference Fields

Use:

```text
created_by
updated_by
approved_by
archived_by
deleted_by
```

### Status Fields

Status values should use constrained text values or PostgreSQL enums where appropriate.

Examples:

```text
status
approval_status
payment_status
enrollment_status
```
```

### Columns

Use lowercase snake case.

Examples:

```text
school_id
created_at
admission_number
payment_status
```

### Primary Keys

Every production table uses:

```sql
id uuid primary key default gen_random_uuid()
```

### Foreign Keys

Foreign key columns end with `_id`.

Examples:

```text
organization_id
school_id
campus_id
student_id
guardian_id
purchase_order_id
```

### Boolean Fields

Use explicit positive names.

Examples:

```text
is_active
is_primary
is_required
is_boarding
```

Avoid names such as:

```text
active
primary
enabled_flag
```

### Timestamp Fields

Standard timestamp fields include:

```text
created_at
updated_at
archived_at
deleted_at
submitted_at
approved_at
completed_at
```

### User Reference Fields

Use:

```text
created_by
updated_by
approved_by
archived_by
deleted_by
```

### Status Fields

Status values should use constrained text values or PostgreSQL enums where appropriate.

Examples:

```text
status
approval_status
payment_status
enrollment_status
```
# 4. Standard Table Structure

Most operational tables will follow a common structure to improve consistency,
auditing, security, and maintainability.

Not every table will contain every column, but tenant-owned business tables
should generally include the following fields.

## Primary Identifier

```sql
id uuid primary key default gen_random_uuid()
```

## Tenant Ownership

```text
organization_id
school_id
campus_id
```

Rules:

- `organization_id` is required for all tenant-owned tables.
- `school_id` is required for school-owned data.
- `campus_id` is optional unless the record belongs to a specific campus.

## Lifecycle

Every operational record should include a lifecycle status.

```text
status
```

Examples:

```text
draft
active
submitted
approved
completed
archived
cancelled
```

Status values should be documented for every business table.

## Audit Fields

```text
created_at
created_by

updated_at
updated_by
```

These fields should exist on nearly all mutable tables.

## Archive Fields

```text
archived_at
archived_by
```

Archived records remain available for reporting but no longer appear in normal
operations.

## Soft Delete Fields

```text
deleted_at
deleted_by
```

Soft deletion should be used only where deletion semantics are required.

Financial records, audit records, and workflow history should normally never be
soft deleted.

## Typical Structure

```sql
id uuid primary key default gen_random_uuid(),

organization_id uuid not null,
school_id uuid not null,
campus_id uuid,

status text not null,

created_at timestamptz not null default now(),
created_by uuid,

updated_at timestamptz not null default now(),
updated_by uuid,

archived_at timestamptz,
archived_by uuid,

deleted_at timestamptz,
deleted_by uuid
```

This structure provides a consistent foundation across the platform while
allowing individual modules to extend it with business-specific fields.

# 5. Tenant Hierarchy

SchoolOS uses a hierarchical tenant model.

```text
Organization
└── School
    └── Campus
```

This hierarchy allows the platform to support:

- Independent schools
- Multi-campus schools
- Education groups
- School networks
- Future district or trust-level administration

## Organization

An organization is the top-level legal or operating entity.

Examples:

```text
Tavaro Education Group
Independent School Operator
Education Trust
School Network
```

An organization may own or operate multiple schools.

Organization-level data may include:

- Organization members
- Subscription accounts
- Shared integrations
- Shared policies
- Shared suppliers
- Cross-school reporting

## School

A school represents a distinct educational institution.

Examples:

```text
Pointer Hill Academy
Tavaro Primary School
Tavaro Secondary School
```

A school belongs to one organization.

School-level data may include:

- Students
- Guardians
- Academic years
- Fee structures
- Suppliers
- Roles
- Staff
- Reports

## Campus

A campus represents a physical or operational location belonging to a school.

Examples:

```text
Main Campus
Primary Campus
Secondary Campus
Boarding Campus
City Campus
```

A school may have one or more campuses.

Campus-level data may include:

- Class sections
- Attendance sessions
- Inventory locations
- Staff assignments
- Transport routes
- Facilities
- Daily operations

## Ownership Rules

Every tenant-owned record must include the identifiers required for its scope.

### Organization-owned records

```text
organization_id
```

### School-owned records

```text
organization_id
school_id
```

### Campus-owned records

```text
organization_id
school_id
campus_id
```

The database must not infer tenant ownership from frontend state.

Tenant identifiers must be stored directly on operational records where required
for security, reporting, and Row Level Security enforcement.

## Scope Rules

- An organization may contain multiple schools.
- A school belongs to exactly one organization.
- A campus belongs to exactly one school.
- A user may belong to multiple organizations, schools, or campuses.
- Access to one school must never automatically grant access to another school.
- Campus restrictions must be enforced where records are campus-specific.
- Cross-campus access must be explicitly granted.
- Cross-school reporting requires organization-level authorization.

## Multi-Campus Design

Some records are school-owned but may optionally reference a campus.

Examples:

```text
students
guardians
staff
suppliers
assets
fee_categories
```

Other records are inherently campus-specific.

Examples:

```text
class_sections
attendance_sessions
inventory_locations
staff_assignments
transport_routes
```

The owning module must document whether `campus_id` is:

```text
required
optional
not applicable
```

## Tenant Isolation Standard

Tenant isolation must be enforced through PostgreSQL Row Level Security.

Frontend filtering is never sufficient.

A user may access a record only when all applicable conditions are satisfied:

```text
Active profile
Active organization membership
Active school membership
Required permission
Campus access where applicable
Entity relationship where applicable
```

This tenant hierarchy is the foundation for all SchoolOS modules.

# 6. Core Identity and Membership Domain

SchoolOS separates authentication identity from application identity and tenant membership.

Supabase Auth stores the authenticated user account.

SchoolOS stores the operational identity, tenant memberships, role assignments,
and access context.

## Profiles

The `profiles` table extends `auth.users`.

Purpose:

- Store application-facing identity
- Store display and contact information
- Store localization preferences
- Store account status
- Provide the profile referenced by operational records

Core fields:

```text
id
full_name
preferred_name
email
phone
avatar_url
locale
timezone
account_status
last_active_at
created_at
updated_at
```

Rules:

- `profiles.id` must match `auth.users.id`.
- One authenticated user has one profile.
- Email should normally mirror the authenticated email.
- Profile deletion must not cascade into historical operational records.
- Suspended or archived profiles must lose application access.

Suggested account statuses:

```text
invited
active
suspended
archived
```

## Organization Memberships

The `organization_memberships` table connects profiles to organizations.

Core fields:

```text
id
organization_id
profile_id
membership_status
invited_at
invited_by
joined_at
suspended_at
archived_at
created_at
```

Unique constraint:

```text
organization_id + profile_id
```

Suggested membership statuses:

```text
invited
active
suspended
archived
```

Rules:

- A user may belong to multiple organizations.
- Membership must be active before organization data is accessible.
- Organization membership alone does not automatically grant school access.
- Invitations must record the inviting user.

## School Memberships

The `school_memberships` table connects profiles to schools.

Core fields:

```text
id
organization_id
school_id
profile_id
membership_status
invited_at
invited_by
joined_at
suspended_at
archived_at
created_at
```

Unique constraint:

```text
school_id + profile_id
```

Rules:

- A user may belong to multiple schools.
- A school membership must belong to the same organization as the school.
- School membership grants tenant presence, not automatic module permissions.
- Suspended and archived memberships must fail RLS access checks.

## Campus Assignments

The `campus_assignments` table defines campus-level access and responsibility.

Core fields:

```text
id
organization_id
school_id
campus_id
profile_id
is_primary
assignment_status
start_date
end_date
created_at
created_by
```

Unique constraint:

```text
campus_id + profile_id
```

Suggested assignment statuses:

```text
active
inactive
ended
```

Rules:

- A campus assignment requires an active school membership.
- A user may have access to multiple campuses.
- One assignment may be marked primary per user and school.
- Expired assignments must not provide active campus access.
- Organization-wide or school-wide users may not require explicit campus assignments.

## Identity Separation

The platform must distinguish between:

```text
Authentication identity
Application profile
Organization membership
School membership
Campus assignment
Role assignment
Permission grant
```

These concepts must not be collapsed into one table or one role field.

For example, a user may be:

```text
One authenticated account
One profile
Member of two schools
Principal in one school
Viewer in another school
Assigned to one campus in each school
```

## Historical References

Operational records should normally reference `profiles.id` for actor fields.

Examples:

```text
created_by
updated_by
approved_by
reviewed_by
assigned_to
```

Historical records must remain readable even if the associated profile becomes
inactive or archived.

Foreign keys from historical records should normally use restrictive or nulling
behavior rather than destructive cascading.

## Membership Access Rule

A user may access tenant-owned data only when the relevant membership is active.

The minimum access chain for school-owned data is:

```text
Authenticated user
→ Active profile
→ Active organization membership
→ Active school membership
→ Required permission
→ Campus access where applicable
```

This identity and membership model provides the foundation for authorization,
audit attribution, multi-school access, and future portal users.

# 7. Authorization Domain

SchoolOS uses Permission-Based Access Control (PBAC).

Roles are collections of permissions.

Permissions are the source of truth.

Users receive permissions through:

- Organization memberships
- School memberships
- Assigned roles
- Explicit permission overrides

A role alone must never be used as the authorization mechanism.

---

## Roles

The `roles` table defines reusable role templates.

Purpose:

- Administrator
- Principal
- Vice Principal
- Teacher
- Finance Officer
- Procurement Officer
- Librarian
- Parent
- Student
- Viewer

Core fields:

```text
id
organization_id
school_id
name
code
description
scope_type
is_system_role
status
created_at
created_by
```

Possible scope types:

```text
platform
organization
school
campus
```

Rules:

- System roles cannot be edited.
- Schools may create custom roles.
- Organizations may define shared roles for all schools.
- Roles themselves do not grant access until permissions are attached.

---

## Permissions

The `permissions` table defines every action available in SchoolOS.

Core fields:

```text
id
code
module
action
description
risk_level
created_at
```

Permission code format:

```text
module.action
```

Examples:

```text
students.view
students.create
students.edit
students.archive

applications.view
applications.review
applications.approve
applications.enroll

attendance.view
attendance.record
attendance.correct

finance.view
fees.manage
payments.record
payments.reverse

procurement.request
procurement.review
procurement.approve
purchase_orders.create
goods_receipts.record

inventory.view
inventory.issue
inventory.adjust

staff.view
staff.manage

reports.view
reports.export

settings.manage
users.manage
permissions.manage
```

Permission codes should remain stable because application code depends on them.

---

## Role Permissions

The `role_permissions` table connects roles to permissions.

Core fields:

```text
id
role_id
permission_id
granted_at
granted_by
```

Unique constraint:

```text
role_id + permission_id
```

Rules:

- A permission should not be duplicated within a role.
- Removing a permission immediately affects all users assigned that role.

---

## Membership Roles

The `membership_roles` table assigns roles to memberships.

Core fields:

```text
id
organization_id
school_id
membership_type
membership_id
role_id
assigned_at
assigned_by
revoked_at
revoked_by
```

Rules:

- A membership may have multiple roles.
- Roles may overlap.
- Effective permissions are the union of assigned role permissions.

---

## User Permission Overrides

The `user_permission_overrides` table grants or denies individual permissions.

Purpose:

Examples:

- Temporarily allow a teacher to approve admissions.
- Deny procurement approval for a suspended manager.
- Grant temporary finance reporting.

Core fields:

```text
id
organization_id
school_id
profile_id
permission_id
effect
reason
expires_at
created_at
created_by
```

Allowed effects:

```text
allow
deny
```

Rules:

- Deny overrides always take precedence.
- Expired overrides are ignored.
- Overrides should generate audit events.

---

## Authorization Resolution Order

SchoolOS evaluates access in this order:

```text
Authenticated user

↓

Profile active

↓

Organization membership active

↓

School membership active

↓

Campus assignment

↓

Assigned roles

↓

Role permissions

↓

Permission overrides

↓

Final authorization decision
```

Every protected operation should evaluate authorization using the same process.

---

## Permission Design Principles

Permissions should represent business actions rather than UI elements.

Good examples:

```text
payments.record
students.archive
attendance.correct
```

Poor examples:

```text
button1
page3
dashboard2
```

Permissions should remain meaningful even if the user interface changes.

---

## Audit Requirements

The following actions must generate audit events:

- Role creation
- Role modification
- Permission assignment
- Permission removal
- User override creation
- User override removal
- Authorization failures where appropriate

Authorization changes are considered security-sensitive events.

# 8. School Configuration Domain

The School Configuration Domain defines the academic structure used by all
operational modules.

These records change infrequently but are referenced by admissions,
academics, attendance, reporting, finance, and student management.

---

## Academic Years

The `academic_years` table defines school academic years.

Examples:

```text
2026 Academic Year
2027 Academic Year
```

Core fields:

```text
id
organization_id
school_id
name
code
start_date
end_date
is_current
status
created_at
created_by
```

Unique constraint:

```text
school_id + code
```

Rules:

- Start date must be before end date.
- Only one academic year may be marked current.
- Closed academic years remain available for reporting.
- Academic years should never be deleted.

---

## Terms

The `terms` table defines semesters, terms, quarters, or trimesters.

Core fields:

```text
id
organization_id
school_id
academic_year_id
name
code
sequence_number
start_date
end_date
status
created_at
created_by
```

Examples:

```text
Term 1
Term 2
Term 3

Semester 1
Semester 2
```

Unique constraints:

```text
academic_year_id + code
academic_year_id + sequence_number
```

Rules:

- Terms belong to one academic year.
- Sequence numbers must be unique within an academic year.
- Terms should not overlap.

---

## Departments

The `departments` table defines academic and operational departments.

Examples:

```text
Administration
Finance
Admissions
Procurement
ICT
Mathematics
Science
Humanities
```

Core fields:

```text
id
organization_id
school_id
campus_id
name
code
department_type
parent_department_id
head_profile_id
status
created_at
created_by
```

Department types:

```text
academic
administration
finance
operations
student_services
procurement
support
```

Rules:

- Departments may be hierarchical.
- Departments may optionally belong to a campus.
- Department heads reference profiles.

---

## Grade Levels

The `grade_levels` table defines educational levels.

Examples:

```text
Pre-K
Kindergarten
Grade 1
Grade 2
Year 7
Form 1
Form 4
```

Core fields:

```text
id
organization_id
school_id
name
code
sequence_number
education_stage
status
created_at
created_by
```

Rules:

- Sequence numbers determine ordering.
- Grade names must be unique within a school.
- Historical grades should remain available.

---

## Class Sections

The `class_sections` table defines teaching groups.

Examples:

```text
Grade 3A
Grade 3B
Form 2 East
Year 9 Blue
```

Core fields:

```text
id
organization_id
school_id
campus_id
academic_year_id
grade_level_id
name
code
capacity
homeroom_teacher_id
status
created_at
created_by
```

Unique constraint:

```text
campus_id + academic_year_id + code
```

Rules:

- Sections belong to one academic year.
- Sections belong to one grade level.
- Capacity should be configurable.
- Homeroom teachers reference staff profiles.

---

## Subjects (Future Domain)

Subjects will later include:

```text
Mathematics
English
Science
History
ICT
Agriculture
Music
Physical Education
```

The detailed subject model will be defined in the Academics Domain.

---

## Configuration Rules

These tables form the academic foundation of SchoolOS.

Operational modules should reference them rather than storing duplicated values.

Examples:

Admissions
→ desired_grade_level_id

Students
→ current_grade_level_id

Attendance
→ class_section_id

Reporting
→ academic_year_id

Finance
→ academic_year_id

Timetables
→ class_section_id

# 9. Admissions Domain

The Admissions Domain manages the complete student intake lifecycle from the
first inquiry through successful enrollment.

SchoolOS treats admissions as a workflow rather than a single record.

The standard lifecycle is:

```text
Inquiry
→ Application Started
→ Application Submitted
→ Document Verification
→ Assessment
→ Interview
→ Review
→ Decision
→ Offer
→ Acceptance
→ Registration
→ Student Created
→ Guardian Activated
→ Enrollment Complete
```

Every transition should be auditable.

---

## Admission Inquiries

The `admission_inquiries` table stores early interest before a formal application exists.

Core fields:

```text
id
organization_id
school_id
campus_id
inquiry_number
prospective_student_name
guardian_name
guardian_email
guardian_phone
desired_grade_level_id
desired_academic_year_id
source
notes
status
created_at
created_by
```

Examples of inquiry sources:

```text
Website
Walk-in
Referral
Telephone
Education Fair
Social Media
Existing Parent
```

Rules:

- An inquiry may or may not become an application.
- Inquiry records should never overwrite application data.
- Every inquiry should receive a unique inquiry number.

---

## Student Applications

The `student_applications` table stores formal admission applications.

Core fields:

```text
id
organization_id
school_id
campus_id
application_number
academic_year_id
desired_grade_level_id

first_name
middle_name
last_name
preferred_name

date_of_birth
gender
nationality

previous_school_name

application_status

submitted_at

created_at
created_by
updated_at
updated_by
```

Unique constraint:

```text
school_id + application_number
```

Application statuses:

```text
draft
submitted
documents_required
under_review
assessment_scheduled
interview_scheduled
approved
waitlisted
rejected
offer_issued
accepted
declined
enrolled
withdrawn
```

Rules:

- Applications should never be physically deleted.
- Status changes should generate audit events.
- Approved applications eventually become students.

---

## Application Guardians

The `application_guardians` table stores guardian information before permanent
guardian records are created.

Core fields:

```text
id
organization_id
school_id
application_id
full_name
relationship_type
email
phone
address
is_primary_contact
is_financially_responsible
is_legal_guardian
created_at
```

Rules:

- Multiple guardians may exist.
- Guardian data is later promoted into permanent guardian records.

---

## Application Documents

The `application_documents` table stores uploaded documents.

Examples:

```text
Birth Certificate
Passport
Transfer Letter
Medical Form
Previous Report Card
Vaccination Record
```

Core fields:

```text
id
organization_id
school_id
application_id
document_type
storage_path
file_name
mime_type
verification_status
verified_at
verified_by
rejection_reason
created_at
created_by
```

Verification statuses:

```text
pending
verified
rejected
missing
```

---

## Application Reviews

The `application_reviews` table records review decisions.

Core fields:

```text
id
organization_id
school_id
application_id
reviewer_id
review_type
recommendation
notes
reviewed_at
created_at
```

---

## Interviews

The `application_interviews` table stores interview scheduling and outcomes.

Core fields:

```text
id
organization_id
school_id
application_id
scheduled_at
location
interviewer_id
interview_status
score
notes
completed_at
created_at
```

---

## Assessments

The `application_assessments` table stores admission testing.

Core fields:

```text
id
organization_id
school_id
application_id
assessment_type
scheduled_at
maximum_score
score
result
assessor_id
notes
completed_at
created_at
```

---

## Admission Decisions

The `application_decisions` table stores formal decisions.

Core fields:

```text
id
organization_id
school_id
application_id
decision
reason
conditions
decided_at
decided_by
created_at
```

Decision values:

```text
approved
waitlisted
rejected
```

---

## Admission Offers

The `admission_offers` table stores issued offers.

Core fields:

```text
id
organization_id
school_id
application_id
offer_number
offered_grade_level_id
offered_campus_id
offer_date
expiry_date
offer_status
accepted_at
declined_at
created_at
created_by
```

Offer statuses:

```text
issued
accepted
declined
expired
withdrawn
```

---

## Enrollment Checklist

The `enrollment_checklists` table tracks registration requirements.

Examples:

```text
Registration Fee Paid
Birth Certificate Verified
Medical Form Received
Guardian Agreement Signed
Uniform Ordered
Student ID Generated
Portal Activated
```

Core fields:

```text
id
organization_id
school_id
application_id
checklist_item
is_required
completion_status
completed_at
completed_by
notes
created_at
```

---

## Admissions Design Principles

The Admissions Domain should:

- Preserve every application
- Preserve every decision
- Preserve every review
- Preserve every interview
- Preserve every assessment
- Generate audit events
- Drive workflow automation
- Convert approved applicants into permanent student records

Admissions data should never be mixed with permanent student records.

# 10. Student and Guardian Domain

The Student and Guardian Domain manages permanent student identities, enrollment history, guardian relationships, household structures, emergency contacts, pickup permissions, documents, and critical medical alerts.

Admissions records remain separate from permanent student records.

An approved applicant becomes a student only through a controlled enrollment conversion process.

---

## Students

The `students` table stores permanent student identities.

Core fields:

```text
id
organization_id
school_id
primary_campus_id
admission_number

first_name
middle_name
last_name
preferred_name

date_of_birth
gender
nationality
photo_url

enrollment_date
student_status

created_at
created_by
updated_at
updated_by
archived_at
archived_by
```

Unique constraint:

```text
school_id + admission_number
```

Student statuses:

```text
active
inactive
suspended
withdrawn
transferred
graduated
deceased
archived
```

Rules:

- A student record represents the permanent identity of the learner.
- Student records should not be deleted during normal operations.
- Status changes must be recorded in history.
- Current class placement should be derived from enrollment records rather than stored as the only source of truth.
- Admission numbers must remain unique within a school.

---

## Student Enrollments

The `student_enrollments` table preserves academic placement history.

Core fields:

```text
id
organization_id
school_id
campus_id
student_id
academic_year_id
term_id
grade_level_id
class_section_id
enrollment_status
start_date
end_date
created_at
created_by
```

Enrollment statuses:

```text
pending
active
completed
withdrawn
transferred
suspended
```

Rules:

- A student may have many historical enrollment records.
- A student should normally have only one active enrollment per school and academic year.
- Transfers should close the previous enrollment and create a new one.
- Historical class placements must remain reportable.

---

## Student Status History

The `student_status_history` table records lifecycle changes.

Core fields:

```text
id
organization_id
school_id
student_id
previous_status
new_status
reason
effective_at
changed_by
created_at
```

Rules:

- Append-only.
- Every significant student status change must create a history record.
- Historical records must not be edited through normal application workflows.

---

## Guardians

The `guardians` table stores permanent guardian identities.

Core fields:

```text
id
organization_id
full_name
preferred_name
email
phone
alternate_phone
address_line_1
address_line_2
city
region
postal_code
country_code
occupation
employer
status
created_at
created_by
updated_at
updated_by
```

Rules:

- Guardians are organization-owned.
- One guardian may be connected to multiple students.
- One guardian may be connected to students in multiple schools within the organization.
- Duplicate guardian records should be minimized through matching and review workflows.
- Guardian access must depend on verified student relationships.

---

## Households

The `households` table groups students and guardians into family or household units.

Core fields:

```text
id
organization_id
household_name
primary_address
billing_address
status
created_at
created_by
```

Examples:

```text
The Otieno Household
The Smith Family
Main Boarding Sponsor Household
```

Rules:

- A household may include multiple guardians and students.
- A student may belong to more than one household where required.
- One household may be marked primary for billing or correspondence.

---

## Household Members

The `household_members` table connects students and guardians to households.

Core fields:

```text
id
organization_id
household_id
member_type
student_id
guardian_id
is_primary_household
created_at
```

Allowed member types:

```text
student
guardian
```

Rules:

- Only one of `student_id` or `guardian_id` may be populated.
- A database constraint should enforce this rule.
- Duplicate household membership must be prevented.

---

## Student Guardians

The `student_guardians` table defines the relationship between a student and guardian.

Core fields:

```text
id
organization_id
school_id
student_id
guardian_id
relationship_type

is_legal_guardian
is_primary_contact
is_emergency_contact
is_financially_responsible

can_receive_academic_information
can_receive_financial_information
can_collect_student

status

created_at
created_by
updated_at
updated_by
```

Unique constraint:

```text
student_id + guardian_id
```

Relationship examples:

```text
mother
father
step_parent
grandparent
sibling
sponsor
foster_guardian
legal_guardian
other
```

Rules:

- A student may have multiple guardians.
- Legal, financial, communication, emergency, and pickup responsibilities must be modeled separately.
- A guardian may have different rights for different students.
- Relationship changes must be auditable.
- Portal access must use this relationship table.

---

## Emergency Contacts

The `student_emergency_contacts` table stores emergency contacts who may not be guardians.

Core fields:

```text
id
organization_id
school_id
student_id
full_name
relationship_type
phone
alternate_phone
priority_order
notes
created_at
created_by
```

Rules:

- Emergency contacts should be ordered by priority.
- Emergency contacts must not automatically receive academic or financial access.
- Contact details must be available to authorized staff during emergencies.

---

## Pickup Authorizations

The `student_pickup_authorizations` table controls who may collect a student.

Core fields:

```text
id
organization_id
school_id
student_id
guardian_id
authorized_person_name
relationship_type
phone
photo_url
authorization_status
valid_from
valid_until
notes
created_at
created_by
```

Authorization statuses:

```text
active
expired
revoked
pending
```

Rules:

- Pickup rights must not be inferred only from guardian status.
- Temporary pickup permissions should support validity dates.
- Revoked authorizations must remain historically visible.
- Authorized pickup data should be available to security staff with appropriate permission.

---

## Student Documents

The `student_documents` table stores student-specific document metadata.

Examples:

```text
Birth Certificate
Passport
Transfer Letter
Medical Form
Consent Form
Report Card
Identity Document
```

Core fields:

```text
id
organization_id
school_id
student_id
document_type
storage_path
file_name
mime_type
document_status
issued_at
expires_at
created_at
created_by
```

Rules:

- File content is stored in Supabase Storage.
- Database rows store metadata and secure references.
- Sensitive documents require restricted permissions.
- Expiring documents should support alerts.

---

## Student Medical Alerts

The `student_medical_alerts` table stores high-visibility medical warnings.

Examples:

```text
Severe allergy
Asthma
Diabetes
Medication requirement
Seizure risk
Mobility assistance
```

Core fields:

```text
id
organization_id
school_id
student_id
alert_type
title
description
severity
is_active
created_at
created_by
updated_at
updated_by
```

Severity values:

```text
low
moderate
high
critical
```

Rules:

- Medical alerts are restricted data.
- Access must require a specialized permission.
- Critical alerts should appear in relevant operational workflows.
- Deactivation should preserve history.
- Detailed health records will belong to the future Health Domain.

---

## Student Conversion from Admissions

The admissions-to-student conversion process should:

```text
Approve application
→ Validate required documents
→ Validate accepted offer
→ Validate required registration conditions
→ Create or match guardian records
→ Create student record
→ Create student-guardian relationships
→ Create initial enrollment
→ Create status history
→ Complete enrollment checklist
→ Create portal invitation where applicable
→ Generate audit events
```

The conversion must be transactional where possible.

If any critical step fails, the process should not leave a partially enrolled student without a recoverable workflow state.

---

## Student and Guardian Design Principles

The domain must:

- Preserve permanent student identity
- Preserve enrollment history
- Support complex guardian relationships
- Separate legal, financial, emergency, and pickup responsibilities
- Support multi-student households
- Support multi-school guardians
- Protect restricted student information
- Avoid duplicate guardian records
- Drive parent portal access through verified relationships
- Maintain audit history for sensitive changes

# 11. Staff and Employment Domain

The Staff and Employment Domain manages employees, contractors, positions,
departments, campus assignments, employment history, documents, and operational
responsibility.

Authentication profiles and staff records are related but not identical.

A staff member may have a SchoolOS login, but a login is not required for every
staff record.

---

## Staff

The `staff` table stores permanent employee and contractor identities.

Core fields:

```text
id
organization_id
school_id
primary_campus_id
profile_id
employee_number

first_name
middle_name
last_name
preferred_name

email
phone

employment_type
hire_date
termination_date
staff_status

created_at
created_by
updated_at
updated_by
archived_at
archived_by
```

Unique constraint:

```text
school_id + employee_number
```

Employment types:

```text
permanent
fixed_term
part_time
casual
contractor
volunteer
intern
```

Staff statuses:

```text
active
on_leave
suspended
terminated
retired
archived
```

Rules:

- `profile_id` is optional.
- A staff record may exist before a user account is created.
- Staff records should not be deleted during normal operations.
- Employment status changes must be auditable.
- A terminated employee must lose active application access.

---

## Positions

The `positions` table defines formal job positions.

Examples:

```text
Principal
Vice Principal
Teacher
Admissions Officer
Finance Officer
Procurement Officer
School Nurse
Driver
Security Officer
```

Core fields:

```text
id
organization_id
school_id
department_id
title
code
position_type
description
status
created_at
created_by
```

Position types:

```text
academic
administrative
finance
operations
support
leadership
contract
```

Unique constraint:

```text
school_id + code
```

Rules:

- Positions belong to one school.
- Positions may optionally belong to a department.
- Historical positions should remain available for reporting.

---

## Staff Assignments

The `staff_assignments` table records the roles and locations where a staff
member works.

Core fields:

```text
id
organization_id
school_id
campus_id
staff_id
position_id
department_id
start_date
end_date
is_primary
assignment_status
created_at
created_by
```

Assignment statuses:

```text
active
ended
suspended
planned
```

Rules:

- A staff member may have multiple assignments.
- Only one assignment should normally be primary within a school.
- Assignment history must be preserved.
- Campus access may be derived from active staff assignments where appropriate.
- Position assignment does not replace authorization roles.

---

## Employment History

The `staff_employment_history` table records important employment lifecycle
changes.

Core fields:

```text
id
organization_id
school_id
staff_id
event_type
previous_value
new_value
effective_date
reason
recorded_by
created_at
```

Event examples:

```text
hired
promoted
transferred
salary_changed
placed_on_leave
suspended
terminated
retired
```

Rules:

- Append-only.
- Significant employment changes must create history records.
- Sensitive values should be restricted and audited.

---

## Staff Documents

The `staff_documents` table stores employment-related document metadata.

Examples:

```text
Employment Contract
Identity Document
Teaching Certificate
Police Clearance
Professional License
Tax Document
Performance Review
Training Certificate
```

Core fields:

```text
id
organization_id
school_id
staff_id
document_type
storage_path
file_name
mime_type
issued_at
expires_at
document_status
created_at
created_by
```

Document statuses:

```text
active
expired
pending_verification
rejected
archived
```

Rules:

- File content is stored in Supabase Storage.
- Expiring certifications should support alerts.
- Confidential employment documents require restricted permissions.
- Document access should be auditable where appropriate.

---

## Staff Qualifications

The `staff_qualifications` table stores academic and professional qualifications.

Core fields:

```text
id
organization_id
school_id
staff_id
qualification_type
institution_name
qualification_name
field_of_study
award_date
expiry_date
verification_status
notes
created_at
created_by
```

Verification statuses:

```text
pending
verified
rejected
not_required
```

---

## Staff Attendance

The detailed attendance and timekeeping model will be defined later in the HR
Domain.

The future model may include:

```text
staff_attendance_sessions
staff_attendance_records
shift_assignments
timesheets
overtime_records
```

---

## Leave Management

The detailed leave model will be defined later in the HR Domain.

The future model may include:

```text
leave_types
leave_balances
leave_requests
leave_approvals
leave_history
```

---

## Payroll Separation

Payroll records are financially sensitive and must remain separate from general
staff profiles.

Future payroll tables may include:

```text
payroll_periods
payroll_runs
payroll_items
salary_components
staff_bank_accounts
statutory_deductions
payslips
```

Payroll access must require specialized permissions and stricter RLS policies.

---

## Teacher Identity

A teacher is represented as:

```text
Staff record
→ Active staff assignment
→ Teaching assignment
→ School membership
→ Authorization roles and permissions
```

The Staff Domain stores employment identity.

The Academics Domain will store:

```text
subject assignments
class assignments
teaching loads
timetables
gradebook responsibility
```

---

## Staff Design Principles

The Staff and Employment Domain must:

- Preserve permanent employment identity
- Separate staff records from authentication profiles
- Preserve assignment and employment history
- Support multiple departments and campuses
- Protect confidential employment data
- Support expiring qualifications and certifications
- Integrate with permissions without replacing them
- Provide a foundation for HR, payroll, attendance, and performance modules

or

## 1. Database Architecture Objective

The SchoolOS Enterprise database must support:

* Single-campus and multi-campus institutions
* Multiple schools within one enterprise group
* Strict tenant isolation
* Role- and permission-based access
* Configurable academic structures
* Financial accountability
* Complete operational auditability
* Workflow-driven business processes
* Mobile and offline-capable operations
* Integration with the Tavaro Enterprise Platform
* Future reuse by other Tavaro products

The database is not treated as a collection of module-specific tables. It is an enterprise operational data platform governed by shared architectural standards.

---

# 2. Database Platform Baseline

SchoolOS Version 1 will use:

* PostgreSQL as the primary relational database
* Supabase-managed PostgreSQL during initial implementation
* Supabase Auth for identity bootstrap
* PostgreSQL Row-Level Security for tenant enforcement
* PostgreSQL functions and triggers only where domain integrity requires them
* Application services for business workflows and orchestration
* Object storage for documents, media, exports, and attachments
* Database migrations stored in source control
* Environment-specific databases for development, staging, and production

The database must remain portable enough to migrate to independently managed PostgreSQL infrastructure in the future.

---

# 3. Enterprise Data Hierarchy

The primary organizational hierarchy is:

```text
Tavaro Platform
└── Tenant
    └── Institution
        └── Campus
            ├── Academic Units
            ├── Administrative Units
            ├── Financial Units
            └── Operational Units
```

## 3.1 Tenant

A tenant represents the highest level of customer isolation.

Examples:

* A private school
* A school group
* A college
* A multi-campus academy
* An education management organization

Every tenant-owned record must include:

```sql
tenant_id uuid not null
```

No tenant-owned operational record may exist without a valid tenant reference.

## 3.2 Institution

An institution represents a legally or operationally distinct educational entity within a tenant.

Examples:

* Pointer Hill Academy
* Tavaro Technical College
* Green Valley Primary School

A tenant may contain one or multiple institutions.

## 3.3 Campus

A campus represents a physical or operational location belonging to an institution.

Examples:

* Main Campus
* Junior School Campus
* Boarding Campus
* Nairobi Campus
* Namanga Campus

Operational records should include `campus_id` whenever activities, resources, finances, students, or staff are campus-specific.

---

# 4. Core Identifier Standard

All primary keys will use UUIDs.

Standard:

```sql
id uuid primary key default gen_random_uuid()
```

UUIDs are required because they:

* Support distributed and offline creation
* Avoid sequential identifier exposure
* Reduce cross-tenant collision risk
* Support mobile synchronization
* Allow future service separation

Human-readable codes must be stored separately.

Examples:

```text
Student ID: STU-2026-000142
Employee ID: EMP-000084
Invoice Number: INV-2026-001028
Purchase Order: PO-2026-000213
Asset Code: AST-000451
```

Human-readable codes must never be used as primary keys.

---

# 5. Standard Enterprise Columns

Unless a table is explicitly classified as an immutable event or junction table, tenant-owned tables should include the following baseline columns:

```sql
id uuid primary key default gen_random_uuid(),
tenant_id uuid not null,
institution_id uuid,
campus_id uuid,

created_at timestamptz not null default now(),
created_by uuid,

updated_at timestamptz not null default now(),
updated_by uuid,

deleted_at timestamptz,
deleted_by uuid,

record_version integer not null default 1
```

Where appropriate, tables may also include:

```sql
status text not null,
effective_from timestamptz,
effective_to timestamptz,
metadata jsonb not null default '{}'::jsonb
```

## 5.1 Record Version

`record_version` supports:

* Optimistic concurrency control
* Mobile synchronization
* Conflict detection
* Audit comparison
* Safe update operations

Updates should validate that the client is modifying the expected record version.

---

# 6. Soft Delete Standard

Operational and master records must use soft deletion unless legal or security requirements demand permanent removal.

Standard:

```sql
deleted_at timestamptz,
deleted_by uuid
```

Application queries must exclude deleted records by default.

Permanent deletion is restricted to:

* Temporary import records
* Expired system caches
* Uncommitted drafts
* Duplicate records approved for purge
* Legally authorized data deletion workflows

Financial, academic, audit, and compliance records must not be physically deleted through normal application operations.

---

# 7. Tenant Isolation

Tenant isolation will be enforced at three levels:

## 7.1 Application Context

Every authenticated request must resolve:

* User identity
* Active tenant
* Active institution
* Active campus, where applicable
* Membership status
* Assigned roles
* Effective permissions

## 7.2 Row-Level Security

Every tenant-owned table must have Row-Level Security enabled.

Example policy principle:

```sql
tenant_id = current_tenant_id()
```

Access must not depend solely on client-supplied tenant identifiers.

The active tenant must be derived from validated membership and session context.

## 7.3 Service-Level Authorization

Row-Level Security provides isolation, but services must still validate:

* Permission to perform the requested action
* Access to the institution or campus
* Workflow state eligibility
* Ownership or assignment where applicable
* Financial approval limits
* Sensitive data restrictions

RLS is not a replacement for application authorization.

---

# 8. Identity and Membership Model

Authentication identity and organizational membership must remain separate.

## 8.1 Platform Identity

A user identity represents a person authenticated through the platform.

Core identity records include:

```text
auth.users
tep_user_profiles
```

## 8.2 Tenant Membership

A user may belong to multiple tenants.

Required entity:

```text
tenant_memberships
```

Core fields:

```sql
id
tenant_id
user_id
membership_status
joined_at
invited_at
activated_at
suspended_at
last_accessed_at
```

## 8.3 Institution and Campus Assignment

Membership scope is represented through:

```text
membership_institutions
membership_campuses
```

A user may:

* Access every institution within the tenant
* Access selected institutions
* Access every campus within an institution
* Access selected campuses only

## 8.4 Roles and Permissions

The authorization model will use:

```text
roles
permissions
role_permissions
membership_roles
permission_overrides
```

Roles are tenant-configurable but may originate from platform templates.

Initial SchoolOS role templates include:

* Platform Administrator
* Tenant Owner
* School Director
* Principal
* Deputy Principal
* Registrar
* Finance Manager
* Accountant
* Procurement Officer
* Storekeeper
* Human Resources Manager
* Teacher
* Class Teacher
* Head of Department
* Librarian
* Nurse
* Counselor
* Transport Manager
* Boarding Manager
* Parent
* Student
* Auditor
* Read-Only Viewer

Permissions must be action-specific.

Examples:

```text
students.view
students.create
students.update
students.archive
students.transfer
students.export

finance.invoices.view
finance.invoices.create
finance.invoices.approve
finance.invoices.void

procurement.requests.create
procurement.requests.review
procurement.purchase_orders.approve
```

---

# 9. Shared TEP Database Domains

The Tavaro Enterprise Platform owns the following shared database domains.

## 9.1 Identity and Authorization

```text
tep_user_profiles
tenants
tenant_memberships
institutions
campuses
roles
permissions
role_permissions
membership_roles
permission_overrides
access_sessions
```

## 9.2 Workflow

```text
workflow_definitions
workflow_definition_versions
workflow_steps
workflow_transitions
workflow_instances
workflow_instance_steps
workflow_assignments
workflow_actions
workflow_comments
workflow_escalations
```

## 9.3 Task Management

```text
tasks
task_assignments
task_dependencies
task_comments
task_checklists
task_attachments
task_status_history
```

## 9.4 Notifications

```text
notification_templates
notification_preferences
notification_events
notification_deliveries
notification_recipients
notification_failures
device_registrations
```

## 9.5 Audit

```text
audit_events
audit_event_changes
security_events
data_access_events
administrative_actions
```

## 9.6 Documents

```text
document_records
document_versions
document_links
document_permissions
document_signatures
document_retention_rules
document_access_logs
```

## 9.7 Search

```text
search_documents
search_index_jobs
saved_searches
recent_searches
```

## 9.8 Reporting

```text
report_definitions
report_parameters
report_runs
report_outputs
scheduled_reports
report_subscriptions
```

## 9.9 Configuration

```text
configuration_definitions
tenant_configuration
institution_configuration
campus_configuration
feature_flags
number_sequences
```

## 9.10 Diagnostics

```text
system_health_checks
integration_health_checks
background_job_runs
failed_jobs
sync_sessions
sync_conflicts
application_errors
```

## 9.11 Integrations

```text
integration_connections
integration_credentials
integration_events
integration_requests
integration_responses
integration_failures
webhook_endpoints
webhook_deliveries
```

## 9.12 Payments

```text
payment_providers
payment_accounts
payment_customers
payment_intents
payment_transactions
payment_allocations
payment_refunds
payment_disputes
payment_webhooks
payment_reconciliation_runs
```

The payment domain must support:

* Stripe
* M-Pesa Daraja API
* Cash
* Bank transfer
* Cheque
* Manual adjustment
* Future payment providers

---

# 10. SchoolOS Module Database Domains

SchoolOS owns education-specific domains built on top of TEP.

## 10.1 Student Information

```text
students
student_identifiers
student_contacts
student_guardians
student_guardian_relationships
student_addresses
student_medical_profiles
student_documents
student_status_history
student_transfers
student_withdrawals
student_enrollments
```

## 10.2 Admissions

```text
admission_cycles
admission_applications
application_students
application_guardians
application_documents
application_reviews
application_interviews
application_decisions
admission_offers
offer_acceptances
admission_checklists
```

## 10.3 Academic Structure

```text
academic_years
academic_terms
education_levels
grade_levels
classes
class_sections
departments
subjects
courses
curriculum_frameworks
curriculum_subjects
teaching_assignments
```

## 10.4 Enrollment and Class Placement

```text
student_academic_enrollments
student_class_assignments
student_subject_enrollments
class_rosters
placement_history
promotion_decisions
repeat_decisions
graduation_records
```

## 10.5 Attendance

```text
attendance_sessions
student_attendance_records
staff_attendance_records
attendance_reasons
attendance_corrections
attendance_approvals
attendance_alerts
```

## 10.6 Timetable and Scheduling

```text
timetable_periods
timetable_templates
timetable_entries
room_allocations
teacher_availability
classroom_resources
schedule_conflicts
schedule_exceptions
calendar_events
```

## 10.7 Assessment and Grading

```text
assessment_categories
assessments
assessment_components
student_assessment_scores
grading_scales
grade_boundaries
reporting_periods
student_term_results
student_subject_results
report_cards
result_approvals
result_publications
```

## 10.8 Learning and Curriculum Delivery

```text
lesson_plans
lesson_sessions
curriculum_units
curriculum_topics
curriculum_progress
learning_resources
assignments
assignment_submissions
teacher_feedback
```

## 10.9 Finance

```text
fee_structures
fee_structure_items
student_fee_assignments
student_accounts
student_invoices
invoice_items
credit_notes
debit_notes
receipts
receipt_allocations
payment_plans
scholarships
discounts
financial_sponsors
cashbooks
bank_accounts
bank_reconciliations
general_ledger_accounts
journal_entries
journal_entry_lines
```

## 10.10 Procurement

```text
procurement_requests
procurement_request_items
procurement_reviews
supplier_records
supplier_contacts
supplier_documents
supplier_qualifications
request_for_quotations
rfq_suppliers
supplier_quotes
supplier_quote_items
bid_evaluations
purchase_orders
purchase_order_items
goods_receipts
goods_receipt_items
supplier_invoices
procurement_returns
```

## 10.11 Inventory

```text
inventory_items
inventory_categories
inventory_units
inventory_locations
inventory_balances
inventory_transactions
stock_receipts
stock_issues
stock_transfers
stock_adjustments
stock_counts
stock_count_items
reorder_rules
inventory_reservations
```

## 10.12 Assets

```text
assets
asset_categories
asset_assignments
asset_locations
asset_maintenance_plans
asset_maintenance_records
asset_inspections
asset_depreciation_records
asset_disposals
asset_documents
```

## 10.13 Human Resources

```text
employees
employee_identifiers
employee_contacts
employee_addresses
employment_contracts
job_positions
departments
employee_assignments
employee_documents
employee_qualifications
employee_leave_requests
employee_leave_balances
employee_attendance
employee_performance_reviews
disciplinary_cases
payroll_periods
payroll_runs
payroll_items
```

## 10.14 Communications

```text
announcements
announcement_audiences
messages
message_threads
message_participants
message_deliveries
communication_campaigns
communication_templates
parent_teacher_conversations
emergency_broadcasts
```

## 10.15 Student Welfare and Discipline

```text
student_welfare_cases
disciplinary_incidents
disciplinary_actions
behavior_observations
counseling_cases
counseling_sessions
safeguarding_cases
welfare_referrals
case_follow_ups
```

## 10.16 Health and Clinic

```text
student_health_records
clinic_visits
medical_conditions
allergies
medications
immunizations
health_screenings
injury_reports
emergency_contacts
health_restrictions
```

## 10.17 Library

```text
library_items
library_copies
library_members
library_loans
library_reservations
library_fines
library_categories
library_publishers
library_authors
```

## 10.18 Transport

```text
vehicles
drivers
transport_routes
route_stops
student_transport_assignments
vehicle_trips
trip_attendance
vehicle_inspections
vehicle_maintenance
fuel_logs
transport_incidents
```

## 10.19 Boarding

```text
boarding_houses
dormitories
rooms
beds
boarding_assignments
boarding_attendance
boarding_incidents
boarding_inspections
meal_attendance
visitor_logs
```

---

# 11. Referential Integrity Standard

Foreign keys must be used for all stable domain relationships.

Example:

```sql
student_id uuid not null references students(id)
```

Foreign key behavior must be deliberately defined.

Default rules:

* `ON DELETE RESTRICT` for financial, academic, workflow, and audit records
* `ON DELETE SET NULL` for optional historical actor references
* `ON DELETE CASCADE` only for true dependent child records
* No accidental cascade deletion across major business entities

Examples of acceptable cascade relationships:

* Invoice to unposted draft invoice items
* Assessment to draft assessment components
* Workflow definition version to its unpublished steps

Examples where cascading is prohibited:

* Student to invoices
* Employee to payroll records
* Supplier to purchase orders
* User to audit events
* Tenant to financial transactions

---

# 12. Status and State Management

Statuses must not be represented through uncontrolled free text.

Each domain must define an approved state model.

Example student application states:

```text
draft
submitted
under_review
interview_required
interview_completed
approved
waitlisted
rejected
offer_issued
offer_accepted
enrolled
withdrawn
```

Example purchase request states:

```text
draft
submitted
department_review
finance_review
procurement_review
approved
rejected
converted_to_rfq
converted_to_purchase_order
fulfilled
cancelled
```

Where status changes are operationally important, they must be recorded in a corresponding history table.

---

# 13. Financial Data Integrity

Financial amounts must use fixed-precision numeric types.

Standard:

```sql
numeric(18, 2)
```

Where higher precision is needed:

```sql
numeric(18, 4)
```

Floating-point data types must not be used for currency.

Every financial record must include an ISO currency code:

```sql
currency_code char(3) not null
```

Examples:

```text
USD
KES
GBP
EUR
```

Financial transactions must support:

* Transaction date
* Posting date
* Accounting period
* Currency
* Exchange rate
* Source document
* Reference number
* Approval state
* Reversal relationship
* Created and approved actors
* Audit history

Posted accounting transactions must be immutable.

Corrections must use:

* Reversals
* Credit notes
* Debit notes
* Adjusting journal entries

---

# 14. Number Sequence Architecture

Human-readable operational codes will be generated through the TEP number-sequence service.

Required table:

```text
number_sequences
```

Sequence configuration includes:

```text
tenant
institution
campus
document type
prefix
year format
minimum digit length
current value
reset rule
```

Example formats:

```text
STU-2026-000001
INV-NAM-2026-000001
PO-2026-000001
RCT-2026-000001
EMP-000001
```

Sequence allocation must be concurrency-safe.

---

# 15. Audit Architecture

Every significant action must generate an audit event.

Audit events must record:

```text
tenant
institution
campus
actor
action
entity type
entity identifier
timestamp
source application
device
IP address where available
request correlation ID
previous values
new values
reason
workflow context
```

High-value audited actions include:

* Authentication
* Permission changes
* Student admission
* Student transfer
* Result modification
* Result publication
* Fee adjustment
* Payment reversal
* Procurement approval
* Purchase-order approval
* Payroll approval
* Employee suspension
* Document access
* Data export
* Configuration changes
* Integration credential changes

Audit records must be append-only.

---

# 16. Enterprise Event Architecture

Business events must be written to a transactional event outbox.

Required table:

```text
event_outbox
```

Core fields:

```sql
id uuid primary key,
tenant_id uuid not null,
event_type text not null,
aggregate_type text not null,
aggregate_id uuid not null,
payload jsonb not null,
occurred_at timestamptz not null,
published_at timestamptz,
attempt_count integer not null default 0,
last_error text,
correlation_id uuid,
causation_id uuid
```

Examples:

```text
student.application_submitted
student.admitted
student.enrolled
attendance.absence_recorded
assessment.results_published
finance.invoice_issued
finance.payment_received
procurement.request_approved
procurement.purchase_order_issued
inventory.stock_below_reorder_level
workflow.task_overdue
employee.leave_approved
```

The outbox ensures that database changes and business events remain transactionally consistent.

---

# 17. Mobile Synchronization Architecture

Offline-capable mobile tables must support:

```text
record_version
updated_at
deleted_at
sync_source
client_generated_id
last_synced_at
```

The mobile synchronization service will maintain:

```text
sync_sessions
sync_session_items
sync_conflicts
device_registrations
device_sync_state
```

Conflict strategies include:

* Server wins
* Client wins
* Latest valid update wins
* Field-level merge
* Manual review required
* Duplicate record review

Financial approvals, result publication, payroll posting, and sensitive administrative actions must not be completed offline.

---

# 18. Document Storage Architecture

Binary files must not be stored directly in relational tables.

Database records store:

```text
storage provider
storage bucket
storage key
file name
content type
file size
checksum
document classification
retention category
encryption status
uploaded by
uploaded at
```

Documents must support:

* Versioning
* Entity linking
* Access control
* Virus scanning
* Retention rules
* Legal hold
* Expiration
* Electronic signature
* Audit logging

---

# 19. Database Migration Standard

All schema changes must be applied through source-controlled migrations.

Migration rules:

1. No direct production schema edits.
2. Every migration must have a unique sequence.
3. Migrations must be repeatable across environments.
4. Destructive migrations require explicit architecture approval.
5. Data backfills must be separate from structural migrations where practical.
6. Production migrations must have rollback or recovery procedures.
7. Migrations must be tested against realistic data volumes.
8. RLS policies must be deployed in the same change set as tenant-owned tables.
9. Indexes must be included before production release.
10. Migration status must be recorded in deployment evidence.

---

# 20. Database Naming Standard

## Tables

Use plural snake case:

```text
students
student_guardians
purchase_orders
workflow_instances
```

## Columns

Use snake case:

```text
tenant_id
created_at
academic_year_id
invoice_number
```

## Foreign Keys

Use:

```text
<entity>_id
```

Examples:

```text
student_id
campus_id
purchase_order_id
```

## Boolean Fields

Use clear affirmative names:

```text
is_active
is_primary
requires_approval
allows_partial_payment
```

Avoid ambiguous names such as:

```text
flag
enabled_value
status_boolean
```

## Timestamps

Use:

```text
created_at
updated_at
submitted_at
approved_at
posted_at
cancelled_at
deleted_at
```

All timestamps must use `timestamptz`.

---

# 21. Indexing Standard

Every tenant-owned operational table should normally include an index beginning with `tenant_id`.

Examples:

```sql
create index idx_students_tenant
on students (tenant_id);

create index idx_students_tenant_status
on students (tenant_id, status);

create index idx_invoices_tenant_student
on student_invoices (tenant_id, student_id);

create index idx_tasks_tenant_assignee_status
on tasks (tenant_id, assigned_to, status);
```

Frequently filtered soft-delete tables should use partial indexes.

Example:

```sql
create index idx_students_active
on students (tenant_id, institution_id, status)
where deleted_at is null;
```

Index design must be based on actual query patterns and verified through query plans.

---

# 22. Data Classification

SchoolOS data will be classified as:

## Public

Examples:

* Published school name
* Public announcements
* Public academic calendar

## Internal

Examples:

* Timetables
* Department plans
* Internal procurement requests

## Confidential

Examples:

* Student records
* Parent contact details
* Employee records
* Financial reports
* Supplier pricing

## Highly Restricted

Examples:

* Authentication credentials
* Medical records
* Safeguarding records
* Counseling notes
* Payroll details
* Banking details
* Payment credentials
* Disciplinary evidence

Highly restricted data requires:

* Explicit permission checks
* Restricted exports
* Access logging
* Encryption where appropriate
* Limited search exposure
* Retention and disposal controls

---

# 23. Database Environment Strategy

SchoolOS will maintain separate environments:

```text
Local Development
Shared Development
Testing
Staging
Production
```

Production data must not be copied into development environments without anonymization.

Environment-specific credentials must never be stored in source control.

Schema versions must remain aligned across environments through automated migrations.

---

# 24. Database Architecture Baseline Decision

The SchoolOS Version 1 database architecture is based on:

* PostgreSQL
* UUID identifiers
* Tenant-first data ownership
* Institution and campus scoping
* Row-Level Security
* Role- and permission-based access
* Soft deletion
* Optimistic concurrency
* Immutable audit history
* Transactional event outbox
* Workflow-driven state transitions
* Fixed-precision financial records
* Source-controlled migrations
* Offline synchronization support
* TEP-owned shared platform domains
* SchoolOS-owned education domains

This architecture is approved as the governing database model for the Version 1 implementation program.

No module may introduce an independent identity, workflow, task, audit, notification, document, reporting, integration, or payment architecture outside the Tavaro Enterprise Platform.
