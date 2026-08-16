# Govardhana CDMS – Release Notes

---

# v3.1.1-post-deployment-uat-round-1

## Date

16-Aug-2026

## Status

Development completed and locally verified.

Current branch:

`fix/post-deployment-uat-round-1`

Backend pedigree updates have been deployed to Google Apps Script.

Frontend fixes are pending final Git commit, merge into `main` and Netlify deployment.

## Purpose

Correct issues identified during the first post-deployment User Acceptance Testing round and improve navigation readability, cattle-age interpretation, pedigree traceability and master-data filtering.

## Pedigree Viewer

### Fixed

- Corrected parent records displaying as Unknown when parent information existed.
- Parent references are resolved using:
  - `cattle_origins`
  - `birth_log`
  - `cattle_master`
- Supports parent lookup using Internal ID and Tag Number.
- Verified parent resolution for `RPCAT0955`.
- Added cattle status to every pedigree node.
- Inactive or deceased parents remain visible as historical lineage.
- Added Active, Inactive and Status unknown badges.
- Added status to:
  - Focus animal
  - Mother
  - Father
  - Paternal grandparents
  - Maternal grandparents
- Added selected cattle’s Tag Number to the page header.
- Retained Internal ID in the page header.
- Status badges are included in printable pedigree output.
- Verified Tag, Internal ID and Active status using Gowri (`RPCAT0960`).

### Business Rule

Pedigree is a historical lineage record.

A parent must remain visible even after becoming inactive, sold, transferred, deactivated or deceased.

Display interpretation:

```text
Recorded status Active
→ Active

Any recorded non-active status
→ Inactive

Missing status
→ Status unknown
```

## New Born / Calving Log

### Fixed

- Corrected Pending Registration KPI.
- The KPI now includes calves that:
  - Have completed 21 days
  - Are eligible for registration
  - Are not registered
  - Are not yet overdue
- Overdue Registration remains separately calculated.
- Registered and Closed counts remain unchanged.
- Verified using `BIRTH-445842`.

## Herd Exit

### Improved

- Added Recorded Age to the Active Cattle Preview.
- Added Recorded Age to the deregistration workflow.
- Age is calculated for the selected exit date.
- Date of Birth is used when available.
- Admission Date and Admission Age are used as fallback.
- Recorded Age can now be compared with Age by Teeth.
- Existing exit validation and lifecycle behaviour remain unchanged.

## Mortality Register

### Improved

- Added Recorded Age at Death to Mortality Details.
- Renamed Teeth Age to Age by Teeth.
- Recorded age and dental age are displayed separately.
- Added admission-date and admission-age fallback data to death-record responses.
- Missing values display Not recorded.

### Recorded-Age Calculation

```text
If Date of Birth is available:
Recorded Age = Date of Death - Date of Birth

Otherwise:
Recorded Age =
Admission Age +
(Date of Death - Admission Date)
```

Fallback-derived age is marked as estimated.

## Death Certificate

### Improved

- Changed Date to Date of Death.
- Replaced Date of Birth with Age.
- Added recorded or estimated age.
- Changed Teeth Age to Age by Teeth.
- Preserved Teeth Details.
- Missing values are explicitly displayed.
- Existing cattle, cause, pregnancy, market-value and signature information is preserved.

## Sidebar and Application Shell

### Improved

- Increased sidebar section-heading size.
- Increased menu font size.
- Improved text contrast.
- Changed the sidebar from a near-black colour to a softer blue/slate colour.
- Improved active-group and hover visibility.
- Improved user and role readability.
- Reduced mobile-sidebar width.
- Reduced mobile-overlay darkness.
- Preserved collapsible menu groups.
- Preserved active-route highlighting.
- Preserved role-based menu visibility.
- Preserved desktop sidebar collapse.
- Preserved mobile drawer behaviour.

### Fixed

- Restored `.main-content` and `.page-container` rules removed during the sidebar CSS replacement.
- Restored desktop sidebar open/hidden rules.
- Corrected the temporary desktop content-width regression.
- Verified desktop and mobile layouts.

## Tag Management

### Improved

- Replaced historical raw colour values in the filter with the approved Cattle Registration colour list.
- Removed duplicate filter entries caused by:
  - Capitalization differences
  - Spelling differences
  - Hyphen variations
  - Historical compound-colour descriptions
