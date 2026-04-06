const SHIPPING_METHODS = [
  {
    id: "gls_home",
    label: "GLS házhozszállítás",
    description: "Házhozszállítás GLS futárral 1-2 munkanapon belül.",
    price: 1990,
    addressHint: "Add meg a teljes kézbesítési címedet.",
  },
  {
    id: "gls_parcel_locker",
    label: "GLS csomagautomata",
    description: "Átvétel GLS automatában a megadott helyszínen.",
    price: 1290,
    addressHint:
      "Az utca, házszám mezőbe a választott GLS automata nevét vagy címét add meg.",
  },
  {
    id: "mpl_home",
    label: "MPL házhozszállítás",
    description: "Házhozszállítás MPL futárszolgálattal.",
    price: 1890,
    addressHint: "Add meg a teljes kézbesítési címedet.",
  },
  {
    id: "mpl_post_office",
    label: "MPL postán maradó",
    description: "Átvétel a választott Magyar Posta átvevőhelyen.",
    price: 990,
    addressHint:
      "Az utca, házszám mezőbe a választott posta nevét vagy címét add meg.",
  },
];

const DEFAULT_COUPONS = [
  {
    code: "SERONA10",
    label: "10% kedvezmény",
    description: "10% kedvezmény 20 000 Ft feletti termékösszegre.",
    type: "percent",
    percent: 10,
    minSubtotal: 20000,
    maxDiscount: 8000,
  },
  {
    code: "UDV1500",
    label: "1 500 Ft kedvezmény",
    description: "Fix 1 500 Ft kedvezmény 12 000 Ft feletti vásárlásra.",
    type: "fixed",
    amount: 1500,
    minSubtotal: 12000,
  },
  {
    code: "GLSFREE",
    label: "Ingyenes GLS szállítás",
    description: "A GLS szállítási díját elengedi 15 000 Ft felett.",
    type: "shipping",
    minSubtotal: 15000,
    appliesToShippingMethods: ["gls_home", "gls_parcel_locker"],
  },
];

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Utánvét",
    description: "Fizetés átvételkor a futárnál vagy az átvevőhelyen.",
  },
  {
    id: "card",
    label: "Bankkártya",
    description:
      "Mentett, tokenizált bankkártyás fizetés. A tényleges gateway-terhelés külön integrációval kapcsolható be.",
  },
  {
    id: "transfer",
    label: "Előre utalás",
    description:
      "Rendelés után díjbekérő e-mailt küldünk a szállítási költséggel növelten.",
  },
];

const SHIPPING_METHOD_IDS = new Set(SHIPPING_METHODS.map((method) => method.id));
const PAYMENT_METHOD_IDS = new Set(PAYMENT_METHODS.map((method) => method.id));

function getShippingMethodById(id) {
  return SHIPPING_METHODS.find((method) => method.id === id) ?? null;
}

function getPaymentMethodById(id) {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? null;
}

function normalizeCouponCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

function getCouponPublicData(coupon) {
  if (!coupon) return null;

  return {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label,
    description: coupon.description,
  };
}

function listCouponSummaries(coupons = DEFAULT_COUPONS) {
  return coupons
    .filter((coupon) => coupon.active !== false)
    .map(getCouponPublicData);
}

function getCouponByCode(code, coupons = DEFAULT_COUPONS) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return (
    coupons.find(
      (coupon) => coupon.active !== false && coupon.code === normalized,
    ) ?? null
  );
}

function calculateCouponDiscount({
  couponCode,
  subtotal,
  shippingMethodId,
  shippingPrice,
  coupons = DEFAULT_COUPONS,
}) {
  const normalizedCode = normalizeCouponCode(couponCode);
  if (!normalizedCode) {
    return {
      coupon: null,
      appliedCode: null,
      discountAmount: 0,
      message: null,
    };
  }

  const coupon = getCouponByCode(normalizedCode, coupons);
  if (!coupon) {
    const error = new Error("Érvénytelen vagy nem aktív kuponkód.");
    error.code = "INVALID_COUPON";
    throw error;
  }

  if (subtotal < Number(coupon.minSubtotal ?? 0)) {
    const error = new Error(
      `A kupon minimum ${coupon.minSubtotal.toLocaleString("hu-HU")} Ft termékösszegnél használható.`,
    );
    error.code = "INVALID_COUPON";
    throw error;
  }

  if (
    Array.isArray(coupon.appliesToShippingMethods) &&
    !coupon.appliesToShippingMethods.includes(shippingMethodId)
  ) {
    const error = new Error("A kupon ehhez a szállítási módhoz nem használható.");
    error.code = "INVALID_COUPON";
    throw error;
  }

  let discountAmount = 0;

  if (coupon.type === "percent") {
    discountAmount = Math.round(subtotal * (Number(coupon.percent) / 100));
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === "fixed") {
    discountAmount = Number(coupon.amount ?? 0);
  } else if (coupon.type === "shipping") {
    discountAmount = shippingPrice;
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal + shippingPrice));

  return {
    coupon: getCouponPublicData(coupon),
    appliedCode: coupon.code,
    discountAmount,
    message: `${coupon.label} sikeresen érvényesítve.`,
  };
}

function buildOrderPricing({
  subtotal,
  shippingMethodId,
  couponCode,
  coupons = DEFAULT_COUPONS,
}) {
  const shippingMethod = getShippingMethodById(shippingMethodId);
  if (!shippingMethod) {
    const error = new Error("Érvénytelen szállítási mód.");
    error.code = "INVALID_SHIPPING_METHOD";
    throw error;
  }

  const shippingPrice = Number(shippingMethod.price);
  const couponResult = calculateCouponDiscount({
    couponCode,
    subtotal,
    shippingMethodId,
    shippingPrice,
    coupons,
  });
  const total = Math.max(subtotal + shippingPrice - couponResult.discountAmount, 0);

  return {
    shippingMethod,
    shippingPrice,
    discountAmount: couponResult.discountAmount,
    discountCode: couponResult.appliedCode,
    coupon: couponResult.coupon,
    couponMessage: couponResult.message,
    total,
  };
}

module.exports = {
  DEFAULT_COUPONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_IDS,
  SHIPPING_METHODS,
  SHIPPING_METHOD_IDS,
  buildOrderPricing,
  calculateCouponDiscount,
  getPaymentMethodById,
  getShippingMethodById,
  getCouponByCode,
  listCouponSummaries,
  normalizeCouponCode,
};
