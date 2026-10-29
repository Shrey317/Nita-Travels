import { z } from "zod";
import { calendarDateSchema } from "@/lib/schemas/common.schema";
import { categorySchema, transactionVehicleRefSchema } from "@/lib/schemas/transaction.schema";
import { NO_VEHICLE_FILTER_VALUE } from "@/lib/constants";
import { ValidationError } from "@/lib/errors";

const vehicleFilter = z.union([transactionVehicleRefSchema.unwrap(), z.literal(NO_VEHICLE_FILTER_VALUE)]);

/** Shared API parsing keeps bad dates, categories and fractional pages away from Prisma. */
export function parseListQuery(searchParams: URLSearchParams) {
  const dateFrom = searchParams.has("dateFrom") ? calendarDateSchema.parse(searchParams.get("dateFrom")) : undefined;
  const dateTo = searchParams.has("dateTo") ? calendarDateSchema.parse(searchParams.get("dateTo")) : undefined;
  if (dateFrom && dateTo && dateFrom > dateTo) throw new ValidationError("Start date must be on or before end date", "dateFrom");
  const vehicleIds = searchParams.getAll("vehicleId");
  const categories = searchParams.getAll("category");
  return {
    dateFrom,
    dateTo,
    page: z.coerce.number().int().min(1).max(100_000).parse(searchParams.get("page") ?? "1"),
    vehicleId: vehicleIds.length ? z.array(vehicleFilter).max(100).parse(vehicleIds) : undefined,
    category: categories.length ? z.array(categorySchema).max(10).parse(categories) : undefined,
    search: searchParams.has("search") ? z.string().max(200).parse(searchParams.get("search")) : undefined,
    sortBy: searchParams.has("sortBy") ? z.enum(["date", "vehicleId", "category", "incomeZarCents", "expenseZarCents", "mileageKm"]).parse(searchParams.get("sortBy")) : undefined,
    sortDir: searchParams.has("sortDir") ? z.enum(["asc", "desc"]).parse(searchParams.get("sortDir")) : undefined,
  };
}

/** Adapt Next page params to the same validation used by JSON and CSV routes. */
export function parsePageListQuery(values: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  try { return { filters: parseListQuery(params), error: null }; }
  catch { return { filters: parseListQuery(new URLSearchParams()), error: "These filters are invalid. Showing unfiltered records; correct the dates, categories or page number and try again." }; }
}
