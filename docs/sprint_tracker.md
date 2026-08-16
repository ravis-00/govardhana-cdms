# Govardhana CDMS – Sprint Tracker

## Current Version

`v3.1-reports-alignment`

## Current UAT Checkpoint

`v3.1.1-post-deployment-uat-round-1`

## Current Branch

`fix/post-deployment-uat-round-1`

## Last Updated

16-Aug-2026

---

# Current Sprint

## Post-Deployment UAT – Round 1

Status: Development completed and locally verified

Backend deployment: Completed

Frontend deployment: Pending final commit, merge and deployment

### UAT Issues

#### Sidebar and Application Layout

- [x] Replaced the long sidebar with collapsible menu groups
- [x] Increased sidebar menu font size
- [x] Changed sidebar background to a lighter, more pleasant blue
- [x] Improved menu contrast and readability
- [x] Improved active-menu highlighting
- [x] Improved mobile sidebar width
- [x] Verified sidebar on desktop
- [x] Verified sidebar on mobile
- [x] Restored full desktop content width after sidebar changes
- [x] Verified that all pages use the available desktop width
- [x] Preserved responsive mobile drawer behaviour
- [x] Preserved fixed user and Logout section

#### New Born / Calving Log

- [x] Investigated mismatch between row workflow and KPI count
- [x] Corrected Pending Registration KPI calculation
- [x] Preserved the 21-day registration eligibility rule
- [x] Preserved the 30-day overdue-registration rule
- [x] Verified Pending Registration count
- [x] Verified Overdue Registration count
- [x] Verified Registered count
- [x] Verified Closed count
- [x] Verified test result:
  - Birth Records: 136
  - Pending Registration: 1
  - Overdue Registration: 0
  - Registered: 117
  - Closed: 18

#### Pedigree Viewer

- [x] Investigated parent details appearing in Master Cattle but not Pedigree Viewer
- [x] Corrected parent resolution using `cattle_origins`, `birth_log` and `cattle_master`
- [x] Resolved dam using the stored `dam_id`
- [x] Resolved sire using the stored `sire_id`
- [x] Preserved parent records even when the parent is inactive or dead
- [x] Added status to pedigree cattle nodes
- [x] Added Active status badge
- [x] Added inactive/deactive status badge
- [x] Added status fallback only when no status is available
- [x] Added selected cattle tag number to the Pedigree Viewer header
- [x] Preserved selected cattle internal ID
- [x] Displayed selected cattle status
- [x] Displayed sire status
- [x] Displayed dam status
- [x] Displayed ancestor status where lineage data exists
- [x] Verified cattle `RPCAT0955` parent resolution
- [x] Verified dam `RPCAT0605`
- [x] Verified sire `RPCAT0177`
- [x] Verified cattle `RPCAT0960` displays Active consistently
- [x] Verified the frontend Pedigree Viewer
- [x] Deployed the updated Apps Script pedigree backend

#### Herd Exit

- [x] Added Recorded Age to the Active Cattle Preview modal
- [x] Used the Master Cattle date of birth where available
- [x] Added admission-age fallback for cattle without date of birth
- [x] Displayed age before Proceed to Deregister
- [x] Preserved age-by-teeth as a separate field
- [x] Verified age is available for age/teeth comparison

#### Mortality Register

- [x] Added Recorded Age at Death to the mortality details modal
- [x] Kept Age by Teeth as a separate field
- [x] Used Master Cattle date of birth where available
- [x] Used admission date and admission age as an estimated fallback
- [x] Used the date of death as the age-calculation reference date
- [x] Displayed “Not recorded” when neither source is available
- [x] Corrected duplicate JSX label warning
- [x] Verified mortality details modal

#### Death Certificate

- [x] Changed `Date` to `Date of Death`
- [x] Removed Date of Birth from the certificate
- [x] Added Recorded Age at Death
- [x] Added estimated-age indication where fallback data is used
- [x] Preserved Teeth Details
- [x] Renamed Teeth Age presentation to Age by Teeth
- [x] Verified the Death Certificate print layout
- [x] Verified the death certificate for cattle without a recorded date of birth
- [x] Verified the death certificate for cattle with a recorded date of birth

