/**
 * Központi típusok: termék, kosár tétel, felhasználó, hír, termékcsoport.
 * A frontend egész alkalmazás ezekre a típusokra épül (mock adatok és state).
 */

/** Termékcsoport – a webshop szűrői és menüpontjai ehhez igazodnak. */
export type ProductCategory = "polo" | "pulover" | "nadrag" | "cipo";

/** Egy eladható termék minden megjelenítéshez szükséges mezője. */
export interface Product {
  id: string;
  name: string;
  /** Ár forintban (egész szám, egyszerűsített demo). */
  price: number;
  category: ProductCategory;
  /** A public mappából szolgáltatott kép URL-je (pl. /pictures/serona-01...). */
  image: string;
  description: string;
  /** Újdonság jelölés – hírek szekció és kiemeléshez. */
  isNew?: boolean;
  stockQuantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  active?: boolean;
}

/** Kosárban egy sor: termék + mennyiség. */
export interface CartLine {
  product: Product;
  quantity: number;
  reservationExpiresAt?: string | null;
  availableQuantity?: number;
}

/** Regisztrált vagy bejelentkezett felhasználó szerepköre. */
export type UserRole = "user" | "admin";

/** Számlázási / szállítási cím – fiók oldal. */
export interface BillingAddress {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  zip: string;
  country: string;
}

export type PaymentProvider = "stripe" | "barion" | "simplepay" | "custom";

export type SavedPaymentMethodStatus = "active" | "pending_setup" | "revoked";

/** Tokenizált, szolgáltatói azonosítóval mentett fizetési mód. */
export interface SavedPaymentMethod {
  id: string;
  provider: PaymentProvider;
  type: "card";
  providerCustomerId: string | null;
  providerMethodId: string;
  holderName: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  funding: string;
  fingerprint: string;
  isDefault: boolean;
  status: SavedPaymentMethodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayConfig {
  provider: PaymentProvider | "none";
  mode: "tokenized";
  readyForClientSetup: boolean;
  supportsSavedCards: boolean;
}

export interface User {
  id?: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
  /** Megjelenített név (alapértelmezés: felhasználónév). */
  displayName: string;
  billing: BillingAddress;
  emailVerified?: boolean;
}

export type PaymentMethod = "cod" | "card" | "transfer";

export type ShippingMethodId =
  | "gls_home"
  | "gls_parcel_locker"
  | "mpl_home"
  | "mpl_post_office";

export interface ShippingMethodOption {
  id: ShippingMethodId;
  label: string;
  description: string;
  price: number;
  addressHint: string;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
}

export interface CouponSummary {
  id?: string;
  code: string;
  label: string;
  description: string;
}

export type CouponType = "percent" | "fixed" | "shipping";

export interface Coupon extends CouponSummary {
  id: string;
  type: CouponType;
  percent: number | null;
  amount: number | null;
  minSubtotal: number;
  maxDiscount: number | null;
  appliesToShippingMethods: ShippingMethodId[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommerceOptions {
  paymentMethods: PaymentMethodOption[];
  shippingMethods: ShippingMethodOption[];
  coupons: CouponSummary[];
  transfer: {
    bankAccountHolder: string;
    bankAccountNumber: string | null;
    bankName: string | null;
    paymentDueDays: number;
  };
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  image: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  userType: UserRole;
  userId: string;
  contactEmail: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethodId;
  status: OrderStatus;
  trackingNumber?: string | null;
  discountCode?: string | null;
  discountAmount: number;
  confirmedAt?: string | null;
  processingStartedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  subtotal: number;
  shippingPrice: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  shipping: BillingAddress;
  billing: BillingAddress;
  items: OrderItem[];
}

export interface OrderQuote {
  subtotal: number;
  shippingPrice: number;
  discountAmount: number;
  discountCode: string | null;
  total: number;
  coupon?: CouponSummary | null;
  couponMessage?: string | null;
}

export interface AdminDashboardSummary {
  totals: {
    orderCount: number;
    todayOrderCount: number;
    activeOrderCount: number;
    deliveredRevenue: number;
    pendingTransferTotal: number;
    lowStockCount: number;
  };
  lowStockThreshold: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;
  topProducts: Array<{
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    status: OrderStatus;
    total: number;
    createdAt: string;
    contactEmail: string;
    shippingMethod: ShippingMethodId;
  }>;
  salesSeries: Array<{
    date: string;
    label: string;
    orderCount: number;
    orderValue: number;
  }>;
}

/** Hír / újdonság blokk a főoldalon. */
export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image?: string;
}
