import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrowserQRCodeReader } from "@zxing/browser";
import {
  FiShield,
  FiCamera,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { api } from "../../service/Api";
import styles from "./VerifierContrat.module.css";

interface ContratPublicDTO {
  valide: boolean;
  numeroContrat: string;
  projet: string;
  investisseur: string;
  montant: number;
  date: string;
}

type Etat = "scan" | "loading" | "result" | "error";

export default function VerifierContrat() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [etat, setEtat] = useState<Etat>("scan");
  const [resultat, setResultat] = useState<ContratPublicDTO | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, setScanning] = useState(false);

  // Démarrer le scanner
  const demarrerScanner = async () => {
    try {
      setScanning(true);
      setEtat("scan");
      setResultat(null);
      setErreur(null);

      readerRef.current = new BrowserQRCodeReader();

      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (devices.length === 0) {
        setErreur(t("verify_contract.scan.no_camera"));
        setEtat("error");
        setScanning(false);
        return;
      }

      // Préférer la caméra arrière sur mobile
      const device =
        devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("arrière") ||
            d.label.toLowerCase().includes("rear"),
        ) || devices[0];

      await readerRef.current.decodeFromVideoDevice(
        device.deviceId,
        videoRef.current!,
        async (result, _error) => {
          if (result) {
            const text = result.getText();
            await traiterQrCode(text);
          }
        },
      );
    } catch (err: any) {
      setErreur(t("verify_contract.scan.camera_denied"));
      setEtat("error");
      setScanning(false);
    }
  };

  // Arrêter le scanner
  const arreterScanner = () => {
    if (readerRef.current) {
      BrowserQRCodeReader.releaseAllStreams();
      readerRef.current = null;
    }
    setScanning(false);
  };

  // Traiter le QR code scanné
  const traiterQrCode = async (text: string) => {
    arreterScanner();
    setEtat("loading");

    try {
      // Extraire le token depuis l'URL
      // Format : https://my-growzapp.com/verifier-contrat?token=UUID
      let token = text;
      if (text.includes("token=")) {
        token = text.split("token=")[1];
      }

      const response = await api.get<ContratPublicDTO>(
        `/api/contrats/verifier-token?token=${token}`,
      );

      setResultat(response);
      setEtat("result");
    } catch (err: any) {
      setErreur(t("verify_contract.scan.verify_generic_error"));
      setEtat("error");
    }
  };

  // Démarrer automatiquement au chargement
  useEffect(() => {
    demarrerScanner();
    return () => arreterScanner();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* HEADER */}
          <div className={styles.header}>
            <FiShield size={48} />
            <h1>{t("verify_contract.scan.page_title")}</h1>
            <p>{t("verify_contract.scan.page_subtitle")}</p>
          </div>

          {/* ÉTAT : SCAN */}
          {etat === "scan" && (
            <div className={styles.scanSection}>
              <div className={styles.videoWrapper}>
                <video
                  ref={videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                />
                {/* Cadre de visée */}
                <div className={styles.scanFrame}>
                  <div className={styles.corner} />
                  <div className={styles.corner} />
                  <div className={styles.corner} />
                  <div className={styles.corner} />
                </div>
                <div className={styles.scanLine} />
              </div>
              <p className={styles.scanHint}>
                <FiCamera size={18} />
                {t("verify_contract.scan.hint")}
              </p>
              <button className={styles.btnSecondary} onClick={arreterScanner}>
                {t("verify_contract.scan.cancel")}
              </button>
            </div>
          )}

          {/* ÉTAT : LOADING */}
          {etat === "loading" && (
            <div className={styles.loadingSection}>
              <div className={styles.spinner} />
              <p>{t("verify_contract.scan.verifying")}</p>
            </div>
          )}

          {/* ÉTAT : RÉSULTAT */}
          {etat === "result" && resultat && (
            <div className={styles.result}>
              {resultat.valide ? (
                <div className={styles.success}>
                  <FiCheckCircle size={64} />
                  <h2>{t("verify_contract.scan.valid_title")}</h2>
                  <p>{t("verify_contract.scan.valid_desc")}</p>
                </div>
              ) : (
                <div className={styles.error}>
                  <FiXCircle size={64} />
                  <h2>{t("verify_contract.scan.invalid_title")}</h2>
                  <p>{t("verify_contract.scan.invalid_desc")}</p>
                </div>
              )}

              <div className={styles.details}>
                <p>
                  <strong>📋 {t("verify_contract.label_contract_no")}</strong>{" "}
                  {resultat.numeroContrat}
                </p>
                <p>
                  <strong>🚀 {t("verify_contract.label_project")}</strong>{" "}
                  {resultat.projet}
                </p>
                <p>
                  <strong>👤 {t("verify_contract.label_investor")}</strong>{" "}
                  {resultat.investisseur}
                </p>
                <p>
                  <strong>💰 {t("verify_contract.label_amount")}</strong>{" "}
                  {resultat.montant.toLocaleString("fr-FR")} FCFA
                </p>
                <p>
                  <strong>📅 {t("verify_contract.label_date")}</strong>{" "}
                  {resultat.date}
                </p>
              </div>

              <button className={styles.btn} onClick={demarrerScanner}>
                <FiRefreshCw size={18} />
                {t("verify_contract.scan.scan_another")}
              </button>
            </div>
          )}

          {/* ÉTAT : ERREUR */}
          {etat === "error" && (
            <div className={styles.result}>
              <div className={styles.error}>
                <FiXCircle size={64} />
                <h2>{t("verify_contract.scan.error_title")}</h2>
                <p>{erreur}</p>
              </div>
              <button className={styles.btn} onClick={demarrerScanner}>
                <FiRefreshCw size={18} />
                {t("verify_contract.scan.retry")}
              </button>
            </div>
          )}

          {/* FOOTER */}
          <div className={styles.footer}>
            <div className={styles.logo}>
              <h3>GrowzApp</h3>
            </div>
            <Link to="/" className={styles.back}>
              <FiArrowLeft size={16} />
              {t("verify_contract.back_home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
