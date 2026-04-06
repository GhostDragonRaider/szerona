import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  acceptAllCookieConsentPreferences,
  buildCookieConsentRecord,
  defaultCookieConsentPreferences,
  isCookieConsentCurrent,
  readCookieConsentRecord,
  type CookieConsentOptionalCategory,
  type CookieConsentPreferences,
  type CookieConsentRecord,
  writeCookieConsentRecord,
} from "../lib/cookieConsent";

interface CookieConsentContextValue {
  consent: CookieConsentRecord | null;
  draftPreferences: CookieConsentPreferences;
  hasConsented: boolean;
  isBannerOpen: boolean;
  isPreferencesOpen: boolean;
  hasConsent: (category: "necessary" | CookieConsentOptionalCategory) => boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  setDraftPreference: (
    category: CookieConsentOptionalCategory,
    enabled: boolean,
  ) => void;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  savePreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

function resolveInitialState() {
  const stored = readCookieConsentRecord();
  return {
    stored,
    currentConsent: isCookieConsentCurrent(stored) ? stored : null,
    draftPreferences:
      stored?.preferences ?? defaultCookieConsentPreferences(),
  };
}

export function CookieConsentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const initialState = resolveInitialState();
  const [consent, setConsent] = useState<CookieConsentRecord | null>(
    initialState.currentConsent,
  );
  const [draftPreferences, setDraftPreferences] =
    useState<CookieConsentPreferences>(initialState.draftPreferences);
  const [isBannerOpen, setBannerOpen] = useState(!initialState.currentConsent);
  const [isPreferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.cookieConsent = consent
      ? "configured"
      : "pending";
    document.documentElement.dataset.cookiePreferences =
      consent?.preferences.preferences ? "granted" : "denied";
    document.documentElement.dataset.cookieAnalytics =
      consent?.preferences.analytics ? "granted" : "denied";
    document.documentElement.dataset.cookieMarketing =
      consent?.preferences.marketing ? "granted" : "denied";

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("serona:cookie-consent-changed", {
          detail: consent,
        }),
      );
    }
  }, [consent]);

  const commitPreferences = useCallback(
    (nextPreferences: Partial<CookieConsentPreferences>) => {
      const record = buildCookieConsentRecord({
        ...draftPreferences,
        ...nextPreferences,
      });

      writeCookieConsentRecord(record);
      setConsent(record);
      setDraftPreferences(record.preferences);
      setBannerOpen(false);
      setPreferencesOpen(false);
    },
    [draftPreferences],
  );

  const openPreferences = useCallback(() => {
    setDraftPreferences((current) =>
      consent?.preferences ?? current ?? defaultCookieConsentPreferences(),
    );
    setPreferencesOpen(true);
  }, [consent]);

  const closePreferences = useCallback(() => {
    setPreferencesOpen(false);
  }, []);

  const setDraftPreference = useCallback(
    (category: CookieConsentOptionalCategory, enabled: boolean) => {
      setDraftPreferences((current) => ({
        ...current,
        necessary: true,
        [category]: enabled,
      }));
    },
    [],
  );

  const acceptAll = useCallback(() => {
    commitPreferences(acceptAllCookieConsentPreferences());
  }, [commitPreferences]);

  const acceptNecessaryOnly = useCallback(() => {
    commitPreferences(defaultCookieConsentPreferences());
  }, [commitPreferences]);

  const savePreferences = useCallback(() => {
    commitPreferences(draftPreferences);
  }, [commitPreferences, draftPreferences]);

  const hasConsent = useCallback(
    (category: "necessary" | CookieConsentOptionalCategory) => {
      if (category === "necessary") return true;
      return Boolean(consent?.preferences[category]);
    },
    [consent],
  );

  const value = useMemo(
    () => ({
      consent,
      draftPreferences,
      hasConsented: Boolean(consent),
      isBannerOpen,
      isPreferencesOpen,
      hasConsent,
      openPreferences,
      closePreferences,
      setDraftPreference,
      acceptAll,
      acceptNecessaryOnly,
      savePreferences,
    }),
    [
      acceptAll,
      acceptNecessaryOnly,
      closePreferences,
      consent,
      draftPreferences,
      hasConsent,
      isBannerOpen,
      isPreferencesOpen,
      openPreferences,
      savePreferences,
      setDraftPreference,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider",
    );
  }
  return context;
}
