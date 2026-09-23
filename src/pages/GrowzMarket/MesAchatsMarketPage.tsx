import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiArrowLeft, FiFileText, FiHash, FiShoppingBag } from "react-icons/fi";
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
  porteurNom: string | null;
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

const STATUT_LABELS: Record<string, string> = {
  PAYEE: "Payée — en préparation",
  PRETE_AU_RETRAIT: "Prête au retrait",
  RETIREE: "Retirée",
  NON_RETIREE: "Non retirée",
  LITIGE: "En litige",
  ANNULEE: "Annulée — remboursée",
};

export default function MesAchatsMarketPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [commandes, setCommandes] = useState<CommandeMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [litigeId, setLitigeId] = useState<number | null>(null);
  const [motifLitige, setMotifLitige] = useState("");

  const load = () => {
    api
      .get<{ data: CommandeMarketDTO[] }>("/api/market/commandes/mes-achats")
      .then((res) => setCommandes(res.data || []))
      .catch(() => toast.error(t("growzmarket.achats.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLitige = async () => {
    if (!litigeId || motifLitige.trim().length < 5) {
      toast.error(t("growzmarket.achats.toast_litige_validation", "Décrivez le problème (5 caractères min.)"));
      return;
    }
    try {
      await api.post(`/api/market/commandes/${litigeId}/litige`, { motif: motifLitige });
      toast.success(t("growzmarket.achats.toast_litige_sent", "Litige ouvert, l'équipe GrowzApp va arbitrer"));
      setLitigeId(null);
      setMotifLitige("");
      load();
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.achats.toast_error", "Erreur"));
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
          <FiShoppingBag /> {t("growzmarket.achats.title", "Mes achats GrowzMarket")}
        </h1>
        <p>{t("growzmarket.achats.subtitle", "Suivi de vos commandes passées sur GrowzMarket.")}</p>
      </div>

      {commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>{t("growzmarket.achats.empty", "Aucun achat pour le moment.")}</p>
          <Link to="/growzmarket" className={styles.btnLink}>
            {t("growzmarket.achats.btn_catalogue", "Découvrir GrowzMarket")}
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {commandes.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>{c.projetLibelle}</strong>
                  {c.porteurNom && <span className={styles.acheteur}> — {c.porteurNom}</span>}
                </div>
                <span className={styles.badge}>{STATUT_LABELS[c.statut] || c.statut}</span>
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

              {c.motifLitige && <p className={styles.motif}>{c.motifLitige}</p>}

              {c.factureUrl && (
                <Link to={`/growzmarket/commandes/${c.id}/facture`} className={styles.btnFacture}>
                  <FiFileText size={14} /> {t("growzmarket.achats.btn_facture", "Voir la facture")}
                </Link>
              )}

              {c.statut === "PRETE_AU_RETRAIT" && (
                <>
                  <div className={styles.numeroBox}>
                    <FiHash size={16} />
                    <div>
                      <p className={styles.numeroLabel}>
                        {t("growzmarket.achats.numero_label", "Numéro à présenter au vendeur")}
                      </p>
                      <p className={styles.numeroValue}>#{c.id}</p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.btnLitige} onClick={() => setLitigeId(c.id)}>
                      <FiAlertTriangle size={14} /> {t("growzmarket.achats.btn_litige", "Signaler un problème")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {litigeId !== null && (
        <div className={styles.modalOverlay} onClick={() => setLitigeId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("growzmarket.achats.litige_title", "Signaler un problème")}</h2>
            <textarea
              value={motifLitige}
              onChange={(e) => setMotifLitige(e.target.value)}
              placeholder={t("growzmarket.achats.litige_placeholder", "Décrivez le problème rencontré...") as string}
              rows={4}
              maxLength={1000}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setLitigeId(null)}>
                {t("growzmarket.achats.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnLitige} onClick={handleLitige}>
                {t("growzmarket.achats.btn_send_litige", "Envoyer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