#### Tag Management

- [x] Removed confusing repeated colour variations from the colour filter
- [x] Standardized the colour list with Cattle Registration
- [x] Preserved matching against historical colour values
- [x] Added normalized colour matching
- [x] Verified the standard list:
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

### UAT Build Verification

- [x] Apps Script syntax verified
- [x] Pedigree backend test passed
- [x] Mortality age-source backend test passed
- [x] Frontend production build passed
- [x] Vite transformed 705 modules
- [x] Build completed without warnings
- [x] `git diff --check` passed
- [x] Desktop layout visually verified
- [x] Mobile sidebar visually verified
- [x] Pedigree visually verified
- [x] New Born KPI visually verified
- [x] Herd Exit age visually verified
- [x] Mortality details visually verified
- [x] Death Certificate visually verified

### Finalization

- [x] Create UAT fix branch
- [x] Consolidate first-round UAT findings
- [x] Implement frontend UAT fixes
- [x] Implement backend UAT fixes
- [x] Deploy required Apps Script changes
- [x] Run final production build
- [x] Run `git diff --check`
- [ ] Update Current State
- [ ] Update Release Notes
- [x] Update Sprint Tracker
- [ ] Update Version History
- [ ] Review final Git status
- [ ] Stage only intended source and documentation files
- [ ] Exclude `backup files/`
- [ ] Commit UAT fixes
- [ ] Push UAT branch
- [ ] Merge UAT branch into `main`
- [ ] Run production build from `main`
- [ ] Push updated `main`
- [ ] Deploy frontend
- [ ] Perform post-deployment smoke test

---

# Completed Sprints

## Sprint 1.1 – UI Foundation Standardization

Status: Completed

- [x] Reusable page headers
- [x] Metric cards
- [x] Status badges
- [x] Form actions
- [x] Filter panels
- [x] Standard tables
- [x] Row highlighting
- [x] Gender colour coding
- [x] Toast notifications
- [x] Confirmation dialogs

---

## Sprint 1.2 – Tag Management

Status: Completed

- [x] Tag update workflow
- [x] Tag History
- [x] Historical tag search
- [x] Confirmation dialog
- [x] Current-tag synchronization
- [x] Previous-tag preservation
- [x] Standardized colour filters

---

## Sprint 1.3/1.4 – Cattle Registration

Status: Completed

- [x] Standard registration UI
- [x] Admission-specific forms
- [x] Born at Goshala
- [x] Purchase
- [x] Donation
- [x] From Farmer
- [x] Rescue / Slaughter House
- [x] Age in years and months
- [x] Parent details
- [x] Linked birth transaction
- [x] Photo
- [x] Duplicate validation
- [x] Source details
- [x] Purchase details
- [x] Health and disability details

---

## Sprint 2.0 – New Born Workflow

Status: Completed

- [x] Birth recording
- [x] Parentage
- [x] Father source and breed
- [x] Automatic calf breed
- [x] Mother eligibility
- [x] Calving-gap validation
- [x] Registration eligibility
- [x] Overdue registration
- [x] Search, filters and pagination
- [x] Photo
- [x] Edit workflow
- [x] Pending Registration KPI reconciliation

---

## Sprint 2.2.1 – Clinical Records

Status: Completed

- [x] Clinical Records modernization
- [x] Active-cattle validation
- [x] Search and filters
- [x] Add/Edit/Details
- [x] Sequential `MED-#####` IDs
- [x] Toasts and saving states
- [x] Searchable symptoms
- [x] Searchable medicines
- [x] Doctor suggestions

---

## Sprint 2.3 – Preventive Care

Status: Completed

