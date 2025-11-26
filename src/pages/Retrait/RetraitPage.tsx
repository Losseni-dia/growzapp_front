// src/pages/withdraw/WithdrawPage.tsx → VERSION 100% PARFAITE & FINALE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFreshToken } from "../../service/api";
import styles from "./RetraitPage.module.css";

type WithdrawMethod = "ORANGE_MONEY" | "WAVE" | "MTN_MOMO" | "BANK_TRANSFER";

export default function WithdrawPage() {
  const navigate = useNavigate();

  const [montant, setMontant] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<WithdrawMethod>("ORANGE_MONEY");
  const [loading, setLoading] = useState(false);
  const [soldeRetirable, setSoldeRetirable] = useState(0);
  const [isLoadingSolde, setIsLoadingSolde] = useState(true);

  // Modals
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showRedirectLoader, setShowRedirectLoader] = useState(false); // LE LOADER

  // Chargement du solde
  useEffect(() => {
    const fetchSolde = async () => {
      const token = getFreshToken();
      if (!token) {
        toast.error("Session expirée");
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8080/api/wallets/solde", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSoldeRetirable(data.soldeRetirable || 0);
      } catch {
        toast.error("Erreur de connexion");
      } finally {
        setIsLoadingSolde(false);
      }
    };
    fetchSolde();
  }, [navigate]);

  const handleContinue = () => {
    const amount = parseFloat(montant);
    if (isNaN(amount) || amount < 5 || amount > soldeRetirable) {
      toast.error(
        `Montant invalide. Min: 5 € • Max: ${soldeRetirable.toFixed(2)} €`
      );
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
   if (!token) {
     navigate("/login");
     return;
   }

   setLoading(true);
   try {
     const res = await fetch("http://localhost:8080/api/wallets/withdraw", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify({
         montant: amount,
         phone: phone.trim() || undefined,
         method,
         // CORRIGÉ ICI :
         type:
           method === "BANK_TRANSFER"
             ? "PAYOUT_STRIPE" // Stripe = virement bancaire
             : method === "ORANGE_MONEY"
             ? "PAYOUT_OM_SN"
             : method === "WAVE"
             ? "PAYOUT_WAVE_SN"
             : "PAYOUT_MTN", // MTN MoMo
       }),
     });

     const data = await res.json();
     if (!res.ok) throw new Error(data.message || "Erreur lors du retrait");

     if (data.redirectUrl) {
       setShowRedirectLoader(true);
       toast.success("Redirection vers Stripe...");
       setTimeout(() => {
         window.location.href = data.redirectUrl;
       }, 800);
     } else {
       toast.success(data.message || "Retrait envoyé avec succès !");
       navigate("/wallet");
     }
   } catch (err: any) {
     toast.error(err.message || "Échec du retrait");
   } finally {
     setLoading(false);
     setShowPhoneModal(false);
     setShowStripeModal(false);
   }
 };

  if (isLoadingSolde) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>Chargement du solde...</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.card}>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            Retour
          </button>

          <h1 className={styles.title}>Retirer mes gains</h1>
          <p className={styles.subtitle}>
            Solde retirable :{" "}
            <strong style={{ color: "#27ae60", fontSize: "1.8rem" }}>
              {soldeRetirable.toFixed(2)} €
            </strong>
          </p>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Montant à retirer</label>
              <input
                type="number"
                placeholder="Ex: 50"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className={styles.input}
                min="5"
                step="0.01"
              />
              <small>Minimum 5 € • Maximum {soldeRetirable.toFixed(2)} €</small>
            </div>

            <div className={styles.inputGroup}>
              <label>Moyen de retrait</label>
              <div className={styles.methods}>
                <label className={styles.method}>
                  <input
                    type="radio"
                    name="method"
                    value="ORANGE_MONEY"
                    checked={method === "ORANGE_MONEY"}
                    onChange={(e) =>
                      setMethod(e.target.value as WithdrawMethod)
                    }
                  />
                  <span className={styles.methodLabel}>
                    <img src="/icons/orange-money.png" alt="Orange Money" />
                    Orange Money
                  </span>
                </label>
                <label className={styles.method}>
                  <input
                    type="radio"
                    name="method"
                    value="WAVE"
                    checked={method === "WAVE"}
                    onChange={(e) =>
                      setMethod(e.target.value as WithdrawMethod)
                    }
                  />
                  <span className={styles.methodLabel}>
                    <img src="/icons/wave.png" alt="Wave" />
                    Wave
                  </span>
                </label>
                <label className={styles.method}>
                  <input
                    type="radio"
                    name="method"
                    value="MTN_MOMO"
                    checked={method === "MTN_MOMO"}
                    onChange={(e) =>
                      setMethod(e.target.value as WithdrawMethod)
                    }
                  />
                  <span className={styles.methodLabel}>
                    <img src="/icons/mtn.png" alt="MTN MoMo" />
                    MTN MoMo
                  </span>
                </label>
                <label className={styles.method}>
                  <input
                    type="radio"
                    name="method"
                    value="BANK_TRANSFER"
                    checked={method === "BANK_TRANSFER"}
                    onChange={(e) =>
                      setMethod(e.target.value as WithdrawMethod)
                    }
                  />
                  <span className={styles.methodLabel}>
                    <img src="/icons/bank.png" alt="Carte bancaire" />
                    Carte bancaire
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={
                loading ||
                !montant ||
                parseFloat(montant) < 5 ||
                parseFloat(montant) > soldeRetirable
              }
              className={styles.submitBtn}
            >
              {loading ? "Traitement..." : "Confirmer le retrait"}
            </button>

            <div className={styles.info}>
              <p>Frais : 2% + 100 FCFA</p>
              <p>Retrait reçu sous 24h ouvrées</p>
            </div>
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
                  onClick={performWithdraw}
                  disabled={!phone.trim() || loading}
                  className={styles.confirmBtn}
                >
                  {loading ? "Envoi..." : "Confirmer"}
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
              <h2>Retrait par carte bancaire</h2>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "1.4rem",
                  margin: "1rem 0",
                }}
              >
                Montant : <strong>{parseFloat(montant).toFixed(2)} €</strong>
              </p>
              <p
                style={{
                  color: "#666",
                  fontSize: "0.95rem",
                  marginBottom: "2rem",
                }}
              >
                Tu recevras l’argent sous 1 à 2 jours ouvrés
              </p>
              <button
                onClick={performWithdraw}
                disabled={loading}
                className={styles.confirmBtn}
                style={{ width: "100%", padding: "1.3rem", fontSize: "1.2rem" }}
              >
                {loading ? "Envoi en cours..." : "Confirmer le retrait"}
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

      {/* LOADER REDIRECTION — MAGNIFIQUE */}
      {showRedirectLoader && (
        <div className={styles.redirectLoaderOverlay}>
          <div className={styles.redirectLoader}></div>
          <p className={styles.redirectText}>Redirection sécurisée...</p>
          <p className={styles.redirectSubtext}>Ne ferme pas cette page</p>
        </div>
      )}
    </>
  );
}
