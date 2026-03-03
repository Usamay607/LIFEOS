export const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export const compactCurrencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

export function daysUntil(dateValue: string): number {
  const ms = new Date(dateValue).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
