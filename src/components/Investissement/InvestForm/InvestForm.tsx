import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiLock,
  FiAlertTriangle,
  FiShield,
  FiInfo,
  FiArrowRight,
  FiArrowLeft,
  FiSmartphone,
  FiMinus,
  FiPlus,
} from "react-icons/fi";
import styles from "./InvestForm.module.css";
import { api } from "../../../service/Api";
import { useCurrency } from "../../Context/CurrencyContext";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface InvestFormProps {
  projet: {
    id: number;
    libelle: string;
    prixUnePart: number;
    partsDisponible: number;
    partsPrises: number;
    currencyCode?: string;
    slug?: string;
  };
  onSuccess?: () => void;
}

type Step = "parts" | "payment" | "confirm";
type Method = "wallet" | "mobile" | "card";

export default function InvestForm({ projet, onSuccess }: InvestFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [step, setStep] = useState<Step>("parts");
  const [parts, setParts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<Method>("wallet");
  const [soldeDisponible, setSoldeDisponible] = useState(0);
  const [loadingSolde, setLoadingSolde] = useState(true);
  const [consentRisks, setConsentRisks] = useState(false);
  const [consentInsurance, setConsentInsurance] = useState(false);
  const [mobileOperator, setMobileOperator] = useState<
    "orange" | "mtn" | "wave"
  >("orange");

  const isKycVerified = user?.kycStatus === "VALIDE";
  const maxParts = Math.max(0, projet.partsDisponible - projet.partsPrises);
  const total = parts * projet.prixUnePart;
  const currency = projet.currencyCode || "XOF";

  useEffect(() => {
    if (!user || !isKycVerified) {
      setLoadingSolde(false);
      return;
    }
    api
      .get<any>(`${BACKEND_URL}/api/wallets/solde`)
      .then((data) => {
        const solde =
          typeof data === "object"
            ? (data?.data?.soldeDisponible ?? data?.soldeDisponible ?? 0)
            : (data ?? 0);
        setSoldeDisponible(Number(solde));
      })
      .catch(() => setSoldeDisponible(0))
      .finally(() => setLoadingSolde(false));
  }, [user, isKycVerified]);

  const handleNextToPayment = () => {
    if (!isKycVerified) {
      toast.error("Vérification KYC requise");
      return;
    }
    if (parts < 1 || parts > maxParts) {
      toast.error("Nombre de parts invalide");
      return;
    }
    setStep("payment");
  };

  const handleNextToConfirm = () => {
    if (selectedMethod === "wallet" && total > soldeDisponible) {
      toast.error("Solde insuffisant");
      return;
    }
    setStep("confirm");
  };

  const handleFinalConfirm = async () => {
    if (!consentRisks || !consentInsurance) {
      toast.error("Veuillez accepter les deux conditions.");
      return;
    }
    setLoading(true);
    const consentDate = new Date().toISOString();
    const payload = {
      nombrePartsPris: parts,
      riskWarningAcceptedAt: consentDate,
      insuranceTermsAcceptedAt: consentDate,
      method: selectedMethod,
    };

    try {
      if (selectedMethod === "wallet") {
        await api.post(
          `${BACKEND_URL}/api/projets/${projet.id}/investir`,
          payload,
        );
        toast.success("Investissement validé ! Contrat envoyé par email.");
        onSuccess?.();
      } else if (selectedMethod === "mobile") {
        toast.loading("Redirection vers PayDunya...");
        const response = await api.post<{ redirectUrl: string }>(
          `${BACKEND_URL}/api/projets/${projet.id}/investir-mobile`,
          {
            nombreParts: parts,
            operator: mobileOperator,
          },
        );
        if (response.redirectUrl) window.location.href = response.redirectUrl;
        else toast.error("Erreur de redirection Mobile Money");
      } else if (selectedMethod === "card") {
        toast.loading("Redirection vers Stripe...");
        const response = await api.post<{ redirectUrl: string }>(
          `${BACKEND_URL}/api/projets/${projet.id}/investir-carte`,
          { ...payload, nombreParts: parts },
        );
        if (response.redirectUrl) window.location.href = response.redirectUrl;
        else toast.error("Erreur de redirection Stripe");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // ── BLOC KYC ──────────────────────────────────────────────────────────────
  if (!isKycVerified) {
    return (
      <div className={styles.kycBlock}>
        <FiAlertTriangle size={32} className={styles.kycIcon} />
        <div>
          <strong>KYC requis pour investir</strong>
          <p>{t("kyc.pending_action_hint")}</p>
          <Link to="/profile/kyc" className={styles.kycLink}>
            Compléter mon KYC →
          </Link>
        </div>
      </div>
    );
  }

  if (maxParts === 0) {
    return (
      <div className={styles.soldOut}>
        <FiCheckCircle size={28} /> Toutes les parts ont été vendues
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* ── STEPPER ───────────────────────────────────────────── */}
      <div className={styles.stepper}>
        {(["parts", "payment", "confirm"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`${styles.stepItem} ${step === s ? styles.stepActive : ""} ${
              (step === "payment" && i === 0) || (step === "confirm" && i < 2)
                ? styles.stepDone
                : ""
            }`}
          >
            <div className={styles.stepDot}>{i + 1}</div>
            <span>
              {s === "parts"
                ? "Parts"
                : s === "payment"
                  ? "Paiement"
                  : "Confirmer"}
            </span>
          </div>
        ))}
      </div>

      {/* ══════════ ÉTAPE 1 — PARTS ══════════════════════════════ */}
      {step === "parts" && (
        <div className={styles.stepContent}>
          <h3 className={styles.stepTitle}>
            Combien de parts souhaitez-vous ?
          </h3>

          <div className={styles.priceTag}>
            <span>Prix unitaire</span>
            <strong>{format(projet.prixUnePart, currency)}</strong>
          </div>

          <div className={styles.partsSelector}>
            <button
              type="button"
              className={styles.partsBtn}
              onClick={() => setParts((p) => Math.max(1, p - 1))}
              disabled={parts <= 1}
            >
              <FiMinus />
            </button>
            <input
              type="number"
              min={1}
              max={maxParts}
              value={parts}
              onChange={(e) =>
                setParts(
                  Math.max(
                    1,
                    Math.min(maxParts, parseInt(e.target.value) || 1),
                  ),
                )
              }
              className={styles.partsInput}
            />
            <button
              type="button"
              className={styles.partsBtn}
              onClick={() => setParts((p) => Math.min(maxParts, p + 1))}
              disabled={parts >= maxParts}
            >
              <FiPlus />
            </button>
          </div>

          <p className={styles.partsAvail}>{maxParts} parts disponibles</p>

          <div className={styles.totalBox}>
            <FiLock />
            <div>
              <span>Montant total</span>
              <strong>{format(total, currency)}</strong>
            </div>
          </div>

          <button className={styles.btnNext} onClick={handleNextToPayment}>
            Choisir le moyen de paiement <FiArrowRight />
          </button>
        </div>
      )}

      {/* ══════════ ÉTAPE 2 — PAIEMENT ═══════════════════════════ */}
      {step === "payment" && (
        <div className={styles.stepContent}>
          <h3 className={styles.stepTitle}>
            Choisissez votre moyen de paiement
          </h3>

          <div className={styles.recap}>
            <span>
              {parts} part{parts > 1 ? "s" : ""} ×{" "}
              {format(projet.prixUnePart, currency)}
            </span>
            <strong>{format(total, currency)}</strong>
          </div>

          <div className={styles.methods}>
            {/* WALLET */}
            <button
              type="button"
              onClick={() => setSelectedMethod("wallet")}
              className={`${styles.method} ${selectedMethod === "wallet" ? styles.methodActive : ""}`}
            >
              <div
                className={styles.methodIcon}
                style={{ background: "#e8f5e9" }}
              >
                <FiDollarSign color="#1B5E20" size={22} />
              </div>
              <div className={styles.methodInfo}>
                <strong>Portefeuille GrowzApp</strong>
                <span>
                  {loadingSolde
                    ? "Chargement..."
                    : `${format(soldeDisponible, "XOF")} disponible`}
                  {!loadingSolde && total > soldeDisponible && (
                    <em className={styles.insufficient}>
                      {" "}
                      — Solde insuffisant
                    </em>
                  )}
                </span>
              </div>
              {selectedMethod === "wallet" && (
                <FiCheckCircle className={styles.methodCheck} />
              )}
            </button>

            {/* MOBILE MONEY */}
            <button
              type="button"
              onClick={() => setSelectedMethod("mobile")}
              className={`${styles.method} ${selectedMethod === "mobile" ? styles.methodActive : ""}`}
            >
              <div
                className={styles.methodIcon}
                style={{ background: "#fff3e0" }}
              >
                <FiSmartphone color="#e65100" size={22} />
              </div>
              <div className={styles.methodInfo}>
                <strong>Mobile Money</strong>
                <span>Orange Money · MTN MoMo · Wave</span>
              </div>
              {selectedMethod === "mobile" && (
                <FiCheckCircle className={styles.methodCheck} />
              )}
            </button>

            {/* Mobile Money détails */}
            {selectedMethod === "mobile" && (
              <div className={styles.mobileDetails}>
                <div className={styles.operatorRow}>
                  {(
                    [
                      { key: "orange", label: "🟠 Orange Money" },
                      { key: "mtn", label: "🟡 MTN MoMo" },
                      { key: "wave", label: "🔵 Wave" },
                    ] as const
                  ).map((op) => (
                    <button
                      key={op.key}
                      type="button"
                      onClick={() => setMobileOperator(op.key)}
                      className={`${styles.operatorBtn} ${mobileOperator === op.key ? styles.operatorActive : ""}`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CARTE BANCAIRE */}
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`${styles.method} ${selectedMethod === "card" ? styles.methodActive : ""}`}
            >
              <div
                className={styles.methodIcon}
                style={{ background: "#e3f2fd" }}
              >
                <FiCreditCard color="#1565c0" size={22} />
              </div>
              <div className={styles.methodInfo}>
                <strong>Carte bancaire</strong>
                <span>Visa · Mastercard — via Stripe</span>
              </div>
              {selectedMethod === "card" && (
                <FiCheckCircle className={styles.methodCheck} />
              )}
            </button>
          </div>

          <div className={styles.btnRow}>
            <button className={styles.btnBack} onClick={() => setStep("parts")}>
              <FiArrowLeft /> Retour
            </button>
            <button className={styles.btnNext} onClick={handleNextToConfirm}>
              Continuer <FiArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ÉTAPE 3 — CONFIRMATION ═══════════════════════ */}
      {step === "confirm" && (
        <div className={styles.stepContent}>
          <div className={styles.confirmHeader}>
            <FiShield size={32} className={styles.shieldIcon} />
            <h3>Confirmation de l'investissement</h3>
          </div>

          <div className={styles.confirmSummary}>
            <div className={styles.confirmRow}>
              <span>Projet</span>
              <strong>{projet.libelle}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Parts</span>
              <strong>{parts}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Moyen de paiement</span>
              <strong>
                {selectedMethod === "wallet"
                  ? "Portefeuille GrowzApp"
                  : selectedMethod === "mobile"
                    ? `Mobile Money (${mobileOperator === "orange" ? "Orange Money" : mobileOperator === "mtn" ? "MTN MoMo" : "Wave"})`
                    : "Carte bancaire (Stripe)"}
              </strong>
            </div>
            <div className={`${styles.confirmRow} ${styles.confirmTotal}`}>
              <span>Total</span>
              <strong>{format(total, currency)}</strong>
            </div>
          </div>

          <div className={styles.checklist}>
            <label className={styles.checkItem}>
              <input
                type="checkbox"
                checked={consentRisks}
                onChange={(e) => setConsentRisks(e.target.checked)}
              />
              <span>
                J'ai pris connaissance des{" "}
                <strong>risques de perte en capital</strong> et d'illiquidité
                liés à cet investissement.
              </span>
            </label>
            <label className={styles.checkItem}>
              <input
                type="checkbox"
                checked={consentInsurance}
                onChange={(e) => setConsentInsurance(e.target.checked)}
              />
              <span>
                Je reconnais bénéficier du <strong>monitoring GrowzApp</strong>{" "}
                et de la garantie assurantielle partielle selon les CGV.
              </span>
            </label>
          </div>

          <div className={styles.auditNote}>
            <FiInfo size={16} />
            <span>
              Une signature électronique horodatée sera générée. Votre contrat
              vous sera envoyé par email.
            </span>
          </div>

          <div className={styles.btnRow}>
            <button
              className={styles.btnBack}
              onClick={() => setStep("payment")}
            >
              <FiArrowLeft /> Retour
            </button>
            <button
              className={styles.btnConfirm}
              disabled={!consentRisks || !consentInsurance || loading}
              onClick={handleFinalConfirm}
            >
              {loading ? "Traitement..." : "Confirmer l'investissement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
