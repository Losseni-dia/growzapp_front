// src/pages/Wallet/WalletPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import { api, getFreshToken } from "../../service/api";
import toast from "react-hot-toast";
import { format as formatDate } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/context/CurrencyContext";
import styles from "./WalletPage.module.css";

import type { WalletDTO } from "../../types/wallet";
import type { TransactionDTO } from "../../types/transaction";

interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
  image: string | null;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // States pour Dépôt
  const [depositMontant, setDepositMontant] = useState("");
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  // States pour Transfert
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [montantTransfer, setMontantTransfer] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [transferSource, setTransferSource] = useState<
    "DISPONIBLE" | "RETIRABLE"
  >("DISPONIBLE");

  // States pour Retrait Admin
  const [montantDemande, setMontantDemande] = useState("");
  const [loadingDemande, setLoadingDemande] = useState(false);

  // CHARGEMENT INITIAL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [walletRes, txRes] = await Promise.all([
          api.get<WalletDTO>("/api/wallets/solde"),
          api.get<TransactionDTO[]>("/api/transactions/mes-transactions"),
        ]);
        setWallet(walletRes);
        setTransactions(txRes || []);
      } catch (err) {
        toast.error(t("common.server_error"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // RECHERCHE UTILISATEUR POUR TRANSFERT
  useEffect(() => {
    if (searchUser.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<UserSearchResult[]>(
          `/api/auth/search?term=${encodeURIComponent(searchUser)}`
        );
        setSearchResults(res.filter((u) => u.id !== user?.id));
      } catch (err) {
        console.error(err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchUser, user?.id]);

  // TRI DE L'HISTORIQUE
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions]);

  // === HANDLERS ===
  const handleDeposit = async () => {
    const montant = parseFloat(depositMontant);
    if (isNaN(montant) || montant < 5)
      return toast.error(t("deposit.toast.min_error"));
    setLoadingDeposit(true);
    try {
      const token = getFreshToken() || "";
      const res = await fetch("http://localhost:8080/api/wallets/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ montant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDeposit(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser)
      return toast.error(t("wallet.actions.transfer_select_error"));
    const montant = parseFloat(montantTransfer);
    if (isNaN(montant) || montant <= 0)
      return toast.error(t("wallet.actions.transfer_amount_error"));
    try {
      const token = getFreshToken() || "";
      const res = await fetch("http://localhost:8080/api/wallets/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinataireUserId: selectedUser.id,
          montant,
          source: transferSource,
        }),
      });
      if (!res.ok) throw new Error("Transfert échoué");
      toast.success(t("wallet.actions.transfer_success"));
      // Reset & Refresh
      setMontantTransfer("");
      setSearchUser("");
      setSelectedUser(null);
      const walletRes = await api.get<WalletDTO>("/api/wallets/solde");
      setWallet(walletRes);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDemandeRetrait = async () => {
    const montant = parseFloat(montantDemande);
    if (isNaN(montant) || montant < 5 || montant > wallet!.soldeDisponible)
      return toast.error(t("deposit.toast.min_error"));
    setLoadingDemande(true);
    try {
      const token = getFreshToken() || "";
      const res = await fetch(
        "http://localhost:8080/api/wallets/demande-retrait",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ montant }),
        }
      );
      if (!res.ok) throw new Error("Échec");
      toast.success(t("wallet.actions.withdraw_success"));
      setMontantDemande("");
      const walletRes = await api.get<WalletDTO>("/api/wallets/solde");
      setWallet(walletRes);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDemande(false);
    }
  };

  if (loading || !wallet)
    return <div className={styles.loading}>{t("wallet.loading")}</div>;

  const totalBalance =
    wallet.soldeDisponible + wallet.soldeBloque + wallet.soldeRetirable;
  const pendingWithdrawals = transactions.filter(
    (t) => t.type === "RETRAIT" && t.statut === "EN_ATTENTE_VALIDATION"
  ).length;

  return (
    <div className={styles.container}>
      {/* HEADER SOLDE */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t("wallet.title")}</h1>
        <div className={styles.balanceGrid}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>
              {t("wallet.balance.available")}
            </div>
            <div className={styles.balanceAmount}>
              {format(wallet.soldeDisponible, "XOF")}
            </div>
          </div>
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>
              {t("wallet.balance.blocked")}
            </div>
            <div className={styles.balanceAmount}>
              {format(wallet.soldeBloque, "XOF")}
            </div>
          </div>
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>
              {t("wallet.balance.withdrawable")}
            </div>
            <div className={styles.balanceAmount}>
              {format(wallet.soldeRetirable, "XOF")}
            </div>
          </div>
        </div>
        <div className={styles.total}>
          {t("wallet.total")} : {format(totalBalance, "XOF")}
        </div>
      </div>

      {/* ACTIONS GRID */}
      <div className={styles.actionsGrid}>
        {/* DÉPÔT */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>
            {t("wallet.actions.deposit_title")}
          </h3>
          <input
            type="number"
            placeholder={t("deposit.amount_label")}
            value={depositMontant}
            onChange={(e) => setDepositMontant(e.target.value)}
            className={styles.input}
          />
          <button
            onClick={handleDeposit}
            disabled={loadingDeposit}
            className={`${styles.btn} ${styles.btnDepot}`}
          >
            {loadingDeposit
              ? t("deposit.processing")
              : t("wallet.actions.deposit_btn")}
          </button>
        </div>

        {/* TRANSFERT À UN AMI */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>
            {t("wallet.actions.transfer_title")}
          </h3>
          <input
            type="text"
            placeholder={t("wallet.actions.transfer_search_placeholder")}
            value={searchUser}
            onChange={(e) => {
              setSearchUser(e.target.value);
              setSelectedUser(null);
            }}
            className={styles.input}
          />
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className={styles.searchItem}
                  onClick={() => {
                    setSelectedUser(u);
                    setSearchUser(u.nomComplet);
                    setSearchResults([]);
                  }}
                >
                  {u.nomComplet} (@{u.login})
                </div>
              ))}
            </div>
          )}
          {selectedUser && (
            <div className={styles.transferForm}>
              <p>
                Destinataire: <strong>{selectedUser.nomComplet}</strong>
              </p>
              <input
                type="number"
                placeholder="Montant"
                value={montantTransfer}
                onChange={(e) => setMontantTransfer(e.target.value)}
                className={styles.input}
              />
              <div className={styles.sourceChoice}>
                <label>
                  <input
                    type="radio"
                    checked={transferSource === "DISPONIBLE"}
                    onChange={() => setTransferSource("DISPONIBLE")}
                  />{" "}
                  Dispo
                </label>
                <label>
                  <input
                    type="radio"
                    checked={transferSource === "RETIRABLE"}
                    onChange={() => setTransferSource("RETIRABLE")}
                  />{" "}
                  Retirable
                </label>
              </div>
              <button
                onClick={handleTransfer}
                className={`${styles.btn} ${styles.btnTransfer}`}
              >
                {t("wallet.actions.transfer_btn")}
              </button>
            </div>
          )}
        </div>

        {/* DEMANDE RETRAIT ADMIN OU DIRECT */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>
            {t("wallet.actions.withdraw_admin_title")}
          </h3>
          <input
            type="number"
            placeholder="Montant"
            value={montantDemande}
            onChange={(e) => setMontantDemande(e.target.value)}
            className={styles.input}
          />
          <button
            onClick={handleDemandeRetrait}
            disabled={loadingDemande}
            className={`${styles.btn} ${styles.btnRetraitAdmin}`}
          >
            {t("wallet.actions.withdraw_admin_btn")}
          </button>

          {wallet.soldeRetirable > 0 && (
            <Link
              to="/retrait"
              style={{
                textDecoration: "none",
                marginTop: "1rem",
                display: "block",
              }}
            >
              <button className={`${styles.btn} ${styles.btnDepot}`}>
                {t("wallet.actions.withdraw_direct_btn")} (
                {wallet.soldeRetirable.toFixed(2)}€)
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* HISTORIQUE */}
      <div className={styles.historyCard}>
        <h2 className={styles.historyTitle}>{t("wallet.history.title")}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{t("wallet.history.cols.date")}</th>
              <th className={styles.th}>{t("wallet.history.cols.type")}</th>
              <th className={styles.th}>{t("wallet.history.cols.amount")}</th>
              <th className={styles.th}>{t("wallet.history.cols.status")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className={styles.td}>
                  {formatDate(new Date(tx.createdAt), "dd MMM yyyy HH:mm", {
                    locale: currentLocale,
                  })}
                </td>
                <td className={styles.td}>
                  {t(`wallet.tx_type.${tx.type}`, tx.type)}
                </td>
                <td
                  className={`${styles.td} ${
                    tx.type.includes("IN")
                      ? styles.amountPositive
                      : styles.amountNegative
                  }`}
                >
                  {format(tx.montant, "XOF")}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.status} ${
                      tx.statut === "SUCCESS"
                        ? styles.statusSuccess
                        : styles.statusPending
                    }`}
                  >
                    {t(`wallet.status.${tx.statut}`, tx.statut)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
