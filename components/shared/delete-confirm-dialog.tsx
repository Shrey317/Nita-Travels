"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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

interface DeleteConfirmDialogProps {
  title: string;
  description: string;
  onDelete: () => Promise<void | boolean>;
  requiresApproval?: boolean;
  successMessage?: string;
  triggerLabel?: string;
}

/** AlertDialog confirmation before every destructive action (SRS Section 9), wired to a real
 *  async delete with its own pending state and toast feedback — used by Transactions now, and
 *  reused as-is by Mileage/Notes delete in later phases. */
export function DeleteConfirmDialog({
  title,
  description,
  onDelete,
  successMessage = "Deleted.",
  triggerLabel = "Delete",
  requiresApproval = false,
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  async function handleConfirm() {
    if (isPending) return;
    setIsPending(true);
      try {
        const pendingApproval = await onDelete();
        toast({ title: pendingApproval === true ? "Submitted for admin approval" : successMessage });
        setOpen(false);
      } catch (error) {
        toast({
          title: requiresApproval ? "Couldn't request deletion" : "Couldn't delete",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={requiresApproval ? `Request deletion: ${triggerLabel}` : triggerLabel}>
          <Trash2 className="h-4 w-4 text-status-red" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{requiresApproval ? "Request deletion?" : title}</AlertDialogTitle>
          <AlertDialogDescription>{requiresApproval ? "Submit this deletion for admin approval. The record will remain unchanged until an administrator approves the request." : description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault(); // stay open through the pending state; we close manually on success
              handleConfirm();
            }}
            disabled={isPending}
          >
            {requiresApproval ? (isPending ? "Submitting..." : "Request deletion") : (isPending ? "Deleting..." : "Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
