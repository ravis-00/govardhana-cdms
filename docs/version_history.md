# Govardhana CDMS Version History

## v2.0 - New Born Workflow
Released: 03-Jul-2026

Highlights
- New Birth Management
- Parentage Tracking
- Registration Rules
- Mother Validation
- KPI Dashboard
- Search & Filters
- Pagination

---

## v1.8 - Tag History

Highlights
- Multiple Tag Management
- Tag History
- Reactivation

---

## v1.5 - Certificates

Highlights
- Birth Certificate
- Sale Certificate
- Transfer Certificate
- Farmer Handover
- Reactivation Certificate

## v2.2.1-clinical-records

Clinical Records modernization completed.

### Frontend

- Renamed Medical Treatment presentation to Clinical Records.
- Added standard page header, metrics and filters.
- Added From/To date filtering.
- Added searchable disease, medicine, doctor and cattle filters.
- Added clickable rows and standardized Details modal.
- Added Master Cattle validation for new clinical records.
- Added cattle summary to Add/Edit and Details views.
- Replaced Ctrl-based multi-select controls with searchable checklists.
- Added standardized saving, success and error toast notifications.
- Preserved working Add and Edit workflows.

### Backend

- Removed spreadsheet ARRAYFORMULA dependency for medical transaction IDs.
- Added sequential `MED-#####` ID generation.
- Malformed, blank and timestamp-based IDs are ignored when calculating the next ID.
- Cattle IDs are stored as plain text to preserve leading zeroes.
- Add and Update treatment workflows verified.

### Deferred

- Separate Symptoms and Diagnosis fields.
- Medicine dosage, unit, frequency, duration and route.
- Treatment status, outcome and follow-up tracking.
- Clinical timeline integration in Master Cattle.