/**
 * Regisztráció modális űrlap. Siker után nem léptet be automatikusan,
 * hanem egy frontend-oldali e-mail megerősítő tájékoztató nézetet mutat.
 */
import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useState } from "react";
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
  padding-top: max(8vh, env(safe-area-inset-top, 0px));
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
  max-height: min(90vh, 100dvh);
  margin: auto 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space.lg};
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xl};
    margin: 0;
  }
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.75rem;
`;

const Copy = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MailBadge = styled.div`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  word-break: break-word;
`;

const LinkPanel = styled.div`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const LinkAnchor = styled.a`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 700;
  word-break: break-all;
  text-decoration: none;
`;

const MetaText = styled.p`
  margin: ${({ theme }) => theme.space.sm} 0 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
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

const CheckboxGroup = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.md};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.sm};
  font-size: 0.88rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Checkbox = styled.input`
  margin-top: 2px;
`;

const LegalLink = styled.a`
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 700;
`;

const Err = styled.p`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.9rem;
  margin: 0 0 ${({ theme }) => theme.space.md};
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
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.secondary},
    #8b5cf6
  );
  color: ${({ theme }) => theme.colors.onAccent};
`;

const BtnGhost = styled(Btn)`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const { register, requestEmailVerification } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [confirmationLink, setConfirmationLink] = useState<string | null>(null);
  const [confirmationExpiresAt, setConfirmationExpiresAt] = useState<
    string | null
  >(null);

  const isConfirmationView = Boolean(confirmationEmail);

  function formatExpiry(value: string | null) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function resetState() {
    setUsername("");
    setEmail("");
    setPassword("");
    setPassword2("");
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setError(null);
    setIsSubmitting(false);
    setConfirmationEmail(null);
    setConfirmationLink(null);
    setConfirmationExpiresAt(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    if (password !== password2) {
      setError("A két jelszó nem egyezik.");
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      setError(
        "A regisztrációhoz el kell fogadnod az ÁSZF-et és az adatkezelési tájékoztatót.",
      );
      return;
    }

    setIsSubmitting(true);
    const res = await register(username, email, password, {
      acceptTerms,
      acceptPrivacy,
    });
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message ?? "Hiba történt.");
      return;
    }

    setConfirmationEmail(email.trim());
    setConfirmationLink(res.devVerificationUrl ?? null);
    setConfirmationExpiresAt(res.expiresAt ?? null);
    setUsername("");
    setEmail("");
    setPassword("");
    setPassword2("");
    setAcceptTerms(false);
    setAcceptPrivacy(false);
  }

  async function handleResend() {
    if (!confirmationEmail || isSubmitting) return;

    setIsSubmitting(true);
    const result = await requestEmailVerification(confirmationEmail);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Nem sikerült új megerősítő levelet küldeni.");
      return;
    }

    setError(null);
    setConfirmationLink(result.devVerificationUrl ?? null);
    setConfirmationExpiresAt(result.expiresAt ?? null);
  }

  if (!open) return null;

  return (
    <Backdrop open={open} onClick={handleClose}>
      <Dialog
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="reg-title"
        aria-modal="true"
      >
        {isConfirmationView ? (
          <>
            <Title id="reg-title">E-mail megerősítés</Title>
            <Copy>
              {confirmationLink
                ? "Ebben a környezetben a megerősítő linket közvetlenül itt kapod meg. A fiókod véglegesítéséhez nyisd meg az alábbi hivatkozást."
                : "Küldtünk egy megerősítő linket az alábbi e-mail címre. A fiókod megerősítése ezen a linken keresztül fog történni."}
            </Copy>
            <MailBadge>{confirmationEmail}</MailBadge>
            {confirmationLink ? (
              <LinkPanel>
                <LinkAnchor
                  href={confirmationLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {confirmationLink}
                </LinkAnchor>
                {formatExpiry(confirmationExpiresAt) ? (
                  <MetaText>
                    A link eddig érvényes:{" "}
                    <strong>{formatExpiry(confirmationExpiresAt)}</strong>
                  </MetaText>
                ) : null}
              </LinkPanel>
            ) : null}
            {error ? <Err>{error}</Err> : null}
            <Row>
              {!confirmationLink ? (
                <BtnGhost
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Küldés..." : "Levél újraküldése"}
                </BtnGhost>
              ) : null}
              <BtnPrimary type="button" onClick={handleClose}>
                Rendben
              </BtnPrimary>
            </Row>
          </>
        ) : (
          <>
            <Title id="reg-title">Regisztráció</Title>
            <form onSubmit={handleSubmit}>
              <Field>
                Felhasználónév
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isSubmitting}
                  required
                  minLength={3}
                />
              </Field>
              <Field>
                E-mail
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </Field>
              <Field>
                Jelszó
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                  minLength={8}
                />
              </Field>
              <Field>
                Jelszó újra
                <Input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </Field>
              <CheckboxGroup>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={isSubmitting}
                    required
                  />
                  <span>
                    Elfogadom az{" "}
                    <LegalLink href="/aszf" target="_blank" rel="noreferrer">
                      Általános Szerződési Feltételeket
                    </LegalLink>
                    .
                  </span>
                </CheckboxLabel>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    disabled={isSubmitting}
                    required
                  />
                  <span>
                    Elfogadom az{" "}
                    <LegalLink
                      href="/adatkezelesi-tajekoztato"
                      target="_blank"
                      rel="noreferrer"
                    >
                      adatkezelési tájékoztatót
                    </LegalLink>
                    .
                  </span>
                </CheckboxLabel>
              </CheckboxGroup>
              {error ? <Err>{error}</Err> : null}
              <Row>
                <BtnGhost
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Mégse
                </BtnGhost>
                <BtnPrimary type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Regisztráció..." : "Fiók létrehozása"}
                </BtnPrimary>
              </Row>
            </form>
          </>
        )}
      </Dialog>
    </Backdrop>
  );
}
