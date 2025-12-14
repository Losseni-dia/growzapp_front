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
import { api } from "../../service/api";

// Stockage hors React pour garantir la stabilité
let CACHED_RATES: Record<string, number> = { XOF: 1, EUR: 0.0015, USD: 0.0016 };

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  format: (amount: number, fromCurrency?: string) => string;
  rates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem("user_currency") || "XOF"
  );
  const [rates, setRates] = useState<Record<string, number>>(CACHED_RATES);
  const isFetching = useRef(false);

  useEffect(() => {
    if (isFetching.current) return;
    isFetching.current = true;

    api
      .get<Record<string, number>>("/api/currencies/rates")
      .then((data) => {
        if (data && typeof data === "object") {
          CACHED_RATES = data;
          setRates(data);
        }
      })
      .catch((err) => console.warn("Utilisation des taux par défaut", err));
  }, []);

  const changeCurrency = useCallback((code: string) => {
    if (!code) return;
    setCurrencyState((prev) => {
      if (prev === code) return prev;
      localStorage.setItem("user_currency", code);
      return code;
    });
  }, []);

  const format = useCallback(
    (amount: number, fromCurrency: string = "XOF") => {
      if (amount === undefined || amount === null) return "---";

      const rateSource = CACHED_RATES[fromCurrency] || 1;
      const rateTarget = CACHED_RATES[currency] || 1;
      const convertedAmount = (amount / rateSource) * rateTarget;

      const lang = localStorage.getItem("i18nextLng") || "fr";

      return new Intl.NumberFormat(lang, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: currency === "XOF" ? 0 : 2,
        maximumFractionDigits: currency === "XOF" ? 0 : 2,
      }).format(convertedAmount);
    },
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency: changeCurrency,
      format,
      rates,
    }),
    [currency, rates, format, changeCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook avec sécurité renforcée
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    // Au lieu de throw une erreur qui fait un écran blanc,
    // on renvoie un fallback temporaire si le provider n'est pas prêt
    return {
      currency: "XOF",
      setCurrency: () => {},
      format: (a: number) => a.toString(),
      rates: CACHED_RATES,
    };
  }
  return context;
};
