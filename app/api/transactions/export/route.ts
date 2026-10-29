export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { transactionCsvChunks } from "@/lib/db/transactions";
import { requireSession, handleApiError } from "@/lib/api-response";
import { parseListQuery } from "@/lib/query-filters";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const chunks = transactionCsvChunks(parseListQuery(sp));
    // Surface query errors before committing the response headers.
    const first = await chunks.next();
    const encoder = new TextEncoder();
    const csv = new ReadableStream<Uint8Array>({
      start(controller) { if (!first.done) controller.enqueue(encoder.encode(first.value)); },
      async pull(controller) {
        try {
          const chunk = await chunks.next();
          if (chunk.done) controller.close();
          else controller.enqueue(encoder.encode(chunk.value));
        } catch {
          controller.error(new Error("Export interrupted. Please retry the download."));
        }
      },
      async cancel() { await chunks.return(undefined); },
    });

    const filename = `nita-travels-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
