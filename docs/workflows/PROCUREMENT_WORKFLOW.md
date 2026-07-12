# SchoolOS Procurement Workflow

**Product:** SchoolOS Enterprise  
**Company:** Tavaro Group LLC  
**Version:** 1.0  
**Status:** Governing workflow specification  
**Owning Module:** Procurement  
**Platform Dependency:** Tavaro Enterprise Platform Workflow Engine

---

# 1. Purpose

This document defines the production procurement workflow for SchoolOS.

The workflow covers the full lifecycle from an internal purchase request through
approval, sourcing, purchasing, receiving, inspection, invoice matching,
payment authorization, and closure.

The procurement workflow must support:

- Department purchase requests
- Budget validation
- Approval thresholds
- Supplier sourcing
- Requests for quotation
- Quote comparison
- Supplier award
- Purchase orders
- Partial deliveries
- Goods receipt
- Quality inspection
- Inventory or asset registration
- Supplier invoice matching
- Payment authorization
- Exceptions and disputes
- Audit history
- Mobile receiving
- Executive reporting

The workflow is designed to prevent unauthorized purchasing, duplicate payments,
budget overruns, incomplete deliveries, and unverified supplier invoices.

---

# 2. Standard Procurement Lifecycle

```text
Draft Purchase Request
→ Submitted
→ Department Review
→ Budget Check
→ Approval
→ Sourcing Required
→ RFQ Issued
→ Quotations Received
→ Evaluation
→ Supplier Award
→ Purchase Order Created
→ Purchase Order Approved
→ Sent to Supplier
→ Delivery Pending
→ Goods Received
→ Inspection
→ Inventory or Asset Registration
→ Supplier Invoice Received
→ Three-Way Match
→ Payment Approval
→ Payment Recorded
→ Procurement Closed
```

Not every request must pass through every sourcing step.

Low-value purchases may follow a simplified route where permitted by school
policy.

High-value, restricted, capital, or sensitive purchases may require additional
approval, competitive sourcing, legal review, or board authorization.

---

# 3. Procurement Roles and Responsibilities

The procurement workflow separates requesting, approving, purchasing, receiving,
inspecting, and paying responsibilities.

This supports segregation of duties and reduces fraud and operational risk.

## Requester

The requester identifies a business need and creates the purchase request.

Typical requesters:

```text
Teacher
Department Head
Administrator
Facilities Officer
Laboratory Technician
Kitchen Manager
Transport Officer
ICT Officer
```

Responsibilities:

- Describe the business need
- Select the department and budget line
- Provide item quantities and specifications
- Provide the required date
- Attach supporting documents where relevant
- Submit the request
- Respond to clarification requests

The requester should not approve their own request unless explicitly permitted
under a low-value policy.

## Department Reviewer

The department reviewer confirms that the request is appropriate for the
department.

Responsibilities:

- Validate the need
- Confirm the specification
- Confirm department ownership
- Check for duplicate requests
- Confirm priority
- Return incomplete requests
- Recommend approval or rejection

## Budget Reviewer

The budget reviewer confirms that sufficient budget is available.

Responsibilities:

- Validate the budget line
- Check committed and available balances
- Identify overspending risk
- Reserve budget where approved
- Escalate budget exceptions
- Reject requests without funding where policy requires

## Procurement Officer

The procurement officer manages sourcing and purchasing.

Responsibilities:

- Review approved requests
- Determine sourcing method
- Create RFQs
- Invite suppliers
- Record quotations
- Coordinate evaluation
- Prepare supplier award recommendations
- Create purchase orders
- Monitor supplier delivery
- Maintain procurement records

## Procurement Approver

The procurement approver authorizes procurement actions according to approval
thresholds.

Responsibilities:

- Review value, risk, urgency, and policy compliance
- Approve or reject purchase requests
- Approve supplier awards
- Approve purchase orders
- Escalate restricted or high-value purchases
- Record approval reasons

## Supplier Evaluator

The supplier evaluator participates in quotation evaluation.

Responsibilities:

- Review price
- Review quality
- Review delivery terms
- Review warranty and support
- Review supplier risk
- Record evaluation scores
- Declare conflicts of interest

Evaluation committees may include multiple evaluators.

## Goods Receiver

The goods receiver records delivered quantities.

Responsibilities:

- Confirm purchase order reference
- Record delivered quantities
- Record damaged or missing items
- Capture delivery documentation
- Create the goods received note
- Route items for inspection where required

The goods receiver should not normally approve supplier payment.

## Inspector

The inspector verifies quality, condition, and specification compliance.

Responsibilities:

- Inspect delivered goods or services
- Record accepted and rejected quantities
- Capture evidence
- Record inspection findings
- Approve or reject delivery quality
- Create exceptions for nonconforming goods

## Inventory or Asset Officer

The inventory or asset officer registers accepted items.

Responsibilities:

- Receive consumables into stock
- Create inventory transactions
- Create asset records
- Assign storage locations
- Generate barcode or QR identifiers where required
- Record serial numbers, warranties, and useful-life data

## Accounts Payable Officer

The accounts payable officer records and reviews supplier invoices.

Responsibilities:

- Record supplier invoices
- Verify invoice references
- Match invoice values to purchase orders and goods receipts
- Identify tax, quantity, and price differences
- Create payment requests
- Prevent duplicate invoice entry

## Payment Approver

The payment approver authorizes payment after successful matching and review.

Responsibilities:

- Review three-way match results
- Review exceptions
- Confirm supplier banking details
- Approve or reject payment
- Record approval reasons
- Escalate suspicious or high-risk payments

## Finance Officer

The finance officer records the completed financial transaction.

Responsibilities:

- Record supplier payment
- Allocate payment to the supplier invoice
- Update financial records
- Update budget commitments and actuals
- Support bank reconciliation
- close the financial portion of the procurement process

## System Administrator

The system administrator configures procurement policy but does not automatically
gain authority to approve procurement transactions.

Responsibilities:

- Configure roles and permissions
- Configure approval thresholds
- Configure workflow templates
- Configure supplier categories
- Maintain integrations
- Support diagnostics

## Segregation of Duties

The following combinations should normally be prevented or explicitly reviewed:

```text
Requester + Final Approver
Requester + Goods Receiver
Procurement Officer + Payment Approver
Goods Receiver + Payment Approver
Supplier Evaluator + Supplier Owner
Invoice Recorder + Payment Approver
```

Exceptions must be documented, permission-controlled, and auditable.