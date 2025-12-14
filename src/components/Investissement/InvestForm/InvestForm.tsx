// src/components/Investissement/InvestForm/InvestForm.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiDollarSign,
  FiSmartphone,
  FiCreditCard,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";
import styles from "./InvestForm.module.css";
import { api } from "../../../service/api";
import { useCurrency } from "../../context/CurrencyContext"; // IMPORT CONTEXT

const BACKEND_URL = "http://localhost:8080";

interface InvestFormProps {
  projet: {
    id: number;
    libelle: string;
    prixUnePart: number;
    partsDisponible: number;
    partsPrises: number;
    currencyCode?: string; // Optionnel selon ton DTO
  };
  onSuccess?: () => void;
}

export default function InvestForm({ projet, onSuccess }: InvestFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { format } = useCurrency(); // HOOK MONNAIE

  const [parts, setParts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<
    "wallet" | "mobile" | "card"
  >("wallet");

  const [soldeDisponible, setSoldeDisponible] = useState(0);
  const [loadingSolde, setLoadingSolde] = useState(true);

  const maxParts = projet.partsDisponible - projet.partsPrises;
  const total = parts * projet.prixUnePart;

  useEffect(() => {
    if (!user) {
      setLoadingSolde(false);
      return;
    }

    setLoadingSolde(true);
    api
      .get<any>(`${BACKEND_URL}/api/wallets/solde`)
      .then((data) => {
        const solde =
          typeof data === "object"
            ? data?.data?.soldeDisponible ?? data?.soldeDisponible ?? data ?? 0
            : data ?? 0;
        setSoldeDisponible(Number(solde));
      })
      .catch(() => {
        toast.error(t("invest_form.messages.error_balance"));
        setSoldeDisponible(0);
      })
      .finally(() => setLoadingSolde(false));
  }, [user, t]);

  const handleSubmit = async () => {
    if (parts < 1 || parts > maxParts) {
      toast.error(t("invest_form.messages.invalid_shares"));
      return;
    }

    if (selectedMethod === "wallet" && total > soldeDisponible) {
      toast.error(t("invest_form.messages.insufficient_balance"));
      return;
    }

    setLoading(true);

    try {
      if (selectedMethod === "wallet") {
        await api.post(`${BACKEND_URL}/api/projets/${projet.id}/investir`, {
          nombrePartsPris: parts,
        });
        toast.success(t("invest_form.messages.success_wallet"));
        onSuccess?.();
      } else if (selectedMethod === "mobile") {
        toast.error(t("invest_form.messages.mobile_dev"));
      } else if (selectedMethod === "card") {
        toast.loading(t("invest_form.messages.stripe_redirect"));

        const response = await api.post<{ redirectUrl: string }>(
          `${BACKEND_URL}/api/projets/${projet.id}/investir-carte`,
          { nombreParts: parts }
        );

        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else {
          toast.error(t("invest_form.messages.error_url"));
        }
      }
    } catch (err: any) {
      toast.error(err.message || t("invest_form.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        {t("invest_form.invest_in", { name: projet.libelle })}
      </h3>

      <div className={styles.info}>
        <p>
          {t("invest_form.price_per_share")} :{" "}
          <strong>
            {format(projet.prixUnePart, projet.currencyCode || "XOF")}
          </strong>
        </p>
        <p>
          {t("invest_form.available_shares")} : <strong>{maxParts}</strong>
        </p>
      </div>

      <div className={styles.inputGroup}>
        <label>{t("invest_form.number_of_shares")}</label>
        <input
          type="number"
          min="1"
          max={maxParts}
          value={parts}
          onChange={(e) =>
            setParts(
              Math.max(1, Math.min(maxParts, parseInt(e.target.value) || 1))
            )
          }
          disabled={loading}
          className={styles.input}
        />
      </div>

      <div className={styles.totalBox}>
        <FiLock className={styles.lockIcon} />
        <div>
          <div className={styles.totalLabel}>
            {t("invest_form.locked_amount")}
          </div>
          <div className={styles.totalAmount}>
            {format(total, projet.currencyCode || "XOF")}
          </div>
        </div>
      </div>

      <div className={styles.paymentMethods}>
        <button
          type="button"
          onClick={() => setSelectedMethod("wallet")}
          className={`${styles.method} ${
            selectedMethod === "wallet" ? styles.active : ""
          }`}
        >
          <FiDollarSign />
          <div className={styles.methodText}>
            <strong>{t("invest_form.methods.wallet_title")}</strong>
            <small>
              {loadingSolde
                ? t("invest_form.messages.loading_balance")
                : t("invest_form.methods.wallet_available", {
                    amount: format(soldeDisponible, "XOF"),
                  })}
            </small>
          </div>
          {selectedMethod === "wallet" && (
            <FiCheckCircle className={styles.check} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod("mobile")}
          className={`${styles.method} ${
            selectedMethod === "mobile" ? styles.active : ""
          }`}
        >
          <FiSmartphone />
          <div className={styles.methodText}>
            <strong>{t("invest_form.methods.mobile_title")}</strong>
            <small>{t("invest_form.methods.mobile_subtitle")}</small>
          </div>
          {selectedMethod === "mobile" && (
            <FiCheckCircle className={styles.check} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod("card")}
          className={`${styles.method} ${
            selectedMethod === "card" ? styles.active : ""
          }`}
        >
          <FiCreditCard />
          <div className={styles.methodText}>
            <strong>{t("invest_form.methods.card_title")}</strong>
            <small>{t("invest_form.methods.card_subtitle")}</small>
          </div>
          {selectedMethod === "card" && (
            <FiCheckCircle className={styles.check} />
          )}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || maxParts <= 0}
        className={styles.submitBtn}
      >
        {loading
          ? t("invest_form.buttons.processing")
          : t(`invest_form.buttons.pay_${selectedMethod}`)}
      </button>

      <p className={styles.hint}>{t("invest_form.hint")}</p>
    </div>
  );
}
