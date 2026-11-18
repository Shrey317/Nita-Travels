export function AgreementPicker({ agreements, tab, canEdit, actionLabel }: { agreements: { id: string; number: string; vehicleId: string }[]; tab: string; canEdit: boolean; actionLabel?: string }) {
  return <form action="/rent-to-own/open" method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
    <input type="hidden" name="tab" value={tab} />
    <label className="min-w-0 flex-1 text-sm font-medium">Choose a car<select name="agreement" required defaultValue="" className="mt-2 block w-full rounded-lg border border-border bg-background p-3"><option value="" disabled>Select an agreement</option>{agreements.map(a => <option key={a.id} value={a.id}>{a.vehicleId} · {a.number}</option>)}</select></label>
    <button className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white">{canEdit ? actionLabel ?? 'Continue' : 'View records'}</button>
  </form>;
}
