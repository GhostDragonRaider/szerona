import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { useEffect, useState, type FormEvent } from "react";
import { formatPrice, SHIPPING_METHOD_LABELS } from "../../data/commerce";
import { apiFetch } from "../../lib/api";
import type {
  AdminDashboardSummary,
  CommerceOptions,
  Coupon,
  ShippingMethodOption,
} from "../../data/types";

const Wrapper = styled.div`
  max-width: 1120px;
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 1.75rem);
`;

const Lead = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;

const Feedback = styled.p<{ $error?: boolean }>`
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme, $error }) =>
    $error ? theme.colors.accent : theme.colors.success};
  font-size: 0.95rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.space.md};
`;

const Card = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background:
    radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 42%),
    ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.space.lg};
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
`;

const WideCard = styled(Card)`
  grid-column: 1 / -1;
`;

const Value = styled.div`
  margin-top: ${({ theme }) => theme.space.sm};
  font-size: 1.65rem;
  font-weight: 800;
`;

const HealthStatusWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  margin-top: ${({ theme }) => theme.space.sm};
`;

const HealthDot = styled.span<{ $status: "online" | "offline" | "checking" }>`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: ${({ $status }) =>
    $status === "online"
      ? "#22c55e"
      : $status === "offline"
        ? "#ef4444"
        : "#f59e0b"};
  box-shadow: 0 0 18px
    ${({ $status }) =>
      $status === "online"
        ? "rgba(34,197,94,0.5)"
        : $status === "offline"
          ? "rgba(239,68,68,0.45)"
          : "rgba(245,158,11,0.45)"};
`;

const HealthBadge = styled.span<{ $status: "online" | "offline" | "checking" }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  padding: 0.45rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $status }) =>
    $status === "online"
      ? "rgba(34,197,94,0.14)"
      : $status === "offline"
        ? "rgba(239,68,68,0.14)"
        : "rgba(245,158,11,0.14)"};
  color: ${({ theme, $status }) =>
    $status === "online"
      ? theme.colors.success
      : $status === "offline"
        ? theme.colors.accent
        : "#f59e0b"};
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.02em;
`;

const Label = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
`;

const Heading = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const SubHeading = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
`;

const Meta = styled.div`
  margin-top: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const List = styled.ul`
  list-style: none;
  margin: ${({ theme }) => theme.space.md} 0 0;
  padding: 0;
`;

const ListItem = styled.li`
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-of-type {
    border-bottom: none;
  }
`;

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.55rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  font-size: 0.78rem;
  font-weight: 700;
  margin-right: 0.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.md};
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;

const LegendDot = styled.span<{ $type: "bar" | "line" }>`
  width: 12px;
  height: 12px;
  border-radius: ${({ $type }) => ($type === "line" ? "999px" : "4px")};
  background: ${({ $type }) =>
    $type === "line"
      ? "linear-gradient(135deg, #f59e0b, #f97316)"
      : "linear-gradient(180deg, rgba(99,102,241,0.95), rgba(59,130,246,0.95))"};
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
`;

const ChartFrame = styled.div`
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background:
    radial-gradient(circle at top right, ${({ theme }) => theme.colors.accentSoft}, transparent 38%),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.02) 38%,
      rgba(0, 0, 0, 0.14)
    );
  padding: ${({ theme }) => theme.space.md};
  overflow: hidden;
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: auto;
  display: block;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.md};
`;

const StatPill = styled.div`
  padding: ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const StatDay = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const StatMain = styled.div`
  margin-top: 0.3rem;
  font-size: 1rem;
  font-weight: 700;
`;

const StatSub = styled.div`
  margin-top: 0.18rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const CouponGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.lg};
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);

  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.md} - 1px)`}) {
    grid-template-columns: 1fr;
  }
`;

const CouponList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const CouponCard = styled.div`
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceElevated};
`;

const CouponHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
`;

const CouponCode = styled.div`
  font-weight: 800;
  letter-spacing: 0.05em;
`;

const CouponStatus = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.65rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.success : theme.colors.textMuted};
  background: ${({ $active }) =>
    $active ? "rgba(34,197,94,0.14)" : "rgba(161,161,170,0.12)"};
`;

const CouponActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
  margin-top: ${({ theme }) => theme.space.sm};
`;

const Button = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  min-height: 42px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $primary, $danger }) =>
      $primary
        ? theme.colors.accent
        : $danger
          ? theme.colors.accent
          : theme.colors.border};
  background: ${({ theme, $primary }) =>
    $primary ? theme.colors.accentSoft : "transparent"};
  color: ${({ theme, $danger }) =>
    $danger ? theme.colors.accent : theme.colors.text};
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const CouponForm = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.sm} - 1px)`}) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.92rem;
`;

const Input = styled.input`
  min-height: 44px;
  padding: 0.75rem 0.9rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
`;

const TextArea = styled.textarea`
  min-height: 94px;
  padding: 0.75rem 0.9rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  resize: vertical;
`;

const Select = styled.select`
  min-height: 44px;
  padding: 0.75rem 0.9rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.sm};

  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.sm} - 1px)`}) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.88rem;
`;

const InlineRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
`;

const statusLabels = {
  pending: "Függőben",
  confirmed: "Jóváhagyva",
  processing: "Feldolgozás alatt",
  shipped: "Feladva",
  delivered: "Teljesítve",
  cancelled: "Törölve",
} as const;

const couponTypeLabels = {
  percent: "Százalékos",
  fixed: "Fix összegű",
  shipping: "Szállítási kedvezmény",
} as const;

interface SummaryResponse {
  ok: boolean;
  summary: AdminDashboardSummary;
}

interface CommerceResponse {
  ok: boolean;
  commerce: CommerceOptions;
}

interface CouponListResponse {
  ok: boolean;
  coupons: Coupon[];
}

interface CouponMutationResponse {
  ok: boolean;
  message?: string;
  coupon: Coupon;
}

interface CouponDeleteResponse {
  ok: boolean;
  message?: string;
}

interface HealthResponse {
  ok: boolean;
  message: string;
  ido: string;
  database: string | null;
  uptimeSeconds?: number;
  startedAt?: string;
}

type ServerHealthState = {
  status: "online" | "offline" | "checking";
  message: string;
  checkedAt: string | null;
  responseTimeMs: number | null;
  serverTime: string | null;
  database: string | null;
  uptimeSeconds: number | null;
  startedAt: string | null;
};

interface CouponFormState {
  code: string;
  label: string;
  description: string;
  type: Coupon["type"];
  percent: string;
  amount: string;
  minSubtotal: string;
  maxDiscount: string;
  appliesToShippingMethods: string[];
  active: boolean;
}

function createEmptyCouponForm(): CouponFormState {
  return {
    code: "",
    label: "",
    description: "",
    type: "percent",
    percent: "10",
    amount: "",
    minSubtotal: "0",
    maxDiscount: "",
    appliesToShippingMethods: [],
    active: true,
  };
}

function couponToForm(coupon: Coupon): CouponFormState {
  return {
    code: coupon.code,
    label: coupon.label,
    description: coupon.description,
    type: coupon.type,
    percent: coupon.percent?.toString() ?? "",
    amount: coupon.amount?.toString() ?? "",
    minSubtotal: coupon.minSubtotal.toString(),
    maxDiscount: coupon.maxDiscount?.toString() ?? "",
    appliesToShippingMethods: coupon.appliesToShippingMethods,
    active: coupon.active,
  };
}

function buildCouponPayload(form: CouponFormState) {
  return {
    code: form.code.trim().toUpperCase(),
    label: form.label.trim(),
    description: form.description.trim(),
    type: form.type,
    percent: form.percent.trim() ? Number(form.percent) : null,
    amount: form.amount.trim() ? Number(form.amount) : null,
    minSubtotal: form.minSubtotal.trim() ? Number(form.minSubtotal) : 0,
    maxDiscount: form.maxDiscount.trim() ? Number(form.maxDiscount) : null,
    appliesToShippingMethods: form.appliesToShippingMethods,
    active: form.active,
  };
}

function formatHealthStatus(status: ServerHealthState["status"]) {
  if (status === "online") return "Elérhető";
  if (status === "offline") return "Nem elérhető";
  return "Ellenőrzés";
}

function formatUptime(seconds: number | null) {
  if (seconds === null || seconds < 0) {
    return "Nincs adat";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} nap ${hours} óra`;
  }

  if (hours > 0) {
    return `${hours} óra ${minutes} perc`;
  }

  return `${minutes} perc`;
}

