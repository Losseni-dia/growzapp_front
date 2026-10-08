import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiSearch, FiTruck, FiXCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import CommandeTimeline from "../../../components/Commande/CommandeTimeline";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import { STATUTS_TERMINAUX_FOURNISSEUR } from "../../../utils/commandeStatus";
import styles from "./FournisseurEspace.module.css";

interface CommandeDTO {
  id: number;
  projetLibelle: string;
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
}

const STATUT_KEYS: Record<string, string> = {
  EN_ATTENTE_VALIDATION: "En attente de validation admin",
  REJETEE: "Rejetée",
  EN_ATTENTE_ACCEPTATION: "À accepter",
  REFUSEE: "Refusée",
  ACCEPTEE: "Acceptée — à expédier",
  EXPEDIEE: "Expédiée",
  LITIGE: "En litige",
  ANNULEE: "Annulée",
  LIVREE: "Livrée — en attente de paiement",
  PAYEE: "Payée",
};

function statutLabel(t: any, statut: string): string {
  return t(`fournisseur.espace.statut.${statut}`, STATUT_KEYS[statut] || statut);
}

export default function FournisseurCommandesList({ vue }: { vue: "en_cours" | "historique" }) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [commandes, setCommandes] = useState<CommandeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get<{ data: CommandeDTO[] }>("/api/commandes/recues")
      .then((res) => setCommandes(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const [commandeSearch, setCommandeSearch] = useState("");
  const [commandeStatutFilter, setCommandeStatutFilter] = useState<string>("ALL");

  const commandesVue = useMemo(
    () => commandes.filter((c) => STATUTS_TERMINAUX_FOURNISSEUR.includes(c.statut) === (vue === "historique")),
    [commandes, vue],
  );

  const filteredCommandes = useMemo(() => {
    const q = commandeSearch.trim().toLowerCase();
    return commandesVue.filter((c) => {
      if (commandeStatutFilter !== "ALL" && c.statut !== commandeStatutFilter) return false;
      if (q && !c.projetLibelle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [commandesVue, commandeSearch, commandeStatutFilter]);

  const statutOptions = vue === "historique"
    ? STATUTS_TERMINAUX_FOURNISSEUR
    : Object.keys(STATUT_KEYS).filter((k) => !STATUTS_TERMINAUX_FOURNISSEUR.includes(k));

  const [expeditionId, setExpeditionId] = useState<number | null>(null);
  const [expeditionSending, setExpeditionSending] = useState(false);
  const [refusId, setRefusId] = useState<number | null>(null);
  const [motifRefus, setMotifRefus] = useState("");

  const handleAccepter = async (id: number) => {
    try {
      await api.post(`/api/commandes/${id}/accepter`);
      toast.success(t("fournisseur.espace.toast_accepted", "Commande acceptée"));
      load();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_error", "Erreur"));
    }
  };

  const handleRefuser = async () => {
    if (!refusId || motifRefus.trim().length < 3) {
      toast.error(t("fournisseur.espace.toast_motif_required", "Le motif est obligatoire (3 caractères min.)"));
      return;
    }
    try {
      await api.post(`/api/commandes/${refusId}/refuser`, { motif: motifRefus });
      toast.success(t("fournisseur.espace.toast_refused", "Commande refusée"));
      setRefusId(null);
      setMotifRefus("");
      load();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_error", "Erreur"));
    }
  };

  const handleConfirmerExpedition = async () => {
    if (!expeditionId) return;
    setExpeditionSending(true);
    try {
      await api.post(`/api/commandes/${expeditionId}/expedier`);
      toast.success(t("fournisseur.espace.toast_expedited", "Commande marquée comme expédiée"));
      setExpeditionId(null);
      load();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_error", "Erreur"));
    } finally {
      setExpeditionSending(false);
    }
  };

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div>
      <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        <FiTruck />{" "}
        {vue === "historique"
          ? t("fournisseur.espace.historique_title", "Historique des commandes")
          : t("fournisseur.espace.commandes_title", "Commandes reçues")}
      </h2>

      {commandesVue.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.searchInput}>
            <FiSearch size={15} />
            <input
              type="text"
              value={commandeSearch}
              onChange={(e) => setCommandeSearch(e.target.value)}
              placeholder={t("fournisseur.espace.search_commande", "Rechercher un projet...") as string}
            />
          </div>
          <select value={commandeStatutFilter} onChange={(e) => setCommandeStatutFilter(e.target.value)}>
            <option value="ALL">{t("fournisseur.espace.filter_all", "Tous")}</option>
            {statutOptions.map((key) => (
              <option key={key} value={key}>
                {statutLabel(t, key)}
              </option>
            ))}
          </select>
        </div>
      )}

      {commandesVue.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {vue === "historique"
              ? t("fournisseur.espace.historique_empty", "Aucune commande terminée pour le moment.")
              : t("fournisseur.espace.commandes_empty", "Aucune commande reçue pour le moment.")}
          </p>
        </div>
      ) : filteredCommandes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.no_results", "Aucun résultat pour cette recherche/filtre.")}</p>
        </div>
      ) : (
        <div className={styles.commandeList}>
          {filteredCommandes.map((c) => (
            <div key={c.id} className={styles.commandeCard}>
              <div className={styles.commandeCardHeader}>
                <div>
                  <strong>{c.projetLibelle}</strong>
                  <span className={styles.commandeDate}>
                    {" "}
                    — {formatDate(new Date(c.dateCommande), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
                <span className={styles.articlePrix}>{format(Number(c.montantTotal), "XOF")}</span>
              </div>
              <span className={`${styles.badge} ${styles.commandeStatutBadge}`}>
                {statutLabel(t, c.statut)}
              </span>

              <CommandeTimeline commande={c} />

              {c.factureUrl && (
                <Link to={`/commandes/${c.id}/facture`} className={styles.btnAction}>
                  {t("fournisseur.espace.btn_voir_facture", "Voir la facture")}
                </Link>
              )}

              {c.statut === "EN_ATTENTE_ACCEPTATION" && (
                <div className={styles.commandeActions}>
                  <button className={styles.btnAction} onClick={() => handleAccepter(c.id)}>
                    <FiCheckCircle size={14} /> {t("fournisseur.espace.btn_accepter", "Accepter")}
                  </button>
                  <button className={styles.btnDanger} onClick={() => setRefusId(c.id)}>
                    <FiXCircle size={14} /> {t("fournisseur.espace.btn_refuser", "Refuser")}
                  </button>
                </div>
              )}
              {c.statut === "ACCEPTEE" && (
                <div className={styles.commandeActions}>
                  <button className={styles.btnAction} onClick={() => setExpeditionId(c.id)}>
                    <FiTruck size={14} /> {t("fournisseur.espace.btn_expedier", "Marquer expédiée")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {refusId !== null && (
        <div className={styles.modalOverlay} onClick={() => setRefusId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("fournisseur.espace.refus_title", "Motif du refus")}</h2>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              placeholder={t("fournisseur.espace.refus_placeholder", "Expliquez pourquoi vous refusez cette commande...") as string}
              rows={4}
              maxLength={500}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setRefusId(null)}>
                {t("fournisseur.espace.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnDanger} onClick={handleRefuser}>
                {t("fournisseur.espace.btn_confirm_refus", "Refuser la commande")}
              </button>
            </div>
          </div>
        </div>
      )}

      {expeditionId !== null && (
        <div className={styles.modalOverlay} onClick={() => setExpeditionId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("fournisseur.espace.facture_title", "Confirmer l'expédition")}</h2>
            <p className={styles.warningText}>
              {t(
                "fournisseur.espace.facture_notice",
                "La facture sera générée automatiquement et transmise au porteur et aux investisseurs du projet une fois le paiement exécuté.",
              )}
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setExpeditionId(null)}>
                {t("fournisseur.espace.btn_cancel", "Annuler")}
              </button>
              <button
                className={styles.btnSubmit}
                onClick={handleConfirmerExpedition}
                disabled={expeditionSending}
              >
                {expeditionSending
                  ? t("fournisseur.espace.btn_saving", "Enregistrement...")
                  : t("fournisseur.espace.btn_confirm_expedition", "Confirmer l'expédition")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
