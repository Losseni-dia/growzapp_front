import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../service/api";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import styles from "./VerifierContrat.module.css";
import {
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiShield,
  FiArrowLeft,
  FiLock,
  FiMail,
  FiFileText
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
  const { t, i18n } = useTranslation();
  const { code } = useParams<{ code?: string }>();

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const [formData, setFormData] = useState({
    numero: code?.toUpperCase() || "",
    email: "",
    password: ""
  });
  
  const [result, setResult] = useState<ContratPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "numero" ? value.toUpperCase() : value
    }));
  };

  const verifier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.numero || !formData.email || !formData.password) {
      toast.error(t("verify_contract.toast_empty") || "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await api.post<ContratPublic>(
        `/api/contrats/public/verifier-securise`, 
        formData
      );
      setResult(res);
      toast.success(t("verify_contract.toast_success"));
    } catch (err: any) {
      setResult(null);
      
      // Récupération du message précis envoyé par le backend (ex: tentatives restantes)
      const backendMessage = err.response?.data?.message;
      const status = err.response?.status;

      if (status === 403) {
        // Cas du compte bloqué pour 24h
        toast.error(backendMessage || "Accès bloqué pour 24h", { duration: 5000 });
      } else if (status === 401) {
        // Cas d'erreur mail/pass (L'intercepteur API doit ignorer cette route pour ne pas déconnecter)
        toast.error(backendMessage || "Identifiants incorrects pour ce contrat");
      } else {
        toast.error(t("verify_contract.toast_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) setFormData(prev => ({ ...prev, numero: code.toUpperCase() }));
  }, [code]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <FiShield size={60} />
            <h1>{t("verify_contract.title")}</h1>
            <p>{t("verify_contract.subtitle")}</p>
          </div>

          <form onSubmit={verifier} className={styles.search}>
            <div className={styles.inputWrapper}>
              <FiFileText size={24} className={styles.innerIcon} />
              <input
                name="numero"
                type="text"
                autoComplete="off"
                className={styles.luxuryInput}
                placeholder={t("verify_contract.placeholder")}
                value={formData.numero}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.inputWrapper}>
              <FiMail size={24} className={styles.innerIcon} />
              <input
                name="email"
                type="email"
                autoComplete="email"
                className={styles.luxuryInput}
                placeholder="Email de l'investisseur"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.inputWrapper}>
              <FiLock size={24} className={styles.innerIcon} />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className={styles.luxuryInput}
                placeholder="Mot de passe de compte"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.btn}>
              {loading ? t("verify_contract.btn_verifying") : t("verify_contract.btn_verify")}
            </button>
          </form>

          {searched && (
            <div className={styles.result}>
              {result ? (
                <div className={styles.success}>
                  <FiCheckCircle size={100} />
                  <h2>{t("verify_contract.success_title")}</h2>
                  <div className={styles.details}>
                    <p><strong>{t("verify_contract.label_contract_no")}</strong> {result.numeroContrat}</p>
                    <p><strong>{t("verify_contract.label_project")}</strong> {result.projet}</p>
                    <p><strong>{t("verify_contract.label_investor")}</strong> {result.investisseur}</p>
                    <p><strong>{t("verify_contract.label_amount")}</strong> {result.montant.toLocaleString(i18n.language)} FCFA</p>
                    <p><strong>{t("verify_contract.label_date")}</strong> {format(new Date(result.date), "dd MMMM yyyy", { locale: currentLocale })}</p>
                  </div>
                  <div className={styles.qr}>
                    <QRCodeSVG value={window.location.href} size={180} fgColor="#1B5E20" />
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

          <div className={styles.footer}>
            <div className={styles.logo}><h3>growzapp</h3></div>
            <p>{t("verify_contract.footer_text")}</p>
            <Link to="/" className={styles.back}><FiArrowLeft /> {t("verify_contract.back_home")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}