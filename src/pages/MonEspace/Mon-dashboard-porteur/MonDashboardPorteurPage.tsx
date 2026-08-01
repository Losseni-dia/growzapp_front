// src/pages/MonEspace/Mon-dashboard-porteur/MonDashboardPorteurPage.tsx
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
    FiDollarSign,
    FiGift,
    FiPackage,
    FiSearch,
    FiTarget,
    FiTrendingUp,
    FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildFileUrl, buildProjetUrl } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import type {
    PorteurDashboardDTO,
    PorteurProjetLigneDTO,
} from "../../../types/porteurDashboard";
import styles from "./MonDashboardPorteurPage.module.css";
import ProjetPorteurDetailModal from "./ProjetPorteurDetailModal";

// Normalisation : retire accents + met en minuscule, pour une recherche
// insensible à la casse et aux accents (ex: "ferme" == "Ferme" == "FÉRME")
const normalize = (str: string): string =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

type SortKey = "invested" | "investors" | "alpha";

function ProjetPorteurCard({
  ligne,
  onClick,
}: {
  ligne: PorteurProjetLigneDTO;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const collecteChart = ligne.historiqueCollecte.map((s) => ({
    dateLabel: new Date(s.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    }),
    collecte: s.montantCollecte,
  }));

  const velociteChart = ligne.vitesseLevee.map((v) => ({
    periode: v.periode,
    montant: v.montant,
  }));

  const statutLabel = t(`admin.projects_list.status.${ligne.statutProjet}`, {
    defaultValue: ligne.statutProjet,
  });

  return (
    <div
      className={styles.projetCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={styles.projetHeader}>
        {ligne.projetPoster && (
          <img
            src={buildFileUrl(ligne.projetPoster)}
            alt={ligne.projetLibelleTradu || ligne.projetLibelle}
            className={styles.projetPoster}
          />
        )}
        <div className={styles.projetTitleBlock}>
          <h3>{ligne.projetLibelleTradu || ligne.projetLibelle}</h3>
          <span className={styles.statutBadge}>{statutLabel}</span>
        </div>
      </div>

      {/* ── JAUGE OBJECTIF ── */}
      <div className={styles.gaugeBlock}>
        <div className={styles.gaugeTop}>
          <span className={styles.gaugeLabel}>
            <FiTarget size={13} /> {t("porteur.card.goal_progress")}
          </span>
          <span className={styles.gaugePct}>
            {ligne.progressionPourcent.toFixed(0)}%
          </span>
        </div>
        <div className={styles.gaugeBar}>
          <div
            className={styles.gaugeFill}
            style={{ width: `${Math.min(ligne.progressionPourcent, 100)}%` }}
          />
        </div>
        <div className={styles.gaugeAmounts}>
          <strong>{format(ligne.montantCollecte, "XOF")}</strong>
          <span>/ {format(ligne.objectifFinancement, "XOF")}</span>
        </div>
      </div>

      {/* ── STATS AGRÉGÉES (anonymisées) ── */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <FiUsers size={15} />
          <div>
            <strong>{ligne.nombreInvestisseurs}</strong>
            <span>{t("porteur.card.investors")}</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <FiDollarSign size={15} />
          <div>
            <strong>{format(ligne.montantMoyenParInvestisseur, "XOF")}</strong>
            <span>{t("porteur.card.avg_investment")}</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <FiGift size={15} />
          <div>
            <strong>{format(ligne.totalDividendesVerses, "XOF")}</strong>
            <span>{t("porteur.card.dividends_paid")}</span>
          </div>
        </div>
      </div>

      {/* ── TRÉSORERIE (chiffres uniquement, aucun lien de gestion) ── */}
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

      {/* ── GRAPHIQUES ── */}
      <div className={styles.chartsGrid}>
        <div className={styles.miniChart}>
          <span className={styles.miniChartTitle}>
            {t("porteur.card.collection_evolution")}
          </span>
          {collecteChart.length >= 2 ? (
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={collecteChart}>
                <defs>
                  <linearGradient
                    id={`collecte-${ligne.projetId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#1B5E20" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1B5E20" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dateLabel" tick={{ fontSize: 9 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number | undefined) => format(v ?? 0, "XOF")}
                />
                <Area
                  type="monotone"
                  dataKey="collecte"
                  stroke="#1B5E20"
                  strokeWidth={2}
                  fill={`url(#collecte-${ligne.projetId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.noData}>{t("porteur.card.no_data")}</p>
          )}
        </div>

        <div className={styles.miniChart}>
          <span className={styles.miniChartTitle}>
            {t("porteur.card.velocity")}
          </span>
          {velociteChart.length >= 1 ? (
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={velociteChart}>
                <XAxis dataKey="periode" tick={{ fontSize: 9 }} />
                <YAxis hide />
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
  );
}

export default function MonDashboardPorteurPage() {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const [dashboard, setDashboard] = useState<PorteurDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [projetSelectionneId, setProjetSelectionneId] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("invested");

  const projetsAffiches = useMemo(() => {
    const projets = dashboard?.projets ?? [];
    const term = normalize(search);
    const filtres = term
      ? projets.filter(
          (p) =>
            normalize(p.projetLibelle).includes(term) ||
            normalize(p.projetLibelleTradu || "").includes(term),
        )
      : projets;

    return [...filtres].sort((a, b) => {
      switch (sortBy) {
        case "investors":
          return b.nombreInvestisseurs - a.nombreInvestisseurs;
        case "alpha":
          return (a.projetLibelleTradu || a.projetLibelle).localeCompare(
            b.projetLibelleTradu || b.projetLibelle,
          );
        case "invested":
        default:
          return b.montantCollecte - a.montantCollecte;
      }
    });
  }, [dashboard, search, sortBy]);

  const fetchDashboard = () => {
    return api
      .get<ApiResponse<PorteurDashboardDTO>>(
        buildProjetUrl("/api/projets/mes-projets/dashboard-porteur"),
      )
      .then((res) => setDashboard(res.data))
      .catch(() => toast.error(t("dashboard.loading")));
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboard().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.language]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (!dashboard || dashboard.nombreProjets === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FiPackage size={48} />
          <h2>{t("porteur.empty")}</h2>
          <Link to="/projet/creer" className={styles.btnCreer}>
            {t("create_project")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("porteur.title")}</h1>
        <p>
          {t(
            dashboard.nombreProjets > 1
              ? "porteur.subtitle_plural"
              : "porteur.subtitle",
            { count: dashboard.nombreProjets },
          )}
        </p>
      </div>

      {/* ═══════════ KPIs GLOBAUX ═══════════ */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiTrendingUp size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("porteur.kpi.total_collected")}
            </span>
            <span className={styles.kpiValue}>
              {format(dashboard.totalCollecteTousProjets, "XOF")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiUsers size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("porteur.kpi.total_investors")}
            </span>
            <span className={styles.kpiValue}>
              {dashboard.totalInvestisseursTousProjets}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiGift size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("porteur.kpi.total_dividends")}
            </span>
            <span className={styles.kpiValue}>
              {format(dashboard.totalDividendesVersesTousProjets, "XOF")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiPackage size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("porteur.kpi.projects_count")}
            </span>
            <span className={styles.kpiValue}>{dashboard.nombreProjets}</span>
          </div>
        </div>
      </div>

      {/* ═══════════ PROJETS ═══════════ */}
      <section className={styles.projetsSection}>
        <div className={styles.projetsSectionHeader}>
          <h2 className={styles.sectionTitle}>{t("porteur.projects_title")}</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <FiSearch size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t("porteur.search_placeholder") as string}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className={styles.sortSelect}
            >
              <option value="invested">{t("porteur.sort.invested")}</option>
              <option value="investors">{t("porteur.sort.investors")}</option>
              <option value="alpha">{t("porteur.sort.alpha")}</option>
            </select>
          </div>
        </div>

        {projetsAffiches.length === 0 ? (
          <p className={styles.noResults}>{t("porteur.search_empty")}</p>
        ) : (
          <div className={styles.projetsGrid}>
            {projetsAffiches.map((ligne) => (
              <ProjetPorteurCard
                key={ligne.projetId}
                ligne={ligne}
                onClick={() => setProjetSelectionneId(ligne.projetId)}
              />
            ))}
          </div>
        )}
      </section>

      {projetSelectionneId != null && (() => {
        const ligne = dashboard.projets.find(
          (p) => p.projetId === projetSelectionneId,
        );
        if (!ligne) return null;
        return (
          <ProjetPorteurDetailModal
            ligne={ligne}
            onClose={() => setProjetSelectionneId(null)}
            onActionDone={fetchDashboard}
          />
        );
      })()}
    </div>
  );
}
