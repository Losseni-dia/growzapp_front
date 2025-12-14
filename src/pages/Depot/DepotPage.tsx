// src/pages/Depot/DepotPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFreshToken } from "../../service/api";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/context/CurrencyContext"; // <--- IMPORT
import styles from "./DepotPage.module.css";

type DepositMethod = "STRIPE_CARD" | "ORANGE_MONEY" | "WAVE" | "MTN_MOMO";

export default function DepositPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency } = useCurrency(); // <--- ON RÉCUPÈRE LA DEVISE CHOISIE

  const [montant, setMontant] = useState("");
  const [method, setMethod] = useState<DepositMethod>("STRIPE_CARD");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showRedirectLoader, setShowRedirectLoader] = useState(false);

  const handleContinue = () => {
    const amount = parseFloat(montant);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t("deposit.toast.min_error"));
      return;
    }
    if (method === "STRIPE_CARD") setShowStripeModal(true);
    else setShowPhoneModal(true);
  };

  const performDeposit = async () => {
    const amount = parseFloat(montant);
    const token = getFreshToken();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/wallets/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          montant: amount,
          currency: currency, // INDISPENSABLE : Dire au backend si c'est des EUR ou XOF
          method,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("deposit.toast.fail"));

      if (data.redirectUrl) {
        setShowRedirectLoader(true);
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 800);
      } else {
        toast.success(t("deposit.toast.success"));
        navigate("/wallet");
      }
    } catch (err: any) {
      toast.error(err.message || t("deposit.toast.fail"));
    } finally {
      setLoading(false);
      setShowPhoneModal(false);
      setShowStripeModal(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.card}>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            {t("deposit.back")}
          </button>
          <h1 className={styles.title}>{t("deposit.title")}</h1>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>
                {t("deposit.amount_label")} ({currency})
              </label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder={`${t("deposit.min_amount")} ${currency}`}
                className={styles.input}
              />
            </div>

            <div className={styles.methods}>
              {/* ... (Mappage des méthodes avec icônes) ... */}
            </div>

            <button
              onClick={handleContinue}
              className={styles.submitBtn}
              disabled={loading || !montant}
            >
              {loading ? t("deposit.processing") : t("deposit.btn_continue")}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL RÉCAPITULATIF */}
      {showStripeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{t("deposit.modal_stripe.title")}</h2>
            <p
              style={{
                textAlign: "center",
                fontSize: "1.6rem",
                margin: "1.5rem 0",
              }}
            >
              {t("deposit.modal_stripe.amount")}{" "}
              <strong>
                {montant} {currency}
              </strong>
            </p>
            <button onClick={performDeposit} className={styles.confirmBtn}>
              {loading
                ? t("deposit.modal_stripe.redirect")
                : t("deposit.modal_stripe.pay_btn")}
            </button>
            <button
              onClick={() => setShowStripeModal(false)}
              className={styles.cancelBtn}
            >
              {t("deposit.modal_phone.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
