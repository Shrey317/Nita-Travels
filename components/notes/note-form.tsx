"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FieldError } from "@/components/shared/field-error";
import { PhotoUpload } from "@/components/shared/photo-upload";
import { useToast } from "@/components/ui/use-toast";
import { vehicleNoteSchema } from "@/lib/schemas/note.schema";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { FLEET_WIDE_VEHICLE_ID, NO_VEHICLE_FILTER_VALUE } from "@/lib/constants";

interface NoteFormProps {
  vehicles: { id: string; registration: string }[];
  initialVehicleId?: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** No edit path exists (SRS 11: delete and re-enter only), so this form only ever creates. */
export function NoteForm({ vehicles, initialVehicleId }: NoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [date, setDate] = useState(todayIso());
  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId ?? NO_VEHICLE_FILTER_VALUE);
  const [note, setNote] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const options = vehicleIdOptions(vehicles);

  function buildPayload() {
    return {
      date,
      vehicleId: vehicleId === NO_VEHICLE_FILTER_VALUE ? null : vehicleId,
      note,
      photoUrls,
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = buildPayload();
    const result = vehicleNoteSchema.safeParse(payload);
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
        const res = await fetch("/api/notes", {
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
        toast({ title: "Note added" });
        setNote("");
        setPhotoUrls([]);
        setDate(todayIso());
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
          <Label htmlFor="nDate">Date</Label>
          <Input
            id="nDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date}
            aria-describedby="nDate-error"
            required
          />
          <FieldError id="nDate-error" message={errors.date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nVehicle">Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="nVehicle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
              <SelectItem value={FLEET_WIDE_VEHICLE_ID}>All Vehicles / Fleet-Wide</SelectItem>
              <SelectItem value={NO_VEHICLE_FILTER_VALUE}>No Specific Vehicle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nNote">Note</Label>
        <Textarea
          id="nNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Driver change, accident, driver absent, general fleet news..."
          aria-invalid={!!errors.note}
          aria-describedby="nNote-error"
          required
        />
        <FieldError id="nNote-error" message={errors.note} />
      </div>

      <PhotoUpload photoUrls={photoUrls} onChange={setPhotoUrls} />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add Note"}
        </Button>
      </div>
    </form>
  );
}
