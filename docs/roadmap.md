# Govardhana CDMS – Product Roadmap

## Current Version

**v2.3-preventive-care**

## Last Updated

23-Jul-2026

---

# 1. Completed Releases

## v1.7 – Certificates

Status: Completed

Features:

- Birth Certificate
- Incoming Certificate
- Sale Certificate
- Transfer Certificate
- Farmer Handover Certificate
- Death Certificate

---

## v1.8 – Reactivation

Status: Completed

Features:

- Reactivation Workflow
- Reactivation History
- Reactivation Certificate
- Active-status restoration

---

## v1.9 – Tag History

Status: Completed

Features:

- Multiple Tag Management
- Tag History
- Historical Tag Search
- Tag Change Count
- Confirmation Dialog

---

## v1.10 – Registration UI

Status: Completed

Features:

- Standard registration layout
- Admission-type-specific forms
- SectionCard layout
- Validation improvements
- Save-state handling
- Details modal improvements

---

## v2.0 – New Born Workflow

Status: Completed

Features:

- Birth Recording
- Parentage Tracking
- Father Source
- Father Breed
- Automatic Calf Breed
- Mother Validation
- Registration Eligibility
- Overdue Registration Tracking
- Search
- Filters
- KPI Cards
- Pagination
- Edit
- Photo Upload

---

## Sprint 1.1 – UI Foundation Standardization

Status: Completed

Features:

- Reusable PageHeader
- Reusable MetricCard
- Reusable StatusBadge
- Reusable FormActions
- Standard page headers
- Standard KPI cards
- Standard filter panels
- Gender colour coding
- Table styling
- Zebra striping
- Selected-row highlighting

---

## Sprint 1.2 – Tag Management UI Standardization

Status: Completed

Features:

- Standardized Tag page
- SectionCard layout
- Selected-cattle summary
- Gender colouring
- Standardized form
- Standardized history table
- Standardized action buttons

---

## Sprint 1.3 – Cattle Registration UI

Status: Completed

Features:

- Admission-type-specific workflow
- Standard form sections
- Dynamic fields
- Improved details modal
- Source-data integration

---

## Sprint 1.4 – Cattle Registration Enhancement

Status: Completed

Features:

- Admission validations
- Born-at-Goshala workflow
- From Farmer workflow
- Photo persistence
- Age handling
- Parent details
- Improved success workflow

---

## Sprint 2.2.1 – Clinical Records

Status: Completed

Features:

- Standard Clinical Records page
- Metrics
- Date filters
- Search
- Disease and doctor filters
- Details modal
- Add and Edit modal
- Cattle validation
- Cattle summary
- Searchable symptoms
- Searchable medicines
- Doctor suggestions
- Toast notifications
- Sequential `MED-#####` IDs
- Leading-zero protection

---

## Sprint 2.3 – Preventive Care

Status: Completed

Features:

- Preventive Care Log
- Vaccination
- Deworming
- Vitamin Supplementation
- Mineral Supplementation
- Other Preventive Treatment
- Preventive Care Types Master
- KPI metrics
- Search and filters
- Add, Edit and View workflows
- Medicine integration
- Coverage tracking
- Automatic excluded count
- Event Status
- Next Schedule
- Sequential `PC-######` IDs
- Backend validation
- Audit fields

---

# 2. Current Position

No new feature sprint has been formally started after Sprint 2.3.

The immediate priority is to review the modules already present in the sidebar and classify each as:

- Completed
- Implemented but needs modernization
- Backend incomplete
- Reporting incomplete
- Future enhancement

---

# 3. Recommended Review Sprint

## Sprint 2.4 – Module Audit and Documentation Alignment

Status: Recommended

Objectives:

- Review every sidebar module
- Confirm frontend and backend completeness
- Confirm Add, Edit and View workflows
- Confirm validations
- Confirm table and modal standards
- Confirm Reports integration
- Identify duplicate or obsolete modules
- Update documentation
- Create a verified gap list
- Select the next sprint based on actual needs

Modules to review:

- Dashboard
- Master Cattle Data
- Cattle Registration
- Pedigree Viewer
- Calving Log
- Tag Management
- Lifecycle Management
- Milk Production
- Nutrition
- Waste Management
- Clinical Records
- Preventive Care
- Mortality Register
- Sponsorship
- Reports
- User Management
- Rates
- Medicines
- Preventive Care Master
- Symptoms
- Weight Scale
- Sheds

---

# 4. Candidate Future Sprints

The order below is provisional and should be confirmed after the module audit.

---

## Authentication and Role Management

Status: Pending

Potential scope:

- Admin Role
- Supervisor Role
- Data Entry Role
- Viewer Role
- Route Protection
- Menu Permissions
- Page Permissions
- Session Timeout
- Login Audit
- Password Security Review

---

## Reports Modernization

Status: Pending

Potential scope:

- Active Cattle Register
- Complete Cattle Register
- Birth Register
- Tag Change Register
- Herd Exit Register
- Reactivation Register
- Death Register
- Milk Production Report
- Nutrition Report
- Waste Management Report
- Clinical Records Report
- Preventive Care Register
- Upcoming Preventive Care
- Overdue Preventive Care
- Sponsorship Report
- Export to CSV
- Print / PDF
- Standard report filters

---

## Management Dashboard

Status: Pending

Potential scope:

- Total Herd
- Active Cattle
- Admission trends
- Exit trends
- Birth trends
- Mortality trends
- Milk-production trends
- Clinical-case trends
- Preventive-care compliance
- Sponsorship summary
- Alerts and exceptions

---

## Clinical Workflow Enhancement

Status: Future

Potential scope:

- Separate Symptoms and Diagnosis
- Clinical Examination
- Temperature
- Weight
- Structured Medicine Details
- Dosage
- Unit
- Frequency
- Duration
- Administration Route
- Treatment Status
- Follow-up Date
- Outcome
- Attachments
- Animal Health Timeline

---

## Medicine Inventory

Status: Future

Potential scope:

- Medicine Master enhancement
- Stock Receipt
- Stock Issue
- Batch Number
- Expiry Date
- Supplier
- Purchase Cost
- Current Stock
- Reorder Level
- Low-Stock Alerts
- Expiry Alerts
- Automatic stock deduction from:
  - Clinical Records
  - Preventive Care

---

## Reproductive Health

Status: Future

Potential scope:

- Heat Detection
- Artificial Insemination
- Natural Service
- Pregnancy Diagnosis
- Expected Calving Date
- Repeat Breeding
- Infertility
- Dry Period
- Reproductive History

---

## Daily Health Monitoring

Status: Future

Potential scope:

- Temperature
- Appetite
- Rumination
- Mobility
- Body Condition
- Mastitis Screening
- Isolation Status
- Daily Health Score
- Alerts

---

## Rollout Preparation

Status: Pending

Potential scope:

- User Acceptance Testing
- Master-data cleanup
- User Manual
- Training
- Backup Strategy
- Restore Test
- Access-control review
- Production Checklist
- Deployment Checklist
- Post-deployment support plan

---

# 5. Prioritization Principle

New sprints should be selected only after confirming:

1. The capability does not already exist.
2. It solves a real operational problem.
3. Required data fields are clear.
4. The Google Sheet schema is finalized.
5. The UI workflow is agreed.
6. Reports and permissions are considered.
7. Existing modules are not duplicated.