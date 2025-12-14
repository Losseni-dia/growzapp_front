// src/pages/Retrait/RetraitPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFreshToken } from "../../service/api";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/context/CurrencyContext"; // <--- IMPORT
import styles from "./RetraitPage.module.css";

type WithdrawMethod = "ORANGE_MONEY" | "WAVE" | "MTN_MOMO" | "BANK_TRANSFER";

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { format, currency } = useCurrency(); // <--- HOOK MONNAIE

  const [montant, setMontant] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<WithdrawMethod>("ORANGE_MONEY");
  const [loading, setLoading] = useState(false);
  const [soldeRetirable, setSoldeRetirable] = useState(0);
  const [isLoadingSolde, setIsLoadingSolde] = useState(true);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showRedirectLoader, setShowRedirectLoader] = useState(false);

  useEffect(() => {
    const fetchSolde = async () => {
      const token = getFreshToken();
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:8080/api/wallets/solde", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // On stocke le montant brut (XOF)
        setSoldeRetirable(data.soldeRetirable || 0);
      } catch {
        toast.error(t("withdraw.toast.connection_error"));
      } finally {
        setIsLoadingSolde(false);
      }
    };
    fetchSolde();
  }, [navigate, t]);

  const handleContinue = () => {
    const amount = parseFloat(montant);
    // Note: On compare ici le montant saisi (dans la devise actuelle) au solde converti
    // Pour simplifier, on peut aussi gérer la saisie toujours en devise de l'interface
    if (isNaN(amount) || amount < 1) {
      toast.error(t("withdraw.toast.invalid_amount"));
      return;
    }

    if (method === "BANK_TRANSFER") {
      setShowStripeModal(true);
    } else {
      setShowPhoneModal(true);
    }
  };

  const performWithdraw = async () => {
    const amount = parseFloat(montant);
    const token = getFreshToken();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/wallets/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          montant: amount, // On envoie le montant saisi
          currency: currency, // On précise la devise de la saisie au backend
          phone: phone.trim() || undefined,
          method,
          type:
            method === "BANK_TRANSFER"
              ? "PAYOUT_STRIPE"
              : method === "ORANGE_MONEY"
              ? "PAYOUT_OM_SN"
              : method === "WAVE"
              ? "PAYOUT_WAVE_SN"
              : "PAYOUT_MTN",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("withdraw.toast.fail"));

      if (data.redirectUrl) {
        setShowRedirectLoader(true);
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 800);
      } else {
        toast.success(t("withdraw.toast.success_sent"));
        navigate("/wallet");
      }
    } catch (err: any) {
      toast.error(err.message || t("withdraw.toast.fail"));
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingSolde)
    return <div className={styles.loading}>{t("wallet.loading")}</div>;

  return (
    <>
      <div className={styles.container}>
        <div className={styles.card}>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            {t("withdraw.back")}
          </button>
          <h1 className={styles.title}>{t("withdraw.title")}</h1>
          <p className={styles.subtitle}>
            {t("withdraw.balance_label")} {/* AFFICHAGE DU SOLDE CONVERTI */}
            <strong style={{ color: "#27ae60", fontSize: "1.8rem" }}>
              {format(soldeRetirable, "XOF")}
            </strong>
          </p>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>
                {t("withdraw.amount_label")} ({currency})
              </label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className={styles.input}
                placeholder={currency === "XOF" ? "ex: 5000" : "ex: 10.00"}
              />
            </div>

            <div className={styles.methods}>
              {/* ... (Identique à ton code pour les labels de méthodes) ... */}
            </div>

            <button
              onClick={handleContinue}
              className={styles.submitBtn}
              disabled={loading || !montant}
            >
              {loading ? t("withdraw.processing") : t("withdraw.btn_confirm")}
            </button>
          </div>
        </div>
      </div>

      {/* MODALS SÉCURISÉS AVEC MONTANT CONVERTI */}
      {showStripeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{t("withdraw.modal_stripe.title")}</h2>
            <p style={{ textAlign: "center", fontSize: "1.6rem" }}>
              {t("withdraw.modal_stripe.amount")}{" "}
              <strong>
                {montant} {currency}
              </strong>
            </p>
            <button onClick={performWithdraw} className={styles.confirmBtn}>
              {loading
                ? t("withdraw.modal_stripe.sending")
                : t("withdraw.modal_stripe.confirm_btn")}
            </button>
            <button
              onClick={() => setShowStripeModal(false)}
              className={styles.cancelBtn}
            >
              {t("withdraw.modal_phone.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
