import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiFileText, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";
import CommandeTimeline from "../../../components/Commande/CommandeTimeline";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import styles from "./MesCommandesPage.module.css";

interface CommandeLigneDTO {
  id: number;
  libelle: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

interface CommandeDTO {
  id: number;
  projetLibelle: string;
  fournisseurNom: string;
  montantTotal: number;
  statut: string;
  dateCommande: string;
  dateValidationAdmin: string | null;
  dateAcceptation: string | null;
  dateExpedition: string | null;
  dateConfirmationReception: string | null;
  datePaiement: string | null;
  motifRejet: string | null;
  motifRefus: string | null;
  motifLitige: string | null;
  factureUrl: string | null;
  lignes: CommandeLigneDTO[];
}

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE_VALIDATION: "En attente de validation admin",
  REJETEE: "Rejetée",
  EN_ATTENTE_ACCEPTATION: "En attente d'acceptation fournisseur",
  REFUSEE: "Refusée par le fournisseur",
  ACCEPTEE: "Acceptée — en préparation",
  EXPEDIEE: "Expédiée — à confirmer",
  LITIGE: "En litige",
  ANNULEE: "Annulée",
  LIVREE: "Livrée — paiement en attente",
  PAYEE: "Payée",
};

export default function MesCommandesPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [commandes, setCommandes] = useState<CommandeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [litigeId, setLitigeId] = useState<number | null>(null);
  const [motifLitige, setMotifLitige] = useState("");

  const load = () => {
    api
      .get<{ data: CommandeDTO[] }>("/api/commandes/mes-commandes")
      .then((res) => setCommandes(res.data || []))
      .catch(() => toast.error(t("mes_commandes.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmer = async (id: number) => {
    if (!window.confirm(t("mes_commandes.confirm_reception", "Confirmer avoir bien reçu cette commande ? L'équipe GrowzApp sera alertée pour exécuter le paiement au fournisseur.") as string)) return;
    try {
      await api.post(`/api/commandes/${id}/confirmer-reception`);
      toast.success(t("mes_commandes.toast_confirmed", "Réception confirmée"));
      load();
    } catch (err: any) {
      toast.error(err.message || t("mes_commandes.toast_error", "Erreur"));
    }
  };

  const handleLitige = async () => {
    if (!litigeId || motifLitige.trim().length < 5) {
      toast.error(t("mes_commandes.toast_litige_validation", "Décrivez le problème (5 caractères min.)"));
      return;
    }
    try {
      await api.post(`/api/commandes/${litigeId}/litige`, { motif: motifLitige });
      toast.success(t("mes_commandes.toast_litige_sent", "Litige ouvert, l'équipe GrowzApp va arbitrer"));
      setLitigeId(null);
      setMotifLitige("");
      load();
    } catch (err: any) {
      toast.error(err.message || t("mes_commandes.toast_error", "Erreur"));
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
          <FiShoppingBag /> {t("mes_commandes.title", "Mes commandes fournisseurs")}
        </h1>
        <p>{t("mes_commandes.subtitle", "Suivi des commandes passées auprès des fournisseurs pour vos projets.")}</p>
      </div>

      {commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>{t("mes_commandes.empty", "Aucune commande pour le moment.")}</p>
          <Link to="/fournisseurs" className={styles.btnLink}>
            {t("mes_commandes.btn_find_fournisseur", "Trouver un fournisseur")}
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {commandes.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>{c.projetLibelle}</strong>
                  <span className={styles.fournisseur}> — {c.fournisseurNom}</span>
                </div>
                <span className={`${styles.badge} ${styles["statut_" + c.statut]}`}>
                  {STATUT_LABELS[c.statut] || c.statut}
                </span>
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

              <CommandeTimeline commande={c} />

              {c.motifRejet && <p className={styles.motif}>{c.motifRejet}</p>}
              {c.motifRefus && <p className={styles.motif}>{c.motifRefus}</p>}

              {c.factureUrl && (
                <Link to={`/commandes/${c.id}/facture`} className={styles.btnFacture}>
                  <FiFileText size={14} /> {t("mes_commandes.btn_facture", "Voir la facture")}
                </Link>
              )}

              {c.statut === "EXPEDIEE" && (
                <div className={styles.actions}>
                  <button className={styles.btnConfirm} onClick={() => handleConfirmer(c.id)}>
                    <FiCheckCircle size={14} /> {t("mes_commandes.btn_confirm", "Confirmer la réception")}
                  </button>
                  <button className={styles.btnLitige} onClick={() => setLitigeId(c.id)}>
                    <FiAlertTriangle size={14} /> {t("mes_commandes.btn_litige", "Signaler un problème")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {litigeId !== null && (
        <div className={styles.modalOverlay} onClick={() => setLitigeId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("mes_commandes.litige_title", "Signaler un problème")}</h2>
            <textarea
              value={motifLitige}
              onChange={(e) => setMotifLitige(e.target.value)}
              placeholder={t("mes_commandes.litige_placeholder", "Décrivez le problème rencontré...") as string}
              rows={4}
              maxLength={1000}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setLitigeId(null)}>
                {t("mes_commandes.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnLitige} onClick={handleLitige}>
                {t("mes_commandes.btn_send_litige", "Envoyer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
