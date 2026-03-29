import styled from "@emotion/styled";

export const Box = styled.section`
  max-width: 640px;
  width: 100%;
`;

export const Lead = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: clamp(0.88rem, 2.8vw, 0.95rem);
  line-height: 1.5;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: ${({ theme }) => theme.space.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

export const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

export const Btn = styled.button`
  width: 100%;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.space.sm};
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    min-width: 200px;
  }
`;

export const BtnGhost = styled.button`
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  cursor: pointer;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
  }
`;

export const Msg = styled.p<{ ok?: boolean }>`
  margin: ${({ theme }) => theme.space.md} 0 0;
  font-size: 0.9rem;
  color: ${({ theme, ok }) =>
    ok ? theme.colors.success : theme.colors.accent};
`;

export const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 1.65rem);
  line-height: 1.2;
`;
