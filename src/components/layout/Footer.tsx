/**
 * Lábléc: középen S-jel logó (felirat nélkül), bevezető szöveg, jogi sor.
 */
import styled from "@emotion/styled";
import { Logo } from "../branding/Logo";

const Foot = styled.footer`
  margin-top: auto;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.md};
  padding-bottom: max(${({ theme }) => theme.space.md}, env(safe-area-inset-bottom, 0px));
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.lg};
  }
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

/** Márka (csak S-jel) + bevezető szöveg */
const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  width: 100%;
  max-width: 36rem;
`;

const Tagline = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  max-width: 48rem;
`;

const Copy = styled.p`
  margin: 0;
  width: 100%;
  font-size: 0.75rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <Foot>
      <Inner>
        <BrandBlock>
          <Logo variant="footer" markOnly />
          <Tagline>
            Prémium utcai divat. Minőségi anyagok, merész sziluettek – a Serona a
            mindennapi önkifejezésedhez készült.
          </Tagline>
        </BrandBlock>
        <Copy>© {year} Serona. Minden jog fenntartva.</Copy>
      </Inner>
    </Foot>
  );
}
