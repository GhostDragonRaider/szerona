import styled from "@emotion/styled";
import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../lib/api";
import type { PaymentGatewayConfig } from "../../data/types";

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  line-height: 1.2;
`;

const Section = styled.section`
  margin-bottom: clamp(${({ theme }) => theme.space.xl}, 6vw, ${({ theme }) => theme.space.xxl});
`;

const Sub = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: clamp(1rem, 3vw, 1.1rem);
  line-height: 1.35;
`;

const Lead = styled.p`
  max-width: 720px;
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;

const Field = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  display: block;
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  margin-top: 6px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

const Select = styled.select`
  display: block;
  width: 100%;
  max-width: 360px;
  box-sizing: border-box;
  margin-top: 6px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.md};
  cursor: pointer;
  font-size: clamp(0.9rem, 2.8vw, 1rem);
  line-height: 1.45;
  & input[type="checkbox"] {
    margin-top: 0.35em;
    flex-shrink: 0;
    width: 1.15rem;
    height: 1.15rem;
  }
`;

const Btn = styled.button`
  width: 100%;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.onAccent};
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.space.md};
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    min-width: min(100%, 240px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Msg = styled.p<{ ok?: boolean }>`
  font-size: 0.92rem;
  color: ${({ theme, ok }) => (ok ? theme.colors.success : theme.colors.accent)};
`;

const StatusGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.sm};
  max-width: 720px;
  margin: 0 0 ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceElevated};
`;

const InfoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  margin-left: 0.35rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.85rem;
  font-weight: 800;
  cursor: help;
`;

function Info({ text }: { text: string }) {
  return (
    <InfoBadge tabIndex={0} title={text} aria-label={text}>
      i
    </InfoBadge>
  );
}

interface PaymentIntegrationSettings {
  paymentProvider: PaymentGatewayConfig["provider"];
  paymentPublicKey: string;
  barionSandbox: boolean;
  barionApiBaseUrl: string;
  barionPosKey: string;
  barionPayee: string;
  barionLocale: string;
  barionCurrency: string;
  barionFundingSources: string;
  szamlazzApiBaseUrl: string;
  szamlazzAgentKey: string;
  szamlazzEInvoice: boolean;
  szamlazzDownloadPdf: boolean;
  gateway: PaymentGatewayConfig;
  barionEnabled: boolean;
  szamlazzEnabled: boolean;
}

interface PaymentSettingsResponse {
  ok: boolean;
  message?: string;
  settings: PaymentIntegrationSettings;
}

const emptySettings: PaymentIntegrationSettings = {
  paymentProvider: "barion",
  paymentPublicKey: "",
  barionSandbox: true,
  barionApiBaseUrl: "",
  barionPosKey: "",
  barionPayee: "",
  barionLocale: "hu-HU",
  barionCurrency: "HUF",
  barionFundingSources: "All",
  szamlazzApiBaseUrl: "https://www.szamlazz.hu/szamla/",
  szamlazzAgentKey: "",
  szamlazzEInvoice: false,
  szamlazzDownloadPdf: false,
  gateway: {
    provider: "barion",
    mode: "redirect",
    readyForClientSetup: false,
    supportsSavedCards: false,
  },
  barionEnabled: false,
  szamlazzEnabled: false,
};

