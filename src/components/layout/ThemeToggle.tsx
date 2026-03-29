/**
 * Világos / sötét mód váltó gomb – ikon + elérhető név a képernyőolvasónak.
 */
import styled from "@emotion/styled";
import { useThemeMode } from "../../context/ThemeModeContext";

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  transition: none;
  @media (hover: hover) {
    &:hover {
      transition: border-color 0.2s, background 0.2s, color 0.2s;
      border-color: #000000;
      background: #000000;
      color: #ffffff;
    }
  }
`;

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";
  return (
    <Btn
      type="button"
      onClick={toggleMode}
      title={isDark ? "Világos mód" : "Sötét mód"}
      aria-label={isDark ? "Váltás világos módra" : "Váltás sötét módra"}
    >
      {isDark ? "☀️" : "🌙"}
    </Btn>
  );
}
