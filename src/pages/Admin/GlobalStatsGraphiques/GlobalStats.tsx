// src/pages/Admin/GlobalStatsGraphiques/GlobalStats.tsx
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  FiDollarSign,
  FiDownload,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiPackage,
  FiGift,
  FiArrowRight,
  FiPieChart,
  FiBarChart2,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api, buildProjetUrl } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import type { AdminGlobalDashboardDTO } from "../../../types/adminGlobalDashboard";
import styles from "./GlobalStats.module.css";

const DONUT_COLORS = [
  "#1B5E20",
  "#FFC107",
  "#2E7D32",
  "#c0392b",
  "#4CAF50",
  "#9aa5a0",
];

export default function AdminStatsPanel() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [stats, setStats] = useState<AdminGlobalDashboardDTO | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<any>(buildProjetUrl("api/admin/dashboard-stats/global"))
      .then((res) => {
        if (res && res.data) {
          setStats(res.data);
        }
      })
      .catch((err) => console.error("Erreur stats globales:", err));
  }, []);

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const canvas = await html2canvas(dashboardRef.current, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#f8fafc",
      logging: false,
      onclone: (clonedDoc) => {
        const el = clonedDoc.querySelector(
          `.${styles.dashboard}`,
        ) as HTMLElement;
        if (el) {
          (el.style as any).webkitFontSmoothing = "antialiased";
          (el.style as any).mozOsxFontSmoothing = "grayscale";
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFillColor(27, 94, 32);
    pdf.rect(0, 0, pdfWidth, 25, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("GROWZAPP - ADMINISTRATIVE REPORT", 12, 12);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 12, 18);

    pdf.addImage(
      imgData,
      "JPEG",
      0,
      25,
      pdfWidth,
      pdfHeight,
      undefined,
      "SLOW",
    );
    pdf.save(
      `Growzapp_Analytics_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  if (!stats)
    return (
      <div className={styles.loading}>{t("admin.settings.loading_stats")}</div>
    );

  const secteursArray = Object.entries(stats.repartitionParSecteur || {}).map(
    ([name, count]) => ({ name, count }),
  );

  const statutsArray = Object.entries(stats.repartitionParStatut || {}).map(
    ([name, count]) => ({
      name: t(`admin.dashboard_global.status.${name}`, { defaultValue: name }),
      value: count,
    }),
  );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.exportHeader}>
        <button onClick={handleDownloadPDF} className={styles.btnExport}>
          <FiDownload /> {t("admin.settings.btn_export_pdf")}
        </button>
      </div>

      <div ref={dashboardRef} className={styles.dashboard}>
        {/* ═══════════ KPIs GLOBAUX ═══════════ */}
        <div className={styles.kpiGrid}>
          <Link to="/admin/project-wallets" className={styles.card}>
            <div className={styles.icon}>
              <FiDollarSign />
            </div>
            <div>
              <h3>{format(stats.kpis.totalCollecte, "XOF")}</h3>
              <p>{t("admin.dashboard_global.kpi_total_collected")}</p>
            </div>
          </Link>
          <Link to="/admin/projets" className={styles.card}>
            <div className={`${styles.icon} ${styles.blue}`}>
              <FiTarget />
            </div>
            <div>
              <h3>{stats.kpis.tauxCompletionGlobal.toFixed(0)}%</h3>
              <p>{t("admin.dashboard_global.kpi_global_goal")}</p>
            </div>
          </Link>
          <Link to="/admin/users" className={styles.card}>
            <div className={`${styles.icon} ${styles.gold}`}>
              <FiUsers />
            </div>
            <div>
              <h3>{stats.kpis.countUsers.toLocaleString()}</h3>
              <p>{t("admin.dashboard_global.kpi_members")}</p>
            </div>
          </Link>
          <Link to="/admin/projets" className={styles.card}>
            <div className={`${styles.icon} ${styles.purple}`}>
              <FiPackage />
            </div>
            <div>
              <h3>{stats.kpis.countProjetsActifs}</h3>
              <p>{t("admin.dashboard_global.kpi_active_projects")}</p>
            </div>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — INVESTISSEMENTS
           ═══════════════════════════════════════════════════════ */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionTitle}>
            <FiTrendingUp />
            <h2>{t("admin.dashboard_global.section_investments")}</h2>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.miniStat}>
              <span>{t("admin.dashboard_global.stat_valid_investments")}</span>
              <strong>{stats.kpis.countInvestissements}</strong>
            </div>
            <div className={styles.miniStat}>
              <span>{t("admin.dashboard_global.stat_unique_investors")}</span>
              <strong>{stats.kpis.countInvestisseursUniques}</strong>
            </div>
            <div className={styles.miniStat}>
              <span>{t("admin.dashboard_global.stat_avg_investment")}</span>
              <strong>
                {format(stats.kpis.montantMoyenInvestissement, "XOF")}
              </strong>
            </div>
          </div>

          <div className={styles.chartBoxBottom}>
            <div className={styles.chartHeader}>
              <h3>{t("admin.dashboard_global.chart_investments_evolution")}</h3>
              <span className={styles.badge}>
                {t("admin.settings.real_time")}
              </span>
            </div>
            {stats.evolutionInvestissements.length >= 2 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.evolutionInvestissements}>
                  <defs>
                    <linearGradient
                      id="colorInvest"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B5E20" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="periode"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      format(value ?? 0, "XOF")
                    }
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="#1B5E20"
                    strokeWidth={3}
                    fill="url(#colorInvest)"
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>
                {t("admin.dashboard_global.no_data")}
              </p>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — PROJETS
           ═══════════════════════════════════════════════════════ */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionTitle}>
            <FiPackage />
            <h2>{t("admin.dashboard_global.section_projects")}</h2>
          </div>

          <div className={styles.bottomGrid}>
            <div className={styles.chartBox}>
              <div className={styles.insightHeader}>
                <FiBarChart2 className={styles.insightIcon} />
                <h3>{t("admin.settings.sector_distribution")}</h3>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={secteursArray}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f8fafc"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                  />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar
                    dataKey="count"
                    fill="#4CAF50"
                    radius={[8, 8, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartBox}>
              <div className={styles.insightHeader}>
                <FiPieChart className={styles.insightIcon} />
                <h3>{t("admin.dashboard_global.chart_status_distribution")}</h3>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={statutsArray}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {statutsArray.map((_, index) => (
                      <Cell
                        key={index}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.rankingsGrid}>
            <div className={styles.rankingBox}>
              <h3>{t("admin.dashboard_global.top_collection_title")}</h3>
              <div className={styles.rankingList}>
                {stats.topProjetsParCollecte.map((p, idx) => (
                  <Link
                    to={`/admin/projets/detail/${p.projetId}`}
                    key={p.projetId}
                    className={styles.rankingRow}
                  >
                    <span className={styles.rankingPosition}>{idx + 1}</span>
                    <span className={styles.rankingName}>
                      {p.libelleTradu || p.libelle}
                    </span>
                    <span className={styles.rankingValue}>
                      {format(p.montantCollecte, "XOF")}
                    </span>
                    <FiArrowRight size={13} className={styles.rankingArrow} />
                  </Link>
                ))}
              </div>
            </div>

            <div className={styles.rankingBox}>
              <h3>{t("admin.dashboard_global.top_progression_title")}</h3>
              <div className={styles.rankingList}>
                {stats.topProjetsParProgression.map((p, idx) => (
                  <Link
                    to={`/admin/projets/detail/${p.projetId}`}
                    key={p.projetId}
                    className={styles.rankingRow}
                  >
                    <span className={styles.rankingPosition}>{idx + 1}</span>
                    <span className={styles.rankingName}>
                      {p.libelleTradu || p.libelle}
                    </span>
                    <span className={styles.rankingValue}>
                      {p.progressionPourcent.toFixed(0)}%
                    </span>
                    <FiArrowRight size={13} className={styles.rankingArrow} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — DIVIDENDES
           ═══════════════════════════════════════════════════════ */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionTitle}>
            <FiGift />
            <h2>{t("admin.dashboard_global.section_dividends")}</h2>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.miniStat}>
              <span>{t("admin.dashboard_global.stat_total_paid")}</span>
              <strong>{format(stats.totalDividendesVerses, "XOF")}</strong>
            </div>
            <div className={styles.miniStat}>
              <span>{t("admin.dashboard_global.stat_payments_count")}</span>
              <strong>{stats.countDividendesVerses}</strong>
            </div>
          </div>

          <div className={styles.chartBoxBottom}>
            <div className={styles.chartHeader}>
              <h3>{t("admin.dashboard_global.chart_dividends_evolution")}</h3>
            </div>
            {stats.evolutionDividendes.length >= 1 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.evolutionDividendes}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number | undefined) => format(v ?? 0, "XOF")}
                  />
                  <Bar
                    dataKey="montant"
                    fill="#FFC107"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>
                {t("admin.dashboard_global.no_data")}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
