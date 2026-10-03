import { revalidatePath } from "next/cache";

/** Every fleet mutation can affect dashboard totals, reports and vehicle history. */
export function invalidateFleetData(): void {
  revalidatePath("/", "layout");
}