- Preserved matching against historical colour values.

### Standard Colour Options

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

## Backend

### Updated

- `Repo_Pedigree.gs`
  - Added origin and birth-record parent resolution.
  - Added Internal ID and Tag Number lookup.
  - Added cycle protection.
  - Added cattle status to every pedigree node.
  - Preserved inactive and historical parents.
- Death-record backend response
  - Added Admission Date.
  - Added Admission Age in months.
  - Preserved Date of Birth.
  - Enabled recorded-age-at-death calculation.

### Backend Tests

- Pedigree parent-resolution test passed.
- Pedigree status-propagation test passed.
- Mortality age-source test passed.
- Google Apps Script web-app update deployed.

## Frontend

### Updated Files

- `src/App.css`
- `src/pages/DeathRecords.jsx`
- `src/pages/Deregister.jsx`
- `src/pages/NewBorn.jsx`
- `src/pages/NewTag.jsx`
- `src/pages/PedigreeViewer.jsx`

## Build Verification

```text
Vite version: 7.2.6
Modules transformed: 705
Result: Successful
Warnings: None
Build time: 14.72 seconds
```

---

# v3.1-reports-alignment

## Date

14-Aug-2026

## Status

Completed, merged into `main` and pushed.

Feature branch:

`feature/existing-reports-alignment`

Feature commits:

- `eaaa8ee` — Align existing reports and add Samvardhana Outgoing
- `849db9a` — Add collapsible sidebar navigation

Main merge commit:

`702cd96`

Google Apps Script backend was deployed.

Frontend was deployed before Post-Deployment UAT Round 1.

## Purpose

Align existing predefined CDMS reports with the gaushala’s manually maintained Daily Milk, MSGP, Krushi and external-sale registers without creating a duplicate reporting system.

## Business Definitions

- Madhava Srusti is the name of the gaushala.
- Samvardhana is the gaushala’s by-products division.
- MSGP is the internal Gau Products manufacturing destination.
- Krushi is the internal agricultural destination.
- Internal transfers are valued movements.
- External transactions are sales with billing.
- Cattle sales remain separate from Samvardhana outgoing.

## Daily Milk Report

### Improved

- Aggregates `milk_production` rows from all sheds by date.
- Uses `milk_distribution` for free and internal distribution classifications.
- Aligns report columns with the gaushala Daily Milk Record.
- Corrected historical date-level overwrite behaviour.
- Corrected outgoing and good-milk calculations.
- Added complete monthly totals.
- Added print/PDF and CSV support.

### Report Fields

- Morning Milk Yield
- Morning Outgoing
- Morning Good Milk
- Colostrum Milk
- Temple
- Evening Milk Yield
- Evening Outgoing
- Free to Workers and Guests
- Total Milk Yield
- Total Outgoing
- Total Good Milk
- Total Colostrum Milk
- Total Free Milk

### Reconciliation

```text
Total Milk Yield =
Morning Milk Yield +
Evening Milk Yield
```

```text
Total Outgoing =
Morning Outgoing +
Evening Outgoing
```

```text
Total Colostrum Milk =
Morning Colostrum +
Evening Colostrum
```

```text
Total Free Milk =
Temple +
Free to Workers and Guests
```

```text
Total Good Milk =
Total Outgoing -
Total Colostrum Milk -
Total Free Milk
```

Morning and evening outgoing allocation need not exactly reproduce manual shift timing, but date-level totals must reconcile.

## Samvardhana Outgoing

### Added

- New Samvardhana Outgoing operational page.
- New header-and-line-item transaction model.
- Internal valued transfers.
- External by-product sales.
- MSGP destination.
- Krushi destination.
- External Party destination.
- Add transaction.
- Edit transaction.
- Details modal.
- Cancel transaction.
- Search and filters.
- Completed and Cancelled statuses.
- Audit fields.

### Sheets

#### `samvardhana_outgoing`

Transaction-header data including:

- Outgoing ID
- Date
- Movement Type
- Destination Type
- Destination Name
- Party Name
- Receipt Number
- Bill Number
- Bill Date
- Billed Amount
- Sender
- Receiver
- Remarks
- Status
- Audit fields
- Material Subtotal
- Tax Amount
- Transport Charges
- Other Charges
- Other Charges Remarks
- Discount Amount

