# Govardhana CDMS – Release Notes

---

# v2.3-preventive-care

## Release Date

23-Jul-2026

## Status

Completed and tested

## Added

### Preventive Care Log

- New `preventive_care_log` Google Sheet
- Sequential event IDs in `PC-######` format
- Vaccination records
- Deworming records
- Vitamin Supplementation
- Mineral Supplementation
- Other Preventive Treatment

### Event Details

- Administration date
- Care Type ID and name
- Medicine ID and name
- Medicine batch number
- Medicine expiry date
- Dosage
- Dosage unit
- Administration route
- Target group
- Eligible count
- Administered count
- Excluded count
- Next schedule
- Doctor or administering person
- Event status
- Remarks
- Audit fields

### Status Workflow

- Draft
- Completed
- Cancelled

### Next Schedule Workflow

- Next Due
- Due Today
- Next Dose Overdue
- Not Scheduled
- Not Finalised
- Cancelled

### Preventive Care Types Master

- New `preventive_care_types` sheet
- Add care type
- Update care type
- Active / inactive status
- Display order
- Duplicate-name validation
- Sequential `PCT-###` IDs

## Frontend

- Replaced legacy Vaccine page with Preventive Care
- Standard page header
- KPI cards
- Search
- From and To date filters
- Care Type filter
- Medicine filter
- Event Status filter
- Due Status filter
- Standard table
- Pagination
- Add modal
- Edit modal
- Details modal
- Care Type badges
- Event Status badges
- Due Status badges
- Automatic excluded-count calculation
- Saving, success and error toasts
- Save and Cancel buttons disabled during submission
- Event Status and Next Schedule clearly separated

## Backend

- Added `Repo_PreventiveCareLog.gs`
- Added:
  - `getPreventiveCareLog_()`
  - `addPreventiveCare_()`
  - `updatePreventiveCare_()`
- Added header validation
- Added sequential event-ID generation
- Added record locking during writes
- Added backend count validation
- Added date validation
- Added medicine-expiry validation
- Added audit-field handling
- Added header-based writes
- Added controller actions:
  - `getPreventiveCareLog`
  - `addPreventiveCare`
  - `updatePreventiveCare`
- Legacy Vaccine actions redirected temporarily to the new Preventive Care functions
- Removed old vaccine transaction repository logic

## Data Cleanup

- Removed malformed legacy vaccine test row
- Confirmed Preventive Care API returns only valid records

---

# v2.2.1-clinical-records

## Status

Completed and tested

## Frontend

- Renamed Medical Treatment presentation to Clinical Records
- Standard Govardhana page header and layout
- Added KPI cards:
  - Total Records
  - Selected Period
  - Today's Cases
  - Cattle Treated
  - Doctors
- Added From and To date filtering
- Added search by:
  - Cattle ID
  - Disease
  - Symptom
  - Medicine
  - Doctor
- Added Disease / Symptom filter
- Added Doctor filter
- Added clickable table rows
- Added Clinical Record Details modal
- Added separate Edit action
- Added Master Cattle validation
- Added read-only cattle summary
- Added searchable symptom and disease checklist
- Added searchable medicine checklist
- Added doctor suggestions
- Added multiline remarks and treatment instructions
- Added saving, success and error toasts
- Disabled Add and Edit actions while saving

## Cattle Lookup

Clinical Record cattle lookup supports:

- Tag Number
- Internal ID
- Government UID
- Previous Tag Numbers
- Historical numeric IDs where leading zeroes were removed

## Backend

- Added sequential IDs in `MED-#####` format
- Removed ARRAYFORMULA dependency
- Ignored blank, malformed and timestamp IDs while generating the next ID
- Stored cattle identifiers as plain text
- Verified Add and Update treatment workflows

## Deferred

- Separate Symptoms and Diagnosis
- Structured medicine dosage
- Dosage unit
- Frequency
- Duration
- Administration route
- Clinical examination
- Treatment status
- Follow-up date
- Outcome
- Attachments
- Animal Health Timeline

---

# v2.0-newborn-workflow

## Release Date

03-Jul-2026

## Added

- New Birth recording
- Parentage tracking
- Father-source management
- Father-breed recording
- Automatic calf-breed calculation
- Mother eligibility validation
- Registration eligibility after 21 days
- Overdue registration identification
- Search
- Filters
- KPI cards
- Pagination
- Action menu
- Edit birth records
- Photo upload

## Backend

- Improved `birth_log` reading
- Removed blank-row issues
- Standardized validation
- Improved data mapping
- Removed debug logs
- Added registration-link workflow

---

# v1.10-registration-ui

## Added

- Standardized Cattle Registration layout
- SectionCard-based admission forms
- Admission-type-specific data entry
- Improved validation
- Improved save feedback
- Add and Cancel button saving states
- Photo-upload integration
- Master Cattle details enhancements

---

# v1.9-tag-history

## Release Date

21-Jun-2026

## Added

- Tag History table
- Historical Tag Search
- Tag Change Register foundation
- Manual Changed By field
- Tag History Count
- Latest-first sorting

## Improved

- Current Tag Management workflow
- Tag update process
- Historical traceability

## UI

- Reusable ConfirmDialog component
- Removed browser confirmation popup

## Backend

- `tag_history` Google Sheet integration
- `cattle_master` active-tag update
- Tag History API endpoints

---

# v1.8-reactivation

## Release Date

19-Jun-2026

## Added

- Reactivation workflow
- Reactivation history tracking
- Reactivation certificate

## Improved

- Action Menu logic
- Deactive-cattle handling
- Lifecycle traceability

## Backend

- `cattle_exit_log` support for reactivation
- Reactivation API
- Active-status restoration

---

# v1.7-certificates

## Release Date

Jun-2026

## Added

- Birth Certificate
- Incoming Certificate
- Sale Certificate
- Transfer Certificate
- Farmer Handover Certificate
- Death Certificate

## Improved

- Certificate numbering
- Certificate layouts
- PDF and print workflows