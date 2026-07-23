# Govardhana CDMS – Current State

## Current Version

**v2.3-preventive-care**

## Status

Stable Development Release

## Last Updated

23-Jul-2026

---

## 1. Project Information

**Project Name:** Govardhana CDMS  
**Purpose:** Cattle Data Management System for Govardhana Goshala  
**GitHub Repository:** `govardhana-cdms`

### Technology Stack

- Frontend: React + Vite
- Backend: Google Apps Script Web App
- Database: Google Sheets
- File and photo storage: Cloudinary and linked URLs where applicable
- Source control: GitHub
- Deployment: React static hosting + Google Apps Script Web App

---

## 2. Core Design Principles

1. `internal_id` is the permanent identity of every cattle.
2. Ear tag numbers may change during the life of the cattle.
3. Only the current active tag is stored in `cattle_master.tag_number`.
4. All historical tag changes are stored in `tag_history`.
5. Cattle lifecycle events must remain traceable.
6. Birth, admission, exit, reactivation and tag history must not overwrite historical records.
7. Google Sheets is the operational database.
8. Google Apps Script is the API and business-logic layer.
9. React is the primary application interface.
10. GitHub is the source of truth for frontend code and documentation.
11. Display dates follow `DD-MM-YYYY`.
12. Browser date inputs may use `YYYY-MM-DD`.
13. Toast notifications are preferred over browser alerts.
14. Forms and tables should use reusable UI components.

---

## 3. Current Application Modules

### 3.1 Authentication and Administration

#### Login

Status: Implemented

Features:

- User login interface
- Email and password authentication through Apps Script
- Logged-in user information retained for application use
- Logout option

Current limitations:

- Full role-based route protection is not yet implemented.
- Session timeout is not yet implemented.
- Fine-grained menu permissions are not yet implemented.

#### User Management

Status: Implemented

Features:

- View users
- Add users
- Update users
- Maintain basic user and role information

---

### 3.2 Dashboard

Status: Implemented

Features:

- Application landing page
- High-level cattle and operational summaries
- Navigation to core modules

Future enhancements:

- Management-level MIS dashboard
- Trend charts
- Alert summaries
- Role-specific dashboards

---

## 4. Herd Management

### 4.1 Master Cattle Data

Status: Completed

Features:

- Complete cattle register
- Current tag number
- Government UID
- Previous tag numbers
- Cattle name
- Gender
- Category
- Breed
- Colour
- Date of birth
- Shed
- Status
- Adoption status
- Photo
- Disability information
- Remarks
- Search and filters
- Pagination
- Details modal
- Edit workflow
- Admission and lifecycle information
- Certificate actions

---

### 4.2 Cattle Registration

Status: Completed

Supported admission types:

- Born at Goshala
- Purchase
- Donation
- From Farmer
- Rescue / Slaughter House

Features:

- Auto-generated sequential internal IDs
- Duplicate internal-ID protection
- Duplicate tag-number protection
- Admission-type-specific forms
- Admission source details
- Age-at-admission capture
- Weight capture
- Purchase price where applicable
- Parent details for cattle born at the Goshala
- Linked birth transaction
- Photo upload
- Health and disability information
- Backend success validation
- Standard save, success and error notifications

Born-at-Goshala workflow:

- Reads eligible calves from `birth_log`
- Registration allowed after 21 days
- Overdue registration identification
- Birth details carried into cattle registration
- Parent and breed information retained
- `birth_log.status` updated after successful registration
- `cattle_origins.linked_birth_id` stores the birth transaction ID

---

### 4.3 Pedigree Viewer

Status: Implemented

Features:

- Search cattle by available identifiers
- View parentage details
- Display dam and sire information
- Support pedigree and lineage review

---

### 4.4 Calving Log / New Born

Status: Completed

Release: `v2.0-newborn-workflow`

Features:

- Birth recording
- Date and time of birth
- Mother identification
- Mother eligibility validation
- Mother breed capture
- Father source:
  - Own
  - Borrowed
  - Unknown
- Father identification
- Father-owner information
- Father breed management
- Automatic calf-breed calculation
- Calf gender
- Calf weight
- Calf colour
- Delivery type
- Disability details
- Birth status
- Remarks
- Photo upload
- Edit birth record
- Search and filters
- KPI cards
- Pagination
- Registration eligibility after 21 days
- Overdue registration tracking
- Exclusion of abortion and stillborn records from registration workflow

Mother eligibility rules include:

- Female cattle
- Active status
- Minimum eligible age
- Minimum calving-gap validation

---

### 4.5 Tag Management

Status: Completed

Release: `v1.9-tag-history`

Features:

- Update current ear tag
- Permanent cattle identity through `internal_id`
- Complete tag-history register
- Historical tag search
- Old-tag and new-tag traceability
- Change date
- Change reason
- Changed-by information
- Remarks
- Tag-history count
- Latest-first history
- Standard confirmation dialog
- Current active tag updated in `cattle_master`

