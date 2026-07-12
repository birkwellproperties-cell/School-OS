# Tavaro Enterprise Platform
# Enterprise Event Architecture

**Platform:** Tavaro Enterprise Platform  
**Reference Product:** SchoolOS Enterprise  
**Company:** Tavaro Group LLC  
**Version:** 1.0  
**Status:** Governing architecture  
**Applies To:** SchoolOS, FarmOS, ContractorOS, ClinicOS, and future Tavaro products

---

# 1. Purpose

This document defines the enterprise event architecture governing business
events, event publication, event delivery, event processing, event reliability,
event observability, and event governance across the Tavaro Enterprise Platform.

Events are a shared TEP capability.

SchoolOS modules and future Tavaro products must use the shared event platform
rather than introducing independent event buses, notification triggers, webhook
pipelines, or background-processing frameworks.

The event architecture supports:

- Transactional event publication
- Reliable asynchronous processing
- Cross-module communication
- Cross-product integration
- Workflow orchestration
- Task generation
- Notification generation
- Reporting updates
- Search indexing
- Integration dispatch
- Audit correlation
- Diagnostics
- Mobile synchronization
- Future service separation

---

# 2. Event Architecture Objectives

The TEP Event Platform must provide:

- Reliable business-event publication
- Transactional consistency
- Standard event naming
- Standard event envelopes
- Event versioning
- Idempotent consumption
- Retry and dead-letter handling
- Subscriber isolation
- Correlation and causation tracking
- Tenant isolation
- Event diagnostics
- Replay capability
- Auditability
- Extensibility for future products and services
- Compatibility with PostgreSQL, Supabase, queues, and future message brokers

---

# 3. Event Architecture Principles

## 3.1 Events Represent Business Facts

Events describe something that has already happened.

Examples:

```text
student.application_submitted
student.enrolled
finance.invoice_issued
finance.payment_received
procurement.request_approved
workflow.task_overdue

Events must not be named as instructions.

Good:

```text
student.enrolled
payment.received
purchase_order.issued
```

Avoid:

```text
enroll_student
send_payment
create_purchase_order
```

Commands request action.

Events record completed business facts.

---

## 3.2 Transactional Consistency

A business event shall never be published unless the associated business
transaction commits successfully.

The platform shall implement the Transactional Outbox Pattern to guarantee that
business data and events remain consistent.

Business transaction:

```text
Update Business Entity
↓
Write Audit Record
↓
Write Event Outbox Record
↓
Commit Transaction
```

Only after the transaction commits successfully may the dispatcher publish the
event.

---

## 3.3 At-Least-Once Delivery

The Version 1 platform guarantees:

- At-least-once delivery

It does **not** guarantee:

- Exactly-once delivery

Therefore every subscriber must be idempotent.

---

## 3.4 Event Immutability

Published events are immutable.

Events are historical records.

If business state changes again, a new event must be published.

Example:

```text
student.enrolled
```

Later:

```text
student.withdrawn
```

The original enrollment event remains unchanged.

---

## 3.5 Loose Coupling

Publishers never know who subscribes.

Subscribers never know who published.

Only the event contract is shared.

---

## 3.6 Tenant Isolation

Every business event contains:

- tenant_id
- organization_id
- school_id
- campus_id (where applicable)

Subscribers must never infer tenant ownership.

---

# 4. Event Categories

The platform recognizes several categories.

## Domain Events

Examples:

```text
student.created
student.updated
student.enrolled
invoice.issued
payment.received
```

## Workflow Events

```text
workflow.started
workflow.completed
workflow.rejected
workflow.escalated
```

## Task Events

```text
task.created
task.assigned
task.completed
task.overdue
```

## Notification Events

```text
notification.requested
notification.sent
notification.failed
```

## Integration Events

```text
integration.request_sent
integration.response_received
integration.failed
```

## Security Events

```text
security.login_failed
security.permission_denied
security.user_locked
```

## System Events

```text
system.backup_completed
system.health_check_failed
system.service_started
```

---

# 5. Event Naming Standard

Events use the format:

```text
domain.entity.action
```

Examples:

```text
student.enrolled

