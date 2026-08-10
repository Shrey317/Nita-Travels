/**
 * prisma/seed.ts
 *
 * Seeds vehicles from verified master data (see comment on `vehicles` below), then parses
 * prisma/seed-data/*.csv — the actual source files, not hand-transcribed numbers — for
 * transactions and mileage entries. This is deliberate: hand-typing ~350 rows of financial
 * data is exactly the kind of transcription error the spec's Business Logic Protection Policy
 * ("preserve financial accuracy at all times") is there to prevent. Parsing the real files and
 * re-running the same normalization rules the live app uses is both more accurate and, if the
 * source sheet is ever re-exported, straightforwardly re-runnable.
 *
 * Vehicle Notes are not seeded — there is no historical note data anywhere in the source
 * workbook (checked all 10 sheets, not just the 3 CSVs). That table starts empty by design.
 */

process.env.TZ = "UTC"; // fixes ISO-week/date math regardless of the host machine's local timezone

import { PrismaClient, type Category, type Prisma } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { getISOWeek, getISOWeekYear } from "date-fns";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CSV parsing helpers — small and hand-written rather than a new dependency,
// but still quote-aware (RFC 4180-ish): several fields in these exports are
// wrapped in quotes specifically because they contain thousands-separator
// commas, e.g. "111,688".
// ---------------------------------------------------------------------------

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const text = content.replace(/\r\n/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** Parses "20 Jul 2025" -> a UTC midnight Date, avoiding any local-timezone parsing ambiguity. */
function parseDdMmmYyyy(raw: string): Date {
  const [dayStr, monStr, yearStr] = raw.trim().split(" ");
  if (!dayStr || !monStr || !yearStr) throw new Error(`Unrecognised date: "${raw}"`);
  const day = Number(dayStr);
  const month = MONTHS[monStr];
  const year = Number(yearStr);
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) {
    throw new Error(`Unrecognised date: "${raw}"`);
  }
  return new Date(Date.UTC(year, month, day));
}

/** "13050" | "" | "-" -> cents. Source amounts are plain Rand numbers (no currency symbol). */
function parseMoneyToCents(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-") return 0;
  return Math.round(parseFloat(cleaned) * 100);
}

/** "65,000 km" | "111,688" | "-" | "" -> integer km, or null. Strips the " km" suffix and commas
 *  per SRS 12.2/25. */
function parseKmOrNull(raw: string): number | null {
  const cleaned = raw.replace(/km/gi, "").replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  return Math.round(parseFloat(cleaned));
}

function normalizeVehicleId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === "ALL CR") return "ALLCR"; // SRS 12.2, 25
  return trimmed;
}

/** Safe column access — a short/malformed CSV row reads as "" for the missing column rather
 *  than throwing on `undefined`, which is the right default for trailing-empty CSV cells. */
function col(row: string[], index: number): string {
  return row[index] ?? "";
}

const CATEGORY_MAP: Record<string, Category> = {
  Service: "Service",
  Fuel: "Fuel",
  Tyres: "Tyres",
  "Brake Pads": "BrakePads",
  Repairs: "Repairs",
  License: "License",
  Maintenance: "Maintenance",
  Other: "Other",
  "Uber Fees": "UberFees",
  Income: "Income",
};

function seedDataPath(filename: string): string {
  return join(__dirname, "seed-data", filename);
}

// ---------------------------------------------------------------------------
// Vehicle master data — read from the live Vehicle Management sheet at seed time
// (22 Jul 2026 export), not the older snapshot in the SRS's own Section 12.1. Purchase
// dates, EMI progress, and insurance figures had all moved on since that section was
// written; currentMileageKm below is a starting point only — the reconciliation pass
// at the end of main() raises it to the true maximum once transactions and mileage
// entries are loaded, exactly as the live app's own sync rules (SRS 15.5, 15.8) would.
// ---------------------------------------------------------------------------

