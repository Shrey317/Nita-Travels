"use client";

import { useState, useTransition, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/shared/field-error";
import { PhotoUpload } from "@/components/shared/photo-upload";
import { useToast } from "@/components/ui/use-toast";
import { transactionSchema } from "@/lib/schemas/transaction.schema";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { ALL_CATEGORIES, CATEGORY_LABELS, NO_VEHICLE_FILTER_VALUE, FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";
import { randToCents, centsToRand } from "@/lib/format";
import type { Transaction } from "@prisma/client";

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TransactionFormProps {
  vehicles: { id: string; registration: string }[];
  transaction?: Transaction;
  /** Called after a successful save AND on cancel — undefined means "standalone page", so the
   *  form falls back to router.push/back instead. A Dialog-hosted form passes this to close itself. */
  onClose?: () => void;
  initialVehicleId?: string;
}

export function TransactionForm({ vehicles, transaction, onClose, initialVehicleId }: TransactionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!transaction;

  const [date, setDate] = useState(transaction ? new Date(transaction.date).toISOString().slice(0, 10) : todayIso());
  const [vehicleId, setVehicleId] = useState<string | undefined>(
    transaction ? transaction.vehicleId ?? NO_VEHICLE_FILTER_VALUE : initialVehicleId
  );
  const [category, setCategory] = useState<string | undefined>(transaction?.category);
  const [incomeRand, setIncomeRand] = useState(transaction ? String(centsToRand(transaction.incomeZarCents)) : "");
  const [expenseRand, setExpenseRand] = useState(transaction ? String(centsToRand(transaction.expenseZarCents)) : "");
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [mileageKm, setMileageKm] = useState(transaction?.mileageKm != null ? String(transaction.mileageKm) : "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(transaction?.photoUrls ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isEdit) {
      const savedVehicle = localStorage.getItem("nita-last-vehicle");
      if (savedVehicle && !vehicleId) setVehicleId(savedVehicle);

      const savedCategory = localStorage.getItem("nita-last-category");
      if (savedCategory && !category) setCategory(savedCategory);
    }
  }, [isEdit, vehicleId, category]);

  const isService = category === "Service";
  const showMileageInput =
    category === "Service" ||
    category === "Repairs" ||
    category === "Tyres" ||
    category === "BrakePads" ||
    category === "Maintenance";
  const isIncomeCat = category === "Income" || category === "UberFees";
  const isExpenseCat = category && !isIncomeCat;
  
  const options = vehicleIdOptions(vehicles);

  function buildPayload() {
    return {
      date,
      vehicleId: vehicleId === NO_VEHICLE_FILTER_VALUE ? null : vehicleId,
      category,
      incomeZarCents: randToCents(Number(incomeRand || 0)),
      expenseZarCents: randToCents(Number(expenseRand || 0)),
      notes: notes.trim() || null,
      mileageKm: showMileageInput && mileageKm ? Number(mileageKm) : null,
      photoUrls,
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = buildPayload();
    const result = transactionSchema.safeParse(payload);
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
        const res = await fetch(isEdit ? `/api/transactions/${transaction.id}` : "/api/transactions", {
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
        toast({ title: isEdit ? "Transaction updated" : "Transaction added" });
        if (!isEdit) {
          if (vehicleId) localStorage.setItem("nita-last-vehicle", vehicleId);
          if (category) localStorage.setItem("nita-last-category", category);
        }
        if (onClose) {
          onClose();
          router.refresh();
        } else {
          router.push("/transactions");
          router.refresh();
        }
      } catch {
        toast({ title: "Network error — please try again", variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="txDate">Date</Label>
          <Input
            id="txDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date}
            aria-describedby="txDate-error"
            required
          />
          <FieldError id="txDate-error" message={errors.date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="txVehicle">Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="txVehicle" aria-invalid={!!errors.vehicleId} aria-describedby="txVehicle-error">
              <SelectValue placeholder="Select a vehicle..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
              <SelectItem value={FLEET_WIDE_VEHICLE_ID}>All Vehicles / Fleet-Wide</SelectItem>
              <SelectItem value={NO_VEHICLE_FILTER_VALUE}>No Vehicle / Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
          <FieldError id="txVehicle-error" message={errors.vehicleId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="txCategory">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="txCategory" aria-invalid={!!errors.category} aria-describedby="txCategory-error">
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {ALL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="txCategory-error" message={errors.category} />
        </div>
        {showMileageInput && (
          <div className="space-y-2">
            <Label htmlFor="txMileage">Mileage at {category ? categoryLabel(category) : "Service"} (km)</Label>
            <Input
              id="txMileage"
              type="number"
              min={0}
              value={mileageKm}
              onChange={(e) => setMileageKm(e.target.value)}
              aria-invalid={!!errors.mileageKm}
              aria-describedby="txMileage-error"
              required={isService}
            />
            <FieldError id="txMileage-error" message={errors.mileageKm} />
          </div>
        )}
        {(!category || isIncomeCat) && (
          <div className="space-y-2">
            <Label htmlFor="txIncome">Income (R)</Label>
            <Input
              id="txIncome"
              type="number"
              min={0}
              step="0.01"
              value={incomeRand}
              onChange={(e) => setIncomeRand(e.target.value)}
              aria-invalid={!!errors.incomeZarCents}
              aria-describedby="txIncome-error"
              autoFocus={Boolean(isIncomeCat)}
            />
            <FieldError id="txIncome-error" message={errors.incomeZarCents} />
          </div>
        )}
        {(!category || isExpenseCat) && (
          <div className="space-y-2">
            <Label htmlFor="txExpense">Expense (R)</Label>
            <Input
              id="txExpense"
              type="number"
              min={0}
              step="0.01"
              value={expenseRand}
              onChange={(e) => setExpenseRand(e.target.value)}
              aria-invalid={!!errors.expenseZarCents}
              aria-describedby="txExpense-error"
              autoFocus={Boolean(isExpenseCat)}
            />
            <FieldError id="txExpense-error" message={errors.expenseZarCents} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="txNotes">Notes</Label>
        <Textarea id="txNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <PhotoUpload photoUrls={photoUrls} onChange={setPhotoUrls} label="Receipts / invoices (optional)" />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => (onClose ? onClose() : router.back())}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
