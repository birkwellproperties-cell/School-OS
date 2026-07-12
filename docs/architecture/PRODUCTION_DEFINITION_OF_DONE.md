# Production Definition of Done

A SchoolOS feature is production-ready only when all applicable requirements pass.

## Data

- Schema migration exists
- Foreign keys are defined
- Constraints prevent invalid states
- Indexes support expected queries
- Tenant ownership is explicit
- RLS policies are enabled and tested
- Sensitive data is appropriately restricted

## Business logic

- Validation is centralized
- Permission checks are enforced
- Workflow transitions are controlled
- Duplicate submissions are prevented
- Sensitive operations are idempotent where necessary
- Audit events are generated

## User experience

- Desktop layout complete
- Tablet layout complete
- Mobile layout complete
- Loading state complete
- Empty state complete
- Error state complete
- Success feedback complete
- Accessibility reviewed
- Destructive actions require confirmation

## Engineering

- Service/repository boundary exists
- Errors are normalized
- Components remain maintainable
- Tests cover critical rules
- Production build passes
- No secrets are committed
- Documentation is updated

## Release

- Migration reviewed
- Smoke test completed
- Rollback path considered
- Git checkpoint created
- Release notes added where appropriate