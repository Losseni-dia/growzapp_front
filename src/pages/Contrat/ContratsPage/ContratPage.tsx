import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import ContratView from "../../../components/Contrat/ContratView/ContratView";
import styles from "./ContratPage.module.css";
import { useTranslation } from "react-i18next"; // <--- IMPORT

export default function ContratPage() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(); // <--- HOOK
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContrat = async () => {
      if (!numero) {
        toast.error(t("contract_view.invalid_link"));
        navigate("/mon-espace");
        return;
      }

      try {
        setLoading(true);
        const res = await api.get<any>(`/api/contrats/details/${numero}`);
        setData(res);
      } catch (err: any) {
        let message = t("contract_view.error_generic");

        if (err.message) {
          if (err.message.includes("404")) {
            message = t("contract_view.error_404");
          } else if (err.message.includes("403")) {
            message = t("contract_view.error_403");
          } else if (err.message.includes("401")) {
            message = t("contract_view.error_401");
          } else {
            message = err.message;
          }
        }

        toast.error(message);
        console.error("Erreur chargement contrat:", err);

        // Redirection propre si erreur grave
        navigate("/mon-espace", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchContrat();
  }, [numero, navigate, t]);

  // État de chargement
  if (loading) {
    return (
      <div className={styles.message}>
        <div className={styles.loader} />
        <p>{t("contract_view.loading")}</p>
      </div>
    );
  }

  // Contrat non trouvé ou erreur
  if (!data) {
    return (
      <div className={styles.message}>
        <h2>{t("contract_view.not_found_title")}</h2>
        <p>{t("contract_view.not_found_desc")}</p>
        <Link to="/mon-espace" className={styles.backLink}>
          {t("contract_view.back_to_space")}
        </Link>
      </div>
    );
  }

  // Tout est bon → affichage du contrat
  return <ContratView {...data} />;
}
