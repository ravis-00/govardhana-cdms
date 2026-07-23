# Govardhana CDMS – UI Standards

## Version

v2.3-preventive-care

## Last Updated

23-Jul-2026

---

# 1. Purpose

The purpose of this document is to maintain a consistent, professional and easy-to-use interface across Govardhana CDMS.

All new modules and major UI changes should follow these standards.

---

# 2. Design Principles

1. Do not break existing working functionality.
2. Improve one module at a time.
3. Reuse shared components.
4. Keep page structure consistent.
5. Use clear business terminology.
6. Prefer visible validation over silent failure.
7. Preserve historical records.
8. Disable duplicate submissions.
9. Use consistent date formats.
10. Use toasts instead of browser alerts.
11. Keep important actions easy to find.
12. Use status badges for quick interpretation.
13. Support scrolling and smaller screens.
14. Keep forms grouped into logical sections.

---

# 3. Modules Covered

- Login
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

# 4. Shared Components

The application should reuse common components where practical.

Current shared components include:

- `PageHeader`
- `MetricCard`
- `SectionCard`
- `StatusBadge`
- `FormActions`
- `ConfirmDialog`

New reusable components should be added when the same UI pattern appears in multiple modules.

---

# 5. Page Layout Standard

Each page should normally include:

1. Page Header
2. KPI or summary cards where useful
3. Search and Filters section
4. Record count and pagination controls
5. Main table or content area
6. Add/Edit modal
7. Details modal where applicable
8. Toast notifications

Recommended page width:

- Use a centered maximum width where appropriate.
- Allow wider tables to use horizontal scrolling.
- Maintain consistent page padding.

---

# 6. Page Header Standard

Each page header should include:

- Page title
- Short description
- Optional count text
- Optional primary action button on the right

Example:

```text
Preventive Care

Manage vaccinations, deworming, supplementation and other preventive treatment events.

Showing 7 of 7 records

+ Add Preventive Care