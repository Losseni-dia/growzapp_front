import { createContext, ReactNode, useContext, useState } from "react";

export interface CookieConsent {
  essential: true;
  chat: boolean;
  timestamp: string;
  version: number;
}

const STORAGE_KEY = "growzapp_cookie_consent";
// Incrémenter si la liste des catégories de cookies change — force les
// visiteurs ayant déjà répondu à se reprononcer sur le nouveau choix.
const CONSENT_VERSION = 1;

interface CookieConsentContextType {
  consent: CookieConsent | null;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (chat: boolean) => void;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

function loadConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => loadConsent());

  const persist = (chat: boolean) => {
    const value: CookieConsent = {
      essential: true,
      chat,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setConsent(value);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        acceptAll: () => persist(true),
        rejectNonEssential: () => persist(false),
        savePreferences: (chat: boolean) => persist(chat),
        resetConsent: () => {
          localStorage.removeItem(STORAGE_KEY);
          setConsent(null);
        },
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextType {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
