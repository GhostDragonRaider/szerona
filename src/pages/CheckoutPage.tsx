/**
 * Pénztár: szerveroldali rendelés létrehozása, backendes kosárral.
 */
import styled from "@emotion/styled";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  Field,
  Input,
  Lead,
  Select,
  Title,
} from "../components/account/accountShared";
import { formatPrice } from "../data/commerce";
import { PICKUP_POINTS } from "../data/pickupPoints";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";
import type {
  BillingAddress,
  CommerceOptions,
  CouponSummary,
  Order,
  OrderQuote,
  PaymentGatewayConfig,
  PaymentSession,
  PaymentMethod,
  SavedPaymentMethod,
  ShippingMethodId,
  ShippingMethodOption,
} from "../data/types";

const Page = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.lg} max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px))
    ${({ theme }) => theme.space.xl} max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  width: 100%;
  box-sizing: border-box;
  min-height: min(70vh, 100%);
`;

const PageTitle = styled.h1`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 2rem);
  letter-spacing: 0.06em;
`;

const Steps = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  margin: 0 0 ${({ theme }) => theme.space.xl};
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const StepItem = styled.li<{ $active: boolean; $done: boolean }>`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $active, $done }) =>
    $active
      ? theme.colors.accentSoft
      : $done
        ? theme.colors.secondarySoft
        : "transparent"};
  color: ${({ theme, $active }) => ($active ? theme.colors.text : "inherit")};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.accent : theme.colors.border};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.md};
  align-items: center;
  margin-top: ${({ theme }) => theme.space.lg};
`;

const SolidBtn = styled.button`
  min-height: 48px;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-sizing: border-box;
  transition: opacity 0.2s;
  width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    min-width: 200px;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  &:hover {
    opacity: 0.9;
  }
`;

const SolidLink = styled(Link)`
  min-height: 48px;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    min-width: 200px;
  }
`;

const RadioList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const RadioLabel = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $checked }) =>
      $checked ? theme.colors.accent : theme.colors.border};
  cursor: pointer;
  background: ${({ theme, $checked }) =>
    $checked ? theme.colors.accentSoft : theme.colors.surface};
`;

const RadioCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const RadioMeta = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.88rem;
  line-height: 1.5;
`;

const SummaryLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.95rem;
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const CardBlock = styled.div`
  margin-top: ${({ theme }) => theme.space.lg};
  padding-top: ${({ theme }) => theme.space.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const SavedMethodCard = styled.label<{ $checked: boolean }>`
  display: block;
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $checked }) =>
      $checked ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, $checked }) =>
    $checked ? theme.colors.accentSoft : theme.colors.surfaceElevated};
  cursor: pointer;
`;

const SavedMethodTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
`;

const SavedMethodBadge = styled.span<{ $default?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.24rem 0.55rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $default }) =>
    $default ? theme.colors.accentSoft : theme.colors.surface};
  color: ${({ theme, $default }) =>
    $default ? theme.colors.accent : theme.colors.textMuted};
  font-size: 0.76rem;
  font-weight: 700;
`;

const SubTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.05rem;
  font-weight: 700;
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.sm} - 1px)`}) {
    grid-template-columns: 1fr;
  }
`;

const HelperText = styled.p`
  margin: -${({ theme }) => theme.space.xs} 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.88rem;
  line-height: 1.5;
`;

const PickupCard = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceElevated};
`;

const StatusMessage = styled.p<{ $error?: boolean }>`
  margin: ${({ theme }) => theme.space.md} 0 0;
  font-size: 0.95rem;
  color: ${({ theme, $error }) =>
    $error ? theme.colors.accent : theme.colors.success};
