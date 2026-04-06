import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import type { LegalDocument } from "../data/legal";

const Page = styled.main`
  width: 100%;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
`;

const Wrap = styled.article`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Eyebrow = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 700;
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  line-height: 1;
`;

const Meta = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
`;

const Intro = styled.div`
  margin-bottom: ${({ theme }) => theme.space.xl};
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Paragraph = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.75;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const SectionTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: 1.1rem;
  line-height: 1.4;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 1.2rem;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.75;
`;

const ListItem = styled.li`
  margin-bottom: ${({ theme }) => theme.space.sm};

  &:last-child {
    margin-bottom: 0;
  }
`;

const HomeLink = styled(Link)`
  display: inline-block;
  margin-top: ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 700;
`;

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <Page>
      <Wrap>
        <Eyebrow>Jogi dokumentum</Eyebrow>
        <Title>{document.title}</Title>
        <Meta>
          Verzió: {document.version}
          <br />
          Utolsó frissítés: {document.lastUpdated}
        </Meta>

        <Intro>
          {document.intro.map((paragraph) => (
            <Paragraph key={paragraph}>{paragraph}</Paragraph>
          ))}
        </Intro>

        {document.sections.map((section) => (
          <Section key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            {section.paragraphs?.map((paragraph) => (
              <Paragraph key={paragraph}>{paragraph}</Paragraph>
            ))}
            {section.bullets?.length ? (
              <List>
                {section.bullets.map((bullet) => (
                  <ListItem key={bullet}>{bullet}</ListItem>
                ))}
              </List>
            ) : null}
          </Section>
        ))}

        <HomeLink to="/">Vissza a főoldalra</HomeLink>
      </Wrap>
    </Page>
  );
}
