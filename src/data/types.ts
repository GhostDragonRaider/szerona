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
}

/** Kosárban egy sor: termék + mennyiség. */
export interface CartLine {
  product: Product;
  quantity: number;
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

/** Demo: mentett kártya (csak frontend, nem valós fizetés). */
export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface User {
  username: string;
  email: string;
  role: UserRole;
  /** Megjelenített név (alapértelmezés: felhasználónév). */
  displayName: string;
  billing: BillingAddress;
  cards: SavedCard[];
}

/** Hír / újdonság blokk a főoldalon. */
export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image?: string;
}
