"use client";

import { useState, useTransition } from "react";
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
  onDelete: () => Promise<void>;
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
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onDelete();
        toast({ title: successMessage });
        setOpen(false);
      } catch (error) {
        toast({
          title: "Couldn't delete",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={triggerLabel}>
          <Trash2 className="h-4 w-4 text-status-red" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
