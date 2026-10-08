import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiBarChart2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import type { TransactionDTO } from "../../../types/transaction";
import { STATUTS_TERMINAUX_FOURNISSEUR } from "../../../utils/commandeStatus";
import { useFournisseurEspace } from "./FournisseurEspaceLayout";
import styles from "./FournisseurEspace.module.css";

interface ArticleDTO {
  id: number;
  disponible: boolean;
}

interface CommandeDTO {
  id: number;
  statut: string;
}

export default function FournisseurDashboardPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { fournisseur } = useFournisseurEspace();

  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [commandes, setCommandes] = useState<CommandeDTO[]>([]);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: ArticleDTO[] }>("/api/fournisseurs/moi/articles"),
      api.get<{ data: CommandeDTO[] }>("/api/commandes/recues"),
      api.get<TransactionDTO[]>("/api/wallets/transactions"),
    ])
      .then(([artRes, cmdRes, txRes]) => {
        setArticles(artRes.data || []);
        setCommandes(cmdRes.data || []);
        setTransactions((txRes || []).filter((tx) => tx.type === "PAIEMENT_FOURNISSEUR"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  const totalRecu = transactions.reduce((sum, tx) => sum + Number(tx.montant), 0);
  const commandesEnCours = commandes.filter((c) => !STATUTS_TERMINAUX_FOURNISSEUR.includes(c.statut));
  const aAccepter = commandes.filter((c) => c.statut === "EN_ATTENTE_ACCEPTATION");
  const articlesDisponibles = articles.filter((a) => a.disponible);

  return (
    <div>
      <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        <FiBarChart2 /> {t("fournisseur.espace.dashboard_title", "Tableau de bord")}
      </h2>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>{t("fournisseur.espace.stat_total_recu", "Total reçu")}</span>
          <span className={styles.statValue}>{format(totalRecu, "XOF")}</span>
        </div>
        <Link to="/mon-espace/fournisseur/commandes" className={styles.statCard} style={{ textDecoration: "none" }}>
          <span className={styles.statLabel}>{t("fournisseur.espace.stat_en_cours", "Commandes en cours")}</span>
          <span className={styles.statValue}>{commandesEnCours.length}</span>
        </Link>
        <Link to="/mon-espace/fournisseur/commandes" className={styles.statCard} style={{ textDecoration: "none" }}>
          <span className={styles.statLabel}>{t("fournisseur.espace.stat_a_accepter", "À accepter")}</span>
          <span className={styles.statValue}>{aAccepter.length}</span>
        </Link>
        <Link to="/mon-espace/fournisseur/catalogue" className={styles.statCard} style={{ textDecoration: "none" }}>
          <span className={styles.statLabel}>{t("fournisseur.espace.stat_articles", "Articles disponibles")}</span>
          <span className={styles.statValue}>
            {articlesDisponibles.length} / {articles.length}
          </span>
        </Link>
        <Link to="/mon-espace/fournisseur/historique" className={styles.statCard} style={{ textDecoration: "none" }}>
          <span className={styles.statLabel}>{t("fournisseur.espace.stat_terminees", "Commandes terminées")}</span>
          <span className={styles.statValue}>{commandes.length - commandesEnCours.length}</span>
        </Link>
      </div>

      {fournisseur.statut === "VALIDE" && articles.length === 0 && (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.dashboard_hint_catalogue", "Ajoutez vos premiers articles pour commencer à recevoir des commandes.")}</p>
          <Link to="/mon-espace/fournisseur/catalogue" className={styles.btnSubmit}>
            {t("fournisseur.espace.catalogue_title", "Mon catalogue")}
          </Link>
        </div>
      )}
    </div>
  );
}
