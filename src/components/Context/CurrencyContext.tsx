// src/context/CurrencyContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { api } from "../../service/Api";

// ── Taux par défaut (fallback si API indisponible) ────────────────────────
// Exprimés en valeur relative à EUR (EUR = 1.0)
// Convertis en valeur relative à XOF pour le calcul interne
let CACHED_RATES: Record<string, number> = {
  EUR: 1.0,
  XOF: 655.957,
  XAF: 655.957,
  USD: 1.08,
  GBP: 0.86,
  MAD: 10.85,
  GHS: 14.5,
  KES: 140.0,
  NGN: 1650.0,
  GNF: 9300.0,
};

// ── Base de conversion : EUR ──────────────────────────────────────────────
// Pour convertir A → B :
// montant_en_EUR = montant_A / rate_A
// montant_B = montant_en_EUR * rate_B

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  format: (amount: number, fromCurrency?: string) => string;
  rates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem("user_currency") || "XOF",
  );
  const [rates, setRates] = useState<Record<string, number>>(CACHED_RATES);
  const isFetching = useRef(false);

  // ── Fetch des taux depuis le backend ─────────────────────────────────────
 useEffect(() => {
   if (isFetching.current) return;
   isFetching.current = true;
   api
     .get<{ success: boolean; message: string; data: Record<string, number> }>(
       "/api/currencies/rates",
     )
     .then((response) => {
       const data = response.data;
       if (data && typeof data === "object") {
         CACHED_RATES = data;
         setRates(data);
       }
     })
     .catch((err) => console.warn("Utilisation des taux par défaut", err));
 }, []);

  // ── Écoute les changements de localStorage (depuis AuthContext au login) ─
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("user_currency");
      if (saved && saved !== currency) {
        setCurrencyState(saved);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [currency]);

  // ── Changement manuel de devise ───────────────────────────────────────────
  const changeCurrency = useCallback((code: string) => {
    if (!code) return;
    setCurrencyState((prev) => {
      if (prev === code) return prev;
      localStorage.setItem("user_currency", code);
      return code;
    });
  }, []);

  // ── Formatage des montants ────────────────────────────────────────────────
  const format = useCallback(
    (amount: number, fromCurrency: string = "XOF") => {
      if (amount === undefined || amount === null) return "---";

      // Conversion : fromCurrency → EUR → currency cible
      const rateSource =
        CACHED_RATES[fromCurrency] ?? CACHED_RATES["XOF"] ?? 655.957;
      const rateTarget = CACHED_RATES[currency] ?? 1;

      // Convertir en EUR d'abord, puis dans la devise cible
      const amountInEUR = amount / rateSource;
      const convertedAmount = amountInEUR * rateTarget;

      // Locale de formatage fixe, indépendante de la langue de l'interface :
      // la devise ne doit pas changer d'apparence quand on change de langue.
      const FORMAT_LOCALE = "fr-FR";

      // Devises sans décimales
      const noDecimals = ["XOF", "XAF", "GNF", "NGN", "KES", "GHS"];
      const decimals = noDecimals.includes(currency) ? 0 : 2;

      return new Intl.NumberFormat(FORMAT_LOCALE, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(convertedAmount);
    },
    [currency],
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency: changeCurrency,
      format,
      rates,
    }),
    [currency, rates, format, changeCurrency],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    return {
      currency: "XOF",
      setCurrency: () => {},
      format: (a: number) => a.toString(),
      rates: CACHED_RATES,
    };
  }
  return context;
};