- [x] Preventive Care Log
- [x] Preventive Care Types
- [x] Vaccination and deworming
- [x] Supplementation
- [x] Coverage calculations
- [x] Next schedules
- [x] Draft/Completed/Cancelled
- [x] Search, filters and pagination
- [x] Sequential IDs
- [x] Audit fields
- [x] Medicine batch and expiry validation

---

## Sprint 2.4 – Veterinary Completion

Status: Completed

- [x] Clinical Records
- [x] Preventive Care
- [x] Mortality Register
- [x] Herd Exit integration
- [x] Responsive veterinary workflows
- [x] Mortality recorded-age calculation
- [x] Death Certificate age alignment

---

## Sprint 2.5 – Milk Operations

Status: Completed

- [x] Milk Production
- [x] Milk Distribution
- [x] Add/Edit
- [x] KPI cards
- [x] From/To dates
- [x] Responsive modal
- [x] Backend validation
- [x] Good milk and colostrum
- [x] Free and internal distribution

---

## Sprint 2.6 – Feeding

Status: Completed

- [x] Feeding Register
- [x] Shed and feed-type filters
- [x] Quantity metrics
- [x] Add/Edit
- [x] Responsive design

---

## Sprint 2.7 – Waste Management

Status: Completed

- [x] Bio Waste Register
- [x] Add/Edit
- [x] Search and filters
- [x] KPI cards
- [x] Validation
- [x] Status handling
- [x] Gaumaya
- [x] Gaumutra
- [x] Compost
- [x] Slurry

---

## Sprint 2.8 – Sponsorship Management

Status: Completed

- [x] Sponsor Register
- [x] Sponsorship Register
- [x] Sponsorship Payments
- [x] KPI cards
- [x] Search and filters
- [x] Backend validation
- [x] Payment history
- [x] Active commitment tracking

---

## Sprint 2.9 – Master Configuration

Status: Completed

- [x] Breeds
- [x] Medicines
- [x] Preventive Care Types
- [x] Rates
- [x] Sheds
- [x] Symptoms
- [x] Weight Standards

---

## Sprint 3.0 – Reports and Analytics

Status: Completed

- [x] Predefined report catalogue
- [x] Dynamic filters
- [x] Totals
- [x] Pagination
- [x] CSV export
- [x] Print/PDF
- [x] Cattle Register
- [x] Birth Report
- [x] Death Report
- [x] Sales Report
- [x] Incoming Report
- [x] Daily Milk Report
- [x] Outgoing Report
- [x] Sponsorship Report

---

## Sprint 3.1 – Existing Reports Alignment and Outgoing Reconciliation

Status: Completed, merged and deployed

### Previous Checkpoint Preserved

- [x] Individual Cattle Milk Yield completed
- [x] Locally verified
- [x] Committed and pushed
- [x] Branch preserved: `feature/individual-cattle-milk-yield`
- [x] Commit preserved: `18b97ba`

### Business Alignment

- [x] Reviewed Daily Milk Report
- [x] Reviewed Govardhana Outgoing
- [x] Reviewed cattle Sales Report
- [x] Confirmed cattle Sales Report remains separate
- [x] Confirmed Samvardhana business definition
- [x] Confirmed MSGP internal-transfer workflow
- [x] Confirmed Krushi internal-transfer workflow
- [x] Confirmed External Party sales workflow
- [x] Confirmed milk may be sold externally
- [x] Confirmed free milk remains in Milk Distribution
- [x] Confirmed cattle sales are external-only and separate

### Samvardhana Data Model

- [x] Created `samvardhana_outgoing`
- [x] Created `samvardhana_outgoing_items`
- [x] Added header/item relationship
- [x] Added transaction IDs
- [x] Added material-line IDs
- [x] Added movement type
- [x] Added destination type
- [x] Added destination and party
- [x] Added receipt/reference
- [x] Added sender and receiver
- [x] Added status
- [x] Added audit fields
- [x] Added material
- [x] Added usage type
- [x] Added quantity and unit
- [x] Added rate snapshot
- [x] Added line amount
- [x] Added source type
- [x] Added source transaction ID
- [x] Added line remarks
- [x] Added material subtotal
- [x] Added tax
- [x] Added transport charges
- [x] Added other charges
- [x] Added other-charge remarks
- [x] Added discount
- [x] Added final billed amount

