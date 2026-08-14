# Govardhana CDMS – Current State

## Current Version

`v3.1-reports-alignment` — Unreleased development checkpoint

## Current Branch

`feature/existing-reports-alignment`

## Previous Preserved Checkpoint

- Branch: `feature/individual-cattle-milk-yield`
- Commit: `18b97ba`
- Status: Locally verified, committed and pushed
- Merge/deployment: Not performed

## Current Status

Existing Reports Alignment and Outgoing Reconciliation Sprint is functionally completed and locally verified.

The current branch has not been merged or deployed to Netlify.

Last updated: 14-Aug-2026

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
4. Historical transactions must not be overwritten or deleted.
5. Cancelled operational and financial records remain available for audit.
6. Google Sheets is the operational database.
7. Google Apps Script is the API and business-logic layer.
8. React is the primary application interface.
9. The backend is the authoritative source for validation and financial calculation.
10. Financial rates are stored as transaction snapshots.
11. Display dates use `DD-MM-YYYY`.
12. Browser date inputs use `YYYY-MM-DD`.
13. Toast notifications are preferred over browser alerts.
14. Add/Edit actions are disabled while saving.
15. Protected operations follow role-based access rules.
16. Performance target is approximately 3–8 seconds.

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

## 4. Dashboard

Status: Implemented and performance-optimized

Features:

- Cattle and operational summaries
- Attention-required cards
- Vaccination overdue routing
- Calf-registration overdue routing
- Sponsorship-expiry routing
- Dashboard backend summary endpoint
- Cache support
- Source timing and record-count diagnostics

---

## 5. Herd Management

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

### New Born / Calving Log

Status: Completed

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
- Registration eligibility and overdue tracking

### Tag Management

Status: Completed

Features:

- Current-tag update
- Complete tag history
- Old/new tag traceability
- Change reason, date and user
- Confirmation workflow

### Herd Exit and Reactivation

Status: Completed

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

### Pedigree Viewer

Status: Completed

Features:

- Search by cattle identifiers
- Dam and sire information
- Parentage and lineage display

### Individual Cattle Milk Yield

Status: Completed checkpoint

Features:

- Lactation management
- Per-cattle milk-yield entry
- Cow history
- Monthly register
- Selected cattle/breed tracking
- Two-decimal precision
- Actual milked quantity tracking

Checkpoint:

`18b97ba`

---

## 6. Veterinary

### Clinical Records

Status: Completed

Features:

- Active-cattle validation
- Disease, symptom, medicine and doctor search
- Date filters
- Add/Edit/Details
- Transaction IDs
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
- Eligible/administered/excluded counts
- Batch, expiry, dosage, unit and route
- Target group
- Next schedule
- Due and overdue interpretation
- Search, filters and pagination

### Mortality Register

Status: Completed

Features:

- Death records
- Cause and date information
- Cattle lifecycle integration

### Veterinary Masters

Implemented:

- Medicines
- Symptoms
- Preventive Care Types

---

## 7. Daily Operations

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

- Gaumaya, Gaumutra, Compost and Slurry
- Source shed
- Destination
- Quantity and unit
- Sender and receiver
- Status and remarks
- Add/Edit and filtering

### Samvardhana Outgoing

Status: Completed and locally verified

Purpose:

Record valued internal transfers and external sales originating from Govardhana/Sheds through the Samvardhana division.

Business flow:

```text
Govardhana / Sheds
        |
        v
Samvardhana
   |         |          |
   v         v          v
MSGP      Krushi    External Party