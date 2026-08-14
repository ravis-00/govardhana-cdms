# Govardhana CDMS – Version History

## Last Updated

14-Aug-2026

---

# v3.1 – Existing Reports Alignment and Outgoing Reconciliation

Date: 14-Aug-2026

Status: Unreleased development checkpoint

Branch:

`feature/existing-reports-alignment`

## Highlights

- Existing Daily Milk Report aligned with the gaushala Daily Milk Record.
- Existing outgoing report rebuilt as Samvardhana Outgoing.
- Added internal valued transfers to MSGP and Krushi.
- Added external Milk and by-product sales.
- Preserved cattle Sales Report as a separate cattle-only report.
- Added destination-specific predefined report layouts.
- Added external billing and automatic bill-number generation.
- Added readable print/PDF layouts.
- Preserved cancelled transactions for audit.

## Data Model

Added:

- `samvardhana_outgoing`
- `samvardhana_outgoing_items`

Added billing fields:

- Material subtotal
- Tax
- Transport charges
- Other charges
- Other-charge remarks
- Discount
- Final billed amount

## Backend

Added:

- `Repo_SamvardhanaOutgoing.gs`
- Get
- Add
- Update
- Cancel
- Header and item validation
- Transaction and line IDs
- Document locking
- Duplicate-receipt protection
- Rate snapshots
- Optional source linkage
- Safe item replacement
- Failed-update rollback
- Billing calculation
- Automatic financial-year bill number
- Bill-number preservation

## Frontend

Added:

- `SamvardhanaOutgoing.jsx`
- Protected route
- Operations navigation
- Search and filters
- KPI cards
- Add/Edit/Details/Cancel
- Multi-material entry
- Billing adjustments
- Read-only generated bill number
- Read-only calculated subtotal
- Read-only final billed amount
- Billing details
- Responsive layouts

## Reports

Added or improved:

- Daily Milk Report reconciliation
- Detailed Samvardhana Ledger
- MSGP layout
- Krushi layout
- External Party layout
- Material subtotal and billing totals
- CSV
- Print/PDF
- Two-table External Party PDF

## Verification

Verified:

- Backend Add/Read/Update/Cancel
- Safe item replacement
- Daily Milk reconciliation
- Automatic bill sequence
- External billing
- Bill-number preservation
- Reports
- CSV
- Print/PDF
- Frontend production build

## Deployment Status

- Not merged
- Not deployed to Netlify

---

# Individual Cattle Milk Yield Enhancement

Date: 12-Aug-2026

Status: Completed checkpoint

Branch:

`feature/individual-cattle-milk-yield`

Commit:

`18b97ba`

## Highlights

- Lactation management
- Individual-cattle yield entry
- Cow History
- Monthly Register
- Per-cattle daily tracking
- Selected breed/shed workflow
- Two-decimal precision
- Actual milked quantity

## Deployment Status

- Committed and pushed
- Not merged
- Not deployed

---

# Performance Improvement Sprint

Date: Aug-2026

Status: Completed

## Highlights

- Dashboard summary backend
- Dashboard cache
- Cache invalidation after writes
- Reduced duplicate frontend requests
- Optimized sheet reads
- Improved cattle repository mapping
- Improved feeding and milk loading
- Lazy-loaded frontend routes
- Timing and record-count diagnostics

## Performance Target

Approximately 3–8 seconds.

---

# Responsive Design and Device Compatibility

Date: Aug-2026

Status: Completed

## Highlights

- Responsive application shell
- Mobile sidebar drawer
- Responsive filters
- Responsive tables
- Responsive modals
- Reports responsiveness
- User Management responsiveness
- Mobile Master Cattle improvements
- Mobile, tablet, laptop and large-desktop support

---

# User Management and Authentication Enhancement

Date: Aug-2026

Status: Completed

## Highlights

- Email or mobile-number login
- Role normalization
- Protected routes
- Viewer read-only access
- Super Admin-only User Management
- Super Admin-only Admin/Super Admin creation
- Super Admin-only status control
- Inactive-user restriction
- Duplicate-email validation
- Password exclusion from list APIs

---

# v3.0 – Reports and Analytics

Released: 04-Aug-2026

## Highlights

- Reports & Analytics module
- Predefined report catalogue
- Dynamic filters
- Search
- Totals
- Pagination
- CSV
- Print/PDF
- Report-specific layouts

