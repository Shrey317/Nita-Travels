/** Legacy bank fields are confidential too. Purchase cost and insurance remain operational. */
export const PRIVATE_FINANCE_FIELDS = ['financeBank', 'financePolicyNumber', 'targetEmiCents', 'emiMonthsTotal', 'emiMonthsPaid', 'emiBalanceCents'] as const;
const bankKeys = new Set<string>(PRIVATE_FINANCE_FIELDS);
export function redactLegacyFinance<T>(value: T): T {
  if (Array.isArray(value)) return value.map(redactLegacyFinance) as T;
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, bankKeys.has(key) ? (key === 'financeBank' || key === 'financePolicyNumber' ? null : 0) : redactLegacyFinance(entry)])) as T;
}
export function omitFinanceInputs<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !bankKeys.has(key) && key !== 'purchaseType'));
}
