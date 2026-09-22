import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import styles from "./AdminCommandesPage.module.css";

interface CommandeLigneDTO {
  id: number;
  libelle: string;
  quantite: number;
  sousTotal: number;
}

interface CommandeDTO {
  id: number;
  projetLibelle: string;
  porteurNom: string | null;
  porteurEmail: string | null;
  fournisseurNom: string;
  fournisseurVille: string | null;
  fournisseurPays: string | null;
  fournisseurTelephone: string | null;
  fournisseurEmail: string | null;
  montantTotal: number;
  statut: string;
  dateCommande: string;
  dateValidationAdmin: string | null;
  dateLivraison: string | null;
  dateConfirmationReception: string | null;
  motifRejet: string | null;
  motifLitige: string | null;
  factureUrl: string | null;
  lignes: CommandeLigneDTO[];
}

type Onglet = "EN_ATTENTE" | "LITIGES";

export default function AdminCommandesPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [onglet, setOnglet] = useState<Onglet>("EN_ATTENTE");
  const [commandes, setCommandes] = useState<CommandeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejetId, setRejetId] = useState<number | null>(null);
  const [motif, setMotif] = useState("");
  const [arbitrageId, setArbitrageId] = useState<number | null>(null);
  const [motifArbitrage, setMotifArbitrage] = useState("");
  const [detail, setDetail] = useState<CommandeDTO | null>(null);

  const load = () => {
    setLoading(true);
    const url = onglet === "EN_ATTENTE" ? "/api/admin/commandes/en-attente" : "/api/admin/commandes/litiges";
    api
      .get<{ data: CommandeDTO[] }>(url)
      .then((res) => setCommandes(res.data || []))
      .catch(() => toast.error(t("admin.commandes.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet]);

  const handleValider = async (id: number) => {
    try {
      await api.post(`/api/admin/commandes/${id}/valider`);
      toast.success(t("admin.commandes.toast_validated", "Commande validée, fonds séquestrés au fournisseur"));
      setCommandes((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.message || t("admin.commandes.toast_error", "Erreur"));
    }
  };

  const handleRejeter = async () => {
    if (!rejetId || motif.trim().length < 3) {
      toast.error(t("admin.commandes.toast_motif_required", "Le motif est obligatoire"));
      return;
    }
    try {
      await api.post(`/api/admin/commandes/${rejetId}/rejeter`, { motif });
      toast.success(t("admin.commandes.toast_rejected", "Commande rejetée"));
      setCommandes((prev) => prev.filter((c) => c.id !== rejetId));
      setRejetId(null);
      setMotif("");
    } catch (err: any) {
      toast.error(err.message || t("admin.commandes.toast_error", "Erreur"));
    }
  };

  const handleArbitrer = async (enFaveurDuFournisseur: boolean) => {
    if (!arbitrageId || motifArbitrage.trim().length < 3) {
      toast.error(t("admin.commandes.toast_motif_required", "Le motif est obligatoire"));
      return;
    }
    try {
      await api.post(
        `/api/admin/commandes/${arbitrageId}/arbitrer?enFaveurDuFournisseur=${enFaveurDuFournisseur}`,
        { motif: motifArbitrage },
      );
      toast.success(t("admin.commandes.toast_arbitrated", "Litige arbitré"));
      setCommandes((prev) => prev.filter((c) => c.id !== arbitrageId));
      setArbitrageId(null);
      setMotifArbitrage("");
    } catch (err: any) {
      toast.error(err.message || t("admin.commandes.toast_error", "Erreur"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiShoppingBag /> {t("admin.commandes.title", "Commandes fournisseurs")}
        </h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${onglet === "EN_ATTENTE" ? styles.tabBtnActive : ""}`}
          onClick={() => setOnglet("EN_ATTENTE")}
        >
          {t("admin.commandes.tab_pending", "En attente de validation")}
        </button>
        <button
          className={`${styles.tabBtn} ${onglet === "LITIGES" ? styles.tabBtnActive : ""}`}
          onClick={() => setOnglet("LITIGES")}
        >
          {t("admin.commandes.tab_litiges", "Litiges")}
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>{t("admin.commandes.empty", "Rien à traiter ici pour le moment.")}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {commandes.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>{c.projetLibelle}</strong>
                  <span className={styles.fournisseur}> → {c.fournisseurNom}</span>
                </div>
                <span className={styles.total}>{format(Number(c.montantTotal), "XOF")}</span>
              </div>
              <p className={styles.date}>{formatDate(new Date(c.dateCommande), "dd MMM yyyy", { locale: fr })}</p>
              <ul className={styles.lignes}>
                {c.lignes.map((l) => (
                  <li key={l.id}>
                    {l.quantite} × {l.libelle} — {format(Number(l.sousTotal), "XOF")}
                  </li>
                ))}
              </ul>

              {onglet === "LITIGES" && c.motifLitige && (
                <p className={styles.motifLitige}>
                  <FiAlertTriangle size={14} /> {c.motifLitige}
                </p>
              )}

              {c.factureUrl && (
                <Link to={`/commandes/${c.id}/facture`} className={styles.btnFacture}>
                  <FiFileText size={14} /> {t("admin.commandes.btn_facture", "Voir la facture")}
                </Link>
              )}

              <div className={styles.actions}>
                <button className={styles.btnDetail} onClick={() => setDetail(c)}>
                  <FiEye size={14} /> {t("admin.commandes.btn_details", "Détails")}
                </button>
                {onglet === "EN_ATTENTE" ? (
                  <>
                    <button className={styles.btnValider} onClick={() => handleValider(c.id)}>
                      <FiCheckCircle size={14} /> {t("admin.commandes.btn_validate", "Valider")}
                    </button>
                    <button className={styles.btnRejeter} onClick={() => setRejetId(c.id)}>
                      <FiXCircle size={14} /> {t("admin.commandes.btn_reject", "Rejeter")}
                    </button>
                  </>
                ) : (
                  <button className={styles.btnValider} onClick={() => setArbitrageId(c.id)}>
                    {t("admin.commandes.btn_arbitrate", "Arbitrer")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail !== null && (
        <div className={styles.modalOverlay} onClick={() => setDetail(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>
              {t("admin.commandes.detail_title", "Commande #{{id}}", { id: detail.id })}
            </h2>

            <div className={styles.detailSection}>
              <p className={styles.detailLabel}>
                <FiUser size={13} /> {t("admin.commandes.detail_porteur", "Porteur")}
              </p>
              <p className={styles.detailValue}>{detail.porteurNom || "—"}</p>
              {detail.porteurEmail && (
                <p className={styles.detailSub}>
                  <FiMail size={12} /> {detail.porteurEmail}
                </p>
              )}
              <p className={styles.detailValue}>{detail.projetLibelle}</p>
            </div>

            <div className={styles.detailSection}>
              <p className={styles.detailLabel}>
                <FiUser size={13} /> {t("admin.commandes.detail_fournisseur", "Fournisseur")}
              </p>
              <p className={styles.detailValue}>{detail.fournisseurNom}</p>
              {(detail.fournisseurVille || detail.fournisseurPays) && (
                <p className={styles.detailSub}>
                  <FiMapPin size={12} /> {detail.fournisseurVille}, {detail.fournisseurPays}
                </p>
              )}
              {detail.fournisseurTelephone && (
                <p className={styles.detailSub}>
                  <FiPhone size={12} /> {detail.fournisseurTelephone}
                </p>
              )}
              {detail.fournisseurEmail && (
                <p className={styles.detailSub}>
                  <FiMail size={12} /> {detail.fournisseurEmail}
                </p>
              )}
            </div>

            <div className={styles.detailSection}>
              <p className={styles.detailLabel}>{t("admin.commandes.detail_lignes", "Articles commandés")}</p>
              <ul className={styles.lignes}>
                {detail.lignes.map((l) => (
                  <li key={l.id}>
                    {l.quantite} × {l.libelle} — {format(Number(l.sousTotal), "XOF")}
                  </li>
                ))}
              </ul>
              <p className={styles.detailTotal}>
                {t("admin.commandes.detail_total", "Total")} : {format(Number(detail.montantTotal), "XOF")}
              </p>
            </div>

            <div className={styles.detailSection}>
              <p className={styles.detailLabel}>{t("admin.commandes.detail_chronologie", "Chronologie")}</p>
              <ul className={styles.detailTimeline}>
                <li>
                  {t("admin.commandes.detail_commandee", "Commandée le")}{" "}
                  {formatDate(new Date(detail.dateCommande), "dd MMM yyyy HH:mm", { locale: fr })}
                </li>
                {detail.dateValidationAdmin && (
                  <li>
                    {t("admin.commandes.detail_validee", "Validée le")}{" "}
                    {formatDate(new Date(detail.dateValidationAdmin), "dd MMM yyyy HH:mm", { locale: fr })}
                  </li>
                )}
                {detail.dateLivraison && (
                  <li>
                    {t("admin.commandes.detail_livree", "Livrée le")}{" "}
                    {formatDate(new Date(detail.dateLivraison), "dd MMM yyyy HH:mm", { locale: fr })}
                  </li>
                )}
                {detail.dateConfirmationReception && (
                  <li>
                    {t("admin.commandes.detail_confirmee", "Confirmée le")}{" "}
                    {formatDate(new Date(detail.dateConfirmationReception), "dd MMM yyyy HH:mm", { locale: fr })}
                  </li>
                )}
              </ul>
              {detail.motifRejet && <p className={styles.motifLitige}>{detail.motifRejet}</p>}
              {detail.motifLitige && (
                <p className={styles.motifLitige}>
                  <FiAlertTriangle size={14} /> {detail.motifLitige}
                </p>
              )}
            </div>

            {detail.factureUrl && (
              <Link to={`/commandes/${detail.id}/facture`} className={styles.btnFacture}>
                <FiFileText size={14} /> {t("admin.commandes.btn_facture", "Voir la facture")}
              </Link>
            )}

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDetail(null)}>
                {t("admin.commandes.btn_close", "Fermer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejetId !== null && (
        <div className={styles.modalOverlay} onClick={() => setRejetId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.commandes.reject_title", "Motif du rejet")}</h2>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={4} maxLength={500} />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setRejetId(null)}>
                {t("admin.commandes.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnRejeter} onClick={handleRejeter}>
                {t("admin.commandes.btn_confirm_reject", "Rejeter")}
              </button>
            </div>
          </div>
        </div>
      )}

      {arbitrageId !== null && (
        <div className={styles.modalOverlay} onClick={() => setArbitrageId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.commandes.arbitrate_title", "Arbitrer le litige")}</h2>
            <textarea
              value={motifArbitrage}
              onChange={(e) => setMotifArbitrage(e.target.value)}
              placeholder={t("admin.commandes.arbitrate_placeholder", "Motif de la décision...") as string}
              rows={4}
              maxLength={1000}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setArbitrageId(null)}>
                {t("admin.commandes.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnRejeter} onClick={() => handleArbitrer(false)}>
                {t("admin.commandes.btn_favor_porteur", "En faveur du porteur (remboursement)")}
              </button>
              <button className={styles.btnValider} onClick={() => handleArbitrer(true)}>
                {t("admin.commandes.btn_favor_fournisseur", "En faveur du fournisseur")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
