# Govardhana CDMS – Version History

## Last Updated

16-Aug-2026

---

# v3.1.1 – Post-Deployment UAT Round 1

Date: 16-Aug-2026

Status: Development completed and locally verified

Branch:

`fix/post-deployment-uat-round-1`

Deployment status:

- Google Apps Script backend deployed
- Frontend pending final commit, merge, tag and deployment
- Planned UAT pilot tag: `v3.1.1-uat-pilot`

## Purpose

Resolve the first round of post-deployment UAT observations before handing the application to the gaushala team for a controlled pilot.

## Sidebar and Application Shell

### Improved

- Increased sidebar section-heading size.
- Increased menu font size.
- Improved sidebar text contrast.
- Changed the sidebar to a softer blue/slate colour.
- Improved active-group and hover visibility.
- Improved user-name and role readability.
- Reduced mobile-sidebar width.
- Reduced mobile-overlay darkness.
- Preserved collapsible navigation groups.
- Preserved active-route highlighting.
- Preserved role-based menu visibility.
- Preserved desktop sidebar collapse.
- Preserved mobile drawer behaviour.
- Preserved the fixed user and Logout section.

### Fixed

- Restored `.main-content` and `.page-container` layout rules.
- Restored desktop sidebar open and hidden rules.
- Corrected the temporary desktop content-width regression.
- Restored full available page width on desktop.
- Verified desktop and mobile layouts.

## New Born / Calving Log

### Fixed

- Corrected the Pending Registration KPI calculation.
- Aligned KPI calculations with the row-level registration workflow.
- Preserved the 21-day registration eligibility rule.
- Preserved the 30-day overdue-registration rule.

### Verified Result

- Birth Records: 136
- Pending Registration: 1
- Overdue Registration: 0
- Registered: 117
- Closed: 18

## Pedigree Viewer

### Improved

- Resolved parent information from:
  - `cattle_origins`
  - `birth_log`
  - `cattle_master`
- Added parent lookup using both Internal ID and Tag Number.
- Preserved inactive, deactive and deceased parents in pedigree history.
- Added cattle status to every resolved pedigree node.
- Added status badges for selected cattle, parents and available ancestors.
- Added selected cattle Tag Number to the Pedigree Viewer header.
- Preserved selected cattle Internal ID.
- Added cycle protection for pedigree traversal.
- Preserved existing lineage when only partial ancestor information is available.

### Verified

- Cattle `RPCAT0955`
- Dam `RPCAT0605`
- Sire `RPCAT0177`
- Active status display for cattle `RPCAT0960`
- Backend parent resolution
- Backend status propagation
- Frontend pedigree presentation

## Herd Exit

### Improved

- Added Recorded Age to the Active Cattle Preview.
- Calculated age for the selected exit date.
- Used Date of Birth when available.
- Used Admission Date and Admission Age as fallback.
- Kept Recorded Age separate from Age by Teeth.
- Enabled comparison between recorded and dental age.
- Preserved existing exit validation and lifecycle behaviour.

## Mortality Register

### Improved

- Added Recorded Age at Death to Mortality Details.
- Renamed Teeth Age presentation to Age by Teeth.
- Displayed recorded age and dental age separately.
- Added Admission Date and Admission Age to death-record responses.
- Used Date of Death as the age-calculation reference.
- Displayed `Not recorded` when no valid age source is available.
- Marked fallback-derived age as estimated.

### Recorded-Age Calculation

```text
If Date of Birth is available:

Recorded Age =
Date of Death - Date of Birth