### Samvardhana Backend

- [x] Created `Repo_SamvardhanaOutgoing.gs`
- [x] Added Get
- [x] Added Add
- [x] Added Update
- [x] Added Cancel
- [x] Added controller routes
- [x] Added frontend API methods
- [x] Added header validation
- [x] Added item validation
- [x] Added header-based sheet mapping
- [x] Added Apps Script locking
- [x] Added transaction-ID generation
- [x] Added item-line-ID generation
- [x] Added duplicate-receipt validation
- [x] Added rate snapshot handling
- [x] Added multi-line item writes
- [x] Added write verification
- [x] Added safe item replacement
- [x] Added failed-update rollback
- [x] Added audit-field preservation
- [x] Added cancellation status
- [x] Excluded cancelled transactions from active reports
- [x] Preserved cancelled transactions for audit

### External Billing

- [x] Added automatic material subtotal
- [x] Added tax
- [x] Added transport charges
- [x] Added other charges
- [x] Added mandatory other-charge remarks
- [x] Added discount
- [x] Added automatic final billed amount
- [x] Added backend-authoritative calculation
- [x] Rejected false frontend billed amounts
- [x] Added negative-value validation
- [x] Added discount-limit validation
- [x] Added automatic bill number
- [x] Added financial-year sequence
- [x] Preserved bill number during Edit
- [x] Prevented cancelled bill-number reuse
- [x] Defaulted bill date to transaction date

### Samvardhana Frontend

- [x] Created `SamvardhanaOutgoing.jsx`
- [x] Added protected route
- [x] Added Operations menu entry
- [x] Restricted access to Admin/Super Admin
- [x] Added search
- [x] Added From/To dates
- [x] Added Movement Type filter
- [x] Added Destination filter
- [x] Added Status filter
- [x] Added KPI cards
- [x] Added Add modal
- [x] Added Edit modal
- [x] Added Details modal
- [x] Added cancellation confirmation
- [x] Added multiple material lines
- [x] Added milk usage type
- [x] Added source linkage
- [x] Added material subtotal display
- [x] Added billing adjustments
- [x] Added read-only bill number
- [x] Added read-only final billed amount
- [x] Added billing breakdown in Details
- [x] Used billed amount for External Sale value
- [x] Used material value for Internal Transfer value
- [x] Added success/error toasts
- [x] Added saving states
- [x] Verified responsive modal and table

### Daily Milk Report Alignment

- [x] Aggregated all sheds by date
- [x] Preserved production precision
- [x] Mapped morning yield
- [x] Mapped evening yield
- [x] Mapped morning/evening outgoing
- [x] Mapped good milk
- [x] Mapped colostrum
- [x] Mapped temple
- [x] Mapped workers and guests
- [x] Included calves/bulls, canteen and events in free milk
- [x] Added total yield
- [x] Added total outgoing
- [x] Added total good milk
- [x] Added total colostrum
- [x] Added total free milk
- [x] Corrected missing-distribution-row inconsistency
- [x] Verified daily reconciliation
- [x] Verified monthly totals
- [x] Verified Print/PDF

### Samvardhana Reports

- [x] Renamed Govardhana Outgoing presentation
- [x] Preserved existing backend report ID
- [x] Added Detailed Ledger
- [x] Added MSGP layout
- [x] Added Krushi layout
- [x] Added External Party layout
- [x] Added Milk to External Party report
- [x] Added Compost
- [x] Added Gaumaya
- [x] Added Gaumutra
- [x] Added Slurry
- [x] Added material subtotal
- [x] Added tax
- [x] Added transport
- [x] Added other charges and remarks
- [x] Added discount
- [x] Added bill number and date
- [x] Added final billed amount
- [x] Added totals
- [x] Added serial-number reset after filtering
- [x] Verified screen layouts
- [x] Verified CSV
- [x] Verified MSGP Print/PDF
- [x] Verified Krushi Print/PDF
- [x] Added readable External Party material table
- [x] Added readable External Party billing table
- [x] Verified External Party Print/PDF

