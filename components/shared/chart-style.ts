/** Shared semantic chart surfaces support both light and dark themes. */
export const chartColors = {
  grid: "rgb(var(--color-border))",
  text: "rgb(var(--color-muted))",
  income: "#0D9488",
  expense: "#64748B",
  repairs: "#D97706",
  profit: "#3B82F6",
};
export const chartTooltipStyle = {
  backgroundColor: "rgb(var(--color-surface-elevated))",
  color: "rgb(var(--color-ink))",
  border: "1px solid rgb(var(--color-border))",
  borderRadius: "8px",
};
export const chartLabelStyle = { color: "rgb(var(--color-ink))" };
export function chartCurrencyAxis(cents: number): string {
  const rand = cents / 100;
  return Math.abs(rand) >= 1000 ? `R${(rand / 1000).toFixed(0)}k` : `R${rand.toFixed(0)}`;
}
