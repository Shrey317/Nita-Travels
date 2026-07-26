export interface VehicleOption {
  value: string;
  label: string;
}

/** CR01..CR09(+) options built from the live vehicle list, not a hardcoded range — so a 10th
 *  vehicle shows up here automatically. Callers add their own ALLCR/"no vehicle" option on top,
 *  since the label for that varies by context (SRS 15.5 vs 15.9 word it differently). */
export function vehicleIdOptions(vehicles: { id: string; registration: string }[]): VehicleOption[] {
  return vehicles.map((v) => ({ value: v.id, label: `${v.id} — ${v.registration}` }));
}
