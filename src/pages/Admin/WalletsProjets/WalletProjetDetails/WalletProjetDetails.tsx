// src/pages/Admin/WalletsProjets/WalletProjetDetails/WalletProjetDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../../service/api";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../../components/context/CurrencyContext";
import styles from "./WalletProjetDetails.module.css";

export default function ProjectWalletDetailPage() {
  const { projetId } = useParams<{ projetId: string }>();
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [data, setData] = useState<any>(null);
  const [dividendes, setDividendes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    resume: true,
    dividendeGlobal: false,
    retrait: false,
    historiqueInvest: true,
    historiqueDividendes: true,
  });

  const [montantGlobal, setMontantGlobal] = useState("");
  const [motifGlobal, setMotifGlobal] = useState("");
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [projetId]);

  const fetchAllData = async () => {
    if (!projetId) return;
    try {
      setLoading(true);
      const [projetWrapper, walletRes, invRes, divRes] = await Promise.all([
        api.get<any>(`/api/projets/${projetId}`),
        api.get<any>(`/api/admin/projet-wallet/${projetId}`),
        api.get<any[]>(`/api/admin/projet-wallet/${projetId}/investissements`),
        api.get<any[]>(`/api/admin/projet-wallet/${projetId}/dividendes`),
      ]);
      const projetRes = projetWrapper.data || projetWrapper;
      setData({
        projet: {
          id: projetRes.id,
          libelle: projetRes.libelle,
          porteurNom: projetRes.porteurNom,
        },
        wallet: walletRes || {
          soldeDisponible: 0,
          soldeBloque: 0,
          soldeRetirable: 0,
        },
        investissements: invRes || [],
      });
      setDividendes(divRes || []);
    } catch (err: any) {
      toast.error(t("admin_wallet.toasts.load_error"));
    } finally {
      setLoading(false);
    }
  };

  const payerDividendes = async () => {
    const m = parseFloat(montantGlobal);
    if (isNaN(m) || m <= 0 || m > data.wallet.soldeDisponible)
      return toast.error(t("admin_wallet.toasts.invalid_amount"));

    setLoadingGlobal(true);
    try {
      await api.post(`/api/admin/projet-wallet/${projetId}/payer-dividende`, {
        montantTotal: m,
        motif: motifGlobal.trim(),
        periode: new Date().getFullYear().toString(),
      });
      toast.success(t("admin_wallet.toasts.dividend_success"));
      setMontantGlobal("");
      setMotifGlobal("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingGlobal(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>{t("admin_wallet.loading")}</div>;
  if (!data) return <div>{t("admin_wallet.not_found")}</div>;

  return (
    <div className={styles.container}>
      <Link to="/admin/project-wallets" className={styles.backLink}>
        ← {t("admin_wallet.back")}
      </Link>
      <h1 className={styles.title}>
        {t("admin_wallet.title")} – {data.projet.libelle}
      </h1>

      {/* SOLDES CONVERTIS */}
      <div className={styles.soldeDetailGrid}>
        <div className={styles.soldeCard}>
          <h3>{t("admin_wallet.balance.available")}</h3>
          <div className={styles.soldeAmount}>
            {format(data.wallet.soldeDisponible, "XOF")}
          </div>
        </div>
        <div className={styles.soldeCard}>
          <h3>{t("admin_wallet.balance.blocked")}</h3>
          <div className={styles.soldeAmountBloque}>
            {format(data.wallet.soldeBloque, "XOF")}
          </div>
        </div>
      </div>

      {/* ACCORDÉON INVESTISSEMENTS */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() =>
            setOpenSections((p) => ({
              ...p,
              historiqueInvest: !p.historiqueInvest,
            }))
          }
        >
          {t("admin_wallet.investments.title")} ({data.investissements.length})
        </h2>
        {openSections.historiqueInvest && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("admin_wallet.investments.col_investor")}</th>
                <th>{t("admin_wallet.investments.col_amount")}</th>
              </tr>
            </thead>
            <tbody>
              {data.investissements.map((inv: any) => (
                <tr key={inv.id}>
                  <td>{inv.investisseurNom}</td>
                  <td className={styles.amount}>
                    {format(inv.montantInvesti, "XOF")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ACCORDÉON DIVIDENDES (CORRIGÉ) */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() =>
            setOpenSections((p) => ({
              ...p,
              historiqueDividendes: !p.historiqueDividendes,
            }))
          }
        >
          {t("admin_wallet.history_dividends.title")} ({dividendes.length})
        </h2>
        {openSections.historiqueDividendes && (
          <table className={styles.table}>
            <thead>
              <tr>
                {/* Traductions pour l'en-tête */}
                <th>{t("admin_wallet.history_dividends.col_investor")}</th>
                <th>{t("admin_wallet.history_dividends.col_amount")}</th>
              </tr>
            </thead>
            <tbody>
              {dividendes.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: "#666",
                    }}
                  >
                    {t("admin_wallet.history_dividends.empty")}
                  </td>
                </tr>
              ) : (
                dividendes.map((d: any) => (
                  <tr key={d.id}>
                    <td>{d.investisseurNom}</td>
                    <td className={styles.amount}>
                      {format(d.montantTotal, "XOF")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
