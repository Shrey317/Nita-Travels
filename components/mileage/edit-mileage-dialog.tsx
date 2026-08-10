"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatKm } from "@/lib/format";

interface EditMileageDialogProps {
  entryId: string;
  vehicleId: string;
  currentMileageKm: number;
  previousMileageKm: number;
  onSaved: () => void;
}

/** Inline dialog that lets the user correct a wrong mileage reading without
 *  deleting and re-creating the entire entry. Only the currentMileageKm
 *  can be edited — the server recalculates distance and over-limit status. */
export function EditMileageDialog({
  entryId,
  vehicleId,
  currentMileageKm,
  previousMileageKm,
  onSaved,
}: EditMileageDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(currentMileageKm));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Reset form state when dialog opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setValue(String(currentMileageKm));
      setError(null);
    }
    setOpen(next);
  }

  function handleSave() {
    const numericValue = Number(value);

    if (!value || isNaN(numericValue) || !Number.isInteger(numericValue) || numericValue <= 0) {
      setError("Enter a valid positive whole number.");
      return;
    }

    if (numericValue <= previousMileageKm) {
      setError(`Must be greater than the previous reading (${previousMileageKm.toLocaleString()} km).`);
      return;
    }

    if (numericValue === currentMileageKm) {
      setOpen(false);
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/mileage/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMileageKm: numericValue }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        toast({ title: "Mileage entry updated" });
        setOpen(false);
        onSaved();
      } catch {
        toast({ title: "Network error — please try again", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit mileage entry">
          <Pencil className="h-4 w-4 text-teal" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Mileage — {vehicleId}</DialogTitle>
          <DialogDescription>
            Correct the current mileage reading. Distance and limit status will be recalculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted">Previous Mileage</Label>
            <p className="font-mono text-sm text-ink">{formatKm(previousMileageKm)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editCurrentKm">Current Mileage (km)</Label>
            <Input
              id="editCurrentKm"
              type="number"
              min={previousMileageKm + 1}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby="editCurrentKm-error"
              autoFocus
            />
            {error && (
              <p id="editCurrentKm-error" className="text-xs text-status-red" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
