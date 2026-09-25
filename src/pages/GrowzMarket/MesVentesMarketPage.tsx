import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiCheckCircle, FiFileText, FiSearch, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";
import CommandeMarketTimeline from "../../components/Commande/CommandeMarketTimeline";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api } from "../../service/Api";
import styles from "./MesVentesMarketPage.module.css";

interface CommandeMarketLigneDTO {
  id: number;
  libelle: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

interface CommandeMarketDTO {
  id: number;
  projetId: number;
  projetLibelle: string;
  acheteurNom: string;
  montantTotal: number;
  statut: string;
  confirmationLieuRetrait: boolean;
  dateCommande: string;
  datePrete: string | null;
  dateRetraitConfirme: string | null;
  motifLitige: string | null;
  factureUrl: string | null;
  lignes: CommandeMarketLigneDTO[];
}

const STATUT_KEYS: Record<string, string> = {
  PAYEE: "Payée — à préparer",
  PRETE_AU_RETRAIT: "Prête au retrait",
  RETIREE: "Retirée",
  NON_RETIREE: "Non retirée",
  LITIGE: "En litige",
  ANNULEE: "Annulée",
};

function statutLabel(t: (key: string, options?: { defaultValue: string }) => string, statut: string): string {
  return t(`growzmarket.ventes.statut.${statut}`, { defaultValue: STATUT_KEYS[statut] || statut });
}

export default function MesVentesMarketPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [commandes, setCommandes] = useState<CommandeMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [litigeId, setLitigeId] = useState<number | null>(null);
  const [motifLitige, setMotifLitige] = useState("");
  const [recherche, setRecherche] = useState("");

  const load = () => {
    api
      .get<{ data: CommandeMarketDTO[] }>("/api/market/commandes/mes-ventes")
      .then((res) => setCommandes(res.data || []))
      .catch(() => toast.error(t("growzmarket.ventes.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreparer = async (id: number) => {
    try {
      await api.post(`/api/market/commandes/${id}/preparer`);
      toast.success(t("growzmarket.ventes.toast_prepared", "Commande marquée comme prête au retrait"));
      load();
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.ventes.toast_error", "Erreur"));
    }
  };

  const handleValiderRetrait = async (id: number) => {
    if (
      !window.confirm(
        t(
          "growzmarket.ventes.confirm_valider_retrait",
          "Confirmer que l'acheteur a bien récupéré cette commande ?",
        ) as string,
      )
    )
      return;
    try {
      await api.post(`/api/market/commandes/${id}/valider-retrait`);
      toast.success(t("growzmarket.ventes.toast_valider_retrait", "Retrait validé"));
      load();
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.ventes.toast_error", "Erreur"));
    }
  };

  const commandesFiltrees = commandes.filter((c) => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.id).includes(q) ||
      c.acheteurNom.toLowerCase().includes(q) ||
      c.projetLibelle.toLowerCase().includes(q)
    );
  });

  const handleLitige = async () => {
    if (!litigeId || motifLitige.trim().length < 5) {
      toast.error(t("growzmarket.ventes.toast_litige_validation", "Décrivez le problème (5 caractères min.)"));
      return;
    }
    try {
      await api.post(`/api/market/commandes/${litigeId}/litige`, { motif: motifLitige });
      toast.success(t("growzmarket.ventes.toast_litige_sent", "Litige ouvert, l'équipe GrowzApp va arbitrer"));
      setLitigeId(null);
      setMotifLitige("");
      load();
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.ventes.toast_error", "Erreur"));
    }
  };

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiShoppingBag /> {t("growzmarket.ventes.title", "Mes ventes GrowzMarket")}
        </h1>
        <p>{t("growzmarket.ventes.subtitle", "Commandes reçues sur vos articles GrowzMarket.")}</p>
      </div>

      {commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>{t("growzmarket.ventes.empty", "Aucune vente pour le moment.")}</p>
          <Link to="/mon-espace/ma-boutique" className={styles.btnLink}>
            {t("growzmarket.ventes.btn_boutique", "Gérer ma boutique")}
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.searchBar}>
            <FiSearch size={15} />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={
                t(
                  "growzmarket.ventes.search_placeholder",
                  "Rechercher par numéro de commande, acheteur, projet...",
                ) as string
              }
            />
          </div>
          <div className={styles.list}>
          {commandesFiltrees.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.numero}>#{c.id}</span>
                  <strong> {c.projetLibelle}</strong>
                  <span className={styles.acheteur}> — {c.acheteurNom}</span>
                </div>
                <span className={styles.badge}>{statutLabel(t, c.statut)}</span>
              </div>

              <ul className={styles.lignes}>
                {c.lignes.map((l) => (
                  <li key={l.id}>
                    {l.quantite} × {l.libelle} — {format(Number(l.sousTotal), "XOF")}
                  </li>
                ))}
              </ul>

              <div className={styles.cardFooter}>
                <span className={styles.total}>{format(Number(c.montantTotal), "XOF")}</span>
                <span className={styles.date}>
                  {formatDate(new Date(c.dateCommande), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>

              <CommandeMarketTimeline commande={c} />

              {c.factureUrl && (
                <Link to={`/growzmarket/commandes/${c.id}/facture`} className={styles.btnFacture}>
                  <FiFileText size={14} /> {t("growzmarket.ventes.btn_facture", "Voir la facture")}
                </Link>
              )}

              {c.statut === "PAYEE" && (
                <div className={styles.actions}>
                  <button className={styles.btnConfirm} onClick={() => handlePreparer(c.id)}>
                    <FiCheckCircle size={14} /> {t("growzmarket.ventes.btn_preparer", "Marquer prête")}
                  </button>
                </div>
              )}
              {c.statut === "PRETE_AU_RETRAIT" && (
                <div className={styles.actions}>
                  <button className={styles.btnConfirm} onClick={() => handleValiderRetrait(c.id)}>
                    <FiCheckCircle size={14} /> {t("growzmarket.ventes.btn_valider_retrait", "Valider le retrait")}
                  </button>
                  <button className={styles.btnLitige} onClick={() => setLitigeId(c.id)}>
                    {t("growzmarket.ventes.btn_litige", "Signaler un problème")}
                  </button>
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}

      {litigeId !== null && (
        <div className={styles.modalOverlay} onClick={() => setLitigeId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("growzmarket.ventes.litige_title", "Signaler un problème")}</h2>
            <textarea
              value={motifLitige}
              onChange={(e) => setMotifLitige(e.target.value)}
              placeholder={t("growzmarket.ventes.litige_placeholder", "Décrivez le problème rencontré...") as string}
              rows={4}
              maxLength={1000}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setLitigeId(null)}>
                {t("growzmarket.ventes.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnLitige} onClick={handleLitige}>
                {t("growzmarket.ventes.btn_send_litige", "Envoyer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
