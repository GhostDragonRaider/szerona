/**
 * Hírek / újdonságok szekció: kártyák kép + cím + rövid szöveg + dátum.
 */
import styled from "@emotion/styled";
import { INITIAL_NEWS } from "../../data/news";

const Section = styled.section`
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  }
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.xl};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: 0.06em;
`;

const Grid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.lg};
  grid-template-columns: 1fr;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.article`
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
`;

const Img = styled.div<{ url?: string }>`
  height: 180px;
  background: ${({ url, theme }) =>
    url
      ? `url(${url}) center/cover no-repeat`
      : theme.colors.surfaceElevated};
  background-color: ${({ theme }) => theme.colors.surfaceElevated};
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.space.lg};
`;

const Meta = styled.time`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`;

const H3 = styled.h3`
  margin: ${({ theme }) => theme.space.sm} 0;
  font-size: 1.15rem;
  font-family: ${({ theme }) => theme.fonts.body};
`;

const Excerpt = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;

export function NewsSection() {
  return (
    <Section aria-labelledby="news-heading">
      <Title id="news-heading">Újdonságok & hírek</Title>
      <Grid>
        {INITIAL_NEWS.map((n) => (
          <Card key={n.id}>
            <Img url={n.image} role="img" aria-label="" />
            <Body>
              <Meta dateTime={n.date}>{n.date}</Meta>
              <H3>{n.title}</H3>
              <Excerpt>{n.excerpt}</Excerpt>
            </Body>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}