export function AdminPaymentIntegrations() {
  const [settings, setSettings] = useState<PaymentIntegrationSettings>(emptySettings);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await apiFetch<PaymentSettingsResponse>(
          "/api/admin/payment-integrations",
          { auth: true },
        );
        if (!cancelled) {
          setSettings(response.settings);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({
            ok: false,
            text:
              error instanceof Error
                ? error.message
                : "Nem sikerült betölteni a fizetési beállításokat.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof PaymentIntegrationSettings>(
    key: K,
    value: PaymentIntegrationSettings[K],
  ) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    setMessage(null);
    setIsSaving(true);
    try {
      const response = await apiFetch<PaymentSettingsResponse>(
        "/api/admin/payment-integrations",
        {
          method: "PATCH",
          auth: true,
          json: settings,
        },
      );

      setSettings(response.settings);
      setMessage({
        ok: true,
        text: response.message ?? "Fizetési integrációk mentve.",
      });
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült menteni a fizetési beállításokat.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Title>Fizetési integrációk</Title>
      <Lead>
        Itt állítható a Barion teszt/éles fizetés és a Számlázz.hu számla-agent
        kulcsa. A mentés a backend környezeti beállításait frissíti.
      </Lead>

      <StatusGrid>
        <div>
          <strong>Gateway mód:</strong>
          <Info text="A gateway mód azt jelenti, hogyan fizet a vásárló. A Barion redirect módnál a vásárlót a Barion biztonságos fizetőoldalára irányítjuk, majd sikeres fizetés után visszatér a webshopba." />{" "}
          {settings.gateway.provider} /{" "}
          {settings.gateway.mode}
        </div>
        <div>
          <strong>Barion:</strong>{" "}
          {settings.barionEnabled ? "bekapcsolva" : "hiányos beállítás"}
        </div>
        <div>
          <strong>Számlázz.hu:</strong>{" "}
          {settings.szamlazzEnabled ? "bekapcsolva" : "hiányos beállítás"}
        </div>
      </StatusGrid>

      {isLoading ? <Lead>Beállítások betöltése...</Lead> : null}

      <form onSubmit={saveSettings}>
        <Section>
          <Sub>Barion</Sub>
          <Field>
            Fizetési szolgáltató
            <Info text="Ez az a külső pénzügyi szolgáltató, aki a bankkártyás fizetést kezeli. Jelenleg a webshop Barionnal működik." />
            <Select
              value={settings.paymentProvider}
              onChange={(event) =>
                update(
                  "paymentProvider",
                  event.target.value as PaymentIntegrationSettings["paymentProvider"],
                )
              }
              disabled={isSaving}
            >
              <option value="barion">Barion</option>
            </Select>
          </Field>
          <CheckRow>
            <input
              type="checkbox"
              checked={settings.barionSandbox}
              onChange={(event) => update("barionSandbox", event.target.checked)}
              disabled={isSaving}
            />
            Barion teszt környezet használata
          </CheckRow>
          <Field>
            Barion POSKey
            <Info text="A POSKey a Barion kereskedői elfogadóhely azonosító kulcsa. Enélkül a webshop nem tud Barion fizetést indítani." />
            <Input
              value={settings.barionPosKey}
              onChange={(event) => update("barionPosKey", event.target.value)}
              disabled={isSaving}
              autoComplete="off"
            />
          </Field>
          <Field>
            Barion Payee / wallet e-mail
            <Info text="Ez a Barion kereskedői tárcához tartozó e-mail cím. Ide kapcsolódik a webshopban indított fizetés." />
            <Input
              type="email"
              value={settings.barionPayee}
              onChange={(event) => update("barionPayee", event.target.value)}
              disabled={isSaving}
              autoComplete="email"
              placeholder="A Barion POS-hoz tartozó kereskedői e-mail"
            />
          </Field>
          <Field>
            Barion API base URL (üresen automatikus teszt/éles URL)
            <Info text="A Barion API címe. Teszt módban a teszt Barion szervert, éles módban az éles Barion szervert használja." />
            <Input
              value={settings.barionApiBaseUrl}
              onChange={(event) => update("barionApiBaseUrl", event.target.value)}
              disabled={isSaving}
              placeholder="https://api.test.barion.com/v2"
            />
          </Field>
        </Section>

        <Section>
          <Sub>Számlázz.hu</Sub>
          <Field>
            Számlázz.hu API / Számla Agent kulcs
            <Info text="A Számlázz.hu API kulcs engedélyezi, hogy a webshop automatikusan számlát állítson ki a rendelésekhez." />
            <Input
              value={settings.szamlazzAgentKey}
              onChange={(event) => update("szamlazzAgentKey", event.target.value)}
              disabled={isSaving}
              autoComplete="off"
            />
          </Field>
          <Field>
            Számlázz.hu API URL
            <Input
              value={settings.szamlazzApiBaseUrl}
              onChange={(event) => update("szamlazzApiBaseUrl", event.target.value)}
              disabled={isSaving}
            />
          </Field>
          <CheckRow>
            <input
              type="checkbox"
              checked={settings.szamlazzEInvoice}
              onChange={(event) => update("szamlazzEInvoice", event.target.checked)}
              disabled={isSaving}
            />
            E-számla létrehozása
          </CheckRow>
          <CheckRow>
            <input
              type="checkbox"
              checked={settings.szamlazzDownloadPdf}
              onChange={(event) =>
                update("szamlazzDownloadPdf", event.target.checked)
              }
              disabled={isSaving}
            />
            Számla PDF letöltése a válaszban
          </CheckRow>
        </Section>

        {message ? <Msg ok={message.ok}>{message.text}</Msg> : null}
        <Btn type="submit" disabled={isSaving || isLoading}>
          {isSaving ? "Mentés..." : "Integrációk mentése"}
        </Btn>
      </form>
    </div>
  );
}
