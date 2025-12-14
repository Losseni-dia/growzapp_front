// src/components/CurrencySwitcher/CurrencySwitcher.tsx
import { useCurrency } from "../context/CurrencyContext";
import { FiGlobe } from "react-icons/fi";
import styles from "./CurrencySwitcher.module.css";

export default function CurrencySwitcher() {
  const { currency, setCurrency, rates } = useCurrency();

  // Liste des devises disponibles basées sur les taux reçus du backend
  const availableCurrencies = Object.keys(rates);

  return (
    <div className={styles.container}>
      <FiGlobe className={styles.icon} />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className={styles.select}
      >
        {availableCurrencies.map((code) => (
          <option key={code} value={code}>
            {code} {code === "XOF" ? "(FCFA)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