### Deployment and Git

- [x] Feature commit: `eaaa8ee`
- [x] Sidebar commit: `849db9a`
- [x] Merged into `main`
- [x] Merge commit: `702cd96`
- [x] Pushed `main`
- [x] Apps Script deployed
- [x] Frontend deployed
- [x] Test transactions cancelled
- [x] Post-deployment UAT started

---

## Performance Improvement Sprint

Status: Completed

- [x] Dashboard summary backend
- [x] Cache
- [x] Cache invalidation
- [x] Reduced duplicate requests
- [x] Improved sheet reads
- [x] Preserved 3–8 second target

---

## Responsive Design Sprint

Status: Completed

- [x] Responsive application shell
- [x] Mobile drawer
- [x] Responsive filters
- [x] Responsive tables
- [x] Responsive modals
- [x] Mobile/tablet/laptop compatibility
- [x] Collapsible sidebar groups
- [x] Responsive sidebar width
- [x] Full-width desktop content restoration

---

## User Management and Authentication

Status: Completed

- [x] Role normalization
- [x] Protected routes
- [x] Viewer read-only
- [x] Super Admin restrictions
- [x] Email/mobile login
- [x] Duplicate validation
- [x] Inactive-user restriction

---

## Individual Cattle Milk Yield

Status: Completed checkpoint

- [x] Lactations
- [x] Individual Data Entry
- [x] Cow History
- [x] Monthly Register
- [x] Per-cattle tracking
- [x] Build verification
- [x] Commit `18b97ba`
- [x] Push feature branch

---

# Certificate and Print Workflows

Status: Implemented

- [x] Birth Certificate
- [x] Incoming Certificate
- [x] Sale Certificate
- [x] Transfer Certificate
- [x] Farmer Handover Certificate
- [x] Death Certificate
- [x] Reactivation Certificate
- [x] Cattle Register Print/PDF
- [x] Birth Report Print/PDF
- [x] Death Report Print/PDF
- [x] Sales Report Print/PDF
- [x] Incoming Report Print/PDF
- [x] Daily Milk Report Print/PDF
- [x] Samvardhana Outgoing Print/PDF
- [x] Sponsorship Report Print/PDF

---

# Deferred Backlog

## Pregnancy Management

- [ ] Eligible female selection
- [ ] Pregnancy examination
- [ ] Status and stage
- [ ] Expected delivery
- [ ] Outcome
- [ ] Reporting

## Clinical Enhancements

- [ ] Separate Symptoms and Diagnosis
- [ ] Structured dosage
- [ ] Frequency and duration
- [ ] Follow-up
- [ ] Outcome
- [ ] Animal Health Timeline

## Medicine Inventory

- [ ] Stock receipts
- [ ] Stock issues
- [ ] Batch-level stock
- [ ] Expiry alerts
- [ ] Low-stock alerts
- [ ] Consumption posting

## Reports

- [ ] Custom report builder
- [ ] User-defined grouping
- [ ] Advanced management MIS
- [ ] Trend analysis
- [ ] Additional exception reports

## Notifications

- [ ] Email notifications
- [ ] Scheduled alerts
- [ ] Renewal reminders
- [ ] Preventive-care reminders

## Operational Enhancements

- [ ] Receipt settlement/payment tracking
- [ ] Stock-ledger reconciliation
- [ ] Medicine inventory integration
- [ ] Automated scheduled backups
- [ ] Restore-test workflow

## Rollout

- [x] User manual
- [x] Feature list
- [ ] UAT Round 2
- [ ] User training
- [ ] Backup strategy
- [ ] Restore test
- [ ] Production checklist
- [ ] Access-control review
- [ ] Final production acceptance