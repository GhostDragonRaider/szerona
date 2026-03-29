/**
 * Belépés modális ablak: felhasználónév + jelszó; siker esetén admin → /admin navigáció.
 */
import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useState } from "react";
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
  max-width: 400px;
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

/** Demo belépési adatok – lekerekített „buborék” tippblokk */
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

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = login(username, password);
    if (!res.ok) {
      setError(res.message ?? "Hiba történt.");
      return;
    }
    setUsername("");
    setPassword("");
    onClose();
    if (username.trim() === "admin") {
      navigate("/admin");
    }
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
        <Title id="login-title">Belépés</Title>
        <TipBubble role="note" aria-label="Demo belépési tippek">
          <TipLabel>Tipp</TipLabel>
          <TipList>
            <TipItem>
              Admin felület: <code>admin</code> / <code>admin</code>
            </TipItem>
            <TipItem>
              Felhasználói fiók: <code>teszt</code> / <code>teszt</code>
            </TipItem>
          </TipList>
        </TipBubble>
        <form onSubmit={handleSubmit}>
          <Field>
            Felhasználónév
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field>
            Jelszó
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error ? <Err>{error}</Err> : null}
          <Row>
            <BtnGhost type="button" onClick={onClose}>
              Mégse
            </BtnGhost>
            <BtnPrimary type="submit">Belépek</BtnPrimary>
          </Row>
        </form>
      </Dialog>
    </Backdrop>
  );
}