finance.invoice.issued

procurement.request.approved

workflow.completed
```

Rules:

- lowercase
- dot separated
- business terminology
- past tense
- stable names

Avoid implementation terminology.

---

# 6. Event Envelope

Every event follows the standard envelope.

```json
{
  "event_id":"uuid",
  "event_type":"student.enrolled",
  "event_version":1,
  "occurred_at":"timestamp",
  "tenant_id":"uuid",
  "aggregate_type":"student",
  "aggregate_id":"uuid",
  "actor_id":"uuid",
  "correlation_id":"uuid",
  "causation_id":"uuid",
  "data":{},
  "metadata":{}
}
```

---

# 7. Correlation IDs

Correlation IDs connect an entire business transaction.

Example:

```text
Admission Application

↓

Student Created

↓

Workflow Started

↓

Task Created

↓

Notification Sent

↓

Audit Written
```

All share the same Correlation ID.

---

# 8. Causation IDs

A causation ID identifies the event that directly caused another event.

Example:

```text
student.enrolled
        ↓
invoice.issued
        ↓
payment.requested
```

Each downstream event references its parent.

---

# 9. Aggregate Types

Every event belongs to a business aggregate.

Examples:

```text
student

guardian

invoice

payment

supplier

purchase_order

employee

workflow

task
```

---

# 10. Event Versioning

Every event includes:

```text
event_version
```

Version 1 begins with:

```text
1
```

Breaking payload changes require a new event version.

Backward-compatible additions do not.

---

# 11. Transactional Event Outbox

The Version 1 platform uses the Transactional Outbox Pattern.

Required table:

```text
event_outbox
```

Core fields:

```text
id
tenant_id
event_type
event_version
aggregate_type
aggregate_id
payload
metadata
actor_id
correlation_id
causation_id
occurred_at
published_at
status
attempt_count
last_error
created_at
```

Status values:

```text
pending
processing
published
retry_scheduled
failed
dead_lettered
cancelled
```

Events remain in the outbox until successfully published.

---

# 12. Outbox Dispatcher

The dispatcher is responsible for:

- Reading pending events
- Locking records safely
- Publishing events
- Updating publish status
- Scheduling retries
- Recording failures
- Updating diagnostics

The dispatcher must be:

- Idempotent
- Horizontally scalable
- Fault tolerant
- Tenant aware

---

# 13. Event Dispatch Flow

```text
Business Transaction
        ↓
Event Outbox
        ↓
Dispatcher
        ↓
Internal Event Bus
        ↓
Subscribers
        ↓
Tasks
Notifications
Reports
Search
Integrations
```

Business transactions never publish directly.

---

# 14. Subscriber Registration

Subscribers register using:

```text
subscriber_key
event_type
minimum_version
maximum_version
handler
retry_policy
dead_letter_policy
active
```

Example:

```text
notification-service

student.enrolled

v1
```

Multiple subscribers may listen to the same event.

---

# 15. Subscriber Processing

Every subscriber maintains its own processing history.

Suggested table:

```text
event_subscriber_deliveries
```

Fields:

```text
event_id

subscriber_key

status

attempt_count

completed_at

last_error

next_attempt

correlation_id
```

One subscriber failing must never block another subscriber.

---

# 16. Idempotent Processing

Subscribers must tolerate duplicate delivery.

Strategies include:

- Unique constraints
- Processed-event tables
- Upserts
- Aggregate version checks
- Natural business keys

Example:

```text
payment.received
```

The receipt generator should never create duplicate receipts.

---

# 17. Event Ordering

Global ordering is **not guaranteed**.

Ordering should instead rely upon:

- Aggregate ID
- Aggregate Version
- Occurred Timestamp

Example:

```text
Invoice Version 5
```

must not be processed before

```text
Invoice Version 4
```

unless specifically supported.

---

# 18. Retry Policy

Retryable failures:

- Timeout
- Network failure
- Provider unavailable
- Temporary database issue
- Temporary authentication failure

Permanent failures:

- Invalid payload
- Unsupported version
- Invalid business reference
- Permission denied
- Configuration error

Retry pattern:

```text
Immediate

