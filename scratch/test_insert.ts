import { createMileageEntry } from '../lib/db/mileage';

async function test() {
  try {
    const entry = await createMileageEntry({
      vehicleId: "CR09",
      date: new Date("2026-10-05T00:00:00Z"),
      currentMileageKm: 79661,
      photoUrls: []
    });
    console.log("Success:", entry.id);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
