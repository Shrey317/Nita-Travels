"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PowerOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface DeactivateVehicleButtonProps {
  vehicleId: string;
  requiresApproval?: boolean;
}

/** Soft-deactivate only (SRS 16, 26) — historical transactions, mileage, and notes referencing
 *  this vehicle stay intact and queryable; it just drops off the active fleet list and Dashboard. */
export function DeactivateVehicleButton({ vehicleId, requiresApproval = false }: DeactivateVehicleButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, setPending] = useState(false);

  async function handleConfirm() {
    if (isPending) return;
    setPending(true);
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't deactivate this vehicle.");
        }
        toast({ title: res.status === 202 ? "Submitted for admin approval" : `${vehicleId} deactivated` });
        if (res.status !== 202) window.dispatchEvent(new Event("fleet-data-changed"));
        setOpen(false);
        router.push("/vehicles");
        router.refresh();
      } catch (error) {
        toast({
          title: "Couldn't deactivate vehicle",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setPending(false);
      }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-status-red hover:bg-status-red/10 hover:text-status-red">
          <PowerOff className="h-4 w-4" />
          {requiresApproval ? "Request deactivation" : "Deactivate"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{requiresApproval ? "Request deactivation of" : "Deactivate"} {vehicleId}?</AlertDialogTitle>
          <AlertDialogDescription>
            {requiresApproval && "An administrator must approve this request before anything changes. "}
            {vehicleId} will drop off the active fleet list and Dashboard. Its transactions, mileage
            log, and notes stay intact and remain queryable from its profile — this doesn&apos;t
            delete any history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? "Submitting..." : requiresApproval ? "Submit request" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