↓

30 seconds

↓

2 minutes

↓

10 minutes

↓

Dead Letter
```

Retry policy should be configurable.

---

# 19. Dead Letter Queue

Required table:

```text
event_dead_letters
```

Suggested fields:

```text
event_id

subscriber_key

tenant_id

failure_reason

attempt_count

last_error

status

resolved_by

resolved_at
```

Resolution states:

```text
open

retry_requested

resolved

cancelled
```

Administrators may:

- Retry
- Ignore
- Resolve
- Escalate

Every action is audited.

---

# 20. Event Replay

Replay allows historical events to be processed again.

Supported filters:

- Tenant
- Event Type
- Aggregate
- Date Range
- Subscriber

Replay use cases:

- Rebuild Search Index
- Rebuild Reports
- Recover Subscriber
- Replay Notifications
- Replay Integrations

Replay never bypasses:

- Permissions
- Tenant Isolation
- Idempotency

---

# 21. Event Contracts

Every published event is a contract between the publisher and its subscribers.

Each contract must define:

- Event name
- Event version
- Business meaning
- Publisher
- Owning module
- Aggregate type
- Required payload fields
- Optional payload fields
- Tenant context
- Security classification
- Expected subscribers

Event contracts must remain stable throughout their supported lifecycle.

---

# 22. Event Payload Design

Event payloads should contain only the information necessary for subscribers.

Good example:

```json
{
  "student_id": "uuid",
  "enrollment_id": "uuid",
  "grade_level_id": "uuid",
  "academic_year_id": "uuid",
  "status": "active"
}
```

Avoid publishing entire database rows or unrelated entities.

Subscribers requiring additional information should query the appropriate service
through approved APIs.

---

# 23. Event Security

Every event must enforce:

- Tenant isolation
- Authorization validation
- Schema validation
- Version validation
- Sensitive data protection
- Audit correlation

Sensitive information such as:

- Passwords
- Authentication tokens
- Payment credentials
- Medical notes
- Payroll details

must never appear in standard business events.

---

# 24. Event Classification

Events are classified according to sensitivity.

Suggested classifications:

```text
Public

Internal

Confidential

Restricted
```

Restricted events require:

- Authorized subscribers
- Additional auditing
- Reduced retention
- Encrypted transport where applicable

---

# 25. Workflow Integration

The Workflow Engine publishes events whenever workflow state changes.

Examples:

```text
workflow.started

workflow.step.assigned

workflow.step.completed

workflow.approved

workflow.rejected

workflow.cancelled

workflow.completed
```

Subscribers may:

- Generate tasks
- Send notifications
- Trigger integrations
- Update reports
- Refresh dashboards

---

# 26. Task Integration

Task events include:

```text
task.created

task.assigned

task.started

task.completed

task.overdue

task.cancelled
```

Subscribers may:

- Notify assignees
- Escalate overdue work
- Update workload dashboards
- Trigger follow-up workflows

---

# 27. Notification Integration

Business modules never communicate directly with notification providers.

Business flow:

```text
Business Event

↓

Notification Request

↓

Notification Platform

↓

Email

SMS

Push

WhatsApp

In-App
```

This architecture allows communication providers to change without affecting
business modules.

---

# 28. Integration Platform

External systems interact through the Integration Platform.

Example:

```text
finance.payment.requested

↓

Payment Adapter

↓

Stripe

↓

payment.provider.confirmed

↓

finance.payment.received
```

Provider-specific payloads are normalized before entering the platform.

Business services remain provider-independent.

---

# 29. Mobile Synchronization

Mobile applications subscribe only to events relevant to the authenticated user.

Synchronization must respect:

- Tenant boundaries
- User permissions
- Device registration
- Offline synchronization rules
- Conflict resolution policies

Not every internal event is synchronized to mobile devices.

---

# 30. Search and Reporting

Search and reporting services consume business events to maintain projections.

Examples:

```text
student.created

student.updated

invoice.issued

payment.received

