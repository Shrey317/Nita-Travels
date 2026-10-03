# Financial and operational definitions

All ledger amounts are PostgreSQL integer cents. `lib/finance.ts` owns financial ratios;
`lib/analytics.ts` composes those functions for period analytics; `lib/periods.ts` provides
weekly/monthly buckets. The database queries project only required source fields and exclude
transactions with `deletedAt` set. No monetary amounts are converted to Rand before summation.
`formatZAR` is the common presentation formatter, preserving the established South African locale.

| Metric | Definition | Missing/zero denominator |
|---|---|---|
| Revenue | Sum of `incomeZarCents` across all selected non-deleted transactions, irrespective of category | Zero if no rows |
| Expenses | Sum of `expenseZarCents` across those same records | Zero if no rows |
| Net profit | Revenue minus expenses | May be negative |
| Margin | Net profit / revenue; ratio internally, percent on screen | Unavailable (`—`) when revenue is zero |
| Revenue, cost, profit / km | Respective amount / recorded distance for the same selected dates | Unavailable when distance is zero or missing |
| ROI | Recorded net profit / purchase price × 100 | Unavailable if purchase price is zero |
| Repairs | Expenses in Repairs, BrakePads and Tyres | Subset of total expenses, not added again |
| Service | Expenses in Service | Zero-cost service records still count toward frequency |
| Maintenance | Repairs + Service + Maintenance category expenses | Subset of expenses |
| Maintenance / km | Maintenance cents / recorded selected distance | Unavailable without positive distance |
| Fixed costs | License category expenses | Classification is deliberately limited |
| Variable costs | Fuel, Tyres, BrakePads, Repairs, Service, Maintenance, UberFees expenses | Other remains unclassified |
| Remaining configured EMI | Target EMI × (term months minus recorded months paid) | Contract projection, not a bank balance |
| Partial ownership cost | Purchase price + recorded ledger expenses | Requires finance-principal reconciliation before complete TCO claims |
| Partial lifetime contribution | Recorded revenue minus partial ownership cost | Not a valuation or replacement decision |

Insurance premiums, finance payments and interest are not inferred from configuration or notes.
There is no structured Insurance/Finance transaction category. Ledger amounts recorded in Other
remain included in expenses but cannot be reliably split automatically. Purchase price can overlap
finance principal already recorded as expense; the ownership panel explicitly discloses this.

## Scope and reconciliation

Fleet totals include active and inactive vehicle history, ALLCR, null/unassigned records, and
records whose vehicle is unavailable. Deleted transactions never contribute. Vehicle rows contain
only their own transactions. A separate unallocated/overhead contribution explains why individual
vehicle rows alone may not sum to the full fleet total. No overhead is arbitrarily distributed.

Dashboard, analytics and reports consume `getAnalyticsReport` with the same filter contract.
Weekly/monthly pages compose the same financial summary functions. Integration tests compare these
outputs against an actual SQL-backed transaction aggregate over identical dates.

Vehicle command-center lifetime per-km metrics retain their established denominator: current
odometer minus mileage at purchase. They are labelled lifetime. Period reports use only dated mileage
log distances and show coverage limitations. These two denominators answer different questions.

## Dates and comparisons

Stored PostgreSQL DATE values are interpreted as UTC calendar dates. The fleet's current calendar
date is determined in Africa/Johannesburg. ISO weeks start Monday and use the ISO week-year.
Weekly labels describe the complete week, but query bounds never expand a selected date range.

Today, yesterday, this/last week, this/last month, three/six/twelve months, YTD, current/previous
year, full history and custom ranges are supported. Three months means the current calendar month
plus the preceding two. Current calendar presets include the full period; YTD ends today.

- Previous equivalent period: immediately preceding interval of the same number of calendar days.
- Previous month / same period last year: shift selected endpoints, clamping month-end/leap dates.
- Rolling four-week / three-month comparison: the prior window's daily average multiplied by the
  selected interval's day count. Category totals are rounded once to integer cents; labels expose
  the normalization. Counts are observed record counts, not fabricated normalized events.
- Percentage change: (current − previous) / absolute(previous) × 100. A zero prior value has no
  defined percentage baseline; no fabricated 100% appears. Margin deltas also show percentage points.

The profit bridge is exact: revenue change + sum(previous category expense − current category
expense) = profit change. It explains numerical contributions, never unsupported causes.

## Operational evidence

Distance is attributed to the later odometer reading's date. Invalid chains or inconsistent stored
distances are flagged and excluded from derived mileage. Multiple entries are summed per vehicle
per ISO week before applying the shared 2,000 km limit. Historical analytics assess complete selected
weeks only; current operational alerts can flag an already-exceeded limit before Sunday.

Mileage anomalies require four consecutive recorded prior weeks and a deviation of at least 50%.
The actual distance, baseline and difference are shown. Missing weeks do not become zero distance.
Service-day projections use grouped recorded weeks in the prior eight complete weeks; absent logs
remain an explicit coverage limitation.

Repeat repairs mean two or more records for the same vehicle and repair category in the selection.
Occurrences, the latest two dates, interval and total cost are evidence; they do not confirm a
mechanical fault. Health weights are preserved, with insurance assessed consistently by calendar day.
Replacement thresholds remain explainable screening factors with management retaining the decision.
Warranty is free text; expiry/mileage remaining is unavailable. Downtime and true utilization are
unavailable because interval/availability data is not collected. Activity coverage is labelled as
record coverage, never utilization.
