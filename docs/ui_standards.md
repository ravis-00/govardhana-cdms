# Govardhana CDMS – UI Standards

## Version

`v3.1-reports-alignment`

## Last Updated

14-Aug-2026

---

# 1. Purpose

This document defines the interface and interaction standards for Govardhana CDMS.

All new modules and significant UI changes should follow these standards to maintain a consistent, professional and easy-to-use system across desktop, tablet and mobile devices.

---

# 2. Design Principles

1. Do not break existing working functionality.
2. Work one file or module at a time.
3. Complete backend changes before dependent frontend changes.
4. Reuse shared components and established patterns.
5. Use terminology confirmed by the gaushala.
6. Prefer visible validation over silent failure.
7. Preserve historical and cancelled records.
8. Prevent duplicate submissions.
9. Use consistent date and number formats.
10. Use toast notifications instead of browser alerts.
11. Keep primary actions easy to locate.
12. Use status badges for quick interpretation.
13. Support desktop, tablet and mobile screens.
14. Use horizontal scrolling for genuinely wide tables.
15. Group forms into logical sections.
16. Clearly distinguish calculated, editable and read-only fields.
17. Show loading, saving, empty and error states.
18. Preserve role-based access restrictions.
19. Do not display actions that the logged-in role cannot perform.
20. Keep financial calculations transparent and auditable.
21. Ensure print/PDF output is readable.
22. Maintain backward compatibility.
23. Optimize normal page response toward the 3–8 second target.

---

# 3. Modules Covered

These standards apply to:

## Authentication and Administration

- Login
- User Management
- Role-based access

## Herd Management

- Dashboard
- Master Cattle
- Cattle Registration
- New Born / Calving Log
- Tag Management
- Pedigree Viewer
- Herd Exit
- Reactivation
- Individual Cattle Milk Yield

## Veterinary

- Clinical Records
- Preventive Care
- Mortality Register
- Medicines
- Preventive Care Master
- Symptoms

## Daily Operations

- Milk Production
- Milk Distribution
- Feeding
- Bio Waste
- Samvardhana Outgoing

## Sponsorship and Finance

- Sponsors
- Sponsorships
- Sponsorship Payments

## Master Configuration

- Breeds
- Rates
- Sheds
- Symptoms
- Weight Standards
- Medicines
- Preventive Care Types

## Reports

- Reports & Analytics
- CSV export
- Print/PDF

---

# 4. Brand and Colour Standards

## Primary Colours

| Usage | Colour |
|---|---|
| Sidebar background | `#0f172a` |
| Primary orange | `#ea580c` |
| Primary hover | `#c2410c` |
| Sidebar text | `#cbd5e1` |
| Main text | `#111827` |
| Secondary text | `#475569` |
| Page background | `#f8fafc` or existing application background |
| Card background | `#ffffff` |
| Border | `#cbd5e1` or `#e2e8f0` |

## Status Colours

Use consistent semantic colours:

| Status | Suggested appearance |
|---|---|
| Active / Completed / Success | Green |
| Draft / Pending | Amber or neutral |
| Cancelled / Error / Overdue | Red |
| Informational | Blue |
| Inactive | Grey |

## Gender Colours

| Gender | Colour convention |
|---|---|
| Female | Pink |
| Male | Blue |

Colour must not be the only way information is communicated. Always include readable text.

---

# 5. Typography

- Use the application’s existing font family consistently.
- Page titles should be clear and visually prominent.
- Section titles should use consistent weight and spacing.
- Table headings may use uppercase where already standardized.
- Body text must remain readable without browser zoom.
- Avoid excessively small print/PDF fonts.
- Use concise labels.
- Do not use unexplained abbreviations.

Recommended hierarchy:

| Element | Treatment |
|---|---|
| Page title | Bold, largest page text |
| Page description | Smaller secondary text |
| Card value | Bold and prominent |
| Section title | Bold, compact |
| Field label | Medium/bold |
| Help text | Smaller secondary text |
| Table header | Bold, compact |

