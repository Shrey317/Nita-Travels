import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const mocks = vi.hoisted(() => ({ head: vi.fn() }));
vi.mock("@vercel/blob", () => ({ head: mocks.head }));
import { verifyNewAttachments } from "@/lib/verify-attachments";
const url = "https://fixture.public.blob.vercel-storage.com/receipt.png";
describe("completed attachment verification", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_fixture_synthetic"); });
  afterEach(() => vi.unstubAllEnvs());
  it("preserves existing attachments without revalidating or contacting the provider", async () => {
    await verifyNewAttachments([url], [url]);
    expect(mocks.head).not.toHaveBeenCalled();
  });
  it("rejects another store before any provider request", async () => {
    await expect(verifyNewAttachments([url.replace('fixture.', 'another.')])).rejects.toThrow("application's storage");
    expect(mocks.head).not.toHaveBeenCalled();
  });
  it("accepts only complete objects with valid provider size and content type", async () => {
    mocks.head.mockResolvedValue({ url, pathname: "receipt.png", size: 100, contentType: "image/png" });
    await expect(verifyNewAttachments([url])).resolves.toBeUndefined();
    mocks.head.mockResolvedValue({ url, pathname: "receipt.png", size: 100, contentType: "text/html" });
    await expect(verifyNewAttachments([url])).rejects.toThrow("incomplete or invalid");
    mocks.head.mockRejectedValue(new Error("private provider diagnostic"));
    await expect(verifyNewAttachments([url])).rejects.toThrow("incomplete or invalid");
  });
});