#### `samvardhana_outgoing_items`

Transaction-line data including:

- Line ID
- Outgoing ID
- Material
- Usage Type
- Quantity
- Unit
- Rate
- Amount
- Source Type
- Source Transaction ID
- Remarks

## Supported Materials

- Milk
- Gaumaya
- Gaumutra
- Compost
- Slurry

## Movement Types

### Internal Transfer

Supported destinations:

- MSGP
- Krushi

Internal transfers:

- Preserve quantities and rates.
- Record the transfer value.
- Do not require external-party billing.
- Remain separate from external sales.

### External Sale

External sales:

- Require external-party information.
- Use transaction rate snapshots.
- Support automatic billing calculations.
- Support receipt and bill information.

## Milk Usage

Supported classifications include:

- Sale
- Canteen
- Ginnu
- Other applicable usage

Milk may be:

- Transferred internally to MSGP
- Used for Gau Products manufacturing
- Distributed internally
- Sold to an external party

## Billing

### Added

- Automatic Material Subtotal
- Tax Amount
- Transport Charges
- Other Charges
- Other Charges Remarks
- Discount Amount
- Automatic Final Billed Amount
- Automatic Bill Number
- Bill Date
- Receipt Number

### Formula

```text
Final Billed Amount
= Material Subtotal
+ Tax Amount
+ Transport Charges
+ Other Charges
- Discount Amount
```

The backend recalculates and validates financial values.

## Bill Number

### Added

- Backend-generated bill numbers
- Date/financial-period-aware numbering
- Duplicate prevention
- Existing bill number preserved during transaction update

## Receipt Number

Receipt Number is the operational acknowledgement/reference for the movement or receipt.

Bill Number is the financial billing identity for an external sale.

The two references remain separate.

## Samvardhana Outgoing Reports

### Added Layouts

- Detailed Ledger
- MSGP
- Krushi
- External Party

### Detailed Ledger

Includes:

- Date
- Outgoing ID
- Movement Type
- Destination
- Receipt Number
- Material quantities
- Total Amount
- Bill Number
- Bill Date
- Billed Amount
- Remarks

### MSGP Layout

Includes:

- Milk Sale
- Milk Canteen
- Milk Ginnu
- Total Milk
- Milk Unit
- Milk Rate
- Milk Amount
- Gaumaya details
- Gaumutra details
- Total Amount

### Krushi Layout

Includes:

- Gaumaya
- Gaumutra
- Compost
- Slurry
- Units
- Rates
- Amounts
- Total Amount

### External Party Layout

Includes:

- Material sale details
- Material Subtotal
- Tax
- Transport Charges
- Other Charges
- Other Charges Remarks
- Discount
- Bill Number
- Bill Date
- Final Billed Amount

## External-Party Print Layout

### Improved

External-party output is divided into:

1. Material Sale Details
2. Billing Details

This avoids an excessively wide single table and makes tax, charges, discounts and final billing easier to understand.

## Reports and Analytics

### Improved

- Renamed Govardhana Outgoing to Samvardhana Outgoing.
- Added destination/layout selection.
- Added Daily Milk aligned columns.
- Added dynamic report columns.
- Added totals.
- Updated CSV export.
- Updated Print/PDF output.
- Preserved cattle Sales Report as a separate cattle-sale report.
- Preserved existing predefined-report architecture.
- Did not create a duplicate reporting module.

## Sidebar Navigation

### Added

- Collapsible navigation groups
- Route-aware automatic expansion
- Active-group indication
- Desktop sidebar collapse
- Mobile navigation drawer
- Mobile background-scroll prevention
- Escape-key close
- Route-change close on mobile
- Role-aware menu filtering

## Compatibility

- Preserved existing report routes.
- Preserved cattle Sales Report.
- Preserved existing authentication and roles.
- Preserved backend cache invalidation.
- Preserved cancelled transaction history.
- Preserved existing report CSV and print/PDF workflows.

---

# v3.0-reports-analytics

## Date

04-Aug-2026

## Status

Completed

## Added

- Reports and Analytics module
- Cattle Register
- Birth Report
- Death Report
- Sales Report
- Incoming Report
- Daily Milk Report
- Govardhana Outgoing
- Sponsorship Report
- Search and date filters
- Report-specific filters
- Pagination
- Totals
- CSV export
- Print/PDF
- Signature areas

