import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../service/api";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next"; // Import i18n
import { format } from "date-fns";
import { fr, enUS, es } from "date-fns/locale"; // Import locales
import styles from "./VerifierContrat.module.css";
import {
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiShield,
  FiArrowLeft,
} from "react-icons/fi";

interface ContratPublic {
  valide: boolean;
  numeroContrat: string;
  projet: string;
  investisseur: string;
  montant: number;
  date: string;
}

export default function VerifierContrat() {
  const { t, i18n } = useTranslation(); // Hook traduction
  const { code } = useParams<{ code?: string }>();

  // Gestion de la date locale
  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const [input, setInput] = useState(code?.toUpperCase() || "");
  const [result, setResult] = useState<ContratPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const verifier = async () => {
    const numero = input.trim().toUpperCase();
    if (!numero) {
      toast.error(t("verify_contract.toast_empty"));
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await api.get<ContratPublic>(
        `/api/contrats/public/verifier/${numero}`
      );
      setResult(res);
      toast.success(t("verify_contract.toast_success"));
    } catch (err) {
      setResult(null);
      toast.error(t("verify_contract.toast_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) verifier();
  }, [code]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* En-tête */}
          <div className={styles.header}>
            <FiShield size={60} />
            <h1>{t("verify_contract.title")}</h1>
            <p>{t("verify_contract.subtitle")}</p>
          </div>

          {/* Barre de recherche */}
          <div className={styles.search}>
            <div className={styles.inputWrapper}>
              <FiSearch size={28} />
              <input
                type="text"
                placeholder={t("verify_contract.placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && verifier()}
              />
            </div>
            <button
              onClick={verifier}
              disabled={loading}
              className={styles.btn}
            >
              {loading
                ? t("verify_contract.btn_verifying")
                : t("verify_contract.btn_verify")}
            </button>
          </div>

          {/* Résultat */}
          {searched && (
            <div className={styles.result}>
              {result ? (
                <div className={styles.success}>
                  <FiCheckCircle size={100} />
                  <h2>{t("verify_contract.success_title")}</h2>

                  <div className={styles.details}>
                    <p>
                      <strong>{t("verify_contract.label_contract_no")}</strong>{" "}
                      {result.numeroContrat}
                    </p>
                    <p>
                      <strong>{t("verify_contract.label_project")}</strong>{" "}
                      {result.projet}
                    </p>
                    <p>
                      <strong>{t("verify_contract.label_investor")}</strong>{" "}
                      {result.investisseur}
                    </p>
                    <p>
                      <strong>{t("verify_contract.label_amount")}</strong>{" "}
                      {result.montant.toLocaleString(i18n.language)} FCFA
                    </p>
                    <p>
                      <strong>{t("verify_contract.label_date")}</strong>{" "}
                      {format(new Date(result.date), "dd MMMM yyyy", {
                        locale: currentLocale,
                      })}
                    </p>
                  </div>

                  <div className={styles.qr}>
                    <QRCodeSVG
                      value={window.location.href}
                      size={180}
                      fgColor="#1B5E20"
                    />
                    <small>{t("verify_contract.qr_hint")}</small>
                  </div>
                </div>
              ) : (
                <div className={styles.error}>
                  <FiXCircle size={100} />
                  <h2>{t("verify_contract.error_title")}</h2>
                  <p>{t("verify_contract.error_desc")}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.logo}>
              <h3>growzapp</h3>
            </div>
            <p>{t("verify_contract.footer_text")}</p>
            <Link to="/" className={styles.back}>
              <FiArrowLeft /> {t("verify_contract.back_home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
