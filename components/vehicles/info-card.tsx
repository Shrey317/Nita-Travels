import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InfoField {
  label: string;
  value: ReactNode;
}

export function InfoCard({ title, fields }: { title: string; fields: InfoField[] }) {
  return (
    <Card className="bg-card border-border-subtle shadow-card-elevated">
      <CardHeader className="pb-3 border-b border-border-subtle bg-surface-elevated/30">
        <CardTitle className="text-sm font-semibold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {fields.map((f, i) => (
          <div key={f.label} className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${i < fields.length - 1 ? "border-b border-border-subtle/50" : ""}`}>
            <span className="text-ink-secondary">{f.label}</span>
            <span className="text-right font-mono-figures text-white">{f.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
