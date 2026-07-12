# SchoolOS Enterprise Service Catalog

**Product:** SchoolOS Enterprise  
**Platform:** Tavaro Enterprise Platform  
**Company:** Tavaro Group LLC  
**Version:** 1.0  
**Status:** Governing service architecture

---

## 1. Purpose

This document defines the production service boundaries for SchoolOS Enterprise
and the Tavaro Enterprise Platform.

It translates the approved domain, workflow, database, event, and API
architecture into implementable application services.

Every service must define:

- Ownership
- Responsibilities
- Public commands
- Public queries
- Dependencies
- Permissions
- Transaction boundaries
- Events published
- Events consumed
- Audit behavior
- Error behavior
- Mobile and offline considerations
- Testing requirements

Business logic must not be implemented directly inside React components,
route handlers, database repositories, or provider integrations.

---

## 2. Service Architecture Rules

### Service ownership

Each business capability has one owning service.

Other modules may consume that service but must not duplicate its business rules.

### Dependency direction

```text
Presentation
    ↓
Application Services
    ↓
Domain Rules and Repositories
    ↓
TEP Platform Services
    ↓
Infrastructure and External Providers
```

### React separation

React components may:

- collect user input
- display state
- call approved application services
- display service results and errors

React components must not:

- implement approval rules
- calculate authoritative balances
- perform direct cross-module database mutations
- call M-Pesa, Stripe, Twilio, Resend, or Firebase directly
- determine final authorization
- create audit records manually

### Repository separation

Repositories manage persistence.

Repositories must not own:

- workflow decisions
- permission policy
- approval thresholds
- payment allocation rules
- notification policy
- cross-module orchestration

### Transactions

A service must define whether an operation requires:

- one database transaction
- an idempotency key
- retry protection
- compensating action
- asynchronous continuation
- workflow recovery

---

## 3. TEP Core Services

Version 1 includes the following shared platform services:

```text
IdentityService
TenantService
MembershipService
AuthorizationService
InvitationService

WorkflowDefinitionService
WorkflowExecutionService
WorkflowTaskService
ApprovalService
EscalationService

NotificationService
NotificationPreferenceService
NotificationDeliveryService
NotificationTemplateService

AuditService
DocumentService
SearchService
ReportingService
ConfigurationService
DiagnosticsService

PaymentService
PaymentProviderService
PaymentReconciliationService
RefundService

IntegrationService
EventBus
OutboxService
JobSchedulerService

MobileRuntimeService
OfflineQueueService
SyncConflictService
```

---

## 4. SchoolOS Business Services

Version 1 includes the following SchoolOS services:

```text
SchoolService
CampusService
AcademicYearService
TermService
DepartmentService
GradeLevelService
ClassSectionService

AdmissionInquiryService
ApplicationService
ApplicationDocumentService
ApplicationReviewService
ApplicationAssessmentService
ApplicationInterviewService
AdmissionDecisionService
AdmissionOfferService
EnrollmentConversionService

StudentService
StudentEnrollmentService
StudentStatusService
GuardianService
HouseholdService
StudentGuardianService
EmergencyContactService
PickupAuthorizationService
StudentDocumentService
StudentMedicalAlertService

StaffService
PositionService
StaffAssignmentService
StaffQualificationService
StaffDocumentService

AttendanceSessionService
AttendanceRecordService
AttendanceCorrectionService
AttendanceNotificationService

FeeStructureService
StudentInvoiceService
PaymentAllocationService
ReceiptService
ScholarshipService
DiscountService
BudgetService
LedgerService

SupplierService
PurchaseRequestService
ProcurementApprovalService
RequestForQuotationService
QuotationService
QuotationEvaluationService
SupplierAwardService
PurchaseOrderService
GoodsReceiptService
InspectionService
ThreeWayMatchService
ProcurementClosureService

InventoryItemService
InventoryTransactionService
StockCountService
InventoryTransferService
AssetService
AssetAssignmentService
AssetMaintenanceService
AssetDisposalService

SubjectService
TeachingAssignmentService
TimetableService
AssessmentService
GradebookService
ReportCardService
TranscriptService

AnnouncementService
MessagingService
BroadcastService
CommunicationConsentService

SchoolReportService
ExecutiveMetricsService
SchoolIntelligenceService
```

---

## 5. Standard Service Contract

Every service specification must use this structure:

```text
Service name
Owning domain
Purpose
Responsibilities
Commands
Queries
Dependencies
Permissions
Transaction boundaries
Events published
Events consumed
Audit events
Validation rules
Errors
Mobile behavior
Offline behavior
Performance expectations
Tests
```

---

## 6. IdentityService

### Owning platform

Tavaro Enterprise Platform — Identity

### Purpose

Manages the application identity associated with Supabase Auth users.

### Responsibilities

- create and maintain application profiles
- resolve the authenticated actor
- validate account status
- update profile preferences
- expose localization and timezone context
- suspend or archive application access

### Commands

```text
createProfile
updateProfile
activateProfile
suspendProfile
archiveProfile
updatePreferences
recordLastActive
```

### Queries

```text
getCurrentProfile
getProfileById
getProfileByEmail
getProfilePreferences
```

### Dependencies

```text
ProfileRepository
AuditService
EventBus
```

### Permissions

```text
profiles.view
profiles.edit_self
profiles.manage
```

### Events published

