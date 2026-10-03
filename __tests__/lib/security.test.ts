import { describe, expect, it } from "vitest";
import { calendarDateSchema, MAX_DATABASE_INT, nonnegativeIntegerSchema, attachmentUrlsSchema } from "@/lib/schemas/common.schema";
import { transactionSchema } from "@/lib/schemas/transaction.schema";
import { attachmentContentTypes, isAllowedAttachmentPath, isTrustedAttachmentUrl, MAX_ATTACHMENT_SIZE, MAX_ATTACHMENTS, validateAttachmentFile } from "@/lib/attachments";
import { csvEscape } from "@/lib/csv";
import { parseListQuery } from "@/lib/query-filters";
import { isIsolatedTestAuthEnabled } from "@/lib/auth-test-mode";
import { parseUploadBody } from "@/lib/schemas/upload.schema";

describe("database-safe mutation input", () => {
  it("accepts the PostgreSQL Int boundary and rejects overflow, fractions and non-finite values", () => {
    expect(nonnegativeIntegerSchema.parse(MAX_DATABASE_INT)).toBe(MAX_DATABASE_INT);
    for (const value of [MAX_DATABASE_INT + 1, 0.1, -1, Infinity, NaN, Number.MAX_SAFE_INTEGER]) {
      expect(nonnegativeIntegerSchema.safeParse(value).success).toBe(false);
    }
  });

  it.each([null, false, 0, "", "2025-02-29", "2026-04-31", "2026-13-01", "2026-01-01Tinvalid"])("rejects invalid calendar input %s", (value) => {
    expect(calendarDateSchema.safeParse(value).success).toBe(false);
  });

  it("accepts leap days and preserves a date-only day in serialized requests", () => {
    expect(calendarDateSchema.parse("2024-02-29").toISOString()).toBe("2024-02-29T00:00:00.000Z");
    expect(calendarDateSchema.parse("2026-01-01T00:00:00+02:00").toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(calendarDateSchema.parse(new Date("2026-12-31T23:00:00Z")).toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("rejects currency overflow through the transaction schema itself", () => {
    expect(transactionSchema.safeParse({ date: "2026-01-01", vehicleId: null, category: "Income", incomeZarCents: MAX_DATABASE_INT + 1 }).success).toBe(false);
  });
});

describe("attachment boundary", () => {
  const allowed = "https://fleet.public.blob.vercel-storage.com/receipt-123.pdf";
  it("accepts supported public Blob URLs and confines MIME permissions to the chosen extension", () => {
    expect(isTrustedAttachmentUrl(allowed)).toBe(true);
    expect(attachmentContentTypes("receipt.pdf")).toEqual(["application/pdf"]);
    expect(attachmentContentTypes("photo.jpg")).toEqual(["image/jpeg"]);
  });
  it.each([
    "javascript:alert(1)", "https://example.com/receipt.pdf", "http://fleet.public.blob.vercel-storage.com/a.pdf",
    "https://fleet.public.blob.vercel-storage.com.evil.test/a.pdf", "https://user@fleet.public.blob.vercel-storage.com/a.pdf",
    "https://fleet.public.blob.vercel-storage.com/a.svg", "https://fleet.public.blob.vercel-storage.com/a.pdf%00.html",
  ])("rejects untrusted or unsafe URL %s", (url) => expect(isTrustedAttachmentUrl(url)).toBe(false));
  it("checks byte size, extension, MIME type and attachment count", () => {
    expect(validateAttachmentFile({ name: "receipt.pdf", size: MAX_ATTACHMENT_SIZE, type: "application/pdf" })).toBeNull();
    expect(validateAttachmentFile({ name: "receipt.pdf", size: MAX_ATTACHMENT_SIZE + 1, type: "application/pdf" })).toBeTruthy();
    expect(validateAttachmentFile({ name: "receipt.pdf", size: 1, type: "image/png" })).toBeTruthy();
    expect(validateAttachmentFile({ name: "receipt.pdf", size: 0, type: "application/pdf" })).toBeTruthy();
    expect(isAllowedAttachmentPath("receipt.pdf.exe")).toBe(false);
    expect(attachmentUrlsSchema.safeParse(Array.from({ length: MAX_ATTACHMENTS + 1 }, () => allowed)).success).toBe(false);
  });
  it("normalizes the optional SDK upload flags and rejects malformed bodies", () => {
    expect(parseUploadBody({ type: "blob.generate-client-token", payload: { pathname: "a.pdf", callbackUrl: "https://fleet.test/api/upload" } })).toMatchObject({ payload: { multipart: false, clientPayload: null } });
    expect(() => parseUploadBody(null)).toThrow();
    expect(() => parseUploadBody({ type: "blob.generate-client-token", payload: { pathname: 42 } })).toThrow();
  });
  it("preserves exact completion callback JSON for SDK signature verification", () => {
    const callback = { payload: { blob: { pathname: "a.pdf", url: allowed, contentDisposition: "attachment", downloadUrl: allowed }, tokenPayload: null }, type: "blob.upload-completed", extra: "preserved" };
    expect(parseUploadBody(callback)).toBe(callback);
    expect(JSON.stringify(parseUploadBody(callback))).toBe(JSON.stringify(callback));
  });
});

describe("CSV safety", () => {
  it.each(["=HYPERLINK(\"evil\")", "+1+1", "-1+1", "@SUM(A1)", "  =SUM(A1)", "\t=1+1"])("neutralizes spreadsheet formula %s", (value) => {
    expect(csvEscape(value).replace(/^"/, "").startsWith("'")).toBe(true);
  });
  it("keeps text and quotes commas, quotes and CRLF", () => {
    expect(csvEscape("Nita Travels")).toBe("Nita Travels");
    expect(csvEscape('Repair, "left"\r\n')).toBe('"Repair, ""left""\r\n"');
  });
});

describe("list filter validation", () => {
  it.each(["page=1.5", "page=NaN", "page=-1", "page=100001", "dateFrom=2026-02-30", "dateFrom=2026-02-01&dateTo=2026-01-01", "category=Invalid", "vehicleId=missing", "sortDir=invalid"])("rejects bad filter %s", (query) => {
    expect(() => parseListQuery(new URLSearchParams(query))).toThrow();
  });
  it("preserves valid filters for listing and exports", () => {
    const filters = parseListQuery(new URLSearchParams("vehicleId=ALLCR&vehicleId=CR01&category=Repairs&dateFrom=2026-01-01&dateTo=2026-01-31&page=2"));
    expect(filters.vehicleId).toEqual(["ALLCR", "CR01"]);
    expect(filters.category).toEqual(["Repairs"]);
    expect(filters.page).toBe(2);
    expect(filters.dateTo?.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });
});

describe("test authentication isolation", () => {
  const url = "postgresql://test:test@localhost:5432/nita_test?schema=nita_test_auth";
  const testEnv = { APP_ENV: "test", NITA_E2E_AUTH: "true", TEST_DB_APPROVED: "true", DATABASE_URL: url, TEST_DATABASE_URL: url, TEST_DATABASE_SCHEMA: "nita_test_auth", TEST_USERNAME: "fixture", TEST_PASSWORD: "fixture-password" };
  it("permits explicitly isolated runner credentials", () => expect(isIsolatedTestAuthEnabled(testEnv)).toBe(true));
  it("rejects test flags on production, different database, public schema and missing approval", () => {
    expect(isIsolatedTestAuthEnabled({ NITA_E2E_AUTH: "true" })).toBe(false);
    expect(isIsolatedTestAuthEnabled({ ...testEnv, VERCEL_ENV: "production" })).toBe(false);
    expect(isIsolatedTestAuthEnabled({ ...testEnv, APP_ENV: "production" })).toBe(false);
    expect(isIsolatedTestAuthEnabled({ ...testEnv, DATABASE_URL: "postgresql://prod/db" })).toBe(false);
    expect(isIsolatedTestAuthEnabled({ ...testEnv, TEST_DATABASE_SCHEMA: "public" })).toBe(false);
    expect(isIsolatedTestAuthEnabled({ ...testEnv, TEST_DB_APPROVED: undefined })).toBe(false);
    expect(isIsolatedTestAuthEnabled({ ...testEnv, TEST_PASSWORD: undefined })).toBe(false);
  });
});

