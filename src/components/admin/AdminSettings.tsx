/**
 * Admin általános beállítások: admin jelszó csere, hero alcím, accent szín,
 * hírek és kategória sáv ki/bekapcsolása – mind a SettingsContext-en keresztül.
 */
import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useState } from "react";
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
  font-size: 0.9rem;
  color: ${({ theme, ok }) => (ok ? theme.colors.success : theme.colors.accent)};
`;

export function AdminSettings() {
  const { settings, updateSettings, changeAdminPassword } = useSettings();
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle);
  const [accent, setAccent] = useState(settings.accentColor);
  const [showNews, setShowNews] = useState(settings.showNewsSection);
  const [showCats, setShowCats] = useState(settings.showCategoryStrip);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function saveSite(e: FormEvent) {
    e.preventDefault();
    updateSettings({
      heroSubtitle,
      accentColor: accent,
      showNewsSection: showNews,
      showCategoryStrip: showCats,
    });
  }

  function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPass !== newPass2) {
      setPwMsg({ ok: false, text: "Az új jelszavak nem egyeznek." });
      return;
    }
    const res = changeAdminPassword(curPass, newPass);
    if (!res.ok) {
      setPwMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }
    setPwMsg({
      ok: true,
      text: "Jelszó frissítve. Következő belépéshez már az új jelszót használd.",
    });
    setCurPass("");
    setNewPass("");
    setNewPass2("");
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
        <Sub>Admin jelszó módosítása</Sub>
        <form onSubmit={savePassword}>
          <Field>
            Jelenlegi jelszó
            <Input
              type="password"
              value={curPass}
              onChange={(e) => setCurPass(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field>
            Új jelszó
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field>
            Új jelszó újra
            <Input
              type="password"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          {pwMsg ? (
            <Msg ok={pwMsg.ok}>{pwMsg.text}</Msg>
          ) : null}
          <Btn type="submit">Jelszó mentése</Btn>
        </form>
      </Section>
    </div>
  );
}
