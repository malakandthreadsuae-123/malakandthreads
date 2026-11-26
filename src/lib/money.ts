/** All money is stored as integer fils (1 AED = 100 fils). */

export function aedToFils(aed: number | string): number {
  const n = typeof aed === "string" ? Number(aed) : aed;
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function filsToAed(fils: number): number {
  return fils / 100;
}

const formatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "AED 1,250.00" */
export function formatAED(fils: number): string {
  return `AED ${formatter.format(fils / 100)}`;
}

/** Plain decimal string for feeds / schema.org: "1250.00" */
export function filsToDecimalString(fils: number): string {
  return (fils / 100).toFixed(2);
}

export function discountPercent(regular: number, sale: number | null | undefined): number {
  if (!sale || sale >= regular || regular <= 0) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}