employee.created
```

Projection failures must never roll back committed business transactions.

Projection rebuilds are performed through controlled event replay.

---

# 31. Event Diagnostics

The TEP Diagnostics Platform shall monitor the health of the event platform.

Minimum diagnostics include:

- Pending outbox events
- Published events per minute
- Failed publications
- Retry queue depth
- Dead-letter queue depth
- Average publish latency
- Subscriber processing latency
- Failed subscriber count
- Replay activity
- Stale dispatcher locks

Health states:

```text
Healthy
Degraded
Backlogged
Failed
Paused
```

Event diagnostics must be visible through the Diagnostics Platform.

---

# 32. Monitoring and Alerting

Operational alerts shall be generated for:

- Dispatcher failure
- Subscriber failure
- Excessive retries
- Dead-letter growth
- Publish latency exceeding thresholds
- Event backlog
- Queue starvation
- Integration failures
- Replay failures
- Tenant-specific processing failures

Alerts shall integrate with:

- Notifications Platform
- Diagnostics Platform
- Operations Dashboard

---

# 33. Event Retention

Event retention depends upon business classification.

Recommended retention:

| Event Category | Recommended Retention |
|----------------|----------------------|
| Operational | 3 Years |
| Financial | Statutory Requirement |
| Security | Security Policy |
| Audit Related | Audit Policy |
| Diagnostic | 90 Days |
| Dead Letters | Until Resolved + Retention Period |

Retention policies shall comply with applicable legal and regulatory requirements.

---

# 34. Event Archiving

Historical events may be archived after the active retention period.

Archived events shall:

- Remain immutable
- Preserve event integrity
- Preserve correlation identifiers
- Preserve tenant ownership
- Remain available for legal or audit recovery

Archived events shall not impact operational performance.

---

# 35. Performance Requirements

The Event Platform shall support:

- Batched publication
- Concurrent subscribers
- Configurable batch sizes
- Horizontal dispatcher scaling
- Priority processing where appropriate
- Efficient indexing
- Back-pressure management

Recommended database indexes:

```text
event_type
tenant_id
aggregate_type
aggregate_id
occurred_at
processing_status
available_at
```

---

# 36. Event Failure Isolation

Failure of one subscriber shall never:

- Roll back the originating business transaction
- Prevent other subscribers from processing
- Block unrelated tenants
- Stop dispatcher execution
- Prevent future events from being processed

Subscribers shall fail independently.

---

# 37. Event Processing Permissions

Administrative event operations require explicit permissions.

Examples:

```text
events.view

events.replay

events.retry

events.resolve_dead_letter

events.manage_subscribers

events.view_diagnostics
```

Viewing sensitive event payloads requires additional authorization.

---

# 38. Event Testing

Every event publisher shall test:

- Event creation
- Transaction rollback
- Event version
- Tenant context
- Correlation ID
- Payload validation
- Audit linkage

Every subscriber shall test:

- Duplicate delivery
- Retry handling
- Dead-letter handling
- Invalid payload
- Unsupported version
- Tenant isolation
- Replay
- Concurrent processing

---

# 39. Local Development

Developers shall be able to run the event platform locally using:

- In-process dispatcher
- Mock subscribers
- Test outbox
- Replay simulation
- Failure simulation
- Retry simulation

Local development must preserve production-equivalent behavior wherever practical.

---

# 40. Environment Strategy

The event platform supports the following environments:

```text
local

development

testing

staging

