export const UNITS = ["lb", "oz", "kg", "g", "each", "case", "pack", "bottle", "bag", "box"] as const;

export const CATEGORIES = [
  "Fish & seafood",
  "Meat",
  "Produce",
  "Rice & dry goods",
  "Sauces & seasonings",
  "Drinks",
  "Tableware",
  "Packaging",
  "Supplies",
  "Other",
];

export function fmtNum(value: number | string, maxDecimals = 2): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export function fmtQty(value: number | string, unit: string): string {
  return `${fmtNum(value)} ${unit}`;
}

export function fmtMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const MOVEMENT_LABEL: Record<string, string> = {
  receive: "Received",
  use: "Used",
  waste: "Waste",
  count: "Count correction",
};
