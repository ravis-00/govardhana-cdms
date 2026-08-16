# Govardhana CDMS – Current State

## Current Version

`v3.1-reports-alignment`

## Current UAT Checkpoint

`post-deployment-uat-round-1`

## Current Branch

`fix/post-deployment-uat-round-1`

## Previous Completed Development

- Feature branch: `feature/existing-reports-alignment`
- Feature commit: `eaaa8ee`
- Sidebar commit: `849db9a`
- Main merge commit: `702cd96`
- Existing Reports Alignment was merged into `main` and pushed.
- Google Apps Script updates were deployed.
- Post-deployment UAT Round 1 fixes are currently pending final commit, merge and frontend deployment.

## Current Status

The Existing Reports Alignment and Samvardhana Outgoing development is complete.

Post-deployment UAT Round 1 has also been completed and locally verified. The fixes include:

- Pedigree parent resolution
- Pedigree animal-status display
- Pedigree selected-cattle identification
- Newborn registration KPI reconciliation
- Herd Exit recorded-age display
- Mortality recorded-age display
- Death Certificate corrections
- Sidebar readability and responsiveness
- Standard cattle-colour filtering

The final frontend production build passed successfully with no warnings.

Last updated: 16-Aug-2026

---

## 1. Project Information

- Project: Govardhana CDMS
- Organisation: Madhava Srusti Rashtrotthana Goshala
- Purpose: Cattle and Dairy Management System
- Repository: `govardhana-cdms`

### Technology Stack

- Frontend: React + Vite
- Backend: Google Apps Script Web App
- Database: Google Sheets
- Image storage: Cloudinary and linked URLs
- Source control: GitHub
- Frontend hosting: Netlify
- Backend deployment: Google Apps Script Web App

---

## 2. Core Design Principles

1. `internal_id` is the permanent identity of each cattle.
2. Ear-tag changes are preserved in `tag_history`.
3. Lifecycle events must remain traceable.
4. Historical transactions must not be overwritten or physically deleted.
5. Cancelled operational and financial records remain available for audit.
6. Google Sheets is the operational database.
7. Google Apps Script is the API and business-logic layer.
8. React is the primary application interface.
9. The backend is authoritative for validation and financial calculation.
10. Financial rates are stored as transaction snapshots.
11. Display dates use `DD-MM-YYYY`.
12. Browser date inputs use `YYYY-MM-DD`.
13. Toast notifications are preferred over browser alerts.
14. Add/Edit actions are disabled while saving.
15. Protected operations follow role-based access rules.
16. Performance target is approximately 3–8 seconds.
17. Parentage remains visible even when a parent becomes inactive or dies.
18. Operational status must not erase historical lineage.
19. Cattle-sale reporting remains separate from by-product outgoing.
20. Existing predefined reports are improved instead of creating duplicate reporting systems.

---

## 3. Authentication and Administration

### Login

Status: Implemented

Features:

- Login using registered email or mobile number and password
- Logged-in user context
- Logout
- Inactive-user restriction
- Protected routes
- Normalized role handling

### Roles

- Super Admin
- Admin
- User
- Viewer

### User Management

Status: Implemented

Rules:

- User Management is restricted to Super Admin.
- Only Super Admin can create Admin or Super Admin users.
- Only Super Admin can activate or deactivate users.
- Viewer access is read-only.
- Passwords are excluded from user-list API responses.
- Duplicate email addresses are rejected.

---

## 4. Application Navigation and Responsive Shell

Status: Completed and UAT-verified

Features:

- Collapsible sidebar menu groups
- Active menu highlighting
- Desktop sidebar collapse
- Mobile drawer navigation
- Mobile background overlay
- Route-aware menu expansion
- Role-aware menu visibility
- User summary and Logout action
- Responsive main-content area

Post-deployment UAT improvements:

- Increased sidebar section-heading size
- Increased sidebar menu font size
- Improved sidebar text contrast
- Changed sidebar to a softer blue/slate colour
- Reduced mobile sidebar width
- Reduced mobile overlay darkness
- Restored full desktop content width after CSS regression
- Verified desktop and mobile navigation

---

## 5. Dashboard

Status: Implemented and performance-optimized

Features:

- Cattle and operational summaries
- Active cattle count
- Purebred rate
- Calf mortality
- Active sponsors
- Herd demographics
- Milk and feeding indicators
- Attention-required cards
- Vaccination-overdue routing
- Calf-registration-overdue routing
- Sponsorship-expiry routing
- Dashboard backend summary endpoint
- Cache support
- Source timing and record-count diagnostics

---

## 6. Herd Management

### Master Cattle

Status: Completed

Features include:

- Permanent internal cattle identity
- Current and previous tag tracking
- Government UID
- Name, gender, category, breed and colour
- Date of birth and age
- Shed and active status
- Admission and source information
- Disability details
- Photo
- Parentage
- Search, filters and pagination
- Row-click details
- Edit workflow
- Certificate actions

### Cattle Registration

Status: Completed

Supported admission types:

- Born at Goshala
- Purchase
- Donation
- From Farmer
- Rescue / Slaughter House

Features:

- Sequential internal IDs
- Duplicate protection
- Admission-type-specific fields
- Age-at-admission capture
- Source and purchase details
- Linked birth transaction
- Parent information
- Photo and health details
- Standardized base-colour selection

Standard cattle colours:

- Black
- White
- Grey
- Brown
- Red
- Reddish Brown
- Fawn
- Cream
- Mixed
- To be confirmed

### New Born / Calving Log

Status: Completed and UAT-verified

Features:

- Birth recording
- Mother eligibility validation
- Father source and breed
- Automatic calf-breed calculation
- Birth status
- Weight, colour and gender
- Disability and remarks
- Photo
- Edit, search, filters and pagination
- Registration eligibility
- Pending-registration tracking
- Overdue-registration tracking
- Registered and closed workflow counts