production
```

Rules:

- Production events never enter non-production environments.
- Replay remains environment-specific.
- Subscribers are environment aware.
- Event identifiers remain globally unique.
- Test integrations never invoke production providers.

---

# 41. Event Governance

Every new business event must have:

- A unique event name
- An owning product
- An owning module
- A business description
- An event version
- A payload definition
- A security classification
- A retention policy
- Documented subscribers
- Test coverage
- Documentation

Breaking changes require a new event version.

Deprecated events shall remain supported until their published retirement date.

---

# 42. Event Catalog

The Tavaro Enterprise Platform maintains a centralized Event Catalog.

Each catalog entry includes:

- Event Name
- Version
- Publisher
- Aggregate
- Business Description
- Payload Schema
- Security Classification
- Expected Subscribers
- Retention Policy
- Documentation Reference

Recommended storage location:

```text
docs/schemas/events/
```

Example:

```text
student.enrolled.v1.schema.json
finance.payment.received.v1.schema.json
procurement.request.approved.v1.schema.json
workflow.completed.v1.schema.json
```

The Event Catalog is the authoritative registry for all business events.

---

# 43. Initial SchoolOS Event Catalog

The initial Version 1 event catalog includes, but is not limited to:

## Identity

```text
identity.user.created
identity.user.invited
identity.user.activated
identity.user.suspended
identity.role.changed
```

## Students

```text
student.created
student.updated
student.enrolled
student.transferred
student.withdrawn
student.graduated
```

## Admissions

```text
application.submitted
application.reviewed
application.approved
application.rejected
admission.offer.accepted
```

## Attendance

```text
attendance.recorded
attendance.corrected
attendance.threshold.exceeded
```

## Academics

```text
assessment.created
assessment.submitted
assessment.approved
report.generated
```

## Finance

```text
invoice.issued
payment.requested
payment.received
payment.failed
refund.completed
```

## Procurement

```text
procurement.request.created
procurement.request.approved
purchase_order.issued
goods.received
supplier.selected
```

## Human Resources

```text
employee.created
employee.assigned
leave.approved
payroll.approved
```

## Inventory

```text
inventory.received
inventory.issued
inventory.adjusted
inventory.reorder.required
```

## Workflow

```text
workflow.started
workflow.step.assigned
workflow.completed
workflow.rejected
```

## Tasks

```text
task.created
task.assigned
task.completed
task.overdue
```

## Documents

```text
document.created
document.approved
document.signed
document.archived
```

## Integrations

```text
integration.connected
integration.failed
integration.webhook.received
integration.provider.recovered
```

The catalog will expand as additional SchoolOS modules are implemented.

---

# 44. Production Readiness

The Event Platform is production-ready only when:

- Transactional Outbox implemented
- Dispatcher implemented
- Safe locking implemented
- Subscriber registration implemented
- Retry handling implemented
- Dead-letter handling implemented
- Replay implemented
- Correlation IDs implemented
- Versioning implemented
- Diagnostics implemented
- Monitoring implemented
- Security validated
- Tenant isolation validated
- Performance validated
- Documentation complete

---

# 45. Future Evolution

The Version 1 architecture is intentionally implementation independent.

Future versions may replace the internal dispatcher with:

- RabbitMQ
- Apache Kafka
- Azure Service Bus
- AWS EventBridge
- Google Pub/Sub
- NATS

Business modules shall remain unchanged because they depend only on the TEP Event abstraction.

---

# 46. Cross-Platform Adoption

All Tavaro products shall use the shared Event Platform.

Including:

- SchoolOS
- FarmOS
- ContractorOS
- ClinicOS
- WarehouseOS
- HospitalityOS
- Future Tavaro products

No product shall implement an independent event architecture.

---

# 47. Compliance

The Event Platform shall support:

- Audit requirements
- Financial regulations
- Education records retention
- Data protection legislation
- Security monitoring
- Disaster recovery
- Legal discovery

Event history forms part of the enterprise operational record.

---

# 48. Architecture Baseline

The Enterprise Event Architecture forms part of:

- Tavaro Enterprise Platform Version 1
- SchoolOS Version 1 Architecture Baseline

All implementations shall comply with this document unless an approved Architecture Decision Record (ADR) explicitly authorizes an exception.

---

# 49. Architecture Decision

The Tavaro Enterprise Platform adopts the following Event Architecture principles:

- Events represent immutable business facts.
- Business transactions publish events through the Transactional Outbox Pattern.
- Delivery is at-least-once.
- Subscribers are idempotent.
- Events are versioned.
- Event contracts are governed.
- Correlation IDs connect distributed operations.
- Tenant isolation is mandatory.
- Failures are isolated.
- Replay is supported.
- Diagnostics and monitoring are mandatory.
- Business modules remain loosely coupled through events.
- The Event Platform is a shared TEP capability.

This document is approved as the governing Enterprise Event Architecture for the
Tavaro Enterprise Platform Version 1 and SchoolOS Enterprise Version 1.