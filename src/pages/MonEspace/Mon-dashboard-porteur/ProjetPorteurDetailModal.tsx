// src/pages/MonEspace/Mon-dashboard-porteur/ProjetPorteurDetailModal.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiX,
  FiUsers,
  FiDollarSign,
  FiGift,
  FiTarget,
  FiSend,
  FiArrowRightCircle,
  FiUpload,
  FiCreditCard,
  FiSmartphone,
} from "react-icons/fi";
import { BsStarFill } from "react-icons/bs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildFileUrl } from "../../../service/Api";
import type { PorteurProjetLigneDTO } from "../../../types/porteurDashboard";
import styles from "./ProjetPorteurDetailModal.module.css";

interface Props {
  ligne: PorteurProjetLigneDTO;
  onClose: () => void;
  onActionDone: () => void;
}

type PanelType = "retrait" | "transfert" | "document" | "premium" | null;

const PRIX_PREMIUM = 5000;

export default function ProjetPorteurDetailModal({ ligne, onClose, onActionDone }: Props) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [panel, setPanel] = useState<PanelType>(null);
  const [montant, setMontant] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNom, setDocNom] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [premiumLoading, setPremiumLoading] = useState<string | null>(null);

  const resetPanel = () => {
    setPanel(null);
    setMontant("");
    setPhone("");
  };

  const handleRetrait = async () => {
    const montantNum = parseFloat(montant);
    if (!montantNum || montantNum <= 0) {
      toast.error(t("porteur.wallet.toast.invalid_amount"));
      return;
    }
    if (montantNum > ligne.soldeDisponibleWallet) {
      toast.error(t("porteur.wallet.toast.insufficient_funds"));
      return;
    }
    if (!phone.trim()) {
      toast.error(t("porteur.wallet.toast.phone_required"));
      return;
    }
    try {
      setSubmitting(true);
      const idempotencyKey = crypto.randomUUID();
      await api.post(`/api/projets/${ligne.projetId}/wallet/retirer`, {
        montant: montantNum,
        phone,
        idempotencyKey,
      });
      toast.success(t("porteur.wallet.toast.withdraw_success"));
      resetPanel();
      onActionDone();
    } catch (err: any) {
      toast.error(err.message || t("porteur.wallet.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfert = async () => {
    const montantNum = parseFloat(montant);
    if (!montantNum || montantNum <= 0) {
      toast.error(t("porteur.wallet.toast.invalid_amount"));
      return;
    }
    if (montantNum > ligne.soldeDisponibleWallet) {
      toast.error(t("porteur.wallet.toast.insufficient_funds"));
      return;
    }
    try {
      setSubmitting(true);
      const idempotencyKey = crypto.randomUUID();
      await api.post(`/api/projets/${ligne.projetId}/wallet/transferer`, {
        montant: montantNum,
        idempotencyKey,
      });
      toast.success(t("porteur.wallet.toast.transfer_success"));
      resetPanel();
      onActionDone();
    } catch (err: any) {
      toast.error(err.message || t("porteur.wallet.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) {
      toast.error(t("porteur.documents.toast.file_required"));
      return;
    }
    if (!docNom.trim()) {
      toast.error(t("porteur.documents.toast.name_required"));
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("nom", docNom);
      formData.append("type", "PDF");
      formData.append("description", docDescription);
      await api.post(`/api/documents/projet/${ligne.projetId}`, formData, true);
      toast.success(t("porteur.documents.toast.upload_success"));
      setDocFile(null);
      setDocNom("");
      setDocDescription("");
      resetPanel();
      onActionDone();
    } catch (err: any) {
      toast.error(err.message || t("porteur.wallet.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const acheterPremium = async (methode: "wallet" | "carte" | "mobile") => {
    setPremiumLoading(methode);
    try {
      if (methode === "wallet") {
        await api.post(`/api/projets/${ligne.projetId}/premium/wallet`);
        toast.success("Statut Premium activé !");
        resetPanel();
        onActionDone();
      } else {
        const response = await api.post<{ redirectUrl?: string; error?: string }>(
          `/api/projets/${ligne.projetId}/premium/${methode}`,
        );
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else {
          toast.error(response.error || "Erreur lors de la redirection");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'activation du Premium");
    } finally {
      setPremiumLoading(null);
    }
  };

  const collecteChart = ligne.historiqueCollecte.map((s) => ({
    dateLabel: new Date(s.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }),
    collecte: s.montantCollecte,
  }));

  const velociteChart = ligne.vitesseLevee.map((v) => ({
    periode: v.periode,
    montant: v.montant,
    nombre: v.nombreInvestissements,
  }));

  const statutLabel = t(`admin.projects_list.status.${ligne.statutProjet}`, {
    defaultValue: ligne.statutProjet,
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {ligne.projetPoster && (
              <img
                src={buildFileUrl(ligne.projetPoster)}
                alt={ligne.projetLibelleTradu || ligne.projetLibelle}
                className={styles.poster}
              />
            )}
            <div>
              <h2>{ligne.projetLibelleTradu || ligne.projetLibelle}</h2>
              <span className={styles.statutBadge}>{statutLabel}</span>
              {ligne.premiumActif && (
                <span
                  style={{
                    marginLeft: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                    color: "#ffc107",
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  <BsStarFill size={10} /> Premium
                </span>
              )}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* ── JAUGE OBJECTIF ── */}
          <div className={styles.gaugeBlock}>
            <div className={styles.gaugeTop}>
              <span className={styles.gaugeLabel}>
                <FiTarget size={14} /> {t("porteur.card.goal_progress")}
              </span>
              <span className={styles.gaugePct}>
                {ligne.progressionPourcent.toFixed(0)}%
              </span>
            </div>
            <div className={styles.gaugeBar}>
              <div
                className={styles.gaugeFill}
                style={{
                  width: `${Math.min(ligne.progressionPourcent, 100)}%`,
                }}
              />
            </div>
            <div className={styles.gaugeAmounts}>
              <strong>{format(ligne.montantCollecte, "XOF")}</strong>
              <span>/ {format(ligne.objectifFinancement, "XOF")}</span>
            </div>
          </div>

          {/* ── STATS AGRÉGÉES ── */}
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <FiUsers size={16} />
              <span>{t("porteur.card.investors")}</span>
              <strong>{ligne.nombreInvestisseurs}</strong>
            </div>
            <div className={styles.statBox}>
              <FiDollarSign size={16} />
              <span>{t("porteur.card.avg_investment")}</span>
              <strong>
                {format(ligne.montantMoyenParInvestisseur, "XOF")}
              </strong>
            </div>
            <div className={styles.statBox}>
              <FiGift size={16} />
              <span>{t("porteur.card.dividends_paid")}</span>
              <strong>{format(ligne.totalDividendesVerses, "XOF")}</strong>
            </div>
          </div>

          {/* ── WALLET ── */}
          <div className={styles.walletRow}>
            <div className={styles.walletItem}>
              <span>{t("porteur.card.available")}</span>
              <strong className={styles.walletAvailable}>
                {format(ligne.soldeDisponibleWallet, "XOF")}
              </strong>
            </div>
            <div className={styles.walletItem}>
              <span>{t("porteur.card.blocked")}</span>
              <strong className={styles.walletBlocked}>
                {format(ligne.soldeBloqueWallet, "XOF")}
              </strong>
            </div>
          </div>

          {/* ── ACTIONS TRÉSORERIE (retrait / transfert du soldeDisponible) ── */}
          <div className={styles.walletActions}>
            <button
              className={styles.walletActionBtn}
              disabled={ligne.soldeDisponibleWallet <= 0}
              onClick={() => setPanel(panel === "retrait" ? null : "retrait")}
            >
              <FiSend size={14} /> {t("porteur.wallet.withdraw_btn")}
            </button>
            <button
              className={styles.walletActionBtn}
              disabled={ligne.soldeDisponibleWallet <= 0}
              onClick={() =>
                setPanel(panel === "transfert" ? null : "transfert")
              }
            >
              <FiArrowRightCircle size={14} />{" "}
              {t("porteur.wallet.transfer_btn")}
            </button>
            <button
              className={styles.walletActionBtn}
              onClick={() => setPanel(panel === "document" ? null : "document")}
            >
              <FiUpload size={14} /> {t("porteur.documents.upload_btn")}
            </button>
            {ligne.statutProjet === "VALIDE" && !ligne.premiumActif && (
              <button
                className={styles.walletActionBtn}
                style={{
                  background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                  color: "#ffc107",
                  border: "none",
                }}
                onClick={() => setPanel(panel === "premium" ? null : "premium")}
              >
                <BsStarFill size={14} /> Passer en Premium
              </button>
            )}
          </div>
          {ligne.premiumActif && ligne.premiumFin && (
            <p style={{ fontSize: "0.82rem", color: "#666", margin: "-8px 0 4px" }}>
              Premium actif jusqu'au{" "}
              {new Date(ligne.premiumFin).toLocaleDateString("fr-FR")}
            </p>
          )}

          {panel === "retrait" && (
            <div className={styles.walletPanel}>
              <p className={styles.walletPanelHint}>
                {t("porteur.wallet.withdraw_hint")}
              </p>
              <label>{t("porteur.wallet.amount_label")}</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                max={ligne.soldeDisponibleWallet}
              />
              <label>{t("porteur.wallet.phone_label")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+22670123456"
              />
              <div className={styles.walletPanelActions}>
                <button
                  onClick={resetPanel}
                  className={styles.walletPanelCancel}
                >
                  {t("porteur.wallet.cancel")}
                </button>
                <button
                  onClick={handleRetrait}
                  disabled={submitting}
                  className={styles.walletPanelConfirm}
                >
                  {submitting
                    ? t("porteur.wallet.processing")
                    : t("porteur.wallet.confirm_withdraw")}
                </button>
              </div>
            </div>
          )}
          {panel === "document" && (
            <div className={styles.walletPanel}>
              <p className={styles.walletPanelHint}>
                {t("porteur.documents.upload_hint")}
              </p>
              <label>{t("porteur.documents.name_label")}</label>
              <input
                type="text"
                value={docNom}
                onChange={(e) => setDocNom(e.target.value)}
                placeholder={t("porteur.documents.name_placeholder") || ""}
              />
              <label>{t("porteur.documents.description_label")}</label>
              <textarea
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder={
                  t("porteur.documents.description_placeholder") || ""
                }
                rows={3}
              />
              <label>{t("porteur.documents.file_label")}</label>
              <input
                type="file"
                accept=".pdf,.xls,.xlsx,.csv"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
              <div className={styles.walletPanelActions}>
                <button
                  onClick={resetPanel}
                  className={styles.walletPanelCancel}
                >
                  {t("porteur.wallet.cancel")}
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={submitting}
                  className={styles.walletPanelConfirm}
                >
                  {submitting
                    ? t("porteur.wallet.processing")
                    : t("porteur.documents.confirm_upload")}
                </button>
              </div>
            </div>
          )}

          {panel === "premium" && (
            <div className={styles.walletPanel}>
              <p className={styles.walletPanelHint}>
                Mets ce projet en tête du catalogue pendant <strong>3 mois</strong> pour{" "}
                <strong>{PRIX_PREMIUM.toLocaleString("fr-FR")} FCFA</strong>.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => acheterPremium("wallet")}
                  disabled={premiumLoading !== null}
                  className={styles.walletPanelConfirm}
                  style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                >
                  <FiDollarSign size={14} />
                  {premiumLoading === "wallet" ? "Traitement..." : "Payer avec mon Wallet GrowzApp"}
                </button>
                <button
                  onClick={() => acheterPremium("mobile")}
                  disabled={premiumLoading !== null}
                  className={styles.walletPanelConfirm}
                  style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                >
                  <FiSmartphone size={14} />
                  {premiumLoading === "mobile" ? "Redirection..." : "Payer par Mobile Money"}
                </button>
                <button
                  onClick={() => acheterPremium("carte")}
                  disabled={premiumLoading !== null}
                  className={styles.walletPanelConfirm}
                  style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                >
                  <FiCreditCard size={14} />
                  {premiumLoading === "carte" ? "Redirection..." : "Payer par carte bancaire"}
                </button>
                <button onClick={resetPanel} className={styles.walletPanelCancel}>
                  {t("porteur.wallet.cancel")}
                </button>
              </div>
            </div>
          )}

          {panel === "transfert" && (
            <div className={styles.walletPanel}>
              <p className={styles.walletPanelHint}>
                {t("porteur.wallet.transfer_hint")}
              </p>
              <label>{t("porteur.wallet.amount_label")}</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                max={ligne.soldeDisponibleWallet}
              />
              <div className={styles.walletPanelActions}>
                <button
                  onClick={resetPanel}
                  className={styles.walletPanelCancel}
                >
                  {t("porteur.wallet.cancel")}
                </button>
                <button
                  onClick={handleTransfert}
                  disabled={submitting}
                  className={styles.walletPanelConfirm}
                >
                  {submitting
                    ? t("porteur.wallet.processing")
                    : t("porteur.wallet.confirm_transfer")}
                </button>
              </div>
            </div>
          )}

          {/* ── GRAPHIQUE COLLECTE AGRANDI ── */}
          <div className={styles.chartBlock}>
            <h3>{t("porteur.card.collection_evolution")}</h3>
            {collecteChart.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={collecteChart}>
                  <defs>
                    <linearGradient
                      id="modalCollecte"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#1B5E20" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1B5E20" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number | undefined) => format(v ?? 0, "XOF")}
                  />
                  <Area
                    type="monotone"
                    dataKey="collecte"
                    stroke="#1B5E20"
                    strokeWidth={2.5}
                    fill="url(#modalCollecte)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>{t("porteur.card.no_data")}</p>
            )}
          </div>

          {/* ── VITESSE DE LEVÉE AGRANDIE ── */}
          <div className={styles.chartBlock}>
            <h3>{t("porteur.card.velocity")}</h3>
            {velociteChart.length >= 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={velociteChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number | undefined) => format(v ?? 0, "XOF")}
                  />
                  <Bar dataKey="montant" fill="#FFC107" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>{t("porteur.card.no_data")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