Post-deployment UAT correction:

- Pending Registration KPI now counts calves that are eligible for registration and not yet overdue.
- `BIRTH-445842` was used to verify the corrected KPI calculation.

### Tag Management

Status: Completed and UAT-verified

Features:

- Current-tag update
- Complete tag history
- Old/new tag traceability
- Change reason, date and user
- Confirmation workflow
- Search by current and previous tags
- Cattle filters
- Standardized colour filter

Post-deployment UAT correction:

- Removed repeated colour options caused by historical capitalization, spelling and compound-colour variations.
- The filter now displays only the approved Cattle Registration colour list.
- Historical colour values remain searchable through normalized matching.

### Herd Exit and Reactivation

Status: Completed and UAT-verified

Exit types include:

- Sold
- Transfer
- Farmer Handover
- Death
- Deactive

Rules:

- Exit history is preserved.
- Eligible exited cattle may be reactivated.
- Cattle recorded as dead cannot be reactivated.
- Cancellation and reactivation do not erase historical lifecycle events.

Post-deployment UAT improvements:

- Active Cattle Preview displays Recorded Age.
- Deregistration workflow displays recorded age from Master Cattle.
- Recorded age can be compared with Age by Teeth.
- Age is calculated using Date of Birth when available.
- Admission Date and Admission Age are used as fallback age sources.

### Pedigree Viewer

Status: Completed and UAT-verified

Features:

- Search by cattle name, tag number or internal ID
- Dam and sire resolution
- Parent and grandparent lineage
- Photo, name, tag and breed display
- Printable pedigree
- Selected-cattle Tag Number and Internal ID
- Status display for focus animal, parents and grandparents

Business rules:

- Pedigree is historical and is not restricted to active parents.
- An inactive or deceased parent remains visible in the lineage.
- Active animals display an Active badge.
- All recorded non-active states display an Inactive badge.
- Missing status displays Status unknown.
- The stored raw status remains available as supporting information.

Post-deployment UAT correction:

- Parent references are resolved using `cattle_origins`, `birth_log` and `cattle_master`.
- Parent lookup supports internal IDs and tag numbers.
- The previous Unknown-parent issue was corrected.
- UAT verification confirmed parent resolution for `RPCAT0955`.
- Status propagation was added to every pedigree node.
- Gowri (`RPCAT0960`) was used to verify selected-cattle Tag, Internal ID and status display.

### Individual Cattle Milk Yield

Status: Completed

Features:

- Lactation management
- Per-cattle milk-yield entry
- Cow history
- Monthly register
- Selected cattle/breed tracking
- Two-decimal precision
- Actual milked quantity tracking

Original checkpoint:

`18b97ba`

---

## 7. Veterinary

### Clinical Records

Status: Completed

Features:

- Active-cattle validation
- Disease, symptom, medicine and doctor search
- Date filters
- Add/Edit/Details
- Sequential transaction IDs
- Clinical remarks
- Toasts and saving states

### Preventive Care

Status: Completed

Supported care types include:

- Vaccination
- Deworming
- Vitamin Supplementation
- Mineral Supplementation
- Other Preventive Treatment

Features:

- Draft, Completed and Cancelled statuses
- Eligible, administered and excluded counts
- Medicine batch and expiry
- Dosage, unit and administration route
- Target group
- Next schedule
- Due and overdue interpretation
- Search, filters and pagination

### Mortality Register

Status: Completed and UAT-verified

Features:

- Death records
- Cause category and specific cause
- Date and time of death
- Certifying person
- Teeth details
- Age by Teeth
- Recorded Age at Death
- Pregnancy status
- Market value
- Photo and remarks
- Cattle lifecycle integration
- Death Certificate

Recorded-age rules:

1. Date of Birth is used when available.
2. Admission Date and Admission Age are used as fallback.
3. Age is calculated as of the Date of Death.
4. Fallback-derived age is marked as estimated.

Post-deployment UAT improvements:

- Mortality Details displays Recorded Age at Death.
- Age by Teeth is displayed separately.
- Death Certificate uses the label Date of Death.
- Death Certificate displays Age instead of Date of Birth.
- Estimated age is clearly marked.
- Missing values display Not recorded.
- Master-record age and Age by Teeth remain visible for reconciliation.

### Veterinary Masters

Implemented:

- Medicines
- Symptoms
- Preventive Care Types

---

## 8. Daily Operations

### Milk Production and Distribution

Status: Completed

Sheets:

- `milk_production`
- `milk_distribution`

Features:

- Morning and evening milk production
- Good milk and colostrum
- Shed-level production
- Temple distribution
- Workers and guests
- Calves and bulls
- Canteen and events
- By-product usage
- Out-pass quantity and number
- Add/Edit and date filtering

### Feeding

Status: Completed

Sheet:

`daily_feeding_log`

Features:

- Date, shed and feed type
- Quantity
- Recorded-by and remarks
- Add/Edit
- Filters and KPI calculations

### Bio Waste

Status: Completed

Sheet:

`bio_waste`

Features:

- Gaumaya
- Gaumutra
- Compost
- Slurry
- Source shed
- Destination
- Quantity and unit
- Sender and receiver
- Status and remarks
- Add/Edit and filtering

### Samvardhana Outgoing

Status: Completed and deployed

Purpose:

Record valued internal transfers and external sales originating from Govardhana/Sheds through the Samvardhana division.

Business flow:

```text
Govardhana / Sheds
        |
        v
Samvardhana
   |         |              |
   v         v              v
MSGP      Krushi      External Party
   |         |              |
   v         v              v
Internal valued      External sale
transfer             and billing