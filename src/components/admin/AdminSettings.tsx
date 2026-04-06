/**
 * Admin altalanos beallitasok: oldal megjelenes + admin kapcsolat + admin jelszo.
 */
import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

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

const Field = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 480px;
  }
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
`;

const Msg = styled.p<{ ok?: boolean }>`
  font-size: 0.92rem;
  color: ${({ theme, ok }) => (ok ? theme.colors.success : theme.colors.accent)};
`;

const Lead = styled.p`
  max-width: 640px;
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;

export function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const { user, updateAdminContact, changeAccountPassword, logoutAllSessions } =
    useAuth();

  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle);
  const [accent, setAccent] = useState(settings.accentColor);
  const [showNews, setShowNews] = useState(settings.showNewsSection);
  const [showCats, setShowCats] = useState(settings.showCategoryStrip);

  const [adminEmail, setAdminEmail] = useState(user?.email ?? "");
  const [adminPhone, setAdminPhone] = useState(user?.phone ?? "");
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isLoggingOutEverywhere, setIsLoggingOutEverywhere] = useState(false);

  useEffect(() => {
    setAdminEmail(user?.email ?? "");
    setAdminPhone(user?.phone ?? "");
  }, [user?.email, user?.phone]);

  function saveSite(e: FormEvent) {
    e.preventDefault();
    updateSettings({
      heroSubtitle,
      accentColor: accent,
      showNewsSection: showNews,
      showCategoryStrip: showCats,
    });
  }

  async function saveAdminContact(e: FormEvent) {
    e.preventDefault();
    if (isSavingAdmin) return;

    setAdminMsg(null);
    setIsSavingAdmin(true);
    const res = await updateAdminContact(
      adminEmail,
      adminPhone,
      adminCurrentPassword,
    );
    setIsSavingAdmin(false);

    if (!res.ok) {
      setAdminMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }

    setAdminMsg({ ok: true, text: "Admin adatok frissitve." });
    setAdminCurrentPassword("");
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (isSavingPassword) return;

    setPwMsg(null);
    if (newPass !== newPass2) {
      setPwMsg({ ok: false, text: "Az uj jelszavak nem egyeznek." });
      return;
    }

    setIsSavingPassword(true);
    const res = await changeAccountPassword(curPass, newPass);
    setIsSavingPassword(false);

    if (!res.ok) {
      setPwMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }

    setPwMsg({ ok: true, text: "Admin jelszo frissitve." });
    setCurPass("");
    setNewPass("");
    setNewPass2("");
  }

  async function handleLogoutAllSessions() {
    if (isLoggingOutEverywhere) return;

    setSessionMsg(null);
    setIsLoggingOutEverywhere(true);
    const result = await logoutAllSessions();
    setIsLoggingOutEverywhere(false);
    setSessionMsg({
      ok: result.ok,
      text:
        result.message ??
        (result.ok
          ? "Minden eszkozrol kijelentkeztettel."
          : "Nem sikerult kijelentkeztetni minden eszkozt."),
    });
  }

  return (
    <div>
      <Title>Általános beállítások</Title>

      <Section>
        <Sub>Oldal szövegei és megjelenés</Sub>
        <form onSubmit={saveSite}>
          <Field>
            Hero alcím
            <Input
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
            />
          </Field>
          <Field>
            Kiemelő szín (hex)
            <Input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="#ff3d5a"
            />
          </Field>
          <CheckRow>
            <input
              type="checkbox"
              checked={showNews}
              onChange={(e) => setShowNews(e.target.checked)}
            />
            Hírek szekció megjelenítése a főoldalon
          </CheckRow>
          <CheckRow>
            <input
              type="checkbox"
              checked={showCats}
              onChange={(e) => setShowCats(e.target.checked)}
            />
            Kategória sáv megjelenítése a főoldalon
          </CheckRow>
          <Btn type="submit">Beállítások mentése</Btn>
        </form>
      </Section>

      <Section>
        <Sub>Admin kapcsolati adatok</Sub>
        <Lead>
          Itt tudod frissiteni az admin fiok e-mail cimet es telefonszamat. A
          menteshez add meg a jelenlegi admin jelszot.
        </Lead>
        <form onSubmit={saveAdminContact}>
          <Field>
            Admin e-mail cím
            <Input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              autoComplete="email"
              disabled={isSavingAdmin}
              required
            />
          </Field>
          <Field>
            Telefonszám
            <Input
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              autoComplete="tel"
              disabled={isSavingAdmin}
              placeholder="+36 30 123 4567"
            />
          </Field>
          <Field>
            Jelenlegi admin jelszó
            <Input
              type="password"
              value={adminCurrentPassword}
              onChange={(e) => setAdminCurrentPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isSavingAdmin}
              required
            />
          </Field>
          {adminMsg ? <Msg ok={adminMsg.ok}>{adminMsg.text}</Msg> : null}
          <Btn type="submit" disabled={isSavingAdmin}>
            {isSavingAdmin ? "Mentés..." : "Kapcsolati adatok mentése"}
          </Btn>
        </form>
      </Section>

      <Section>
        <Sub>Admin jelszó módosítása</Sub>
        <Lead>
          Add meg a jelenlegi admin jelszot, majd az uj jelszot ketszer. Az uj
          admin jelszo legalabb 4 karakter legyen.
        </Lead>
        <form onSubmit={savePassword}>
          <Field>
            Jelenlegi jelszó
            <Input
              type="password"
              value={curPass}
              onChange={(e) => setCurPass(e.target.value)}
              autoComplete="current-password"
              disabled={isSavingPassword}
              required
            />
          </Field>
          <Field>
            Új jelszó
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              disabled={isSavingPassword}
              minLength={4}
              required
            />
          </Field>
          <Field>
            Új jelszó újra
            <Input
              type="password"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              autoComplete="new-password"
              disabled={isSavingPassword}
              minLength={4}
              required
            />
          </Field>
          {pwMsg ? <Msg ok={pwMsg.ok}>{pwMsg.text}</Msg> : null}
          <Btn type="submit" disabled={isSavingPassword}>
            {isSavingPassword ? "Mentés..." : "Jelszó mentése"}
          </Btn>
        </form>
      </Section>

      <Section>
        <Sub>Munkamenetek</Sub>
        <Lead>
          Ha szukseges, az admin fiokot egy kattintassal kijelentkeztetheted
          az osszes eszkozrol.
        </Lead>
        {sessionMsg ? <Msg ok={sessionMsg.ok}>{sessionMsg.text}</Msg> : null}
        <Btn
          type="button"
          onClick={() => {
            void handleLogoutAllSessions();
          }}
          disabled={isLoggingOutEverywhere}
        >
          {isLoggingOutEverywhere
            ? "Kijelentkeztetes..."
            : "Kijelentkeztetes minden eszkozrol"}
        </Btn>
      </Section>
    </div>
  );
}
