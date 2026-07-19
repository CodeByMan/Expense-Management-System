const formatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null | undefined) {
  return formatter.format(Number(value ?? 0));
}

export function formatCompactCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "code",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));
}