## Reports

- Cattle Register
- Birth Report
- Death Report
- Cattle Sales Report
- Incoming Report
- Daily Milk Report
- Govardhana Outgoing
- Sponsorship Report

## Deferred

- Custom report builder
- Advanced grouping
- Management analytics

---

# v2.9 – Master Configuration

Released: 03-Aug-2026

## Highlights

- Breeds
- Medicines
- Preventive Care Types
- Rates
- Sheds
- Symptoms
- Weight Standards
- Duplicate validation
- Active/inactive handling
- Standard Add/Edit workflows

---

# v2.8 – Sponsorship Management

Released: 01-Aug-2026

## Highlights

- Sponsor Register
- Sponsorship Register
- Sponsorship Payments
- Sponsor profile management
- Commitment management
- Payment recording
- Active Commitment KPI
- High Value Sponsor KPI
- Search and filters
- Pagination
- Responsive forms
- Backend-generated IDs
- Duplicate validation
- Payment history

## IDs

- Sponsor: `SPN-######`
- Sponsorship: `SPO-######`
- Payment: `PAY-######`

## Deferred

- Sponsorship Scheme Master
- Renewal workflow
- Expiry notifications
- Donor dashboard

---

# v2.7 – Waste Management

Released: 29-Jul-2026

## Highlights

- Bio Waste modernization
- Gaumaya, Gaumutra, Compost and Slurry
- Source and destination tracking
- Sender and receiver
- Add/Edit
- Search and filters
- KPI cards
- Pagination
- Validation
- Responsive modal

---

# v2.6 – Nutrition and Feeding

Released: 29-Jul-2026

## Highlights

- Feeding Register modernization
- Shed filter
- Feed Type filter
- Quantity metrics
- Add/Edit
- Search
- Pagination
- Responsive design

---

# v2.5 – Milk Operations

Released: 26-Jul-2026

## Highlights

- Milk Production
- Milk Distribution
- Morning/evening production
- Good milk and colostrum
- Temple
- Workers and guests
- Calves/bulls
- Canteen
- Events
- Out-pass
- Add/Edit
- Date filters
- KPI cards

## Sheets

- `milk_production`
- `milk_distribution`

---

# v2.4 – Veterinary Completion

Released: 25-Jul-2026

## Highlights

- Clinical Records
- Preventive Care
- Mortality Register
- Herd Exit integration
- Veterinary navigation
- Search and filtering
- Add/Edit/Details
- Responsive workflows

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
- Preventive Care Types
- Medicine integration
- Coverage tracking
- Next Schedule
- Draft/Completed/Cancelled
- Search and filters
- KPI cards
- Add/Edit/Details

## Backend

- `Repo_PreventiveCareLog.gs`
- Sequential `PC-######` IDs
- Header validation
- Record locking
- Count validation
- Date validation
- Expiry validation
- Audit fields
- Controller actions

---

# v2.2.1 – Clinical Records

Released: Jul-2026

## Highlights

- Clinical Records modernization
- Standard page header
- KPI cards
- Date filters
- Search and filters
- Row-click details
- Add/Edit
- Cattle validation
- Searchable symptoms and medicines
- Doctor suggestions
- Sequential `MED-#####` IDs
- Leading-zero protection

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
- Parentage tracking
- Father source
- Father breed
- Automatic calf breed
- Mother validation
- Registration eligibility
- Overdue registration
- KPI cards
- Search and filters
- Pagination
- Edit
- Photo upload

---

# v1.10 – Registration UI

Released: Jun-2026

## Highlights

- Registration redesign
- Section-based forms
- Admission-specific fields
- Origin integration
- Details modal
- Validation
- Saving states
- Photo persistence

---

# v1.9 – Tag History

Released: 21-Jun-2026

## Highlights

- Tag Management
- Tag History
- Historical tag search
- Tag Change count
- Latest-first history
- ConfirmDialog
- `tag_history` integration

---

# v1.8 – Reactivation

Released: 19-Jun-2026

## Highlights

- Reactivation workflow
- Reactivation history
- Reactivation certificate
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

# Current Stable Development Checkpoints

## Previous Preserved Checkpoint

```text
feature/individual-cattle-milk-yield
18b97ba