"use client";

import { useState, useEffect, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/shared/field-error";
import { PhotoUpload } from "@/components/shared/photo-upload";
import { useToast } from "@/components/ui/use-toast";
import { mileageEntrySchema } from "@/lib/schemas/mileage.schema";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { formatKm } from "@/lib/format";

interface MileageFormProps {
  vehicles: { id: string; registration: string }[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MileageForm({ vehicles }: MileageFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [date, setDate] = useState(todayIso());
  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const [currentMileageKm, setCurrentMileageKm] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [previousMileageKm, setPreviousMileageKm] = useState<number | null>(null);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Server-fetched, read-only — SRS 13.5 forbids trusting a client-submitted previous reading.
  useEffect(() => {
    if (!vehicleId) {
      setPreviousMileageKm(null);
      return;
    }
    let cancelled = false;
    setIsLoadingPrevious(true);
    fetch(`/api/mileage/previous/${vehicleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPreviousMileageKm(typeof data.previousMileageKm === "number" ? data.previousMileageKm : null);
      })
      .catch(() => {
        if (!cancelled) setPreviousMileageKm(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrevious(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const currentKmNum = currentMileageKm ? Number(currentMileageKm) : null;
  const distance = currentKmNum !== null && previousMileageKm !== null ? currentKmNum - previousMileageKm : null;
  const isInvalidProgression = distance !== null && distance <= 0;
  const isOverLimit = distance !== null && distance > 2000;

  const options = vehicleIdOptions(vehicles);

  function buildPayload() {
    return { date, vehicleId, currentMileageKm: currentKmNum, photoUrls };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = buildPayload();
    const result = mileageEntrySchema.safeParse(payload);
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
    if (isInvalidProgression) {
      setErrors({ currentMileageKm: "Current mileage must be greater than the previous reading." });
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        const res = await fetch("/api/mileage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.field) setErrors((prev) => ({ ...prev, [data.field]: data.error }));
          toast({ title: data.error ?? "Something went wrong", variant: "destructive" });
          return;
        }
        toast({ title: "Mileage entry logged" });
        router.push("/mileage");
        router.refresh();
      } catch {
        toast({ title: "Network error — please try again", variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mDate">Date</Label>
          <Input id="mDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mVehicle">Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="mVehicle" aria-invalid={!!errors.vehicleId} aria-describedby="mVehicle-error">
              <SelectValue placeholder="Select a vehicle..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="mVehicle-error" message={errors.vehicleId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mPrevious">Previous Mileage</Label>
          <Input
            id="mPrevious"
            value={!vehicleId ? "Select a vehicle first" : isLoadingPrevious ? "Loading..." : formatKm(previousMileageKm)}
            disabled
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mCurrent">Current Mileage (km)</Label>
          <Input
            id="mCurrent"
            type="number"
            min={0}
            value={currentMileageKm}
            onChange={(e) => setCurrentMileageKm(e.target.value)}
            aria-invalid={!!errors.currentMileageKm}
            aria-describedby="mCurrent-error"
            required
          />
          <FieldError id="mCurrent-error" message={errors.currentMileageKm} />
        </div>
      </div>

      {distance !== null && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <div>
            <p className="text-xs text-muted">Distance Driven</p>
            <p className="font-mono text-lg font-semibold text-ink">{distance.toLocaleString()} km</p>
          </div>
          <div className="ml-auto">
            {isInvalidProgression ? (
              <Badge variant="destructive">Must exceed previous reading</Badge>
            ) : isOverLimit ? (
              <Badge variant="destructive">⚠ Over Limit by {(distance - 2000).toLocaleString()} km</Badge>
            ) : (
              <Badge variant="success">✅ Within Limit</Badge>
            )}
          </div>
        </div>
      )}

      <PhotoUpload photoUrls={photoUrls} onChange={setPhotoUrls} label="Odometer photo (optional)" />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !vehicleId}>
          {isPending ? "Saving..." : "Log Mileage"}
        </Button>
      </div>
    </form>
  );
}
