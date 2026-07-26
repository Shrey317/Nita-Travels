"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/shared/field-error";
import { useToast } from "@/components/ui/use-toast";
import { vehicleSchema } from "@/lib/schemas/vehicle.schema";
import { randToCents, centsToRand } from "@/lib/format";
import type { Vehicle } from "@prisma/client";

interface VehicleFormProps {
  vehicle?: Vehicle;
}

interface FormState {
  id: string;
  make: string;
  model: string;
  registration: string;
  registration2: string;
  transmission: "Manual" | "Auto";
  purchaseDate: string;
  purchasePriceRand: string;
  mileageAtPurchaseKm: string;
  currentMileageKm: string;
  warranty: string;
  serviceIntervalKm: string;
  targetEmiRand: string;
  emiMonthsTotal: string;
  emiMonthsPaid: string;
  insurer: string;
  policyNumber: string;
  monthlyPremiumRand: string;
  insurancePeriodMonths: string;
  insuranceEndDate: string;
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

function buildInitialState(vehicle?: Vehicle): FormState {
  if (!vehicle) {
    return {
      id: "", make: "", model: "", registration: "", registration2: "",
      transmission: "Manual", purchaseDate: toDateInputValue(new Date()),
      purchasePriceRand: "", mileageAtPurchaseKm: "", currentMileageKm: "0",
      warranty: "", serviceIntervalKm: "20000", targetEmiRand: "0",
      emiMonthsTotal: "0", emiMonthsPaid: "0", insurer: "", policyNumber: "",
      monthlyPremiumRand: "0", insurancePeriodMonths: "0", insuranceEndDate: "",
    };
  }
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    registration: vehicle.registration,
    registration2: vehicle.registration2 ?? "",
    transmission: vehicle.transmission === "Auto" ? "Auto" : "Manual",
    purchaseDate: toDateInputValue(vehicle.purchaseDate),
    purchasePriceRand: String(centsToRand(vehicle.purchasePriceCents)),
    mileageAtPurchaseKm: String(vehicle.mileageAtPurchaseKm),
    currentMileageKm: String(vehicle.currentMileageKm),
    warranty: vehicle.warranty ?? "",
    serviceIntervalKm: String(vehicle.serviceIntervalKm),
    targetEmiRand: String(centsToRand(vehicle.targetEmiCents)),
    emiMonthsTotal: String(vehicle.emiMonthsTotal),
    emiMonthsPaid: String(vehicle.emiMonthsPaid),
    insurer: vehicle.insurer ?? "",
    policyNumber: vehicle.policyNumber ?? "",
    monthlyPremiumRand: String(centsToRand(vehicle.monthlyPremiumCents)),
    insurancePeriodMonths: String(vehicle.insurancePeriodMonths),
    insuranceEndDate: toDateInputValue(vehicle.insuranceEndDate),
  };
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!vehicle;
  const [form, setForm] = useState<FormState>(() => buildInitialState(vehicle));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload() {
    return {
      id: form.id.trim().toUpperCase(),
      make: form.make,
      model: form.model,
      registration: form.registration,
      registration2: form.registration2.trim() || null,
      transmission: form.transmission,
      purchaseDate: form.purchaseDate,
      purchasePriceCents: randToCents(Number(form.purchasePriceRand || 0)),
      mileageAtPurchaseKm: Number(form.mileageAtPurchaseKm || 0),
      currentMileageKm: Number(form.currentMileageKm || 0),
      warranty: form.warranty.trim() || null,
      serviceIntervalKm: Number(form.serviceIntervalKm || 20000),
      targetEmiCents: randToCents(Number(form.targetEmiRand || 0)),
      emiMonthsTotal: Number(form.emiMonthsTotal || 0),
      emiMonthsPaid: Number(form.emiMonthsPaid || 0),
      insurer: form.insurer.trim() || null,
      policyNumber: form.policyNumber.trim() || null,
      monthlyPremiumCents: randToCents(Number(form.monthlyPremiumRand || 0)),
      insurancePeriodMonths: Number(form.insurancePeriodMonths || 0),
      insuranceEndDate: form.insuranceEndDate || null,
      active: true,
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = buildPayload();
    const result = vehicleSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        const res = await fetch(isEdit ? `/api/vehicles/${vehicle.id}` : "/api/vehicles", {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.field) setErrors((prev) => ({ ...prev, [data.field]: data.error }));
          toast({ title: data.error ?? "Something went wrong", variant: "destructive" });
          return;
        }
        toast({ title: isEdit ? "Vehicle updated" : "Vehicle added" });
        router.push(`/vehicles/${data.vehicle.id}`);
        router.refresh();
      } catch {
        toast({ title: "Network error — please try again", variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Identity & Specs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="id">Vehicle ID</Label>
            <Input
              id="id"
              value={form.id}
              onChange={(e) => update("id", e.target.value.toUpperCase())}
              placeholder="CR10"
              disabled={isEdit}
              aria-invalid={!!errors.id}
              aria-describedby="id-error"
              required
            />
            <FieldError id="id-error" message={errors.id} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              value={form.make}
              onChange={(e) => update("make", e.target.value)}
              aria-invalid={!!errors.make}
              aria-describedby="make-error"
              required
            />
            <FieldError id="make-error" message={errors.make} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              aria-invalid={!!errors.model}
              aria-describedby="model-error"
              required
            />
            <FieldError id="model-error" message={errors.model} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration">Registration</Label>
            <Input
              id="registration"
              value={form.registration}
              onChange={(e) => update("registration", e.target.value)}
              aria-invalid={!!errors.registration}
              aria-describedby="registration-error"
              required
            />
            <FieldError id="registration-error" message={errors.registration} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration2">Registration 2 (optional)</Label>
            <Input id="registration2" value={form.registration2} onChange={(e) => update("registration2", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission</Label>
            <Select value={form.transmission} onValueChange={(v) => update("transmission", v === "Auto" ? "Auto" : "Manual")}>
              <SelectTrigger id="transmission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="warranty">Warranty</Label>
            <Input id="warranty" value={form.warranty} onChange={(e) => update("warranty", e.target.value)} placeholder="Valid till 2029" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceIntervalKm">Service Interval (km)</Label>
            <Input
              id="serviceIntervalKm"
              type="number"
              min={1}
              value={form.serviceIntervalKm}
              onChange={(e) => update("serviceIntervalKm", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Purchase & Mileage</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => update("purchaseDate", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasePriceRand">Purchase Price (R)</Label>
            <Input
              id="purchasePriceRand"
              type="number"
              min={0}
              step="0.01"
              value={form.purchasePriceRand}
              onChange={(e) => update("purchasePriceRand", e.target.value)}
              aria-invalid={!!errors.purchasePriceCents}
              aria-describedby="purchasePrice-error"
              required
            />
            <FieldError id="purchasePrice-error" message={errors.purchasePriceCents} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileageAtPurchaseKm">Mileage at Purchase (km)</Label>
            <Input
              id="mileageAtPurchaseKm"
              type="number"
              min={0}
              value={form.mileageAtPurchaseKm}
              onChange={(e) => update("mileageAtPurchaseKm", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentMileageKm">Current Mileage (km)</Label>
            <Input
              id="currentMileageKm"
              type="number"
              min={0}
              value={form.currentMileageKm}
              onChange={(e) => update("currentMileageKm", e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">EMI / Financing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="targetEmiRand">Monthly EMI (R)</Label>
            <Input
              id="targetEmiRand"
              type="number"
              min={0}
              step="0.01"
              value={form.targetEmiRand}
              onChange={(e) => update("targetEmiRand", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emiMonthsTotal">Term (months)</Label>
            <Input
              id="emiMonthsTotal"
              type="number"
              min={0}
              value={form.emiMonthsTotal}
              onChange={(e) => update("emiMonthsTotal", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emiMonthsPaid">Months Paid</Label>
            <Input
              id="emiMonthsPaid"
              type="number"
              min={0}
              value={form.emiMonthsPaid}
              onChange={(e) => update("emiMonthsPaid", e.target.value)}
              aria-invalid={!!errors.emiMonthsPaid}
              aria-describedby="emiMonthsPaid-error"
            />
            <FieldError id="emiMonthsPaid-error" message={errors.emiMonthsPaid} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Insurance</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="insurer">Insurer</Label>
            <Input id="insurer" value={form.insurer} onChange={(e) => update("insurer", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input id="policyNumber" value={form.policyNumber} onChange={(e) => update("policyNumber", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyPremiumRand">Monthly Premium (R)</Label>
            <Input
              id="monthlyPremiumRand"
              type="number"
              min={0}
              step="0.01"
              value={form.monthlyPremiumRand}
              onChange={(e) => update("monthlyPremiumRand", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurancePeriodMonths">Insurance Period (months)</Label>
            <Input
              id="insurancePeriodMonths"
              type="number"
              min={0}
              value={form.insurancePeriodMonths}
              onChange={(e) => update("insurancePeriodMonths", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceEndDate">Insurance End Date</Label>
            <Input
              id="insuranceEndDate"
              type="date"
              value={form.insuranceEndDate}
              onChange={(e) => update("insuranceEndDate", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Vehicle"}
        </Button>
      </div>
    </form>
  );
}