`;

const stepsConfig = [
  { id: 1, label: "1. Szállítási adatok" },
  { id: 2, label: "2. Fizetési mód" },
  { id: 3, label: "3. Összegzés" },
] as const;

interface OrderResponse {
  ok: boolean;
  message?: string;
  order: Order;
  paymentSession?: PaymentSession;
  emailNotice?: {
    ok: boolean;
    message: string;
  };
}

interface CommerceResponse {
  ok: boolean;
  commerce: CommerceOptions;
}

interface QuoteResponse {
  ok: boolean;
  quote: OrderQuote;
}

interface PaymentMethodsResponse {
  ok: boolean;
  paymentMethods: SavedPaymentMethod[];
  gateway: PaymentGatewayConfig;
}

interface BarionFinalizeResponse {
  ok: boolean;
  message?: string;
  order: Order;
  paymentState: {
    status: string;
  };
}

const PAYMENT_PROVIDER_LABELS: Record<
  PaymentGatewayConfig["provider"],
  string
> = {
  none: "Nincs beállítva",
  stripe: "Stripe",
  barion: "Barion",
  simplepay: "SimplePay",
  custom: "Egyedi szolgáltató",
};

function emptyAddress(): BillingAddress {
  return {
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    zip: "",
    country: "Magyarország",
  };
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

interface Coordinates {
  lat: number;
  lon: number;
}

const CITY_COORDINATES: Record<string, Coordinates> = {
  ajka: { lat: 47.101, lon: 17.558 },
  baja: { lat: 46.183, lon: 18.954 },
  bekescsaba: { lat: 46.683, lon: 21.087 },
  budaors: { lat: 47.461, lon: 18.958 },
  budapest: { lat: 47.4979, lon: 19.0402 },
  cegled: { lat: 47.173, lon: 19.799 },
  debrecen: { lat: 47.5316, lon: 21.6273 },
  dunaujvaros: { lat: 46.9619, lon: 18.9355 },
  eger: { lat: 47.9025, lon: 20.3772 },
  erd: { lat: 47.391, lon: 18.904 },
  esztergom: { lat: 47.7928, lon: 18.7415 },
  godollo: { lat: 47.6, lon: 19.3667 },
  gyongyos: { lat: 47.7826, lon: 19.928 },
  gyor: { lat: 47.6875, lon: 17.6504 },
  hajduszoboszlo: { lat: 47.443, lon: 21.391 },
  hatvan: { lat: 47.6667, lon: 19.6833 },
  hodmezovasarhely: { lat: 46.4167, lon: 20.3333 },
  kaposvar: { lat: 46.3594, lon: 17.7968 },
  kazincbarcika: { lat: 48.25, lon: 20.6333 },
  kecskemet: { lat: 46.9062, lon: 19.6897 },
  kiskunfelegyhaza: { lat: 46.711, lon: 19.85 },
  kiskunhalas: { lat: 46.431, lon: 19.487 },
  komarom: { lat: 47.743, lon: 18.12 },
  mako: { lat: 46.2167, lon: 20.4833 },
  miskolc: { lat: 48.1035, lon: 20.7784 },
  nagykanizsa: { lat: 46.459, lon: 16.989 },
  nyiregyhaza: { lat: 47.9554, lon: 21.7167 },
  oroshaza: { lat: 46.5667, lon: 20.6667 },
  papa: { lat: 47.3306, lon: 17.467 },
  pecs: { lat: 46.0727, lon: 18.2323 },
  salgotarjan: { lat: 48.105, lon: 19.809 },
  sarvar: { lat: 47.253, lon: 16.936 },
  siofok: { lat: 46.904, lon: 18.058 },
  sopron: { lat: 47.6817, lon: 16.5845 },
  szeged: { lat: 46.253, lon: 20.1414 },
  szekesfehervar: { lat: 47.186, lon: 18.4221 },
  szekszard: { lat: 46.347, lon: 18.706 },
  szentendre: { lat: 47.669, lon: 19.076 },
  szigetszentmiklos: { lat: 47.343, lon: 19.043 },
  szolnok: { lat: 47.1747, lon: 20.1763 },
  szombathely: { lat: 47.2307, lon: 16.6218 },
  tatabanya: { lat: 47.5862, lon: 18.3948 },
  vac: { lat: 47.78, lon: 19.13 },
  veszprem: { lat: 47.0933, lon: 17.9115 },
  zalaegerszeg: { lat: 46.8417, lon: 16.8416 },
};

function normalizeZipSearch(value: string) {
  return value.replace(/\D/g, "");
}

function getCityCoordinates(city: string) {
  return CITY_COORDINATES[normalizeSearchText(city)] ?? null;
}

function getDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildPickupSearchText(point: {
  zip: string;
  city: string;
  label: string;
  address: string;
}) {
  return normalizeSearchText(
    `${point.zip} ${point.city} ${point.label} ${point.address}`,
  );
}

function isPickupPointMethod(method: ShippingMethodId) {
  return method === "gls_parcel_locker" || method === "mpl_post_office";
}

export function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { lines, totalPrice, refreshCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingMethodOption[]>(
    [],
  );
  const [availableCoupons, setAvailableCoupons] = useState<CouponSummary[]>([]);
  const [isLoadingCommerce, setIsLoadingCommerce] = useState(true);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [shipping, setShipping] = useState<BillingAddress>(emptyAddress);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodId>("gls_home");
  const [homeDeliveryDraft, setHomeDeliveryDraft] =
    useState<BillingAddress>(emptyAddress);
  const [pickupZipQuery, setPickupZipQuery] = useState("");
  const [pickupCityQuery, setPickupCityQuery] = useState("");
  const [pickupPointId, setPickupPointId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    SavedPaymentMethod[]
  >([]);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGatewayConfig>({
    provider: "none",
    mode: "tokenized",
    readyForClientSetup: false,
    supportsSavedCards: true,
  });
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [selectedSavedPaymentMethodId, setSelectedSavedPaymentMethodId] =
    useState("");
  const barionOrderId = searchParams.get("barionOrderId")?.trim() ?? "";
  const barionPaymentId =
    searchParams.get("paymentId")?.trim() ??
    searchParams.get("PaymentId")?.trim() ??
    "";

  useEffect(() => {
    if (!user) return;

    const baseShipping = {
      fullName: user.billing.fullName || user.displayName,
      line1: user.billing.line1,
      line2: user.billing.line2,
      city: user.billing.city,
      zip: user.billing.zip,
      country: user.billing.country || "Magyarország",
    };
    setContactEmail(user.email);
    setShipping((previous) => {
      const resolved = {
        ...previous,
        fullName: previous.fullName || baseShipping.fullName,
        line1: previous.line1 || baseShipping.line1,
        line2: previous.line2 || baseShipping.line2,
        city: previous.city || baseShipping.city,
        zip: previous.zip || baseShipping.zip,
        country: previous.country || baseShipping.country,
      };
      return resolved;
    });
    setHomeDeliveryDraft((previous) => ({
      ...previous,
      fullName: previous.fullName || baseShipping.fullName,
      line1: previous.line1 || baseShipping.line1,
      line2: previous.line2 || baseShipping.line2,
      city: previous.city || baseShipping.city,
      zip: previous.zip || baseShipping.zip,
      country: previous.country || baseShipping.country,
    }));
  }, [user]);

  useEffect(() => {
    if (!user || !barionOrderId || !barionPaymentId) {
      return;
    }

    let cancelled = false;

    async function finalizeBarionPayment() {
      setIsSubmitting(true);
      try {
        const response = await apiFetch<BarionFinalizeResponse>(
          "/api/payments/barion/finalize",
          {
            method: "POST",
            auth: true,
            json: {
              orderId: barionOrderId,
              paymentId: barionPaymentId,
            },
          },
        );

        if (cancelled) return;

        setOrder(response.order);
        setMessage({
          ok: response.order.status !== "cancelled",
          text:
            response.order.status === "confirmed"
              ? "A Barion fizetés sikeres volt, a rendelést megerősítettük."
              : response.order.status === "cancelled"
                ? "A Barion fizetés nem sikerült vagy megszakadt, ezért a rendelést töröltük."
                : response.message ?? `Barion állapot: ${response.paymentState.status}`,
        });
        await refreshCart();
      } catch (error) {
        if (cancelled) return;
        setMessage({
          ok: false,
          text:
            error instanceof Error
              ? error.message
              : "Nem sikerült lezárni a Barion fizetés státuszát.",
        });
      } finally {
        if (!cancelled) {
          setIsSubmitting(false);
          setSearchParams({}, { replace: true });
        }
      }
    }

    void finalizeBarionPayment();

    return () => {
      cancelled = true;
    };
  }, [
    barionOrderId,
    barionPaymentId,
    refreshCart,
    setSearchParams,
    user,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadCommerce() {
      try {
        const response = await apiFetch<CommerceResponse>("/api/commerce/options");
        if (!cancelled) {
          setShippingOptions(response.commerce.shippingMethods);
          setAvailableCoupons(response.commerce.coupons);
          if (response.commerce.paymentGateway) {
            setPaymentGateway(response.commerce.paymentGateway);
          }
          setShippingMethod((previous) =>
            response.commerce.shippingMethods.some((method) => method.id === previous)
              ? previous
              : response.commerce.shippingMethods[0]?.id ?? "gls_home",
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({
            ok: false,
            text:
              error instanceof Error
                ? error.message
                : "Nem sikerült betölteni a szállítási opciókat.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCommerce(false);
        }
      }
    }

    void loadCommerce();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadPaymentMethods() {
      setIsLoadingPaymentMethods(true);
      try {
        const response = await apiFetch<PaymentMethodsResponse>(
          "/api/account/payment-methods",
          {
            auth: true,
          },
        );

        if (cancelled) return;
        setSavedPaymentMethods(response.paymentMethods);
        setPaymentGateway(response.gateway);
        const defaultMethod =
          response.paymentMethods.find((method) => method.isDefault) ??
          response.paymentMethods[0] ??
          null;
        setSelectedSavedPaymentMethodId(defaultMethod?.id ?? "");
      } catch (error) {
        if (cancelled) return;
        setMessage({
          ok: false,
          text:
            error instanceof Error
              ? error.message
              : "Nem sikerült betölteni a mentett fizetési módokat.",
        });
      } finally {
        if (!cancelled) {
          setIsLoadingPaymentMethods(false);
        }
      }
    }

    void loadPaymentMethods();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const billing = useMemo(() => {
    if (!user) {
      return shipping;
    }

    const hasSavedBilling =
      user.billing.fullName &&
      user.billing.line1 &&
      user.billing.city &&
      user.billing.zip;

    return hasSavedBilling ? user.billing : shipping;
  }, [shipping, user]);

  const selectedShippingOption = useMemo(
    () =>
      shippingOptions.find((option) => option.id === shippingMethod) ?? null,
    [shippingMethod, shippingOptions],
  );

  const selectedSavedPaymentMethod = useMemo(
    () =>
      savedPaymentMethods.find(
        (method) => method.id === selectedSavedPaymentMethodId,
      ) ?? null,
    [savedPaymentMethods, selectedSavedPaymentMethodId],
  );

  const availablePaymentMethods = useMemo(
    () =>
      selectedShippingOption?.allowedPaymentMethods ??
      (["cod", "card"] satisfies PaymentMethod[]),
    [selectedShippingOption],
  );

  const pickupPointsForMethod = useMemo(
    () =>
      isPickupPointMethod(shippingMethod)
        ? PICKUP_POINTS.filter((point) => point.shippingMethod === shippingMethod)
        : [],
    [shippingMethod],
  );

  const pickupSearchOrigin = useMemo(
    () => getCityCoordinates(pickupCityQuery),
    [pickupCityQuery],
  );

  const filteredPickupPoints = useMemo(() => {
    const zipQuery = normalizeZipSearch(pickupZipQuery);
    const textQuery = normalizeSearchText(
      [pickupZipQuery, pickupCityQuery].filter(Boolean).join(" "),
    );

    if (pickupSearchOrigin && !zipQuery) {
      return [...pickupPointsForMethod].sort((a, b) => {
        const pointA = getCityCoordinates(a.city);
        const pointB = getCityCoordinates(b.city);
        if (!pointA || !pointB) return 0;
        return (
          getDistanceKm(pickupSearchOrigin, pointA) -
          getDistanceKm(pickupSearchOrigin, pointB)
        );
      });
    }

    if (!zipQuery && !textQuery) {
      return pickupPointsForMethod;
    }

    return pickupPointsForMethod.filter((point) => {
      const haystack = buildPickupSearchText(point);
      const zipMatches = Boolean(zipQuery) && point.zip.includes(zipQuery);
      const textMatches = Boolean(textQuery) && haystack.includes(textQuery);
      return zipMatches || textMatches;
    });
  }, [pickupCityQuery, pickupPointsForMethod, pickupSearchOrigin, pickupZipQuery]);

  const selectedPickupPoint = useMemo(
    () =>
      pickupPointsForMethod.find((point) => point.id === pickupPointId) ?? null,
    [pickupPointId, pickupPointsForMethod],
  );

  const orderTotal = useMemo(
    () => quote?.total ?? totalPrice + (selectedShippingOption?.price ?? 0),
    [quote?.total, selectedShippingOption?.price, totalPrice],
  );

  async function requestQuote(nextCouponCode: string, showErrors = true) {
    if (!user) return null;

    try {
      const response = await apiFetch<QuoteResponse>("/api/commerce/quote", {
        method: "POST",
        auth: true,
        json: {
          shippingMethod,
          couponCode: nextCouponCode,
        },
      });
      setQuote(response.quote);
      setAppliedCouponCode(response.quote.discountCode ?? "");
      return response.quote;
    } catch (error) {
      setQuote(null);
      setAppliedCouponCode("");
      if (showErrors) {
        setMessage({
          ok: false,
          text:
            error instanceof Error
              ? error.message
              : "Nem sikerült a végösszeget frissíteni.",
        });
      }
      return null;
    }
  }

  useEffect(() => {
    void requestQuote(appliedCouponCode, false);
  }, [appliedCouponCode, shippingMethod, totalPrice, user]);

  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0] ?? "card");
    }
  }, [availablePaymentMethods, paymentMethod]);

  useEffect(() => {
    if (!isPickupPointMethod(shippingMethod)) {
      return;
    }

    if (pickupPointId && !filteredPickupPoints.some((point) => point.id === pickupPointId)) {
      setPickupPointId("");
    }
  }, [filteredPickupPoints, pickupPointId, shippingMethod]);

  useEffect(() => {
    if (!isPickupPointMethod(shippingMethod)) {
      return;
    }

    if (!selectedPickupPoint) {
      setShipping((previous) => ({
        ...previous,
        zip: "",
        city: "",
        line1: "",
        line2: "",
        country: previous.country || "Magyarország",
      }));
      return;
    }

    setShipping((previous) => ({
      ...previous,
      zip: selectedPickupPoint.zip,
      city: selectedPickupPoint.city,
      line1: selectedPickupPoint.label,
      line2: selectedPickupPoint.address,
      country: "Magyarország",
    }));
  }, [selectedPickupPoint, shippingMethod]);

  useEffect(() => {
    if (isPickupPointMethod(shippingMethod)) {
      return;
    }

    setHomeDeliveryDraft(shipping);
  }, [shipping, shippingMethod]);

  function handleShippingMethodChange(nextMethod: ShippingMethodId) {
    if (nextMethod === shippingMethod) return;

    const pickupMode = isPickupPointMethod(nextMethod);
    const currentlyPickupMode = isPickupPointMethod(shippingMethod);

    if (!currentlyPickupMode) {
      setHomeDeliveryDraft(shipping);
    }

    if (pickupMode) {
      setPickupPointId("");
      setPickupZipQuery("");
      setPickupCityQuery("");
      setShipping((previous) => ({
        ...previous,
        zip: "",
        city: "",
        line1: "",
        line2: "",
        country: previous.country || "Magyarország",
      }));
    } else if (currentlyPickupMode) {
      setPickupPointId("");
      setShipping((previous) => ({
        ...previous,
        ...homeDeliveryDraft,
        country: homeDeliveryDraft.country || previous.country || "Magyarország",
      }));
    }

    setShippingMethod(nextMethod);
    setMessage(null);
  }

  function handleShippingNext(e: FormEvent) {
    e.preventDefault();
    if (!selectedShippingOption) {
      setMessage({ ok: false, text: "Válassz szállítási módot." });
      return;
    }
    if (!shipping.fullName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setMessage({
        ok: false,
        text: "Töltsd ki a kötelező kapcsolatfelvételi adatokat.",
      });
      return;
    }

    if (isPickupPointMethod(shippingMethod) && !selectedPickupPoint) {
      setMessage({
        ok: false,
        text: "Válassz egy átvételi pontot a listából.",
      });
      return;
    }

    if (
      !isPickupPointMethod(shippingMethod) &&
      (!shipping.zip.trim() || !shipping.city.trim() || !shipping.line1.trim())
    ) {
      setMessage({ ok: false, text: "Töltsd ki a teljes szállítási címet." });
      return;
    }

    setMessage(null);
    setStep(2);
  }

  function handlePaymentNext(e: FormEvent) {
    e.preventDefault();

    if (!availablePaymentMethods.includes(paymentMethod)) {
      setMessage({
        ok: false,
        text: "A választott fizetési mód ehhez a szállítási módhoz nem használható.",
      });
      return;
    }

    if (paymentMethod === "card" && !paymentGateway.readyForClientSetup) {
      setMessage({
        ok: false,
        text:
          paymentGateway.provider === "barion"
            ? "A Barion fizetés még nincs készre konfigurálva ezen a környezeten."
            : "A bankkártyás fizetés még nincs teljesen bekötve ezen a környezeten.",
      });
      return;
    }

    if (
      paymentMethod === "card" &&
      paymentGateway.mode === "tokenized" &&
      paymentGateway.supportsSavedCards
    ) {
      if (!selectedSavedPaymentMethodId) {
        setMessage({
          ok: false,
          text:
            "Bankkártyás fizetéshez válassz egy mentett, tokenizált fizetési módot.",
        });
        return;
      }
    }

    setMessage(null);
    setStep(3);
  }

  async function handlePlaceOrder() {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await apiFetch<OrderResponse>("/api/orders", {
        method: "POST",
        auth: true,
        json: {
          shipping,
          billing,
          contactEmail,
          contactPhone,
          paymentMethod,
          savedPaymentMethodId:
            paymentMethod === "card" && paymentGateway.mode === "tokenized"
              ? selectedSavedPaymentMethodId
              : null,
          shippingMethod,
          couponCode: appliedCouponCode,
        },
      });

      if (response.paymentSession?.redirectUrl) {
        window.location.href = response.paymentSession.redirectUrl;
        return;
      }

      setOrder(response.order);
      setMessage({
        ok: true,
        text:
          response.emailNotice?.message ??
          response.message ??
          "Rendelés létrehozva.",
      });
      await refreshCart();
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült létrehozni a rendelést.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <Page>
        <EmptyBox>
          <p>A rendeléshez jelentkezz be a fiókoddal.</p>
          <p css={{ marginTop: "1rem" }}>
            <Link to="/">Vissza a kezdőlapra</Link>
          </p>
        </EmptyBox>
      </Page>
    );
  }

  if (order) {
    return (
      <Page>
        <PageTitle>
          {order.status === "cancelled"
            ? "A fizetés nem sikerült"
            : "Rendelés sikeresen rögzítve"}
        </PageTitle>
        <Box>
          <Title>{order.id}</Title>
          <Lead>
            {order.status === "cancelled"
              ? "A rendelést lezártuk, mert az online fizetés nem futott végig sikeresen."
              : "A rendelést a backend létrehozta, a státuszát a fiókodban és az adminfelületen is követni tudod."}
          </Lead>
          {order.paymentMethod === "card" && order.status !== "cancelled" ? (
            <Lead>
              Az online fizetés státuszát a Barion visszajelzése alapján
              szinkronizáltuk.
            </Lead>
          ) : null}
          {message ? (
            <StatusMessage $error={!message.ok}>{message.text}</StatusMessage>
          ) : null}
          <SummaryLine>
            <span>Státusz</span>
            <strong>{order.status}</strong>
          </SummaryLine>
          <SummaryLine>
            <span>Szállítási díj</span>
            <strong>{formatPrice(order.shippingPrice)}</strong>
          </SummaryLine>
          {order.discountAmount ? (
            <SummaryLine>
              <span>
                Kedvezmény
                {order.discountCode ? ` (${order.discountCode})` : ""}
              </span>
              <strong>-{formatPrice(order.discountAmount)}</strong>
            </SummaryLine>
          ) : null}
          <SummaryLine>
            <span>Végösszeg</span>
            <strong>{formatPrice(order.total)}</strong>
          </SummaryLine>
          <Row>
            <SolidLink to="/account">Ugrás a fiókhoz</SolidLink>
            <SolidLink to="/shop">Tovább a boltba</SolidLink>
          </Row>
        </Box>
      </Page>
    );
  }

  if (lines.length === 0) {
    return (
      <Page>
        <EmptyBox>
          <p>Nincs termék a kosárban.</p>
          <p css={{ marginTop: "1rem" }}>
            <Link to="/shop">Vissza a boltba</Link>
          </p>
        </EmptyBox>
      </Page>
    );
  }

  const paymentLabels: Record<PaymentMethod, string> = {
    cod: "Utánvét (készpénz átvételkor)",
    card:
      paymentGateway.provider === "barion"
        ? "Online bankkártya (Barion)"
        : "Bankkártya (mentett, tokenizált fizetési mód)",
  };

  return (
    <Page>
      <PageTitle>Fizetés</PageTitle>
      <Steps>
        {stepsConfig.map((stepConfig) => (
          <StepItem
            key={stepConfig.id}
            $active={step === stepConfig.id}
            $done={step > stepConfig.id}
            aria-current={step === stepConfig.id ? "step" : undefined}
          >
            {stepConfig.label}
          </StepItem>
        ))}
      </Steps>

      {step === 1 ? (
        <Box as="form" onSubmit={handleShippingNext}>
          <Title>Szállítási adatok</Title>
          <Lead>
            Add meg, hova szállíthatjuk a rendelést. A számlázási cím a fiókban
            mentett adatokból jön, ha már kitöltötted.
          </Lead>
          <SubTitle>Szállítási mód</SubTitle>
          <Lead css={{ marginBottom: "1rem" }}>
            Válaszd ki a neked megfelelő kézbesítési módot. A szállítási díj a
            végösszegben is megjelenik.
          </Lead>
          <RadioList>
            {shippingOptions.map((option) => (
              <RadioLabel key={option.id} $checked={shippingMethod === option.id}>
                <input
                  type="radio"
                  name="shipping-method"
                  checked={shippingMethod === option.id}
                  onChange={() => handleShippingMethodChange(option.id)}
                />
                <RadioCopy>
                  <strong>
                    {option.label} - {formatPrice(option.price)}
                  </strong>
                  <RadioMeta>{option.description}</RadioMeta>
                </RadioCopy>
              </RadioLabel>
            ))}
          </RadioList>
          {isLoadingCommerce ? (
            <Lead>Szállítási módok betöltése...</Lead>
          ) : null}
          {selectedShippingOption ? (
            <Lead css={{ marginBottom: "1rem" }}>
              Tipp: {selectedShippingOption.addressHint}
            </Lead>
          ) : null}
          <Field>
            Teljes név
            <Input
              required
              autoComplete="name"
              value={shipping.fullName}
              onChange={(e) =>
                setShipping((prev) => ({ ...prev, fullName: e.target.value }))
              }
            />
          </Field>
          <Field>
            E-mail
            <Input
              type="email"
              required
              autoComplete="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </Field>
          <Field>
            Telefon
            <Input
              type="tel"
              required
              autoComplete="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </Field>
          {isPickupPointMethod(shippingMethod) ? (
            <>
              <SubTitle>
                {shippingMethod === "gls_parcel_locker"
                  ? "GLS csomagautomata keresése"
                  : "MPL postán maradó keresése"}
              </SubTitle>
              <HelperText>
                Szűrj irányítószám vagy település alapján, majd válaszd ki a
                megfelelő átvételi pontot a listából.
              </HelperText>
              <SearchRow>
                <Field>
                  Irányítószám szerinti keresés
                  <Input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={pickupZipQuery}
                    onChange={(e) => setPickupZipQuery(e.target.value)}
                    placeholder="pl. 1087"
                  />
                </Field>
                <Field>
                  Település szerinti keresés
                  <Input
                    autoComplete="address-level2"
                    value={pickupCityQuery}
                    onChange={(e) => setPickupCityQuery(e.target.value)}
                    placeholder="pl. Budapest"
                  />
                </Field>
              </SearchRow>
              <Field>
                Elérhető átvételi pontok
                <Select
                  value={pickupPointId}
                  onChange={(e) => setPickupPointId(e.target.value)}
                >
                  <option value="">Válassz átvételi pontot</option>
                  {filteredPickupPoints.map((point) => {
                    const pointCoordinates = getCityCoordinates(point.city);
                    const distance =
                      pickupSearchOrigin && pointCoordinates
                        ? Math.round(
                            getDistanceKm(pickupSearchOrigin, pointCoordinates),
                          )
                        : null;

                    return (
                      <option key={point.id} value={point.id}>
                        {point.zip} {point.city} - {point.label}
                        {distance !== null ? ` (${distance} km)` : ""}
                      </option>
                    );
                  })}
                </Select>
              </Field>
              <HelperText>
                {filteredPickupPoints.length > 0
                  ? pickupSearchOrigin && !normalizeZipSearch(pickupZipQuery)
                    ? `${filteredPickupPoints.length} átvételi pont távolság szerint rendezve.`
                    : `${filteredPickupPoints.length} átvételi pont található a jelenlegi szűrésre.`
                  : "Nincs találat a megadott szűrésre."}
              </HelperText>
              {selectedPickupPoint ? (
                <PickupCard>
                  <strong>{selectedPickupPoint.label}</strong>
                  <div css={{ marginTop: "0.5rem" }}>
                    {selectedPickupPoint.zip} {selectedPickupPoint.city},{" "}
                    {selectedPickupPoint.address}
                  </div>
                  {selectedPickupPoint.note ? (
                    <div css={{ marginTop: "0.4rem", opacity: 0.8 }}>
                      {selectedPickupPoint.note}
                    </div>
                  ) : null}
                </PickupCard>
              ) : null}
            </>
          ) : (
            <>
              <Field>
                Irányítószám
                <Input
                  required
                  autoComplete="postal-code"
                  value={shipping.zip}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, zip: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Település
                <Input
                  required
                  autoComplete="address-level2"
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Utca, házszám
                <Input
                  required
                  autoComplete="street-address"
                  value={shipping.line1}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, line1: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Emelet, ajtó (opcionális)
                <Input
                  value={shipping.line2}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, line2: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Ország
                <Input
                  value={shipping.country}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, country: e.target.value }))
                  }
                />
              </Field>
            </>
          )}
          {message ? <StatusMessage $error={!message.ok}>{message.text}</StatusMessage> : null}
          <Row>
            <SolidBtn
              type="submit"
              disabled={isLoadingCommerce || !selectedShippingOption}
            >
              Tovább a fizetési módhoz
            </SolidBtn>
          </Row>
        </Box>
      ) : null}

      {step === 2 ? (
        <Box as="form" onSubmit={handlePaymentNext}>
          <Title>Fizetési mód</Title>
          <Lead>Válassz, hogyan szeretnél fizetni.</Lead>
          <RadioList>
            {availablePaymentMethods.includes("cod") ? (
              <RadioLabel $checked={paymentMethod === "cod"}>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <RadioCopy>
                  <strong>Utánvét</strong>
                  <RadioMeta>
                    {selectedShippingOption?.codNote ??
                      "Fizetés átvételkor a futárnál vagy az átvevőhelyen."}
                  </RadioMeta>
                </RadioCopy>
              </RadioLabel>
            ) : null}
            {availablePaymentMethods.includes("card") ? (
              <RadioLabel $checked={paymentMethod === "card"}>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <RadioCopy>
                  <strong>
                    {paymentGateway.provider === "barion"
                      ? "Online bankkártya (Barion)"
                      : "Bankkártya (mentett, tokenizált fizetési mód)"}
                  </strong>
                  <RadioMeta>
                    Online fizetés a rendelés leadása után, biztonságos fizetési
                    oldalon.
                  </RadioMeta>
                </RadioCopy>
              </RadioLabel>
            ) : null}
          </RadioList>

          {paymentMethod === "card" ? (
            <CardBlock>
              <SubTitle>
                {paymentGateway.mode === "redirect"
                  ? "Online fizetés"
                  : "Mentett bankkártyák"}
              </SubTitle>
              <HelperText>
                Aktív provider:{" "}
                {PAYMENT_PROVIDER_LABELS[paymentGateway.provider]}.{" "}
                {paymentGateway.mode === "redirect"
                  ? paymentGateway.readyForClientSetup
                    ? "A rendelés után a Barion biztonságos fizetési oldalára irányítunk át."
                    : "Az online bankkártyás fizetés még nincs bekötve ezen a környezeten."
                  : paymentGateway.readyForClientSetup
                    ? "A kliensoldali tokenizáló bekötéshez már van alapkész konfiguráció."
                    : "A teljes kliensoldali tokenizáló widget még külön bekötést igényel."}
              </HelperText>
              {paymentGateway.mode === "redirect" ? (
                <Lead>
                  A kártyaadatokat nem a Serona kéri be. A rendelés rögzítése
                  után a Barion saját oldalán tudod biztonságosan befejezni a
                  fizetést.
                </Lead>
              ) : isLoadingPaymentMethods ? (
                <Lead>Mentett fizetési módok betöltése...</Lead>
              ) : savedPaymentMethods.length > 0 ? (
                <RadioList>
                  {savedPaymentMethods.map((method) => (
                    <SavedMethodCard
                      key={method.id}
                      $checked={selectedSavedPaymentMethodId === method.id}
                    >
                      <input
                        type="radio"
                        name="saved-payment-method"
                        checked={selectedSavedPaymentMethodId === method.id}
                        onChange={() => setSelectedSavedPaymentMethodId(method.id)}
                      />
                      <SavedMethodTop>
                        <strong>
                          {method.brand} •••• {method.last4}
                        </strong>
                        <SavedMethodBadge>
                          {PAYMENT_PROVIDER_LABELS[method.provider]}
                        </SavedMethodBadge>
                        {method.isDefault ? (
                          <SavedMethodBadge $default>
                            Alapértelmezett
                          </SavedMethodBadge>
                        ) : null}
                      </SavedMethodTop>
                      <RadioMeta>
                        {method.holderName} · {method.expiryMonth}/
                        {method.expiryYear}
                      </RadioMeta>
                    </SavedMethodCard>
                  ))}
                </RadioList>
              ) : (
                <Lead>
                  Még nincs mentett, tokenizált fizetési módod. Előbb a{" "}
                  <Link to="/account?tab=payment">Fiók / Fizetés</Link>{" "}
                  részen rögzíts egyet.
                </Lead>
              )}
              {paymentGateway.mode === "tokenized" && selectedSavedPaymentMethod ? (
                <HelperText>
                  Kiválasztva: {selectedSavedPaymentMethod.brand} ••••{" "}
                  {selectedSavedPaymentMethod.last4} ·{" "}
                  {selectedSavedPaymentMethod.holderName}
                </HelperText>
              ) : null}
            </CardBlock>
          ) : null}

          <CardBlock>
            <SubTitle>Kuponkód</SubTitle>
            <Lead css={{ marginBottom: "1rem" }}>
              Ha van aktív kuponod, itt tudod érvényesíteni. A végösszeget a
              szerveroldali árajánlat frissíti.
            </Lead>
            <Field>
              Kuponkód
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="pl. SERONA10"
              />
            </Field>
            {availableCoupons.length > 0 ? (
              <HelperText>
                Aktív kuponok:{" "}
                {availableCoupons
                  .map((coupon) => `${coupon.code} (${coupon.label})`)
                  .join(" · ")}
              </HelperText>
            ) : null}
            <Row>
              <SolidBtn
                type="button"
                disabled={isApplyingCoupon}
                onClick={async () => {
                  setIsApplyingCoupon(true);
                  const result = await requestQuote(couponCode.trim(), true);
                  if (result) {
                    setMessage({
                      ok: true,
                      text:
                        result.couponMessage ??
                        (result.discountCode
                          ? "A kupon érvényesítve lett."
                          : "A végösszeg frissítve lett."),
                    });
                  }
                  setIsApplyingCoupon(false);
                }}
              >
                Kupon érvényesítése
              </SolidBtn>
              {appliedCouponCode ? (
                <SolidBtn
                  type="button"
                  disabled={isApplyingCoupon}
                  onClick={async () => {
                    setCouponCode("");
                    setIsApplyingCoupon(true);
                    const result = await requestQuote("", false);
                    if (result) {
                      setMessage({
                        ok: true,
                        text: "A kupon eltávolítva a rendelésről.",
                      });
                    }
                    setIsApplyingCoupon(false);
                  }}
                >
                  Kupon törlése
                </SolidBtn>
              ) : null}
            </Row>
          </CardBlock>

          {message ? <StatusMessage $error={!message.ok}>{message.text}</StatusMessage> : null}
          <Row>
            <SolidBtn type="button" onClick={() => setStep(1)}>
              Vissza
            </SolidBtn>
            <SolidBtn type="submit">Tovább az összegzéshez</SolidBtn>
          </Row>
        </Box>
      ) : null}

      {step === 3 ? (
        <Box>
          <Title>Összegzés</Title>
          <Lead>
            Ellenőrizd az adatokat, majd zárd le a rendelést. A leadás
            szerveroldali készletellenőrzéssel történik.
          </Lead>
          <div
            css={(theme) => ({
              marginBottom: theme.space.lg,
              padding: theme.space.md,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              fontSize: "0.9rem",
            })}
          >
            <div css={{ fontWeight: 700, marginBottom: 8 }}>Szállítás</div>
            <div>{shipping.fullName}</div>
            <div>{contactEmail}</div>
            <div>{contactPhone}</div>
            <div>
              {shipping.zip} {shipping.city}, {shipping.line1}
              {shipping.line2 ? `, ${shipping.line2}` : ""}
            </div>
            <div css={{ marginTop: 12, fontWeight: 700 }}>Számlázás</div>
            <div>{billing.fullName}</div>
            <div>
              {billing.zip} {billing.city}, {billing.line1}
              {billing.line2 ? `, ${billing.line2}` : ""}
            </div>
            <div css={{ marginTop: 12, fontWeight: 700 }}>Fizetés</div>
            <div>{paymentLabels[paymentMethod]}</div>
            <div css={{ marginTop: 12, fontWeight: 700 }}>Szállítási mód</div>
            <div>
              {selectedShippingOption?.label ?? shippingMethod} -{" "}
              {formatPrice(selectedShippingOption?.price ?? 0)}
            </div>
            {quote?.discountAmount ? (
              <>
                <div css={{ marginTop: 12, fontWeight: 700 }}>Kedvezmény</div>
                <div>
                  {quote.discountCode ? `${quote.discountCode} - ` : ""}-
                  {formatPrice(quote.discountAmount)}
                </div>
              </>
            ) : null}
          </div>
          {lines.map(({ product, quantity }) => (
            <SummaryLine key={product.id}>
              <span>
                {product.name} x {quantity}
              </span>
              <span>
                {(product.price * quantity).toLocaleString("hu-HU")} Ft
              </span>
            </SummaryLine>
          ))}
          <SummaryLine>
            <span>Szállítási díj</span>
            <span>{formatPrice(selectedShippingOption?.price ?? 0)}</span>
          </SummaryLine>
          {quote?.discountAmount ? (
            <SummaryLine>
              <span>
                Kedvezmény
                {quote.discountCode ? ` (${quote.discountCode})` : ""}
              </span>
              <span>-{formatPrice(quote.discountAmount)}</span>
            </SummaryLine>
          ) : null}
          <SummaryLine
            css={{ fontWeight: 700, fontSize: "1.1rem", border: "none" }}
          >
            <span>Végösszeg</span>
            <span>{formatPrice(orderTotal)}</span>
          </SummaryLine>
          {message ? <StatusMessage $error={!message.ok}>{message.text}</StatusMessage> : null}
          <Row>
            <SolidBtn type="button" onClick={() => setStep(2)} disabled={isSubmitting}>
              Vissza
            </SolidBtn>
            <SolidBtn
              type="button"
              onClick={() => {
                void handlePlaceOrder();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Feldolgozás..."
                : paymentMethod === "card" && paymentGateway.mode === "redirect"
                  ? "Tovább a Barion fizetéshez"
                  : "Rendelés leadása"}
            </SolidBtn>
          </Row>
        </Box>
      ) : null}
    </Page>
  );
}
