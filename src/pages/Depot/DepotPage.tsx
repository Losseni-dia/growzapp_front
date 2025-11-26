// src/pages/deposit/DepositPage.tsx → VERSION 100% PARFAITE & FINALE
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFreshToken } from "../../service/api";
import styles from "./DepotPage.module.css";

type DepositMethod = "STRIPE_CARD" | "ORANGE_MONEY" | "WAVE" | "MTN_MOMO";

export default function DepositPage() {
  const navigate = useNavigate();
  const [montant, setMontant] = useState("");
  const [method, setMethod] = useState<DepositMethod>("STRIPE_CARD");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showRedirectLoader, setShowRedirectLoader] = useState(false); // LE LOADER

  const handleContinue = () => {
    const amount = parseFloat(montant);
    if (isNaN(amount) || amount < 5) {
      toast.error("Montant minimum : 5 €");
      return;
    }

    if (method === "STRIPE_CARD") {
      setShowStripeModal(true);
    } else {
      setShowPhoneModal(true);
    }
  };

  const confirmWithPhone = async () => {
    if (!phone.trim()) {
      toast.error("Numéro requis");
      return;
    }
    await performDeposit();
  };

  const performDeposit = async () => {
    const amount = parseFloat(montant);
    const token = getFreshToken();
    if (!token) {
      toast.error("Session expirée");
      navigate("/login");
      return;
    }

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
          method,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur dépôt");

      if (data.redirectUrl) {
        setShowRedirectLoader(true);
        toast.success("Redirection sécurisée...");
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 800);
      } else {
        toast.success("Dépôt réussi !");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Échec du dépôt");
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
            Retour
          </button>
          <h1 className={styles.title}>Déposer de l'argent</h1>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Montant (€)</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="Minimum 5"
                min="5"
                step="0.01"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Méthode</label>
              <div className={styles.methods}>
                {["STRIPE_CARD", "ORANGE_MONEY", "WAVE", "MTN_MOMO"].map(
                  (m) => (
                    <label key={m} className={styles.method}>
                      <input
                        type="radio"
                        name="method"
                        value={m}
                        checked={method === m}
                        onChange={(e) =>
                          setMethod(e.target.value as DepositMethod)
                        }
                      />
                      <span className={styles.methodLabel}>
                        <img
                          src={`/icons/${m
                            .toLowerCase()
                            .replace("_", "-")}.png`}
                          alt={m}
                          width={36}
                          height={36}
                        />
                        {m === "STRIPE_CARD"
                          ? "Carte bancaire"
                          : m.replace("_", " ")}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={loading || !montant || parseFloat(montant) < 5}
              className={styles.submitBtn}
            >
              {loading ? "Traitement..." : "Continuer"}
            </button>
          </div>
        </div>

        {/* MODAL TÉLÉPHONE */}
        {showPhoneModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowPhoneModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>Numéro de téléphone</h2>
              <p>Pour {method.replace("_", " ")}</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 89 01 23 45"
                className={styles.input}
                autoFocus
              />
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className={styles.cancelBtn}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmWithPhone}
                  disabled={!phone.trim() || loading}
                  className={styles.confirmBtn}
                >
                  {loading ? "Envoi..." : "Confirmer le dépôt"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CARTE BANCAIRE */}
        {showStripeModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowStripeModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>Paiement par carte</h2>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "1.6rem",
                  margin: "1.5rem 0",
                }}
              >
                Montant : <strong>{parseFloat(montant).toFixed(2)} €</strong>
              </p>
              <button
                onClick={performDeposit}
                disabled={loading}
                className={styles.confirmBtn}
                style={{
                  width: "100%",
                  padding: "1.4rem",
                  fontSize: "1.25rem",
                }}
              >
                {loading ? "Redirection vers Stripe..." : "Payer avec carte"}
              </button>
              <button
                onClick={() => setShowStripeModal(false)}
                className={styles.cancelBtn}
                style={{ marginTop: "1rem" }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOADER REDIRECTION */}
      {showRedirectLoader && (
        <div className={styles.redirectLoaderOverlay}>
          <div className={styles.redirectLoader}></div>
          <p className={styles.redirectText}>Redirection sécurisée...</p>
          <p className={styles.redirectSubtext}>
            Connexion à la banque en cours
          </p>
        </div>
      )}
    </>
  );
}