```text
platform.profile.created
platform.profile.updated
platform.profile.activated
platform.profile.suspended
platform.profile.archived
```

### Audit events

- profile created
- profile changed
- profile suspended
- profile archived

### Rules

- profile ID must match the Supabase Auth user ID
- suspended and archived profiles cannot receive active application access
- users may edit only approved self-service fields
- privileged profile changes require administrative permission

---

## 7. TenantService

### Owning platform

Tavaro Enterprise Platform — Tenancy

### Purpose

Manages organizations, schools, campuses, and active tenant context.

### Responsibilities

- create organizations
- create schools
- create campuses
- validate hierarchy ownership
- resolve active school and campus context
- support tenant switching
- prevent cross-tenant access

### Commands

```text
createOrganization
updateOrganization
createSchool
updateSchool
createCampus
updateCampus
archiveSchool
archiveCampus
setPrimaryCampus
```

### Queries

```text
getOrganization
getSchoolsForProfile
getSchool
getCampusesForSchool
getActiveTenantContext
```

### Dependencies

```text
OrganizationRepository
SchoolRepository
CampusRepository
MembershipService
AuthorizationService
AuditService
EventBus
```

### Permissions

```text
organizations.manage
schools.view
schools.manage
campuses.view
campuses.manage
```

### Events published

```text
platform.organization.created
school.school.created
school.school.updated
school.campus.created
school.campus.updated
```

### Rules

- a school belongs to exactly one organization
- a campus belongs to exactly one school
- archived tenants cannot be selected as active operational context
- tenant switching must verify active membership and permission

---

## 8. AuthorizationService

### Owning platform

Tavaro Enterprise Platform — Authorization

### Purpose

Calculates effective permissions for an authenticated user within a tenant
context.

### Responsibilities

- resolve roles
- resolve permission grants
- apply permission overrides
- enforce deny precedence
- validate campus restrictions
- provide permission-aware navigation
- support RLS helper functions

### Commands

```text
assignRole
revokeRole
grantPermissionOverride
denyPermissionOverride
removePermissionOverride
```

### Queries

```text
hasPermission
getEffectivePermissions
getAssignedRoles
canAccessCampus
canAccessEntity
```

### Dependencies

```text
MembershipRepository
RoleRepository
PermissionRepository
AuditService
EventBus
```

### Events published

```text
platform.role.assigned
platform.role.revoked
platform.permission.override_created
platform.permission.override_removed
platform.permission.changed
```

### Rules

- deny overrides take precedence
- expired overrides are ignored
- inactive memberships grant no tenant permissions
- authorization must be evaluated using server and database controls
- UI permission checks are usability controls, not the security boundary

---

## 9. PaymentService

### Owning platform

Tavaro Enterprise Platform — Payments

### Purpose

Provides provider-independent payment processing for SchoolOS and future Tavaro
products.

### Version 1 providers

```text
M-Pesa Daraja
Stripe
Manual bank transfer recording
```

### Responsibilities

- initiate payment requests
- select the configured provider
- create idempotent payment transactions
- process provider callbacks and webhooks
- verify completed payments
- reject duplicate completion events
- expose payment status
- request refunds or reversals
- initiate reconciliation
- publish normalized payment events

### Commands

```text
createPayment
initiatePayment
confirmManualPayment
processProviderCallback
cancelPayment
requestRefund
requestReversal
reconcilePayment
```

### Queries

```text
getPayment
getPaymentStatus
getPaymentsForEntity
getProviderTransaction
getReconciliationStatus
```

### Dependencies

```text
PaymentTransactionRepository
PaymentProviderService
PaymentReconciliationService
RefundService
AuditService
NotificationService
EventBus
OutboxService
```

### Permissions

```text
payments.view
payments.initiate
payments.record
payments.reverse
payments.refund
payments.reconcile
```

### Events published

```text
platform.payment.created
platform.payment.initiated
platform.payment.pending
platform.payment.completed
platform.payment.failed
platform.payment.cancelled
platform.payment.refund_requested
platform.payment.refunded
platform.payment.reversal_requested
platform.payment.reversed
platform.payment.reconciliation_required
platform.payment.reconciled
```

### M-Pesa rules

- credentials remain server-side
- STK Push requests require idempotency protection
- callback payloads are stored before processing
- callbacks may be delivered more than once
- receipt numbers must be unique
- amount and account reference must be validated
- delayed callbacks must remain recoverable
- transaction status checks must be supported
- reversals require restricted permission and audit
- B2C and B2B operations require separate configuration and approval controls

### Stripe rules

- payment intents are created server-side
- webhook signatures must be verified
- webhook events must be idempotently processed
- client confirmation does not establish authoritative payment completion
- refunds require restricted permission and audit

### Transaction boundaries

Payment initiation and external provider completion cannot be one database
transaction.

The service must use:

```text
local transaction creation
→ provider request
→ callback or webhook
→ idempotent completion
→ business allocation
→ receipt generation
```

### Mobile behavior

- M-Pesa is a primary payment action in the parent mobile portal
- payment state must survive app backgrounding
- pending status must be refreshable
- duplicate taps must not create duplicate charges
- receipts must be accessible after successful completion

---

## 10. Service Implementation Rule

No service is considered ready for implementation until its contract defines:

- command names
- query names
- permission requirements
- transaction boundaries
- events
- errors
- audit behavior
- mobile behavior
- tests