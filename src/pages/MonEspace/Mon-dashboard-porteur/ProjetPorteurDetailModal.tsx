// src/pages/MonEspace/Mon-dashboard-porteur/ProjetPorteurDetailModal.tsx
import { useTranslation } from "react-i18next";
import { FiX, FiUsers, FiDollarSign, FiGift, FiTarget } from "react-icons/fi";
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
import type { PorteurProjetLigneDTO } from "../../../types/porteurDashboard";
import styles from "./ProjetPorteurDetailModal.module.css";

interface Props {
  ligne: PorteurProjetLigneDTO;
  onClose: () => void;
}

export default function ProjetPorteurDetailModal({ ligne, onClose }: Props) {
  const { t } = useTranslation();
  const { format } = useCurrency();

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
                src={ligne.projetPoster}
                alt={ligne.projetLibelleTradu || ligne.projetLibelle}
                className={styles.poster}
              />
            )}
            <div>
              <h2>{ligne.projetLibelleTradu || ligne.projetLibelle}</h2>
              <span className={styles.statutBadge}>{statutLabel}</span>
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

          {/* ── WALLET (chiffres uniquement, pas de lien de gestion) ── */}
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
