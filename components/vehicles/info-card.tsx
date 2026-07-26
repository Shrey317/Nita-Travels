import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InfoField {
  label: string;
  value: ReactNode;
}

export function InfoCard({ title, fields }: { title: string; fields: InfoField[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted">{f.label}</span>
            <span className="text-right font-mono text-ink">{f.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
