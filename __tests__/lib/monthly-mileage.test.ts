import { it, expect } from 'vitest';
import { mileageTotals } from '@/lib/monthly-mileage';
it('allows a high week to balance within the month and resets next month',()=>{
  const rows=[{date:new Date('2026-11-08'),distanceKm:2500},{date:new Date('2026-11-15'),distanceKm:1500}];
  expect(mileageTotals(rows,new Date('2026-11-08'))).toMatchObject({weekOver:true,monthOver:false,monthKm:2500});
  expect(mileageTotals(rows,new Date('2026-11-15'))).toMatchObject({weekOver:false,monthOver:false,monthKm:4000});
  expect(mileageTotals(rows,new Date('2026-12-01'))).toMatchObject({monthKm:0,monthOver:false});
});
it('uses a stronger alert only above 8000, and excludes future readings',()=>{
  const rows=[{date:new Date('2026-11-10'),distanceKm:8000},{date:new Date('2026-11-11'),distanceKm:1},{date:new Date('2026-12-01'),distanceKm:1000}];
  expect(mileageTotals(rows,new Date('2026-11-10')).monthOver).toBe(false);
  expect(mileageTotals(rows,new Date('2026-11-11'))).toMatchObject({monthOver:true,monthKm:8001,remainingKm:0});
});
