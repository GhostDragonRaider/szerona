import type { PaymentMethod, ShippingMethodId } from "./types";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Utánvét",
  card: "Bankkártya",
  transfer: "Előre utalás",
};

export const SHIPPING_METHOD_LABELS: Record<ShippingMethodId, string> = {
  gls_home: "GLS házhozszállítás",
  gls_parcel_locker: "GLS csomagautomata",
  mpl_home: "MPL házhozszállítás",
  mpl_post_office: "MPL postán maradó",
};

export function formatPrice(amount: number) {
  return `${amount.toLocaleString("hu-HU")} Ft`;
}
