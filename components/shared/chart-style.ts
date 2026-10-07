/** Shared semantic chart surfaces support both light and dark themes. */
export const chartColors = {
  grid: "rgba(148, 163, 184, 0.1)",
  text: "rgb(var(--color-muted))",
  income: "#2F6BFF",
  expense: "#F05252",
  repairs: "#F5B942",
  profit: "#18C98B",
};
export const chartTooltipStyle = {
  backgroundColor: "rgba(13, 26, 45, 0.9)", // surface-elevated
  color: "#F8FAFC", // ink
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "12px",
  boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(12px)",
};
export const chartLabelStyle = { color: "#A8B5C8", marginBottom: "4px", fontSize: "13px" };
export function chartCurrencyAxis(cents: number): string {
  const rand = cents / 100;
  return Math.abs(rand) >= 1000 ? `R${(rand / 1000).toFixed(0)}k` : `R${rand.toFixed(0)}`;
}
