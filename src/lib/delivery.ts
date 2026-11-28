/** Delivery wording used across the store (header, product pages, cart, footer…). Follows the delivery fee set in Admin → Store settings. */

const aed = (fils: number) => {
  const v = Math.round(fils) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

/** "Delivery charges 17 dirham across UAE (charges may vary according to your location)" */
export function deliveryNote(feeFils: number) {
  return `Delivery charges ${aed(feeFils)} dirham across UAE (charges may vary according to your location)`;
}

/** "AED 17 delivery across the UAE" — for tight spaces; pair with deliveryVaries where possible. */
export function deliveryShort(feeFils: number) {
  return `AED ${aed(feeFils)} delivery across the UAE`;
}

export const deliveryVaries = "may vary according to your location";