---

## 5. Lifecycle Management

### 5.1 Exit and Deregistration

Status: Completed

Supported exit types:

- Sale
- Transfer
- Farmer Handover
- Death
- Deactive / other approved exit types

Features:

- Exit date and time
- Exit category
- Cause details
- Receiving party details
- Contact and address
- Amount
- Reference number
- Gate pass
- Receipt number
- Remarks
- Teeth details
- Pregnancy information
- Market value
- Photo
- Lifecycle history preservation

---

### 5.2 Reactivation

Status: Completed

Release: `v1.8-reactivation`

Features:

- Reactivate previously exited cattle
- Reactivation date
- Reason for return
- Returned-from details
- Previous exit reference
- Status restored to Active
- Reactivation history stored
- Reactivation details displayed in cattle history
- Reactivation certificate

Restriction:

- Cattle recorded as dead cannot be reactivated.

---

## 6. Certificates

Status: Completed

Available certificates:

- Birth Certificate
- Incoming Certificate
- Sale Certificate
- Transfer Certificate
- Farmer Handover Certificate
- Death Certificate
- Reactivation Certificate

Features:

- Standard certificate layout
- Certificate numbering
- Event-specific information
- Print and PDF support
- Lifecycle traceability

---

## 7. Production and Operations

### 7.1 Milk Production

Status: Implemented

Features:

- Milk-production entries
- Date-based records
- Shed and production information
- Add and update workflows
- Search and reporting support

---

### 7.2 Nutrition

Status: Implemented

Features:

- Feeding and nutrition records
- Daily feed information
- Add and update workflow
- Date-based operational records

Future review:

- Confirm whether stock, feed formulation and cost tracking should be added.
- Standardize reports and management metrics.

---

### 7.3 Waste Management

Status: Implemented

Features:

- Bio-waste and by-product records
- Gaumaya, Gomutra, slurry and related outputs
- Date-based records
- Add and update workflow where configured

Future review:

- Standardized reporting
- Quantity and value analysis
- Customer or destination tracking

---

## 8. Medical Management

### 8.1 Clinical Records

Status: Completed  
Release: `v2.2.1-clinical-records`

Purpose:

Maintain veterinary treatment history for sick or injured cattle.

Features:

- Standard page header and layout
- KPI cards:
  - Total Records
  - Selected Period
  - Today's Cases
  - Cattle Treated
  - Doctors
- From and To date filtering
- Search by:
  - Cattle ID
  - Disease
  - Symptom
  - Medicine
  - Doctor
- Disease and symptom filters
- Doctor filter
- Row-click details modal
- Separate edit action
- Cattle validation against Master Cattle
- Lookup by:
  - Tag Number
  - Internal ID
  - Government UID
  - Previous Tag Numbers
  - Historical numeric IDs where leading zeroes were removed
- New records allowed only for valid Active cattle
- Historical records may be edited without changing the original cattle identity
- Read-only cattle summary
- Searchable disease and symptom selection
- Searchable medicine selection
- Doctor suggestions
- Multiline clinical remarks
- Saving, success and error toasts
- Add and Edit buttons disabled during save
- Sequential transaction IDs:
  - `MED-00001`
  - `MED-00002`
  - etc.
- Cattle IDs written as plain text to preserve leading zeroes

Current limitations:

- Symptoms and diagnosis are stored together in the existing `symptom` field.
- Medicine dosage, unit, frequency, duration and route are not separately structured.
- Clinical examination findings are not separately structured.
- Treatment outcome and follow-up workflow are deferred.
- Clinical timeline integration into Master Cattle is deferred.

---

### 8.2 Preventive Care

Status: Completed  
Release: `v2.3-preventive-care`

Purpose:

Maintain preventive-care events, campaigns, coverage and next schedules.

Supported care types:

- Vaccination
- Deworming
- Vitamin Supplementation
- Mineral Supplementation
- Other Preventive Treatment

Features:

- Standard Preventive Care page
- KPI cards:
  - Total Events
  - Selected Period
  - Vaccination
  - Deworming
  - Vitamin
  - Mineral
  - Upcoming
  - Overdue
- Search
- From and To date filters
- Care Type filter
- Medicine filter
- Event Status filter
- Due Status filter
- Add workflow
- Edit workflow
- Details modal
- Pagination
- Event ID
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
- Automatically calculated excluded count
- Next schedule date
- Doctor or administering person
- Event status
- Remarks
- Created and updated audit information
- Sequential event IDs:
  - `PC-000001`
  - `PC-000002`
  - etc.

Event statuses:

- Draft
- Completed
- Cancelled

Status interpretation:

- Draft: planned or incomplete event
- Completed: preventive-care activity administered
- Cancelled: planned event abandoned

Next Schedule interpretation:

- Next Due
- Due Today
- Next Dose Overdue
- Not Scheduled
- Not Finalised
- Cancelled