const vehicles: Prisma.VehicleCreateInput[] = [
  {
    id: "CR01", make: "Suzuki", model: "S PRESSO", registration: "ML 47 SY GP", registration2: null,
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2025, 6, 20)), purchasePriceCents: 14_000_000,
    mileageAtPurchaseKm: 44_000, currentMileageKm: 95_864, warranty: "Valid till 2027", serviceIntervalKm: 20_000,
    targetEmiCents: 200_000, emiMonthsTotal: 61, emiMonthsPaid: 0, insurer: null, policyNumber: null,
    monthlyPremiumCents: 208_251, insurancePeriodMonths: 61, insuranceEndDate: new Date(Date.UTC(2029, 7, 16)),
  },
  {
    id: "CR02", make: "Suzuki", model: "S PRESSO", registration: "ML 85 NG GP", registration2: null,
    transmission: "Auto", purchaseDate: new Date(Date.UTC(2025, 6, 20)), purchasePriceCents: 16_000_000,
    mileageAtPurchaseKm: 40_000, currentMileageKm: 119_890, warranty: "Valid till 2027", serviceIntervalKm: 20_000,
    targetEmiCents: 200_000, emiMonthsTotal: 61, emiMonthsPaid: 0, insurer: null, policyNumber: null,
    monthlyPremiumCents: 198_530, insurancePeriodMonths: 61, insuranceEndDate: new Date(Date.UTC(2029, 7, 16)),
  },
  {
    id: "CR03", make: "VW", model: "Kombi", registration: "MG 81 DR GP", registration2: null,
    transmission: "Auto", purchaseDate: new Date(Date.UTC(2025, 8, 19)), purchasePriceCents: 29_500_000,
    mileageAtPurchaseKm: 75_000, currentMileageKm: 0, warranty: "Valid till 2028", serviceIntervalKm: 20_000,
    targetEmiCents: 0, emiMonthsTotal: 61, emiMonthsPaid: 0, insurer: null, policyNumber: null,
    monthlyPremiumCents: 349_456, insurancePeriodMonths: 61, insuranceEndDate: new Date(Date.UTC(2029, 9, 16)),
  },
  {
    id: "CR04", make: "Suzuki", model: "S PRESSO", registration: "MN 81 MC GP", registration2: null,
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2025, 9, 23)), purchasePriceCents: 13_311_100,
    mileageAtPurchaseKm: 39_000, currentMileageKm: 79_165, warranty: "Valid till 2029", serviceIntervalKm: 20_000,
    targetEmiCents: 200_000, emiMonthsTotal: 61, emiMonthsPaid: 0, insurer: null, policyNumber: null,
    monthlyPremiumCents: 217_690, insurancePeriodMonths: 61, insuranceEndDate: new Date(Date.UTC(2029, 10, 20)),
  },
  {
    id: "CR05", make: "Suzuki", model: "S PRESSO", registration: "LP 66 LB GP", registration2: null,
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2025, 10, 11)), purchasePriceCents: 15_011_100,
    mileageAtPurchaseKm: 41_645, currentMileageKm: 75_426, warranty: "Valid till 2029", serviceIntervalKm: 20_000,
    targetEmiCents: 301_460, emiMonthsTotal: 72, emiMonthsPaid: 5, insurer: "ABSA", policyNumber: "71000634051",
    monthlyPremiumCents: 294_725, insurancePeriodMonths: 72, insuranceEndDate: new Date(Date.UTC(2030, 8, 16)),
  },
  {
    id: "CR06", make: "Suzuki", model: "S PRESSO", registration: "MR 65 SW GP", registration2: "BR 47 TY ZN",
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2025, 10, 11)), purchasePriceCents: 15_011_100,
    mileageAtPurchaseKm: 46_275, currentMileageKm: 83_894, warranty: "Valid till 2029", serviceIntervalKm: 20_000,
    targetEmiCents: 304_413, emiMonthsTotal: 71, emiMonthsPaid: 5, insurer: "ABSA", policyNumber: "71000634069",
    monthlyPremiumCents: 297_667, insurancePeriodMonths: 72, insuranceEndDate: new Date(Date.UTC(2030, 8, 16)),
  },
  {
    id: "CR07", make: "Suzuki", model: "S PRESSO", registration: "MS 29 BZ GP", registration2: null,
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2025, 10, 27)), purchasePriceCents: 14_911_100,
    mileageAtPurchaseKm: 44_500, currentMileageKm: 72_931, warranty: "Valid till 2029", serviceIntervalKm: 20_000,
    targetEmiCents: 375_000, emiMonthsTotal: 54, emiMonthsPaid: 5, insurer: "ABSA", policyNumber: "71000691988",
    monthlyPremiumCents: 369_172, insurancePeriodMonths: 54, insuranceEndDate: new Date(Date.UTC(2029, 6, 16)),
  },
  {
    id: "CR08", make: "Suzuki", model: "S PRESSO", registration: "MW 07 YY GP", registration2: "BT 23 JK ZN",
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2026, 0, 30)), purchasePriceCents: 14_741_100,
    mileageAtPurchaseKm: 41_000, currentMileageKm: 56_740, warranty: "Valid till 2029", serviceIntervalKm: 20_000,
    targetEmiCents: 375_000, emiMonthsTotal: 61, emiMonthsPaid: 4, insurer: "FNB/WESBANK", policyNumber: "85408245868",
    monthlyPremiumCents: 374_604, insurancePeriodMonths: 61, insuranceEndDate: new Date(Date.UTC(2030, 2, 16)),
  },
  {
    id: "CR09", make: "Suzuki", model: "S PRESSO", registration: "MW 07 ZG GP", registration2: "BR 43 XC ZN",
    transmission: "Manual", purchaseDate: new Date(Date.UTC(2026, 0, 30)), purchasePriceCents: 14_741_100,
    mileageAtPurchaseKm: 44_000, currentMileageKm: 54_715, warranty: "Valid till 2029", serviceIntervalKm: 20_000,
    targetEmiCents: 375_000, emiMonthsTotal: 61, emiMonthsPaid: 4, insurer: "FNB/WESBANK", policyNumber: "85405357800",
    monthlyPremiumCents: 374_604, insurancePeriodMonths: 61, insuranceEndDate: new Date(Date.UTC(2030, 2, 16)),
  },
];

