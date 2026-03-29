/**
 * Regisztráció modális űrlap: felhasználónév, email, jelszó + megerősítés.
 * Siker után automatikus bejelentkezés (mock localStorage).
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
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("A két jelszó nem egyezik.");
      return;
    }
    const res = register(username, email, password);
    if (!res.ok) {
      setError(res.message ?? "Hiba történt.");
      return;
    }
    setUsername("");
    setEmail("");
    setPassword("");
    setPassword2("");
    onClose();
  }

  if (!open) return null;

  return (
    <Backdrop open={open} onClick={onClose}>
      <Dialog
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="reg-title"
        aria-modal="true"
      >
        <Title id="reg-title">Regisztráció</Title>
        <form onSubmit={handleSubmit}>
          <Field>
            Felhasználónév
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
              required
              minLength={4}
            />
          </Field>
          <Field>
            Jelszó újra
            <Input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          {error ? <Err>{error}</Err> : null}
          <Row>
            <BtnGhost type="button" onClick={onClose}>
              Mégse
            </BtnGhost>
            <BtnPrimary type="submit">Fiók létrehozása</BtnPrimary>
          </Row>
        </form>
      </Dialog>
    </Backdrop>
  );
}
