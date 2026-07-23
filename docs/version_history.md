
---

# 7. `docs/version_history.md`

```markdown
# Govardhana CDMS – Version History

## Last Updated

23-Jul-2026

---

# v2.3 – Preventive Care

Released: 23-Jul-2026

## Highlights

- Preventive Care Log
- Vaccination
- Deworming
- Vitamin Supplementation
- Mineral Supplementation
- Other Preventive Treatment
- Preventive Care Types Master
- Medicine integration
- Coverage tracking
- Next Schedule tracking
- Event Status workflow
- Search and filters
- KPI cards
- Add, Edit and Details modals

## Frontend

- Replaced legacy Vaccine page
- Added standard Preventive Care page
- Added Care Type filter
- Added Medicine filter
- Added Event Status filter
- Added Due Status filter
- Added automatic excluded count
- Added Event Status badges
- Added Next Schedule badges
- Added audit information
- Added pagination
- Added toast notifications

## Backend

- Added `Repo_PreventiveCareLog.gs`
- Added sequential `PC-######` IDs
- Added header validation
- Added backend record validation
- Added date and medicine-expiry validation
- Added audit fields
- Added controller actions
- Removed legacy vaccine repository functions

---

# v2.2.1 – Clinical Records

Released: Jul-2026

## Highlights

- Clinical Records modernization
- Standard page header
- KPI cards
- Date-range filtering
- Search and filters
- Clickable rows
- Details modal
- Modern Add/Edit workflow
- Cattle validation
- Searchable symptoms
- Searchable medicines
- Doctor suggestions

## Backend

- Sequential `MED-#####` transaction IDs
- Removed ARRAYFORMULA dependency
- Leading-zero protection
- Add and Update workflow verification

## Deferred

- Separate symptoms and diagnosis
- Structured dosage
- Frequency and duration
- Follow-up and outcome
- Clinical Health Timeline

---

# v2.0 – New Born Workflow

Released: 03-Jul-2026

## Highlights

- Birth Management
- Parentage Tracking
- Father Source
- Father Breed
- Automatic Calf Breed
- Mother Validation
- Registration Eligibility
- Overdue Registration Tracking
- KPI Dashboard
- Search and Filters
- Pagination
- Edit Birth Record
- Photo Upload

## Backend

- Improved `birth_log`
- Standardized validation
- Improved parent and calf mapping
- Removed blank-row issues
- Removed debug logs

---

# v1.10 – Registration UI

Released: Jun-2026

## Highlights

- Cattle Registration redesign
- SectionCard forms
- Admission-type-specific sections
- Dynamic form fields
- Origin-data integration
- Details modal improvements
- Saving-state improvements
- Photo persistence

---

# v1.9 – Tag History

Released: 21-Jun-2026

## Highlights

- Multiple Tag Management
- Tag History
- Historical Tag Search
- Tag Change Count
- Latest-first history
- Confirmation Dialog

## Backend

- `tag_history` integration
- Active-tag update in `cattle_master`
- Tag-history APIs

---

# v1.8 – Reactivation

Released: 19-Jun-2026

## Highlights

- Reactivation Workflow
- Reactivation History
- Reactivation Certificate
- Active-status restoration
- Lifecycle-history preservation

---

# v1.7 – Certificates

Released: Jun-2026

## Highlights

- Birth Certificate
- Incoming Certificate
- Sale Certificate
- Transfer Certificate
- Farmer Handover Certificate
- Death Certificate
- Certificate numbering
- Print and PDF layouts

---

# v1.5 – Certificate Foundation

## Highlights

- Initial certificate framework
- Event-based certificate generation
- Common print layouts

---

# Current Stable Development Version

```text
v2.3-preventive-care