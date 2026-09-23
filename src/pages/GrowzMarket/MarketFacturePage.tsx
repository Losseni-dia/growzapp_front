import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiArrowLeft, FiDownload, FiFileText } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import styles from "../Commandes/CommandeFacturePage.module.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function MarketFacturePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    let currentUrl: string | null = null;
    fetch(`${API_BASE_URL}/api/market/commandes/${id}/facture`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        setContentType(res.headers.get("Content-Type") || "");
        return res.blob();
      })
      .then((blob) => {
        currentUrl = URL.createObjectURL(blob);
        setBlobUrl(currentUrl);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [id]);

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiFileText /> {t("growzmarket.facture.title", "Facture GrowzMarket — Commande #{{id}}", { id })}
        </h1>
      </div>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : error || !blobUrl ? (
        <div className={styles.emptyState}>
          <FiAlertCircle size={48} />
          <p>
            {t(
              "growzmarket.facture.error",
              "Impossible d'afficher cette facture — elle n'existe pas encore ou vous n'y avez pas accès.",
            )}
          </p>
        </div>
      ) : (
        <div className={styles.viewer}>
          {contentType.includes("pdf") ? (
            <iframe src={blobUrl} title="Facture" className={styles.iframe} />
          ) : (
            <img src={blobUrl} alt="Facture" className={styles.image} />
          )}
          <a href={blobUrl} download={`facture-growzmarket-${id}`} className={styles.btnDownload}>
            <FiDownload /> {t("growzmarket.facture.btn_download", "Télécharger")}
          </a>
        </div>
      )}
    </div>
  );
}
