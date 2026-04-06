/**
 * Belepes modal: auth login + elfelejtett jelszo keres.
 */
import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Backdrop = styled.div<{ open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: ${({ theme }) => theme.colors.overlay};
  display: ${({ open }) => (open ? "flex" : "none")};
  align-items: flex-start;
  justify-content: center;
  padding: ${({ theme }) => theme.space.md};
  padding-top: max(12vh, env(safe-area-inset-top, 0px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: center;
    padding: ${({ theme }) => theme.space.lg};
    padding-top: ${({ theme }) => theme.space.lg};
  }
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 420px;
  margin: auto 0;
  padding: ${({ theme }) => theme.space.lg};
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xl};
    margin: 0;
  }
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.75rem;
`;

const TipBubble = styled.div`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.accentSoft};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-size: 0.82rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const TipLabel = styled.div`
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const TipList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
`;

const TipItem = styled.li`
  margin-bottom: 0.25rem;
  &:last-of-type {
    margin-bottom: 0;
  }
  code {
    font-family: ui-monospace, monospace;
    font-size: 0.88em;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.surfaceElevated};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Field = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
`;

const Err = styled.p`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.9rem;
  margin: 0 0 ${({ theme }) => theme.space.md};
`;

const Ok = styled(Err)`
  color: ${({ theme }) => theme.colors.success};
`;

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.lg};
`;

const Btn = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  cursor: pointer;
`;

const BtnPrimary = styled(Btn)`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
`;

const BtnGhost = styled(Btn)`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const TextButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font-weight: 600;
`;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, requestPasswordReset, requestEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
    null,
  );
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode("login");
      setError(null);
      setSuccess(null);
      setDevResetUrl(null);
      setDevVerificationUrl(null);
      setCanResendVerification(false);
    }
  }, [open]);

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccess(null);
    setDevVerificationUrl(null);
    setCanResendVerification(false);
    setIsSubmitting(true);
    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message ?? "Hiba tortent.");
      setDevVerificationUrl(res.devVerificationUrl ?? null);
      setCanResendVerification(
        Boolean(
          !res.devVerificationUrl &&
            (res.verificationRequired ||
              res.message?.toLowerCase().includes("nincs megerősítve") ||
              res.message?.toLowerCase().includes("nincs megerositve")),
        ),
      );
      return;
    }
    setCanResendVerification(false);
    setUsername("");
    setPassword("");
    onClose();
    if (res.user?.role === "admin") {
      navigate("/admin");
    }
  }

  async function handleResendVerification() {
    if (isSubmitting || !username.trim()) return;

    setError(null);
    setSuccess(null);
    setDevVerificationUrl(null);
    setIsSubmitting(true);
    const result = await requestEmailVerification(username.trim());
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Nem sikerult uj megerosito levelet kerni.");
      return;
    }

    setSuccess(
      result.message ??
        "Ha talaltunk nem megerositett fiokot, uj megerosito levelet kuldtunk.",
    );
    setDevVerificationUrl(result.devVerificationUrl ?? null);
  }

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccess(null);
    setDevResetUrl(null);
    setIsSubmitting(true);
    const result = await requestPasswordReset(forgotEmail);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Nem sikerult elinditani a visszaallitast.");
      return;
    }

    setSuccess(
      result.message ??
        "Ha talaltunk ilyen fiokot, kuldtunk egy visszaallitasi linket.",
    );
    setDevResetUrl(result.devResetUrl ?? null);
  }

  if (!open) return null;

  return (
    <Backdrop open={open} onClick={onClose} role="presentation">
      <Dialog
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="login-title"
        aria-modal="true"
      >
        <Title id="login-title">
          {mode === "login" ? "Belepes" : "Elfelejtett jelszo"}
        </Title>
        {mode === "login" ? (
          <TipBubble role="note" aria-label="Belepesi tippek">
            <TipLabel>Tipp</TipLabel>
            <TipList>
              <TipItem>
                Admin felulet: <code>admin</code> / <code>aktualis admin jelszo</code>
              </TipItem>
              <TipItem>
                Vasarloi fiok: a sajat regisztralt felhasznaloddal tudsz belepni
              </TipItem>
            </TipList>
          </TipBubble>
        ) : (
          <TipBubble role="note" aria-label="Visszaallitas tipp">
            <TipLabel>Info</TipLabel>
            Add meg az e-mail cimet, amihez a fiok tartozik. Ha talalunk ilyen
            fiokot, visszaallitasi linket kuldunk a megadott cimre.
          </TipBubble>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit}>
            <Field>
              Felhasznalonev
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
                required
              />
            </Field>
            <Field>
              Jelszo
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
            </Field>
            {error ? <Err>{error}</Err> : null}
            {success ? <Ok>{success}</Ok> : null}
            {devVerificationUrl ? (
              <Ok>
                Megerősítő link:{" "}
                <a href={devVerificationUrl} target="_blank" rel="noreferrer">
                  {devVerificationUrl}
                </a>
              </Ok>
            ) : null}
            {canResendVerification ? (
              <TextButton
                type="button"
                onClick={handleResendVerification}
                disabled={isSubmitting}
              >
                Megerosito level ujrakuldese
              </TextButton>
            ) : null}
            <TextButton
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setSuccess(null);
                setDevVerificationUrl(null);
                setCanResendVerification(false);
              }}
            >
              Elfelejtetted a jelszavad?
            </TextButton>
            <Row>
              <BtnGhost type="button" onClick={onClose} disabled={isSubmitting}>
                Megse
              </BtnGhost>
              <BtnPrimary type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Beleptetes..." : "Belepek"}
              </BtnPrimary>
            </Row>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit}>
            <Field>
              E-mail cim
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </Field>
            {error ? <Err>{error}</Err> : null}
            {success ? <Ok>{success}</Ok> : null}
            {devResetUrl ? (
              <Ok>
                Teszt link:{" "}
                <a href={devResetUrl} target="_blank" rel="noreferrer">
                  {devResetUrl}
                </a>
              </Ok>
            ) : null}
            <TextButton
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
                setDevResetUrl(null);
                setDevVerificationUrl(null);
              }}
            >
              Vissza a belepeshez
            </TextButton>
            <Row>
              <BtnGhost type="button" onClick={onClose} disabled={isSubmitting}>
                Megse
              </BtnGhost>
              <BtnPrimary type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kuldes..." : "Visszaallitasi link kerese"}
              </BtnPrimary>
            </Row>
          </form>
        )}
      </Dialog>
    </Backdrop>
  );
}