Important:

A record may correctly show:

- Event Status: Completed
- Next Schedule: Next Dose Overdue

This means the earlier event was completed, but the following scheduled cycle is overdue.

---

### 8.3 Medicines Master

Status: Implemented

Features:

- Maintain medicine names used by Clinical Records and Preventive Care
- Searchable medicine selection
- Reuse across medical modules

Future enhancement:

- Inventory quantity
- Batch-level stock
- Purchase and issue transactions
- Expiry alerts
- Low-stock alerts
- Automatic stock deduction

---

### 8.4 Preventive Care Master

Status: Completed

Sheet:

`preventive_care_types`

Features:

- Care Type ID
- Care Type Name
- Description
- Display Order
- Active / inactive status
- Remarks
- Add and update workflow
- Duplicate-name validation
- Sequential IDs:
  - `PCT-001`
  - `PCT-002`
  - etc.

---

### 8.5 Symptoms Master

Status: Implemented

Features:

- Maintain reusable disease and symptom values
- Searchable selection in Clinical Records
- Active / inactive master-data support where configured

---

## 9. Other Operational Modules

### 9.1 Mortality Register

Status: Implemented

Features:

- Death and mortality records
- Date-based register
- Cattle and cause information
- Links to cattle lifecycle records

Future review:

- Mortality analytics
- Cause trends
- Age-group analysis
- Management dashboard

---

### 9.2 Sponsorship / Dattu Yojana

Status: Implemented

Features:

- Sponsorship records
- Cattle-linked sponsorship information
- Add and update workflows
- Sponsorship-related certificate and reporting support

Future review:

- Payment tracking
- Renewal alerts
- Sponsor communication
- Outstanding amount tracking

---

## 10. Masters and Configuration

### Rates

Status: Implemented

Purpose:

Maintain operational rate configuration used by relevant modules.

### Weight Scale

Status: Implemented

Purpose:

Maintain weight-related configuration and reference data.

### Sheds

Status: Implemented

Features:

- Add shed
- Update shed
- Delete shed
- Reuse shed master in cattle and operational modules

---

## 11. Reports

Status: Partially Implemented

Available or partially available:

- Birth Register
- Death Register
- Active Cattle Register
- Tag History Register
- Exit Register
- Milk-related reports
- Sponsorship reports
- Certificate printing

Known gaps:

- Unified Reports page requires full review.
- Some reports may still use static or partial data.
- Management-level MIS reports are pending.
- Export formats need standardization.
- Report permissions are pending.

---

## 12. UI Standardization Status

Status: Substantially Completed

Reusable components include:

- `PageHeader`
- `MetricCard`
- `SectionCard`
- `StatusBadge`
- `FormActions`
- `ConfirmDialog`

Standards implemented:

- Standard page titles and descriptions
- Primary action buttons
- KPI cards
- Search and filter panels
- Standard table headers
- Zebra-striped rows
- Sticky table headers
- Pagination
- Add/Edit modals
- Details modals
- Toast notifications
- Loading states
- Empty states
- Required-field validation
- Saving-state button disablement
- Display dates in `DD-MM-YYYY`
- Browser date inputs in `YYYY-MM-DD`

---

## 13. Current Known Gaps

### Authentication and Security

- Full role-based permissions
- Route protection
- Menu-level permissions
- Session timeout
- Password-security review
- API-access restrictions

### Reports and Dashboards

- Complete Reports module
- Management MIS dashboard
- Standardized exports
- Trend analysis
- Alerts and exceptions

### Clinical Workflow

- Separate symptoms and diagnosis
- Structured medicine dosage
- Frequency and duration
- Clinical examination
- Follow-up workflow
- Outcome and recovery status
- Attachments
- Animal Health Timeline

### Medicine Management

- Medicine inventory
- Stock receipts
- Stock issues
- Batch-level stock
- Expiry alerts
- Low-stock alerts
- Automatic consumption posting

### Rollout Preparation

- User Acceptance Testing
- User manual
- Training
- Backup and recovery plan
- Production checklist
- Data-quality review
- Access-control review

---

## 14. Latest Stable Release

### v2.3-preventive-care

Release Date:

23-Jul-2026

Major features:

- Preventive Care Log
- Preventive Care Types Master
- Vaccination workflow
- Deworming workflow
- Supplementation workflow
- Coverage tracking
- Next Schedule tracking
- Draft, Completed and Cancelled statuses
- Search, filters, metrics and pagination
- Add, Edit and Details workflows
- Backend sequential event IDs
- Audit fields

---

## 15. Suggested Next Step

Before starting the next feature sprint:

1. Commit and tag `v2.3-preventive-care`.
2. Review every sidebar module.
3. Confirm whether each module is:
   - Completed
   - Requires modernization
   - Requires backend completion
   - Requires reporting only
4. Select the next sprint based on verified gaps.