# Govardhana CDMS – Release Notes

---

# v3.1-reports-alignment

## Date

14-Aug-2026

## Status

Development completed and locally verified.

Current branch:

`feature/existing-reports-alignment`

Not merged or deployed to Netlify.

## Purpose

Align existing predefined CDMS reports with the gaushala’s manually maintained Daily Milk, MSGP, Krushi and external-sale registers without creating a duplicate reporting system.

## Daily Milk Report

### Improved

- Aggregates `milk_production` rows from all sheds by date.
- Uses `milk_distribution` for free/internal distribution classifications.
- Aligns report columns with the gaushala Daily Milk Record.
- Corrected historical date-level overwrite behaviour.
- Corrected outgoing and good-milk calculations.
- Added complete monthly totals.

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
Total Outgoing =
Morning Outgoing + Evening Outgoing