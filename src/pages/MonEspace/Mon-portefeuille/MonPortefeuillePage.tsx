// src/pages/MonEspace/Mon-portefeuille/MonPortefeuillePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiGift,
  FiPieChart,
  FiArrowRight,
  FiBarChart2,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api, buildProjetUrl } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import type {
  PortefeuilleDTO,
  PortefeuilleLigneDTO,
} from "../../../types/portefeuille";
import PositionDetailModal from "./PositionDetailModal";
import styles from "./MonPortefeuillePage.module.css";

const DONUT_COLORS = [
  "#1B5E20",
  "#FFC107",
  "#2E7D32",
  "#f57f17",
  "#4CAF50",
  "#c9a227",
  "#66BB6A",
  "#a1887f",
];

// ── Reconstruit une timeline agrégée du portefeuille dans le temps ──────────
function buildPortfolioTimeline(lignes: PortefeuilleLigneDTO[]) {
  if (lignes.length === 0) return [];

  const dateSet = new Set<string>();
  lignes.forEach((l) => {
    dateSet.add(l.dateInvestissement);
    l.historiqueValorisation.forEach((s) => dateSet.add(s.date));
  });
  dateSet.add(new Date().toISOString());

  const dates = Array.from(dateSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  return dates.map((dateStr) => {
    const t = new Date(dateStr).getTime();
    let valeurTotale = 0;
    let investiTotal = 0;

    lignes.forEach((ligne) => {
      const dateInv = new Date(ligne.dateInvestissement).getTime();
      if (dateInv > t) return;

      investiTotal += ligne.montantInvesti;

      const snapshotsAvant = ligne.historiqueValorisation
        .filter((s) => new Date(s.date).getTime() <= t)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

      const derniereValorisation =
        snapshotsAvant.length > 0
          ? snapshotsAvant[0].montantValorisation
          : ligne.montantInvesti / (ligne.pourcentageDetenu / 100 || 1);

      valeurTotale += (derniereValorisation * ligne.pourcentageDetenu) / 100;
    });

    return {
      date: dateStr,
      dateLabel: new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
      valeur: Math.round(valeurTotale),
      investi: Math.round(investiTotal),
    };
  });
}

function MiniSparkline({ ligne }: { ligne: PortefeuilleLigneDTO }) {
  const data = ligne.historiqueValorisation.map((s) => ({
    v: s.montantValorisation,
  }));
  if (data.length < 2) return null;
  const positive = ligne.performancePourcent >= 0;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id={`spark-${ligne.investissementId}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={positive ? "#1B5E20" : "#c0392b"}
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor={positive ? "#1B5E20" : "#c0392b"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={positive ? "#1B5E20" : "#c0392b"}
          strokeWidth={2}
          fill={`url(#spark-${ligne.investissementId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function MonPortefeuillePage() {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const [portefeuille, setPortefeuille] = useState<PortefeuilleDTO | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [positionSelectionnee, setPositionSelectionnee] =
    useState<PortefeuilleLigneDTO | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<PortefeuilleDTO>>(
        buildProjetUrl("/api/investissements/mon-portefeuille"),
      )
      .then((res) => setPortefeuille(res.data))
      .catch(() => toast.error(t("dashboard.loading")))
      .finally(() => setLoading(false));
  }, [t, i18n.language]);

  const timeline = useMemo(
    () => (portefeuille ? buildPortfolioTimeline(portefeuille.lignes) : []),
    [portefeuille],
  );

  const allocation = useMemo(
    () =>
      (portefeuille?.lignes || []).map((l) => ({
        name: l.projetLibelleTradu || l.projetLibelle,
        value: l.valeurPositionActuelle,
      })),
    [portefeuille],
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (!portefeuille || portefeuille.nombrePositions === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FiBarChart2 size={48} />
          <h2>{t("user_investments.empty")}</h2>
          <Link to="/projets" className={styles.btnInvestir}>
            {t("user_investments.btn_discover")}
          </Link>
        </div>
      </div>
    );
  }

  const globalPositive = portefeuille.performanceGlobalePourcent >= 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("portfolio.title")}</h1>
        <p>
          {t(
            portefeuille.nombrePositions > 1
              ? "portfolio.subtitle_plural"
              : "portfolio.subtitle",
            { count: portefeuille.nombrePositions },
          )}
        </p>
      </div>

      {/* ═══════════ TICKER ═══════════ */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {portefeuille.lignes.concat(portefeuille.lignes).map((l, idx) => {
            const positive = l.performancePourcent >= 0;
            return (
              <div
                key={`${l.investissementId}-${idx}`}
                className={styles.tickerItem}
              >
                <span className={styles.tickerName}>
                  {l.projetLibelleTradu || l.projetLibelle}
                </span>
                <span
                  className={`${styles.tickerChange} ${positive ? styles.tickerUp : styles.tickerDown}`}
                >
                  {positive ? (
                    <FiTrendingUp size={13} />
                  ) : (
                    <FiTrendingDown size={13} />
                  )}
                  {positive ? "+" : ""}
                  {l.performancePourcent.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ KPIs ═══════════ */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiDollarSign size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("portfolio.kpi.capital_invested")}
            </span>
            <span className={styles.kpiValue}>
              {format(portefeuille.totalInvesti, "XOF")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiBarChart2 size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("portfolio.kpi.current_value")}
            </span>
            <span className={styles.kpiValue}>
              {format(portefeuille.valeurActuelleTotale, "XOF")}
            </span>
          </div>
        </div>

        <div
          className={`${styles.kpiCard} ${globalPositive ? styles.kpiCardPositive : styles.kpiCardNegative}`}
        >
          <div className={styles.kpiIcon}>
            {globalPositive ? (
              <FiTrendingUp size={18} />
            ) : (
              <FiTrendingDown size={18} />
            )}
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("portfolio.kpi.global_performance")}
            </span>
            <span className={styles.kpiValue}>
              {globalPositive ? "+" : ""}
              {portefeuille.performanceGlobalePourcent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiGift size={18} />
          </div>
          <div>
            <span className={styles.kpiLabel}>
              {t("portfolio.kpi.dividends_received")}
            </span>
            <span className={styles.kpiValue}>
              {format(portefeuille.totalDividendesPercus, "XOF")}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════ GRAPHIQUE ÉVOLUTION + DONUT ═══════════ */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3>{t("portfolio.chart.evolution_title")}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="valeurGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B5E20" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1B5E20" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="investiGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#FFC107" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#FFC107" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number | undefined) =>
                  format(value ?? 0, "XOF")
                }
                labelStyle={{ fontWeight: 700 }}
              />
              <Area
                type="monotone"
                dataKey="investi"
                name={t("portfolio.chart.legend_invested") as string}
                stroke="#FFC107"
                strokeWidth={2}
                fill="url(#investiGradient)"
              />
              <Area
                type="monotone"
                dataKey="valeur"
                name={t("portfolio.chart.legend_value") as string}
                stroke="#1B5E20"
                strokeWidth={2.5}
                fill="url(#valeurGradient)"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>
            <FiPieChart size={16} /> {t("portfolio.chart.allocation_title")}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {allocation.map((_, index) => (
                  <Cell
                    key={index}
                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) =>
                  format(value ?? 0, "XOF")
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══════════ POSITIONS ═══════════ */}
      <section className={styles.positionsSection}>
        <h2 className={styles.sectionTitle}>
          {t("portfolio.positions.section_title")}
        </h2>
        <div className={styles.positionsGrid}>
          {portefeuille.lignes.map((l) => {
            const positive = l.performancePourcent >= 0;
            return (
              <div
                key={l.investissementId}
                className={styles.positionCard}
                onClick={() => setPositionSelectionnee(l)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.positionHeader}>
                  {l.projetPoster && (
                    <img
                      src={l.projetPoster}
                      alt={l.projetLibelleTradu || l.projetLibelle}
                      className={styles.positionPoster}
                    />
                  )}
                  <div className={styles.positionTitleBlock}>
                    <h4>{l.projetLibelleTradu || l.projetLibelle}</h4>
                    <span
                      className={`${styles.positionBadge} ${positive ? styles.badgePositive : styles.badgeNegative}`}
                    >
                      {positive ? (
                        <FiTrendingUp size={12} />
                      ) : (
                        <FiTrendingDown size={12} />
                      )}
                      {positive ? "+" : ""}
                      {l.performancePourcent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <MiniSparkline ligne={l} />

                <div className={styles.positionStats}>
                  <div>
                    <span>{t("portfolio.positions.invested_label")}</span>
                    <strong>{format(l.montantInvesti, "XOF")}</strong>
                    <small className={styles.positionSubDetail}>
                      {l.nombrePartsPris}{" "}
                      {t(
                        l.nombrePartsPris > 1
                          ? "portfolio.positions.share_plural"
                          : "portfolio.positions.share",
                      )}{" "}
                      × {format(l.montantInvesti / l.nombrePartsPris, "XOF")}
                    </small>
                  </div>
                  <div>
                    <span>{t("portfolio.positions.current_value_label")}</span>
                    <strong>{format(l.valeurPositionActuelle, "XOF")}</strong>
                  </div>
                  <div>
                    <span>{t("portfolio.positions.dividends_label")}</span>
                    <strong>{format(l.dividendesPercus, "XOF")}</strong>
                  </div>
                </div>

                <Link
                  to={`/projet/${l.projetId}`}
                  className={styles.positionLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("portfolio.positions.view_project")}{" "}
                  <FiArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {positionSelectionnee && (
        <PositionDetailModal
          ligne={positionSelectionnee}
          onClose={() => setPositionSelectionnee(null)}
        />
      )}
    </div>
  );
}