// ---------------------------------------------------------------------------
// Transactions — parsed from prisma/seed-data/transactions.csv
// ---------------------------------------------------------------------------

interface ParsedTransaction {
  date: Date;
  vehicleId: string | null;
  category: Category;
  incomeZarCents: number;
  expenseZarCents: number;
  notes: string | null;
  mileageKm: number | null;
}

function parseTransactionsCsv(): ParsedTransaction[] {
  const rows = parseCsvRows(readFileSync(seedDataPath("transactions.csv"), "utf-8"));
  // Row 0: title, row 1: instructions, row 2: blank, row 3: header. Data from row 4.
  return rows
    .slice(4)
    .filter((r) => r[0]?.trim())
    .map((r) => {
      const date = col(r, 0);
      const vehicleIdRaw = col(r, 1);
      const categoryRaw = col(r, 5).trim();
      const income = col(r, 6);
      const expense = col(r, 7);
      const notes = col(r, 8);
      const mileage = col(r, 10);
      const incomeZarCents = parseMoneyToCents(income);
      const expenseZarCents = parseMoneyToCents(expense);

      let category = CATEGORY_MAP[categoryRaw];
      if (!category) {
        if (categoryRaw) {
          // A non-blank value that doesn't match any known category is a real data problem
          // worth stopping for, not guessing past.
          throw new Error(`Unknown transaction category "${categoryRaw}" on ${date}`);
        }
        // A blank category (found once in the source data: a loan repayment with no vehicle
        // and nothing filled in under Category) still carries real money and needs a home
        // rather than being dropped — SRS's Business Logic Protection Policy rules out silently
        // skipping audit-relevant rows. Falls back to Income for an income-only row, Other
        // otherwise; either can be recategorized afterwards from the Transactions page, which
        // already supports editing every field including category.
        category = incomeZarCents > 0 && expenseZarCents === 0 ? "Income" : "Other";
        console.warn(`  Blank category on ${date} (${notes || "no notes"}) -> defaulted to "${category}"`);
      }

      return {
        date: parseDdMmmYyyy(date),
        vehicleId: normalizeVehicleId(vehicleIdRaw),
        category,
        incomeZarCents,
        expenseZarCents,
        notes: notes.trim() || null,
        mileageKm: category === "Service" ? parseKmOrNull(mileage) : null,
      };
    });
}

/**
 * Service Log entries with no matching Transaction row (SRS 12.3), cross-checked by date +
 * vehicle against the CSV above. The spec's own Section 12.3 lists 3 of these; a 4th (CR03)
 * has since been added to the source Service Log tab and was gap-filled the same way. A 5th
 * near-miss (CR02: Service Log's 20 Nov 2025 vs. an existing 18 Nov 2025 Transaction) was
 * judged to be the same real-world visit rather than a second one, per product decision — so
 * it is intentionally NOT included here; the existing 18 Nov 2025 Transaction stands as-is.
 */
const gapFillTransactions: ParsedTransaction[] = [
  {
    date: new Date(Date.UTC(2025, 10, 20)), vehicleId: "CR06", category: "Service",
    incomeZarCents: 0, expenseZarCents: 300_000, mileageKm: 62_500, notes: "Normal Service",
  },
  {
    date: new Date(Date.UTC(2026, 0, 15)), vehicleId: "CR08", category: "Service",
    incomeZarCents: 0, expenseZarCents: 300_000, mileageKm: 45_000, notes: "Normal Service",
  },
  {
    date: new Date(Date.UTC(2026, 0, 16)), vehicleId: "CR09", category: "Service",
    incomeZarCents: 0, expenseZarCents: 300_000, mileageKm: 45_000, notes: "Normal Service",
  },
  {
    // Free/warranty service — R0 both sides. Valid under the Service-category exception to the
    // "income and expense can't both be zero" rule (lib/schemas/transaction.schema.ts).
    date: new Date(Date.UTC(2025, 10, 30)), vehicleId: "CR03", category: "Service",
    incomeZarCents: 0, expenseZarCents: 0, mileageKm: 90_000, notes: "Normal Service (free / warranty)",
  },
];