---

# 6. Shared Components

Reuse common components where practical.

Current shared patterns/components include:

- `PageHeader`
- `MetricCard`
- `SectionCard`
- `StatusBadge`
- `FormActions`
- `ConfirmDialog`
- Field wrappers
- Toast notification
- Loading state
- Empty state

Add a reusable component when the same interaction or presentation appears in multiple modules.

Do not create a shared component for a one-time pattern unless it materially improves clarity or consistency.

---

# 7. Application Shell

## Desktop

- Persistent dark sidebar.
- Header/top navigation remains visible.
- Main content uses consistent padding.
- Content should not overflow the viewport unnecessarily.

## Mobile and Tablet

- Sidebar becomes a drawer.
- Drawer includes a backdrop.
- Route selection closes the drawer.
- Background scrolling is prevented while the drawer is open.
- Main content uses reduced padding.
- Header actions remain reachable.
- Wide tables use contained horizontal scrolling.

## Breakpoints

Target device ranges:

| Device | Width |
|---|---:|
| Mobile | 360–480 px |
| Tablet | 768–1024 px |
| Laptop | 1280–1440 px |
| Large desktop | 1600 px and above |

---

# 8. Page Layout Standard

Each operational page should normally contain:

1. Page Header
2. Optional primary action
3. KPI/summary cards where useful
4. Search and Filters
5. Record count
6. Main table/register
7. Pagination
8. Add/Edit modal
9. Details modal
10. Toast notifications

Recommended structure:

```text
Page Header                    Primary Action

KPI / Summary Cards

Search and Filters
Apply Filters | Clear Filters

Record Register
Table / Empty / Loading State

Pagination
```

## Width and Spacing

- Use a centered maximum width where appropriate.
- Preserve consistent horizontal and vertical spacing.
- Use cards to group major sections.
- Avoid excessive empty space inside forms.
- Allow operational registers to use available width.
- Keep actions aligned consistently.

---

# 9. Page Header Standard

Each page header should include:

- Page title
- Short business description
- Optional primary action on the right

Example:

```text
Samvardhana Outgoing

Record valued internal transfers to MSGP/Krushi and external milk or by-product sales.

+ Add Outgoing
```

Descriptions should explain the business purpose rather than implementation details.

---

# 10. KPI and Summary Cards

Use KPI cards only when they help the user understand the filtered dataset.

Suitable metrics include:

- Total records
- Active records
- Completed records
- Internal transfers
- External sales
- Total quantity
- Total transfer value
- Final billed value
- Upcoming/overdue count

Rules:

- KPI values should update with active filters unless explicitly designed as global metrics.
- Labels must clearly describe the value.
- Do not use an “Entries” card if it does not help operations.
- Financial cards must state whether they represent subtotal, transfer value or billed value.
- External Sales use final billed amount.
- Internal Transfers use material/transfer value.
- Cancelled transactions should not be included in active totals.

---

# 11. Search and Filters

## Standard Controls

- Search
- From Date
- To Date
- Module-specific dropdowns
- Apply Filters
- Clear Filters

## Rules

- Search placeholder should describe searchable fields.
- From Date must not exceed To Date.
- Clear Filters resets filters, results and pagination consistently.
- Filter labels must remain visible.
- Filters should wrap cleanly on smaller screens.
- Applied filters should determine KPI and table results consistently.
- Generate Report is required where report generation is explicit.
- Do not trigger unnecessary duplicate API requests on every keystroke.

---

# 12. Date Standards

## Display

Use:

```text
DD-MM-YYYY
```

Example:

```text
14-08-2026
```

## Browser Inputs and API

Use:

```text
YYYY-MM-DD
```

Example:

```text
2026-08-14
```

## Rules

- Convert dates at the UI/API boundary.
- Do not compare localized display strings directly.
- Future dates should be rejected where the business workflow disallows them.
- Bill Date defaults to transaction date for External Sales.
- A deliberately corrected Bill Date should not be overwritten during Edit.

---

# 13. Table Standards

Tables should include:

- Clear header row
- Consistent borders
- Readable row height
- Numeric alignment
- Empty-state handling
- Loading-state handling
- Pagination where needed
- Row-click Details where applicable

## Numeric Columns

Right-align:

- Quantities
- Rates
- Amounts
- Counts
- Totals

## Wide Tables

- Use a contained horizontal scrollbar.
- Keep the scrollbar visible at the bottom of the register.
- Do not reduce screen text to an unreadable size.
- Preserve all columns in CSV.
- Use a specialized compact layout for Print/PDF where required.

## Row Interaction

- Use row-click Details for primary review.
- Keep Edit or Cancel inside Details or an explicit action area.
- Avoid unnecessary “View” buttons when row-click is established.
- Use pointer cursor where rows are clickable.
- Do not trigger row-click when a nested button is selected.

## Totals Row

- Display totals only for meaningful numeric columns.
- Do not total rates.
- Use a stronger border/background.
- Label the first cell `Total`.
- Totals must use the full filtered dataset, not only the current page.

---

# 14. Pagination

Pagination should include:

- Current page
- Total pages
- Previous
- Next
- Rows per page where appropriate

Rules:

- Reset to page 1 after filters change.
- Disable Previous on page 1.
- Disable Next on the final page.
- Filtering should occur before pagination.
- Serial numbers should be regenerated after filtering.
- Serial numbers should begin at 1 for destination-specific report layouts.

---

# 15. Form Standards

## Structure

Group fields into logical sections, such as:

- Transaction Details
- Cattle Details
- Material Lines
- Billing
- Source and Remarks
- Audit Information

## Labels

- Every field must have a visible label.
- Required fields should be clearly indicated.
- Labels should use confirmed business terms.
- Avoid placeholder-only labels.

## Inputs

- Use appropriate HTML input types.
- Use `inputMode="decimal"` for decimal numeric entry where useful.
- Set practical `min`, `max` and `step` attributes.
- Restrict dropdowns to approved values.
- Trim text input before validation.
- Preserve text IDs and leading zeroes.

## Save Behaviour

- Disable Save and Cancel actions while saving where closing would create ambiguity.
- Show `Saving...` during submission.
- Prevent double submission.
- Validate before sending.
- Show success or error toast.
- Close the modal only after confirmed backend success.
- Refresh data after save.

---

# 16. Modal Standards

## Add/Edit Modal

Include:

- Clear title
- Existing record ID during Edit
- Close action
- Scrollable body
- Fixed/reachable footer
- Cancel
- Save/Update
- Saving state

## Details Modal

Include:

- Business summary
- Status
- Relevant identifiers
- Financial/quantity breakdown
- Edit action where authorized
- Cancel action where authorized
- Close action

## Responsive Behaviour

- Modal width should fit the viewport.
- Modal height should not exceed the viewport.
- Modal body should scroll independently.
- Footer buttons must remain reachable.
- Forms should collapse to one column on mobile.

---

# 17. Confirmation Dialog

Use `ConfirmDialog` for consequential actions such as:

- Cancel transaction
- Deactivate user
- Exit cattle
- Delete/deactivate master record
- Close lactation
- Other irreversible workflow transitions

The dialog should contain:

- Specific title
- Clear consequence
- Confirm button with action-specific text
- Cancel button
- Backdrop-click cancellation where safe

Avoid generic messages such as:

```text
Are you sure?
```

Prefer:

```text
Cancel Samvardhana Outgoing transaction SVO-000006?

The transaction will remain available for audit but will be excluded from active reports.
```

---

# 18. Toast Notifications

Use toast messages for:

- Save success
- Update success
- Cancellation success
- Validation failure
- API failure
- Loading/retry information where useful

Rules:

- Success toast uses green styling.
- Error toast uses red styling.
- Messages should describe the completed or failed action.
- Do not expose raw stack traces to users.
- Do not rely only on console logs for user feedback.

---

# 19. Loading and Empty States

## Loading

Use specific text:

```text
Loading transactions...
```

Avoid ambiguous blank screens.

## Empty

Use a business-specific message:

```text
No Samvardhana Outgoing transactions found.
```

## Rules

- Preserve the surrounding layout during loading.
- Disable actions that require loaded data.
- Avoid duplicate loading indicators.
- Clear stale errors after successful loading.

---

# 20. Status Badges

Use `StatusBadge` or the established badge pattern.

Common statuses:

- Active
- Inactive
- Draft
- Completed
- Cancelled
- Pending
- Overdue
- Due Today
- Registered

Rules:

- Normalize status text before styling.
- Always show text.
- Use consistent colours.
- Do not make cancelled records appear active.
- Keep badges compact.

---

# 21. Role-Based UI

Roles:

- Super Admin
- Admin
- User
- Viewer

Rules:

- Super Admin-only modules must not appear for other roles.
- Viewer must not see Add/Edit/Cancel controls.
- ProtectedRoute is required for restricted routes.
- Backend must still validate authorization.
- Hiding a button is not a substitute for backend security.
- Role names should be normalized before comparison.

Super Admin-only functions include:

- User Management
- User activation/deactivation
- Creating Admin/Super Admin accounts

---

# 22. Financial UI Standards

## Calculated Fields

Calculated fields should be read-only and visually distinguishable.

Examples:

- Material-line amount
- Material subtotal
- Final billed amount
- Excluded count
- Outstanding amount

## Editable Adjustments

Examples:

- Tax amount
- Transport charges
- Other charges
- Discount

## Validation

- Negative values are not permitted unless explicitly required.
- Other Charges Remarks is mandatory when Other Charges is greater than zero.
- Discount cannot exceed subtotal plus charges.
- Final billed amount cannot be negative.
- Frontend calculations provide immediate feedback.
- Backend calculation remains authoritative.

## Samvardhana External Billing

Display:

```text
Material Subtotal
+ Tax
+ Transport
+ Other Charges
- Discount
= Final Billed Amount
```

## Bill Number

- Generated by the backend.
- Read-only.
- Display placeholder before saving:

```text
Generated after saving
```

- Preserve during Edit.
- Do not reuse cancelled bill numbers.

## Value Presentation

- Internal Transfer: show Transfer Value.
- External Sale: show Final Billed Amount.
- Mixed KPI totals combine these two business values.
- Report totals must separately show subtotal and billing adjustments.

---

# 23. Multi-Line Transaction Standards

For forms such as Samvardhana Outgoing:

- Require at least one item line.
- Provide Add Material.
- Provide Remove per line.
- Keep Material, Usage, Quantity, Unit, Rate and Amount together.
- Display line amount as calculated/read-only.
- Show optional source linkage below the primary line.
- Preserve line remarks.
- Validate every line before saving.
- Use stable line IDs during Edit.

---

# 24. Source Linkage

Optional source fields may include:

- Source Type
- Source Transaction ID

Current source types include:

- Milk Distribution
- Bio Waste

Rules:

- Source Transaction ID is disabled until Source Type is selected.
- Placeholder should identify the expected source.
- Do not generate false source links.
- Backend should preserve the source snapshot.
- Future reconciliation may require mandatory links after source workflows stabilize.

---

# 25. Reports and Analytics Standards

## Catalogue

- Use the existing Reports & Analytics module.
- Improve predefined reports rather than creating duplicate report modules.
- Keep report buttons compact.
- Use categories where useful.
- Preserve report IDs where required for backward compatibility.

## Filters

- Date range
- Search
- Report-specific filters
- Generate Report
- Clear Filters

## Results

- Show record count.
- Use report-specific columns.
- Use totals for applicable reports.
- Use horizontal scrolling for wide screen registers.
- Keep pagination below results.

## CSV

- Include every active report column.
- Preserve raw numeric values.
- Use a descriptive filename.
- Escape commas, quotes and line breaks correctly.
- Export the complete filtered dataset, not only the current page.

## Print/PDF

Include:

- Organisation name
- Report title
- Period
- Generated date/time
- Record count
- Totals
- Supervisor signature
- Project Manager signature

Rules:

- Use landscape orientation for wide reports.
- Do not force an unreadable number of columns into one table.
- Split very wide reports into logical tables.

### External Party Samvardhana Print

Use:

1. Material Sale Details
2. Billing Details

The screen and CSV may retain the complete wide layout.

---

# 26. Daily Milk Report Standards

The aligned Daily Milk Report includes:

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

Reconciliation:

```text
Total Outgoing =
Morning Outgoing + Evening Outgoing
```

```text
Total Good Milk =
Total Outgoing - Total Colostrum Milk
```

```text
Total Milk Yield =
Total Outgoing + Total Free Milk
```

Displayed session values and total values must not contradict each other.

---

# 27. Accessibility and Usability

- Use visible labels.
- Maintain readable colour contrast.
- Use native buttons and inputs.
- Preserve keyboard focus.
- Do not remove focus outlines without a replacement.
- Use descriptive button text.
- Avoid colour-only status communication.
- Keep touch targets practical on mobile.
- Ensure horizontal scrolling does not hide page actions.
- Add `title` or help text for important read-only fields where useful.

---

# 28. Performance Standards

- Avoid duplicate API calls.
- Use memoization for derived lists and totals.
- Filter before paginating.
- Use lazy-loaded routes where established.
- Reuse cached dashboard data.
- Invalidate relevant caches after writes.
- Avoid reading entire sheets repeatedly within one request.
- Use batched reads and writes.
- Target normal operations within approximately 3–8 seconds.
- Show loading feedback when operations take longer.

---

# 29. Error Handling

## Frontend

- Validate required fields.
- Show business-friendly errors.
- Keep the form open after failure.
- Preserve user-entered values.
- Avoid exposing raw backend responses.

## Backend

- Validate headers.
- Validate required fields.
- Validate business rules.
- Use locks for generated IDs and bills.
- Verify critical writes.
- Preserve original data if an Update fails.
- Return structured success/error responses.

---

# 30. Development and Verification Workflow

For each module:

1. Confirm business meaning.
2. Confirm source sheets and columns.
3. Complete backend changes.
4. Run backend syntax validation.
5. Run backend functional tests.
6. Deploy Apps Script test version where required.
7. Update frontend API.
8. Update one frontend page/module.
9. Run lint/build checks.
10. Perform screen verification.
11. Test Add.
12. Test Edit.
13. Test Details.
14. Test Cancel/status workflow.
15. Test filters.
16. Test responsive behaviour.
17. Test CSV where applicable.
18. Test Print/PDF where applicable.
19. Update documentation.
20. Commit to the correct feature branch.
21. Push without merging unless approved.

---

# 31. Production Rollout Checklist

Before production deployment:

- [ ] Test records cancelled
- [ ] Backend tests passed
- [ ] Frontend build passed
- [ ] Role restrictions verified
- [ ] Desktop verification completed
- [ ] Mobile verification completed
- [ ] CSV verified
- [ ] Print/PDF verified
- [ ] Documentation updated
- [ ] Correct Git branch confirmed
- [ ] Intended files staged
- [ ] Backup files excluded
- [ ] Commit reviewed
- [ ] Feature branch pushed
- [ ] Merge approved
- [ ] Apps Script production version confirmed
- [ ] Netlify deployment approved
- [ ] Post-deployment smoke test completed