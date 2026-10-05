"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className="mt-2 w-full bg-brand-blue text-white transition-colors hover:bg-brand-blueAccent">
      {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
      {pending ? "Signing in…" : "Sign In"}
    </Button>
  );
}
