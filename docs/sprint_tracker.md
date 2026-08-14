# Govardhana CDMS – Sprint Tracker

## Current Version

`v3.1-reports-alignment` — Unreleased

## Current Branch

`feature/existing-reports-alignment`

## Last Updated

14-Aug-2026

---

# Current Sprint

## Existing Reports Alignment and Outgoing Reconciliation

Status: Development completed and locally verified

Merge status: Not merged

Netlify deployment: Not deployed

### Previous Checkpoint Preserved

- [x] Individual Cattle Milk Yield completed
- [x] Locally verified
- [x] Committed and pushed
- [x] Branch preserved: `feature/individual-cattle-milk-yield`
- [x] Commit preserved: `18b97ba`
- [x] Not merged
- [x] Not deployed

### Existing Reports Review

- [x] Reviewed Daily Milk Report
- [x] Reviewed Govardhana Outgoing
- [x] Reviewed cattle Sales Report
- [x] Confirmed cattle Sales Report remains separate
- [x] Confirmed Samvardhana business definition
- [x] Confirmed MSGP internal-transfer workflow
- [x] Confirmed Krushi internal-transfer workflow
- [x] Confirmed External Party sales workflow
- [x] Confirmed Milk may be sold externally
- [x] Confirmed free Milk remains in Milk Distribution
- [x] Confirmed cattle sales are external-only and separate

### Data Model

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
- [x] Added GET
- [x] Added Add
- [x] Added Update
- [x] Added Cancel
- [x] Added controller routes
- [x] Added frontend API methods
- [x] Added header validation
- [x] Added item validation
- [x] Added header-based sheet mapping
- [x] Added Apps Script locking
- [x] Added transaction ID generation
- [x] Added item-line ID generation
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
- [x] Added backend authoritative calculation
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
- [x] Added Cancel confirmation
- [x] Added multiple material lines
- [x] Added Milk usage type
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
- [x] Corrected missing-distribution row inconsistency
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

### Backend Tests

- [x] Add transaction
- [x] Read transaction
- [x] Update transaction
- [x] Cancel transaction
- [x] Multi-line transaction
- [x] Rate lookup
- [x] Safe item replacement
- [x] Rollback handling
- [x] Daily Milk alignment
- [x] Samvardhana report generation
- [x] Automatic bill number
- [x] Bill-number preservation
- [x] Subtotal calculation
- [x] Tax calculation
- [x] Transport calculation
- [x] Other-charge calculation
- [x] Discount calculation
- [x] Final billed amount

### Finalization

- [x] Created new sprint branch
- [x] Preserved previous feature checkpoint
- [x] Updated README
- [x] Updated Current State
- [x] Updated Database Schema
- [x] Updated Release Notes
- [ ] Update Sprint Tracker
- [ ] Update Version History
- [ ] Cancel all test transactions
- [ ] Run final production build
- [ ] Review Git status and diff
- [ ] Stage only intended files
- [ ] Commit
- [ ] Push feature branch
- [ ] Preserve branch without merge
- [ ] Do not deploy until approved

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

## Sprint 1.2 – Tag Management

Status: Completed

- [x] Tag update workflow
- [x] Tag History
- [x] Historical tag search
- [x] ConfirmDialog
- [x] Current-tag synchronization

## Sprint 1.3/1.4 – Registration

Status: Completed

- [x] Standard registration UI
- [x] Admission-specific forms
- [x] Born at Goshala
- [x] Purchase
- [x] Donation
- [x] From Farmer
- [x] Rescue / Slaughter House
- [x] Age in years/months
- [x] Parent details
- [x] Linked birth
- [x] Photo
- [x] Duplicate validation

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

## Sprint 2.2.1 – Clinical Records

Status: Completed

- [x] Clinical Records modernization
- [x] Active-cattle validation
- [x] Search and filters
- [x] Add/Edit/Details
- [x] Sequential `MED-#####` IDs
- [x] Toasts and saving states

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
- [x] Sequential IDs and audit fields

## Sprint 2.4 – Veterinary Completion

Status: Completed

- [x] Clinical Records
- [x] Preventive Care
- [x] Mortality Register
- [x] Herd Exit integration
- [x] Responsive veterinary workflows

## Sprint 2.5 – Milk Operations

Status: Completed

- [x] Milk Production
- [x] Milk Distribution
- [x] Add/Edit
- [x] KPI cards
- [x] From/To dates
- [x] Responsive modal
- [x] Backend validation

## Sprint 2.6 – Feeding

Status: Completed

- [x] Feeding Register
- [x] Shed and feed-type filters
- [x] Quantity metrics
- [x] Add/Edit
- [x] Responsive design

## Sprint 2.7 – Waste Management

Status: Completed

- [x] Bio Waste Register
- [x] Add/Edit
- [x] Search and filters
- [x] KPI cards
- [x] Validation
- [x] Status handling

## Sprint 2.8 – Sponsorship Management

Status: Completed

- [x] Sponsors
- [x] Sponsorships
- [x] Payments
- [x] KPI cards
- [x] Search and filters
- [x] Backend validation

## Sprint 2.9 – Master Configuration

Status: Completed

- [x] Breeds
- [x] Medicines
- [x] Preventive Care Types
- [x] Rates
- [x] Sheds
- [x] Symptoms
- [x] Weight Standards

## Sprint 3.0 – Reports and Analytics

Status: Completed

- [x] Predefined report catalogue
- [x] Dynamic filters
- [x] Totals
- [x] Pagination
- [x] CSV
- [x] Print/PDF
- [x] Cattle Register
- [x] Birth
- [x] Death
- [x] Sales
- [x] Incoming
- [x] Daily Milk
- [x] Outgoing
- [x] Sponsorship

## Performance Improvement Sprint

Status: Completed

- [x] Dashboard summary backend
- [x] Cache
- [x] Cache invalidation
- [x] Reduced duplicate requests
- [x] Improved sheet reads
- [x] Preserved 3–8 second target

## Responsive Design Sprint

Status: Completed

- [x] Responsive application shell
- [x] Mobile drawer
- [x] Responsive filters
- [x] Responsive tables
- [x] Responsive modals
- [x] Mobile/tablet/laptop compatibility

## User Management and Authentication

Status: Completed

- [x] Role normalization
- [x] Protected routes
- [x] Viewer read-only
- [x] Super Admin restrictions
- [x] Email/mobile login
- [x] Duplicate validation
- [x] Inactive-user restriction

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

## Rollout

- [ ] User Acceptance Testing
- [ ] User manual
- [ ] User training
- [ ] Backup strategy
- [ ] Restore test
- [ ] Production checklist
- [ ] Access-control review
- [ ] Production deployment