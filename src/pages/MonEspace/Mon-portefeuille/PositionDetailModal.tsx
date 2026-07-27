// src/pages/MonEspace/Mon-portefeuille/PositionDetailModal.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
  FiGift,
  FiCalendar,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import type { PortefeuilleLigneDTO } from "../../../types/portefeuille";
import styles from "./PositionDetailModal.module.css";

interface Props {
  ligne: PortefeuilleLigneDTO;
  onClose: () => void;
}

export default function PositionDetailModal({ ligne, onClose }: Props) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const positive = ligne.performancePourcent >= 0;
  const prixEntree = ligne.montantInvesti / ligne.nombrePartsPris;

  const chartData = ligne.historiqueValorisation.map((s) => ({
    dateLabel: new Date(s.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }),
    valorisation: s.montantValorisation,
    type: s.typeEvenement,
  }));

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
              <span
                className={`${styles.perfBadge} ${positive ? styles.badgePositive : styles.badgeNegative}`}
              >
                {positive ? (
                  <FiTrendingUp size={14} />
                ) : (
                  <FiTrendingDown size={14} />
                )}
                {positive ? "+" : ""}
                {ligne.performancePourcent.toFixed(1)}%
              </span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* ── GRAPHIQUE AGRANDI ── */}
          <div className={styles.chartBlock}>
            <h3>{t("portfolio.modal.chart_title")}</h3>
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="modalValeur"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={positive ? "#1B5E20" : "#c0392b"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={positive ? "#1B5E20" : "#c0392b"}
                        stopOpacity={0}
                      />
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
                  />
                  <Area
                    type="monotone"
                    dataKey="valorisation"
                    stroke={positive ? "#1B5E20" : "#c0392b"}
                    strokeWidth={2.5}
                    fill="url(#modalValeur)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>{t("portfolio.modal.no_data")}</p>
            )}
          </div>

          {/* ── DÉTAIL FINANCIER ── */}
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span>{t("portfolio.modal.entry_price")}</span>
              <strong>{format(prixEntree, "XOF")}</strong>
            </div>
            <div className={styles.statBox}>
              <span>{t("portfolio.modal.shares_held")}</span>
              <strong>{ligne.nombrePartsPris}</strong>
            </div>
            <div className={styles.statBox}>
              <span>{t("portfolio.modal.equity_pct")}</span>
              <strong>{ligne.pourcentageDetenu.toFixed(2)}%</strong>
            </div>
            <div className={styles.statBox}>
              <span>{t("portfolio.modal.invested_amount")}</span>
              <strong>{format(ligne.montantInvesti, "XOF")}</strong>
            </div>
            <div className={styles.statBox}>
              <span>{t("portfolio.modal.current_valuation")}</span>
              <strong>{format(ligne.valorisationActuelle, "XOF")}</strong>
            </div>
            <div className={styles.statBox}>
              <span>{t("portfolio.modal.position_value")}</span>
              <strong>{format(ligne.valeurPositionActuelle, "XOF")}</strong>
            </div>
          </div>

          {/* ── DIVIDENDES ── */}
          <div className={styles.dividendesBlock}>
            <h3>
              <FiGift size={16} /> {t("portfolio.modal.dividends_title")} (
              {format(ligne.dividendesPercus, "XOF")}{" "}
              {t("portfolio.modal.dividends_total_suffix")})
            </h3>
            {ligne.dividendesDetail.length === 0 ? (
              <p className={styles.noData}>
                {t("portfolio.modal.no_dividends")}
              </p>
            ) : (
              <div className={styles.dividendesList}>
                {ligne.dividendesDetail.map((d) => (
                  <div key={d.id} className={styles.dividendeRow}>
                    <span className={styles.dividendeDate}>
                      <FiCalendar size={13} />
                      {d.datePaiement
                        ? new Date(d.datePaiement).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                    <span className={styles.dividendeMotif}>
                      {d.motif || "—"}
                    </span>
                    <span className={styles.dividendeMontant}>
                      +{format(d.montantTotal, "XOF")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ÉVÉNEMENTS ── */}
          <div className={styles.eventsBlock}>
            <h3>{t("portfolio.modal.events_title")}</h3>
            <div className={styles.eventsList}>
              {ligne.historiqueValorisation
                .slice()
                .reverse()
                .map((ev, idx) => (
                  <div key={idx} className={styles.eventRow}>
                    <span className={styles.eventDate}>
                      {new Date(ev.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className={styles.eventType}>
                      {t(`portfolio.events.${ev.typeEvenement}`, {
                        defaultValue: ev.typeEvenement,
                      })}
                    </span>
                    {ev.montantEvenement != null && (
                      <span className={styles.eventAmount}>
                        {format(ev.montantEvenement, "XOF")}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Link to={`/projet/${ligne.projetId}`} className={styles.btnProjet}>
            {t("portfolio.modal.view_project")} <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