// ---------------------------------------------------------------------------
// Mileage entries — parsed from prisma/seed-data/mileage-log.csv
// ---------------------------------------------------------------------------

interface ParsedMileageEntry {
  date: Date;
  vehicleId: string;
  previousMileageKm: number;
  currentMileageKm: number;
  distanceDrivenKm: number;
  isoWeek: number;
  isoYear: number;
  overLimitByKm: number | null;
}

function parseMileageLogCsv(): ParsedMileageEntry[] {
  const rows = parseCsvRows(readFileSync(seedDataPath("mileage-log.csv"), "utf-8"));
  return rows
    .slice(4)
    .filter((r) => r[0]?.trim() && r[1]?.trim())
    .map((r) => {
      const date = col(r, 0);
      const vehicleId = col(r, 1);
      const previousRaw = col(r, 3);
      const currentRaw = col(r, 4);
      const current = parseKmOrNull(currentRaw);
      if (current === null) throw new Error(`Missing current mileage for ${vehicleId} on ${date}`);

      // SRS 12.4: blank/dash previous mileage means a first-ever entry for that vehicle —
      // previous is taken as 0, distance as the full current reading, and the over-limit
      // check is skipped (it isn't a real weekly delta, so 2,000km/week doesn't apply to it).
      const isFirstEntry = !previousRaw.trim() || previousRaw.trim() === "-";
      const previous = isFirstEntry ? 0 : parseKmOrNull(previousRaw) ?? 0;
      const distance = isFirstEntry ? current : current - previous;
      const overLimitByKm = isFirstEntry ? null : distance > 2000 ? distance - 2000 : null;
      const parsedDate = parseDdMmmYyyy(date);

      return {
        date: parsedDate,
        vehicleId: vehicleId.trim(),
        previousMileageKm: previous,
        currentMileageKm: current,
        distanceDrivenKm: distance,
        isoWeek: getISOWeek(parsedDate),
        isoYear: getISOWeekYear(parsedDate),
        overLimitByKm,
      };
    });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding vehicles...");
  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({ where: { id: vehicle.id }, create: vehicle, update: vehicle });
  }

  const existingTransactionCount = await prisma.transaction.count();
  if (existingTransactionCount > 0) {
    console.warn(
      `Skipping transaction + mileage seed: ${existingTransactionCount} transactions already exist. ` +
        "Delete them first (or reset the database) if you want to reseed from the CSVs."
    );
  } else {
    console.log("Parsing transactions.csv...");
    const parsedTransactions = parseTransactionsCsv();
    const allTransactions = [...parsedTransactions, ...gapFillTransactions];
    console.log(
      `Inserting ${parsedTransactions.length} transactions from the CSV + ${gapFillTransactions.length} gap-fill records...`
    );
    await prisma.transaction.createMany({ data: allTransactions });

    console.log("Parsing mileage-log.csv...");
    const mileageEntries = parseMileageLogCsv();
    console.log(`Inserting ${mileageEntries.length} mileage entries...`);
    await prisma.mileageEntry.createMany({ data: mileageEntries });

    console.log("Reconciling each vehicle's currentMileageKm to the true observed maximum...");
    for (const vehicle of vehicles) {
      const [vehicleRow, maxServiceMileage, maxLogMileage] = await Promise.all([
        prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
        prisma.transaction.aggregate({
          where: { vehicleId: vehicle.id, category: "Service", mileageKm: { not: null } },
          _max: { mileageKm: true },
        }),
        prisma.mileageEntry.aggregate({
          where: { vehicleId: vehicle.id },
          _max: { currentMileageKm: true },
        }),
      ]);
      const trueCurrent = Math.max(
        vehicleRow.currentMileageKm,
        maxServiceMileage._max.mileageKm ?? 0,
        maxLogMileage._max.currentMileageKm ?? 0
      );
      if (trueCurrent !== vehicleRow.currentMileageKm) {
        await prisma.vehicle.update({ where: { id: vehicle.id }, data: { currentMileageKm: trueCurrent } });
        console.log(`  ${vehicle.id}: currentMileageKm ${vehicleRow.currentMileageKm} -> ${trueCurrent}`);
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });