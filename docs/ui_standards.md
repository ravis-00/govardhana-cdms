# Govardhana CDMS – UI Standards

Version: v1.9-tag-history  
Sprint: Sprint 1 – UI Standardization

## 1. Purpose
To make all Govardhana CDMS pages visually consistent and easier to maintain.

## 2. Modules Covered
- Dashboard
- Master Cattle
- Active Cattle
- New Tag
- New Born
- Treatment
- Feeding
- Milk Yield
- Bio Waste
- Vaccine / Deworming
- Dattu Yojana
- Deregister / Death Records
- Certificates & Reports

## 3. Page Header Standard
Each page should have:
- Page title
- Short description
- Optional primary action button on right
- Optional summary count below title

Example:
Master Cattle  
Complete cattle master records with filters, search, and certificate actions.

## 4. Table Standard
All tables should follow:
- Fixed header
- Scrollable body
- Search box above table
- Filters before table
- Consistent column alignment
- Status badges/pills
- Action menu/icon on right
- Pagination at bottom or top-right

## 5. Form Standard
All forms should use:
- Clear section headings
- Required field indication
- Consistent input height
- Save and Cancel buttons
- Field validation before submit

## 6. Dialog / Modal Standard
Dialogs should have:
- Clear title
- Close button
- Body content with sections
- Footer buttons
- No page reload after save unless necessary

## 7. Date Format Standard
Display dates as:
DD-MM-YYYY

Examples:
21-06-2026

Input fields may use browser/default ISO format:
YYYY-MM-DD

## 8. Notification Standard
Use toast notifications instead of alert.

Types:
- Success: Record saved successfully
- Error: Unable to save record
- Warning: Required fields missing
- Info: No records found

## 9. Design Principles
- Do not break existing working functionality
- Improve one module at a time
- Reuse shared components wherever possible
- Maintain consistency with current sidebar/layout structure