function roundChartMax(value: number) {
  if (value <= 0) return 1;
  if (value <= 10) return Math.ceil(value);
  if (value <= 100) return Math.ceil(value / 10) * 10;
  if (value <= 1000) return Math.ceil(value / 100) * 100;
  if (value <= 10000) return Math.ceil(value / 1000) * 1000;
  return Math.ceil(value / 5000) * 5000;
}

function buildSmoothLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX.toFixed(2)} ${current.y.toFixed(2)}, ${controlX.toFixed(2)} ${next.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

export function AdminOverview() {
  const theme = useTheme();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>(
    [],
  );
  const [form, setForm] = useState<CouponFormState>(createEmptyCouponForm);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [busyCouponId, setBusyCouponId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [serverHealth, setServerHealth] = useState<ServerHealthState>({
    status: "checking",
    message: "A szerver állapotának ellenőrzése folyamatban van.",
    checkedAt: null,
    responseTimeMs: null,
    serverTime: null,
    database: null,
    uptimeSeconds: null,
    startedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [summaryResponse, couponResponse, commerceResponse] =
          await Promise.all([
            apiFetch<SummaryResponse>("/api/admin/dashboard", { auth: true }),
            apiFetch<CouponListResponse>("/api/admin/coupons", { auth: true }),
            apiFetch<CommerceResponse>("/api/commerce/options"),
          ]);

        if (cancelled) return;
        setSummary(summaryResponse.summary);
        setCoupons(couponResponse.coupons);
        setShippingMethods(commerceResponse.commerce.shippingMethods);
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nem sikerült betölteni az adminösszefoglalót.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAll();
    const timer = window.setInterval(() => {
      void loadAll();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      const startedAt = performance.now();

      try {
        const response = await apiFetch<HealthResponse>("/api/health");
        if (cancelled) return;

        setServerHealth({
          status: "online",
          message: response.message || "A szerver elérhető.",
          checkedAt: new Date().toISOString(),
          responseTimeMs: Math.round(performance.now() - startedAt),
          serverTime: response.ido ?? null,
          database:
            typeof response.database === "string" ? response.database : null,
          uptimeSeconds:
            typeof response.uptimeSeconds === "number"
              ? response.uptimeSeconds
              : null,
          startedAt: response.startedAt ?? null,
        });
      } catch (healthError) {
        if (cancelled) return;

        setServerHealth((current) => ({
          ...current,
          status: "offline",
          message:
            healthError instanceof Error
              ? healthError.message
              : "A szerver jelenleg nem elérhető.",
          checkedAt: new Date().toISOString(),
          responseTimeMs: null,
          serverTime: null,
        }));
      }
    }

    void loadHealth();
    const timer = window.setInterval(() => {
      void loadHealth();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function refreshCoupons() {
    const response = await apiFetch<CouponListResponse>("/api/admin/coupons", {
      auth: true,
    });
    setCoupons(response.coupons);
  }

  async function handleCouponSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingCoupon(true);
    setMessage(null);

    try {
      const payload = buildCouponPayload(form);
      const response = await apiFetch<CouponMutationResponse>(
        editingCouponId
          ? `/api/admin/coupons/${editingCouponId}`
          : "/api/admin/coupons",
        {
          method: editingCouponId ? "PATCH" : "POST",
          auth: true,
          json: payload,
        },
      );

      await refreshCoupons();
      setForm(createEmptyCouponForm());
      setEditingCouponId(null);
      setMessage({
        ok: true,
        text: response.message ?? "A kupon mentése sikerült.",
      });
    } catch (saveError) {
      setMessage({
        ok: false,
        text:
          saveError instanceof Error
            ? saveError.message
            : "Nem sikerült menteni a kupont.",
      });
    } finally {
      setIsSavingCoupon(false);
    }
  }

  async function handleDeactivateCoupon(couponId: string) {
    const confirmed = window.confirm(
      "Biztosan inaktiválni szeretnéd ezt a kupont?",
    );
    if (!confirmed) return;

    setBusyCouponId(couponId);
    setMessage(null);

    try {
      const response = await apiFetch<CouponDeleteResponse>(
        `/api/admin/coupons/${couponId}`,
        {
          method: "DELETE",
          auth: true,
        },
      );

      await refreshCoupons();
      if (editingCouponId === couponId) {
        setEditingCouponId(null);
        setForm(createEmptyCouponForm());
      }
      setMessage({
        ok: true,
        text: response.message ?? "A kupon inaktiválva lett.",
      });
    } catch (deleteError) {
      setMessage({
        ok: false,
        text:
          deleteError instanceof Error
            ? deleteError.message
            : "Nem sikerült inaktiválni a kupont.",
      });
    } finally {
      setBusyCouponId(null);
    }
  }

  function startEditingCoupon(coupon: Coupon) {
    setEditingCouponId(coupon.id);
    setForm(couponToForm(coupon));
    setMessage(null);
  }

  function resetCouponForm() {
    setEditingCouponId(null);
    setForm(createEmptyCouponForm());
    setMessage(null);
  }

  const salesSeries = summary?.salesSeries ?? [];
  const chartWidth = 760;
  const chartHeight = 320;
  const chartLeft = 62;
  const chartRight = chartWidth - 26;
  const chartTop = 22;
  const chartBottom = 246;
  const chartInnerHeight = chartBottom - chartTop;
  const slotWidth =
    salesSeries.length > 0 ? (chartRight - chartLeft) / salesSeries.length : 0;
  const barWidth = Math.max(18, Math.min(slotWidth * 0.46, 38));
  const maxOrdersRaw = Math.max(
    ...salesSeries.map((point) => point.orderCount),
    1,
  );
  const maxOrderValueRaw = Math.max(
    ...salesSeries.map((point) => point.orderValue),
    1,
  );
  const maxOrders = roundChartMax(maxOrdersRaw);
  const maxOrderValue = roundChartMax(maxOrderValueRaw);
  const gridLineCount = 6;
  const valueTicks = Array.from({ length: gridLineCount }, (_, index) => {
    const ratio = index / (gridLineCount - 1);
    const value = maxOrderValue - maxOrderValue * ratio;
    return {
      y: chartTop + chartInnerHeight * ratio,
      label: formatPrice(Math.round(value)),
    };
  });
  const linePoints = salesSeries.map((point, index) => {
    const x = chartLeft + slotWidth * index + slotWidth / 2;
    const barHeight = (point.orderCount / maxOrders) * chartInnerHeight;
    const y = chartBottom - (point.orderValue / maxOrderValue) * chartInnerHeight;
    return {
      ...point,
      x,
      y,
      barHeight,
    };
  });
  const linePath = buildSmoothLinePath(linePoints);
  const areaPath =
    linePoints.length > 0
      ? `${buildSmoothLinePath(linePoints)} L ${linePoints[linePoints.length - 1].x.toFixed(2)} ${chartBottom.toFixed(2)} L ${linePoints[0].x.toFixed(2)} ${chartBottom.toFixed(2)} Z`
      : "";
  const bandFillA =
    theme.colors.bg === "#000000"
      ? "rgba(255,255,255,0.038)"
      : "rgba(15,23,42,0.042)";
  const bandFillB =
    theme.colors.bg === "#000000"
      ? "rgba(255,255,255,0.018)"
      : "rgba(15,23,42,0.018)";
  const axisStroke =
    theme.colors.bg === "#000000"
      ? "rgba(255,255,255,0.24)"
      : "rgba(15,23,42,0.18)";
  const gridStroke =
    theme.colors.bg === "#000000"
      ? "rgba(255,255,255,0.11)"
      : "rgba(15,23,42,0.11)";
  const labelFill =
    theme.colors.bg === "#000000"
      ? "rgba(255,255,255,0.7)"
      : "rgba(15,23,42,0.62)";
  const subLabelFill =
    theme.colors.bg === "#000000"
      ? "rgba(255,255,255,0.5)"
      : "rgba(15,23,42,0.42)";
  const orderCountSummary =
    salesSeries.reduce((sum, point) => sum + point.orderCount, 0) || 0;
  const orderValueSummary =
    salesSeries.reduce((sum, point) => sum + point.orderValue, 0) || 0;

  return (
    <Wrapper>
      <Title>Áttekintés</Title>
      <Lead>
        Itt látod a napi állapotot, a kritikus készletű termékeket, a forgalmi
        trendet és innen tudod kezelni az aktív kuponokat is.
      </Lead>
      {message ? (
        <Feedback $error={!message.ok}>{message.text}</Feedback>
      ) : null}
      {isLoading ? <Lead>Összefoglaló betöltése...</Lead> : null}
      {error ? <Feedback $error>{error}</Feedback> : null}
      <Grid>
        <Card>
          <Label>Szerverállapot</Label>
          <HealthStatusWrap>
            <HealthBadge $status={serverHealth.status}>
              <HealthDot $status={serverHealth.status} />
              {formatHealthStatus(serverHealth.status)}
            </HealthBadge>
          </HealthStatusWrap>
          <Meta>{serverHealth.message}</Meta>
          <Meta>
            Utolsó ellenőrzés:{" "}
            {serverHealth.checkedAt
              ? new Date(serverHealth.checkedAt).toLocaleString("hu-HU")
              : "folyamatban"}
          </Meta>
          <Meta>
            Válaszidő:{" "}
            {serverHealth.responseTimeMs !== null
              ? `${serverHealth.responseTimeMs} ms`
              : "nincs adat"}
          </Meta>
          <Meta>
            Adatbázis: {serverHealth.database ?? "ismeretlen"}
          </Meta>
          <Meta>
            Szerveridő:{" "}
            {serverHealth.serverTime
              ? new Date(serverHealth.serverTime).toLocaleString("hu-HU")
              : "nincs adat"}
          </Meta>
          <Meta>
            Indulás:{" "}
            {serverHealth.startedAt
              ? new Date(serverHealth.startedAt).toLocaleString("hu-HU")
              : "nincs adat"}
          </Meta>
          <Meta>
            Uptime: {formatUptime(serverHealth.uptimeSeconds)}
          </Meta>
        </Card>
        {summary ? (
          <>
            <Card>
              <Label>Mai rendelések</Label>
              <Value>{summary.totals.todayOrderCount}</Value>
            </Card>
            <Card>
              <Label>Nyitott rendelések</Label>
              <Value>{summary.totals.activeOrderCount}</Value>
            </Card>
            <Card>
              <Label>Teljesített bevétel</Label>
              <Value>{formatPrice(summary.totals.deliveredRevenue)}</Value>
            </Card>
            <Card>
              <Label>Várakozó utalások</Label>
              <Value>{formatPrice(summary.totals.pendingTransferTotal)}</Value>
            </Card>
          </>
        ) : null}
      </Grid>

      {summary ? (
        <>
          <SectionGrid>
            <WideCard>
              <ChartHeader>
                <div>
                  <Heading>Utóbbi 7 nap teljesítménye</Heading>
                  <Meta>
                    A grafikon a napi rendelésdarabszámot és az aznapi
                    rendelésértéket mutatja.
                  </Meta>
                </div>
                <LegendRow>
                  <LegendItem>
                    <LegendDot $type="bar" />
                    Rendelésszám
                  </LegendItem>
                  <LegendItem>
                    <LegendDot $type="line" />
                    Rendelésérték
                  </LegendItem>
                  <LegendItem>
                    7 nap összesen: {orderCountSummary} rendelés ·{" "}
                    {formatPrice(orderValueSummary)}
                  </LegendItem>
                </LegendRow>
              </ChartHeader>

              <ChartFrame>
                <ChartSvg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img">
                  {salesSeries.map((point, index) => {
                    const x = chartLeft + slotWidth * index;
                    return (
                      <rect
                        key={`${point.date}-band`}
                        x={x}
                        y={chartTop}
                        width={slotWidth}
                        height={chartInnerHeight}
                        fill={index % 2 === 0 ? bandFillA : bandFillB}
                      />
                    );
                  })}

                  {valueTicks.map((tick, index) => (
                    <g key={`tick-${index}`}>
                      <line
                        x1={chartLeft}
                        y1={tick.y}
                        x2={chartRight}
                        y2={tick.y}
                        stroke={gridStroke}
                        strokeDasharray={index === valueTicks.length - 1 ? undefined : "4 8"}
                      />
                      <text
                        x={chartLeft - 12}
                        y={tick.y + 4}
                        fill={labelFill}
                        fontSize="11"
                        textAnchor="end"
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}

                  {salesSeries.map((point, index) => {
                    const x = chartLeft + slotWidth * (index + 1);
                    if (index === salesSeries.length - 1) return null;
                    return (
                      <line
                        key={`${point.date}-divider`}
                        x1={x}
                        y1={chartTop}
                        x2={x}
                        y2={chartBottom}
                        stroke={gridStroke}
                        opacity="0.5"
                      />
                    );
                  })}

                  <line
                    x1={chartLeft}
                    y1={chartBottom}
                    x2={chartRight}
                    y2={chartBottom}
                    stroke={axisStroke}
                    strokeWidth="1.4"
                  />
                  <line
                    x1={chartLeft}
                    y1={chartTop}
                    x2={chartLeft}
                    y2={chartBottom}
                    stroke={axisStroke}
                    strokeWidth="1.4"
                  />

                  {areaPath ? (
                    <path
                      d={areaPath}
                      fill="url(#valueAreaGradient)"
                      opacity="0.95"
                    />
                  ) : null}

                  {linePoints.map((point) => {
                    const x = point.x - barWidth / 2;
                    const y = chartBottom - point.barHeight;
                    return (
                      <g key={point.date}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(point.barHeight, 4)}
                          rx="8"
                          fill="url(#ordersGradient)"
                        />
                        <text
                          x={point.x}
                          y={chartBottom + 20}
                          fill={labelFill}
                          fontSize="12"
                          textAnchor="middle"
                        >
                          {point.label}
                        </text>
                        <text
                          x={point.x}
                          y={chartBottom + 36}
                          fill={subLabelFill}
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {point.orderCount} db
                        </text>
                      </g>
                    );
                  })}

                  {linePath ? (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#valueGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}

                  {linePoints.map((point) => (
                    <circle
                      key={`${point.date}-circle`}
                      cx={point.x}
                      cy={point.y}
                      r="4.2"
                      fill="#f59e0b"
                      stroke="#0a0a0b"
                      strokeWidth="2"
                    />
                  ))}

                  <text
                    x={chartLeft}
                    y={chartHeight - 12}
                    fill={subLabelFill}
                    fontSize="11"
                  >
                    Napok
                  </text>
                  <text
                    x={chartLeft}
                    y={chartTop - 8}
                    fill={subLabelFill}
                    fontSize="11"
                  >
                    Napi rendelésérték
                  </text>

                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.colors.secondary} />
                      <stop
                        offset="100%"
                        stopColor={theme.colors.accent}
                        stopOpacity="0.72"
                      />
                    </linearGradient>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={theme.colors.accent} />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient
                      id="valueAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={theme.colors.accent}
                        stopOpacity="0.24"
                      />
                      <stop
                        offset="100%"
                        stopColor={theme.colors.accent}
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>
                </ChartSvg>
              </ChartFrame>

              <StatsRow>
                {salesSeries.map((point) => (
                  <StatPill key={point.date}>
                    <StatDay>{point.label}</StatDay>
                    <StatMain>{point.orderCount} db</StatMain>
                    <StatSub>{formatPrice(point.orderValue)}</StatSub>
                  </StatPill>
                ))}
              </StatsRow>
            </WideCard>

            <Card>
              <Heading>Alacsony készlet</Heading>
              <Meta>
                Riasztási határ: {summary.lowStockThreshold} db elérhető készlet.
              </Meta>
              <List>
                {summary.lowStockProducts.length === 0 ? (
                  <ListItem>Nincs kritikus készletszintű termék.</ListItem>
                ) : (
                  summary.lowStockProducts.map((product) => (
                    <ListItem key={product.id}>
                      <strong>{product.name}</strong>
                      <Meta>
                        Elérhető: {product.availableQuantity} db · Foglalva:{" "}
                        {product.reservedQuantity} db
                      </Meta>
                    </ListItem>
                  ))
                )}
              </List>
            </Card>

            <Card>
              <Heading>Legnépszerűbb termékek</Heading>
              <Meta>A nem törölt rendelések alapján számolva.</Meta>
              <List>
                {summary.topProducts.length === 0 ? (
                  <ListItem>Még nincs elég adat a toplistához.</ListItem>
                ) : (
                  summary.topProducts.map((product) => (
                    <ListItem key={product.name}>
                      <strong>{product.name}</strong>
                      <Meta>
                        Eladott mennyiség: {product.quantitySold} db · Árbevétel:{" "}
                        {formatPrice(product.revenue)}
                      </Meta>
                    </ListItem>
                  ))
                )}
              </List>
            </Card>

            <Card>
              <Heading>Friss rendelések</Heading>
              <List>
                {summary.recentOrders.map((order) => (
                  <ListItem key={order.id}>
                    <strong>{order.id}</strong>
                    <Meta>
                      <Status>{statusLabels[order.status]}</Status>
                      {formatPrice(order.total)}
                    </Meta>
                    <Meta>
                      {new Date(order.createdAt).toLocaleString("hu-HU")} ·{" "}
                      {order.contactEmail}
                    </Meta>
                    <Meta>
                      {SHIPPING_METHOD_LABELS[order.shippingMethod]}
                    </Meta>
                  </ListItem>
                ))}
              </List>
            </Card>

            <WideCard>
              <Heading>Kuponkezelés</Heading>
              <Meta>
                Új kupon létrehozása, meglévő kupon szerkesztése vagy
                inaktiválása közvetlenül az admin áttekintésből.
              </Meta>

              <CouponGrid>
                <CouponList>
                  {coupons.length === 0 ? (
                    <CouponCard>
                      <SubHeading>Jelenleg nincs kupon.</SubHeading>
                      <Meta>Hozz létre egy új kedvezményt a jobb oldali űrlapon.</Meta>
                    </CouponCard>
                  ) : (
                    coupons.map((coupon) => (
                      <CouponCard key={coupon.id}>
                        <CouponHead>
                          <div>
                            <CouponCode>{coupon.code}</CouponCode>
                            <Meta>{coupon.label}</Meta>
                          </div>
                          <CouponStatus $active={coupon.active}>
                            {coupon.active ? "Aktív" : "Inaktív"}
                          </CouponStatus>
                        </CouponHead>
                        <Meta>{coupon.description}</Meta>
                        <Meta>
                          {couponTypeLabels[coupon.type]} · Minimum kosárérték:{" "}
                          {formatPrice(coupon.minSubtotal)}
                        </Meta>
                        {coupon.type === "percent" && coupon.percent !== null ? (
                          <Meta>
                            Kedvezmény: {coupon.percent}%{" "}
                            {coupon.maxDiscount !== null
                              ? `· Max.: ${formatPrice(coupon.maxDiscount)}`
                              : ""}
                          </Meta>
                        ) : null}
                        {coupon.type === "fixed" && coupon.amount !== null ? (
                          <Meta>Kedvezmény: {formatPrice(coupon.amount)}</Meta>
                        ) : null}
                        {coupon.type === "shipping" ? (
                          <Meta>
                            Szállítási módok:{" "}
                            {coupon.appliesToShippingMethods.length > 0
                              ? coupon.appliesToShippingMethods
                                  .map(
                                    (methodId) =>
                                      SHIPPING_METHOD_LABELS[methodId],
                                  )
                                  .join(", ")
                              : "összes"}
                          </Meta>
                        ) : null}
                        <CouponActions>
                          <Button
                            type="button"
                            onClick={() => startEditingCoupon(coupon)}
                          >
                            Szerkesztés
                          </Button>
                          <Button
                            type="button"
                            $danger
                            disabled={busyCouponId === coupon.id || !coupon.active}
                            onClick={() => {
                              void handleDeactivateCoupon(coupon.id);
                            }}
                          >
                            {busyCouponId === coupon.id
                              ? "Mentés..."
                              : "Inaktiválás"}
                          </Button>
                        </CouponActions>
                      </CouponCard>
                    ))
                  )}
                </CouponList>

                <Card as="div">
                  <SubHeading>
                    {editingCouponId ? "Kupon szerkesztése" : "Új kupon létrehozása"}
                  </SubHeading>
                  <Meta>
                    Az itt mentett kuponok azonnal elérhetők a checkout oldalon.
                  </Meta>

                  <CouponForm onSubmit={handleCouponSubmit}>
                    <FormGrid>
                      <Field>
                        Kuponkód
                        <Input
                          value={form.code}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              code: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="pl. TAVASZ20"
                          required
                        />
                      </Field>
                      <Field>
                        Típus
                        <Select
                          value={form.type}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              type: event.target.value as Coupon["type"],
                            }))
                          }
                        >
                          <option value="percent">Százalékos</option>
                          <option value="fixed">Fix összegű</option>
                          <option value="shipping">Szállítási kedvezmény</option>
                        </Select>
                      </Field>
                    </FormGrid>

                    <Field>
                      Megjelenő név
                      <Input
                        value={form.label}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>

                    <Field>
                      Leírás
                      <TextArea
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>

                    <FormGrid>
                      <Field>
                        Minimum kosárérték (Ft)
                        <Input
                          type="number"
                          min={0}
                          value={form.minSubtotal}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              minSubtotal: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Field>
                        Maximális kedvezmény (Ft)
                        <Input
                          type="number"
                          min={0}
                          value={form.maxDiscount}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              maxDiscount: event.target.value,
                            }))
                          }
                          placeholder="opcionális"
                        />
                      </Field>
                    </FormGrid>

                    {form.type === "percent" ? (
                      <Field>
                        Kedvezmény százalékban
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={form.percent}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              percent: event.target.value,
                            }))
                          }
                          required
                        />
                      </Field>
                    ) : null}

                    {form.type === "fixed" ? (
                      <Field>
                        Kedvezmény összege (Ft)
                        <Input
                          type="number"
                          min={1}
                          value={form.amount}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              amount: event.target.value,
                            }))
                          }
                          required
                        />
                      </Field>
                    ) : null}

                    <Field>
                      Szállítási módok
                      <Meta>
                        Üresen hagyva a kupon minden szállítási módnál használható.
                      </Meta>
                      <CheckboxGrid>
                        {shippingMethods.map((method) => (
                          <CheckboxLabel key={method.id}>
                            <input
                              type="checkbox"
                              checked={form.appliesToShippingMethods.includes(method.id)}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  appliesToShippingMethods: event.target.checked
                                    ? [
                                        ...current.appliesToShippingMethods,
                                        method.id,
                                      ]
                                    : current.appliesToShippingMethods.filter(
                                        (methodId) => methodId !== method.id,
                                      ),
                                }))
                              }
                            />
                            {method.label}
                          </CheckboxLabel>
                        ))}
                      </CheckboxGrid>
                    </Field>

                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            active: event.target.checked,
                          }))
                        }
                      />
                      Kupon aktív
                    </CheckboxLabel>

                    <InlineRow>
                      <Button type="submit" $primary disabled={isSavingCoupon}>
                        {isSavingCoupon
                          ? "Mentés..."
                          : editingCouponId
                            ? "Kupon frissítése"
                            : "Kupon létrehozása"}
                      </Button>
                      {editingCouponId ? (
                        <Button type="button" onClick={resetCouponForm}>
                          Mégse
                        </Button>
                      ) : null}
                    </InlineRow>
                  </CouponForm>
                </Card>
              </CouponGrid>
            </WideCard>
          </SectionGrid>
        </>
      ) : null}
    </Wrapper>
  );
}
