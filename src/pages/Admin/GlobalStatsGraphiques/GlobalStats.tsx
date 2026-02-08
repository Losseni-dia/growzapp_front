import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiDollarSign, FiDownload, FiPieChart, FiTarget, FiTrendingUp, FiUsers } from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from "recharts";
import { api } from "../../../service/Api";
import styles from "./GlobalStats.module.css";

export default function AdminStatsPanel() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  api
    .get<any>("api/admin/dashboard-stats")
    .then((res) => {
      // Sécurité : on vérifie que res ET res.data existent
      if (res && res.data) {
        setStats(res.data);
      } else {
        // Si res.data est vide, on initialise avec des valeurs par défaut
        console.warn("Stats reçues vides, initialisation par défaut");
        setStats({
          evolution: [],
          secteurs: {},
          totalCollecte: 0,
          totalObjectif: 0,
          countUsers: 0,
        });
      }
    })
    .catch((err) => {
      console.error("Erreur stats:", err);
      // FORCE l'affichage même en cas d'erreur API (très utile pour Storybook)
      setStats({
        totalCollecte: 0,
        totalObjectif: 0,
        countUsers: 0,
        secteurs: {},
        evolution: [],
      });
    });
}, []);
  // Exportation Ultra-HD (Zéro flou)
  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;

    // Attente de la fin des animations Recharts pour capturer l'état final
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(dashboardRef.current, {
      scale: 4, // Super-échantillonnage pour éliminer le flou
      useCORS: true,
      backgroundColor: "#f8fafc",
      logging: false,
      onclone: (clonedDoc) => {
        const el = clonedDoc.querySelector(`.${styles.dashboard}`) as HTMLElement;
        if (el) {
          // Force le lissage des polices sur le clone pour la capture
          (el.style as any).webkitFontSmoothing = "antialiased";
          (el.style as any).mozOsxFontSmoothing = "grayscale";
        }
      }
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // En-tête vectoriel (Toujours 100% net car généré par jsPDF, pas html2canvas)
    pdf.setFillColor(27, 94, 32);
    pdf.rect(0, 0, pdfWidth, 25, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("GROWZAPP - ADMINISTRATIVE REPORT", 12, 12);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 12, 18);

    // Image du dashboard placée sous l'en-tête
    pdf.addImage(imgData, "JPEG", 0, 25, pdfWidth, pdfHeight, undefined, 'SLOW');
    pdf.save(`Growzapp_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!stats) return <div className={styles.loading}>{t("admin.settings.loading_stats")}</div>;

  // Analyse Secteur Leader
  const secteursArray = Object.entries(stats.secteurs || {}).map(([name, count]) => ({ 
    name, 
    count: count as number 
  }));
  const topSecteur = secteursArray.length > 0 
    ? secteursArray.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : null;

  const tauxCompletion = stats.totalObjectif > 0 
    ? Math.round((stats.totalCollecte / stats.totalObjectif) * 100) 
    : 0;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.exportHeader}>
        <button onClick={handleDownloadPDF} className={styles.btnExport}>
          <FiDownload /> {t("admin.settings.btn_export_pdf")}
        </button>
      </div>

      <div ref={dashboardRef} className={styles.dashboard}>
        {/* 1. KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.card}>
            <div className={styles.icon}><FiDollarSign /></div>
            <div>
              <h3>{stats.totalCollecte?.toLocaleString()} €</h3>
              <p>{t("admin.settings.total_collecte")}</p>
            </div>
          </div>
          <div className={styles.card}>
            <div className={`${styles.icon} ${styles.blue}`}><FiTarget /></div>
            <div>
              <h3>{tauxCompletion}%</h3>
              <p>{t("admin.settings.global_goal")}</p>
            </div>
          </div>
          <div className={styles.card}>
            <div className={`${styles.icon} ${styles.gold}`}><FiUsers /></div>
            <div>
              <h3>{stats.countUsers?.toLocaleString()}</h3>
              <p>{t("admin.settings.members_count")}</p>
            </div>
          </div>
        </div>

        {/* 2. Middle Section: BarChart + Analytics Insight */}
        <div className={styles.bottomGrid}>
          <div className={styles.chartBox}>
            <div className={styles.insightHeader}>
              <FiPieChart className={styles.insightIcon} />
              <h3>{t("admin.settings.sector_distribution")}</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={secteursArray}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#4CAF50" radius={[8, 8, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className={styles.chartBox}>
             <div className={styles.insightHeader}>
                <FiTrendingUp className={styles.insightIcon} />
                <h3>{t("admin.settings.performance_analysis") || "Analyse de Performance"}</h3>
             </div>
             <div className={styles.insightContent}>
                {topSecteur ? (
                  <>
                    <p>Le secteur <strong>{topSecteur.name}</strong> est le plus performant avec <strong>{topSecteur.count} projets</strong>.</p>
                    <div className={styles.leaderBadge}>🏆 {topSecteur.name}</div>
                  </>
                ) : (
                  <p>Collecte des données...</p>
                )}
                <hr className={styles.divider} />
                <p className={styles.smallInfo}>Données cumulées en temps réel.</p>
             </div>
          </div>
        </div>

        {/* 3. Bottom: Full Width Evolution Curve */}
        <div className={styles.chartBoxBottom}>
          <div className={styles.chartHeader}>
            <h3>{t("admin.settings.investment_evolution")}</h3>
            <span className={styles.badge}>{t("admin.settings.real_time")}</span>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={stats.evolution}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1B5E20" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} interval="preserveStartEnd" minTickGap={30} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(v: number) => `${v?.toLocaleString() || 0}€`} />
              <Tooltip 
                formatter={(value: any) => [`${Number(value || 0).toLocaleString()} €`, "Total Cumulé"]}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} 
              />
              <Area type="monotone" dataKey="montant" stroke="#1B5E20" strokeWidth={4} fill="url(#colorPrice)" animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}