## Deferred

- Custom report builder
- User-selectable report columns
- Advanced calculated fields
- Advanced grouping

---

# v2.9-master-configuration

## Date

03-Aug-2026

## Status

Completed

## Added or Improved

- Breeds
- Medicines
- Preventive Care Types
- Sheds
- Symptoms
- Rates
- Weight Standards
- Active/inactive status handling
- Duplicate validation
- Standard UI behaviour

---

# v2.8-sponsorship-management

## Date

01-Aug-2026

## Status

Completed

## Added

- Sponsor Register
- Sponsorship Register
- Sponsorship Payments
- Sponsor Profile Management
- Sponsorship Agreement Management
- Payment Recording
- Active Commitment KPI
- High Value Sponsor KPI
- Search and filters
- Pagination
- Responsive Add/Edit forms
- Backend-generated IDs
- Duplicate validation
- Payment history

## Deferred

- Searchable Sponsor Selector
- Sponsorship Scheme Master
- Sponsorship Coverage Master
- Renewal workflow
- Expiry notifications
- Sponsorship certificate generation
- Donor dashboard
- Additional sponsorship reports

---

# v2.7-waste-management

## Date

29-Jul-2026

## Status

Completed

## Added

- Modernized Bio Waste page
- Gaumaya, Gaumutra, Compost and Slurry records
- Source Shed and Destination
- Quantity and Unit
- Sender and Receiver
- Add/Edit workflow
- Search and filters
- KPI cards
- Pagination
- Status-based cancellation

---

# v2.6-nutrition-feeding

## Date

29-Jul-2026

## Status

Completed

## Added

- Feeding Register modernization
- Feed-type and shed filters
- KPI cards
- Add/Edit
- Date filters
- Quantity summaries
- Responsive forms

---

# v2.5-milk-operations

## Date

26-Jul-2026

## Status

Completed

## Added or Improved

- Milk Production
- Milk Distribution
- Morning and Evening records
- Good Milk and Colostrum
- Internal and free distribution
- Out-pass details
- Production and Distribution tabs
- From and To date filters
- KPI cards
- Add/Edit workflow
- Responsive entry forms

---

# v2.4-veterinary-complete

## Date

25-Jul-2026

## Status

Completed

## Added or Improved

- Mortality Register
- Herd Exit integration
- Death-record details
- Death Certificate
- Clinical Records stabilization
- Preventive Care stabilization

---

# v2.3-preventive-care

## Date

23-Jul-2026

## Status

Completed

## Added

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
- Add/Edit/Details modals

---

# v2.2.1-clinical-records

## Status

Completed

## Added or Improved

- Clinical Records modernization
- Standard page header
- KPI cards
- Date-range filtering
- Search and filters
- Row-click details
- Add/Edit workflow
- Cattle validation
- Searchable symptoms
- Searchable medicines
- Doctor suggestions
- Sequential `MED-#####` IDs

---

# v2.0-newborn-workflow

## Date

03-Jul-2026

## Status

Completed

## Added

- Birth recording
- Parentage tracking
- Father source
- Father breed
- Automatic calf breed
- Mother eligibility
- Registration eligibility
- Overdue-registration tracking
- Search and filters
- KPI cards
- Pagination
- Edit workflow
- Photo upload

---

# v1.10-registration-ui

## Date

Jun-2026

## Status

Completed

## Added or Improved

- Cattle Registration redesign
- Section-based forms
- Admission-type-specific sections
- Origin-data integration
- Details modal
- Saving-state improvements
- Photo persistence

---

# v1.9-tag-history

## Date

21-Jun-2026

## Status

Completed

## Added

- Multiple Tag Management
- Tag History
- Historical Tag Search
- Tag Change Count
- Latest-first history
- Confirmation dialog

---

# v1.8-reactivation

## Date

19-Jun-2026

## Status

Completed

## Added

- Reactivation workflow
- Reactivation history
- Reactivation Certificate
- Active-status restoration
- Lifecycle-history preservation

---

# v1.7-certificates

## Date

Jun-2026

## Status

Completed

## Added

- Birth Certificate
- Incoming Certificate
- Sale Certificate
- Transfer Certificate
- Farmer Handover Certificate
- Death Certificate
- Certificate numbering
- Print/PDF layouts