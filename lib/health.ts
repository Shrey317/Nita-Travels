/**
 * lib/health.ts
 *
 * Pure business logic for Vehicle Health Score and Replacement Analysis.
 */

export interface HealthScoreResult {
  score: number;
  categories: {
    service: { score: number; max: number };
    insurance: { score: number; max: number };
    mileage: { score: number; max: number };
    repairs: { score: number; max: number };
    financial: { score: number; max: number };
  };
  reasons: string[];
}

export interface HealthInput {
  active: boolean;
  serviceStatus?: "OK" | "DUE_SOON" | "OVERDUE" | "NEEDS_DATA";
  insuranceEndDate?: Date | null;
  hasRecentMileage?: boolean;
  highRepairFrequency?: boolean;
  highRepairCost?: boolean;
  roiPercent?: number | null;
}

/**
 * Calculates a detailed vehicle health score out of 100 based on a transparent weighting model:
 * Service (20%), Insurance (15%), Mileage (15%), Repairs (25%), Financial (25%).
 */
export function calculateVehicleHealthScore(v: HealthInput): HealthScoreResult {
  const result: HealthScoreResult = {
    score: 0,
    categories: {
      service: { score: 20, max: 20 },
      insurance: { score: 15, max: 15 },
      mileage: { score: 15, max: 15 },
      repairs: { score: 25, max: 25 },
      financial: { score: 25, max: 25 },
    },
    reasons: [],
  };

  if (!v.active) {
    result.categories.service.score = 0;
    result.categories.insurance.score = 0;
    result.categories.mileage.score = 0;
    result.categories.repairs.score = 0;
    result.categories.financial.score = 0;
    result.reasons.push("Vehicle is inactive (Score: 0)");
    return result;
  }

  // 1. Service (20%)
  if (v.serviceStatus === "OVERDUE") {
    result.categories.service.score = 0;
    result.reasons.push("Service is overdue (-20 pts)");
  } else if (v.serviceStatus === "DUE_SOON") {
    result.categories.service.score = 10;
    result.reasons.push("Service is due soon (-10 pts)");
  } else if (v.serviceStatus === "NEEDS_DATA") {
    result.categories.service.score = 15;
    result.reasons.push("Missing service records (-5 pts)");
  }

  // 2. Insurance (15%)
  if (v.insuranceEndDate) {
    const today = new Date();
    const end = v.insuranceEndDate.getTime();
    if (end < today.getTime()) {
      result.categories.insurance.score = 0;
      result.reasons.push("Insurance is expired (-15 pts)");
    } else if (end - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
      result.categories.insurance.score = 5;
      result.reasons.push("Insurance expires soon (-10 pts)");
    }
  } else {
    result.categories.insurance.score = 0;
    result.reasons.push("No insurance data (-15 pts)");
  }

  // 3. Mileage (15%)
  if (v.hasRecentMileage === false) {
    result.categories.mileage.score = 0;
    result.reasons.push("Missing recent mileage log (-15 pts)");
  }

  // 4. Repairs (25%)
  if (v.highRepairFrequency) {
    result.categories.repairs.score -= 12;
    result.reasons.push("High frequency of recent repairs (-12 pts)");
  }
  if (v.highRepairCost) {
    result.categories.repairs.score -= 13;
    result.reasons.push("Repair spending is double the fleet average (-13 pts)");
  }
  result.categories.repairs.score = Math.max(0, result.categories.repairs.score);

  // 5. Financial (25%)
  if (v.roiPercent !== undefined && v.roiPercent !== null) {
    if (v.roiPercent < -10) {
      result.categories.financial.score = 0;
      result.reasons.push(`Very poor ROI: ${v.roiPercent.toFixed(1)}% (-25 pts)`);
    } else if (v.roiPercent < 0) {
      result.categories.financial.score = 10;
      result.reasons.push(`Negative ROI: ${v.roiPercent.toFixed(1)}% (-15 pts)`);
    }
  } else {
    result.categories.financial.score = 10;
    result.reasons.push("Insufficient financial data for full score (-15 pts)");
  }

  result.score =
    result.categories.service.score +
    result.categories.insurance.score +
    result.categories.mileage.score +
    result.categories.repairs.score +
    result.categories.financial.score;

  return result;
}

export interface ReplacementInput {
  currentMileageKm: number;
  purchaseDate: Date;
  roiPercent: number | null;
  repairsCostCents: number;
  totalIncomeCents: number;
  profitPerKmCents?: number | null;
}

export function checkVehicleReplacementCriteria(v: ReplacementInput): { recommended: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (v.currentMileageKm > 300000) {
    reasons.push(`High mileage: ${v.currentMileageKm.toLocaleString()} km`);
  }

  const ageInYears = (new Date().getTime() - v.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageInYears > 5) {
    reasons.push(`Vehicle age is ${ageInYears.toFixed(1)} years`);
  }

  if (v.totalIncomeCents > 0 && v.repairsCostCents > v.totalIncomeCents * 0.3) {
    reasons.push(`Cumulative repair costs exceed 30% of total revenue`);
  }

  if (v.roiPercent !== null && v.roiPercent < -20 && ageInYears > 3) {
    reasons.push(`Persistently negative ROI (${v.roiPercent.toFixed(1)}%) on an older vehicle`);
  }

  if (v.profitPerKmCents !== undefined && v.profitPerKmCents !== null && v.profitPerKmCents < 0) {
    reasons.push(`Operating at a loss: ${v.profitPerKmCents < 0 ? "-" : ""}R${(Math.abs(v.profitPerKmCents) / 100).toFixed(2)} / km`);
  }

  return {
    recommended: reasons.length >= 2,
    reasons,
  };
}
