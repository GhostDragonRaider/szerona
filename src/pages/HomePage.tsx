/**
 * Kezdőlap összeállítása: hero, automatikus terméksáv, kategóriák, hírek (beállítás szerint).
 */
import { AutoScrollSlider } from "../components/home/AutoScrollSlider";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { HeroSection } from "../components/home/HeroSection";
import { NewsSection } from "../components/home/NewsSection";
import { useSettings } from "../context/SettingsContext";

export function HomePage() {
  const { settings } = useSettings();

  return (
    <>
      <HeroSection />
      <AutoScrollSlider />
      {settings.showCategoryStrip ? <CategoryGrid /> : null}
      {settings.showNewsSection ? <NewsSection /> : null}
    </>
  );
}
