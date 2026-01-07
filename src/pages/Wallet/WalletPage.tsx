import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { api, getFreshToken } from "../../service/api";
import toast from "react-hot-toast";
import { format as formatDate } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/Context/CurrencyContext";
import styles from "./WalletPage.module.css";

import type { WalletDTO } from "../../types/wallet";
import type { TransactionDTO } from "../../types/transaction";

interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
  image: string | null;
}

// Méthodes de dépôt disponibles
type PaymentMethod = "DEBIT_CARD" | "MOBILE_MONEY";

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
  const [depositMethod, setDepositMethod] =
    useState<PaymentMethod>("DEBIT_CARD");

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

  useEffect(() => {
    fetchData();
  }, [t]);

  // RECHERCHE UTILISATEUR
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

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions]);

  // ========================================================
  // LOGIQUE DES SIGNES (FINALE)
  // ========================================================
  const getTransactionInfo = (tx: TransactionDTO) => {
    const type = tx.type.toUpperCase();

    // Tout ce qui est une dépense/sortie pour l'utilisateur
    const isOutbound =
      type.includes("INVESTISSEMENT") ||
      type.includes("RETRAIT") ||
      type.includes("TRANSFERT_OUT") ||
      type.includes("DEBITE") ||
      type.includes("PAYMENT");

    if (isOutbound) return { sign: "-", className: styles.amountNegative };
    return { sign: "+", className: styles.amountPositive };
  };


 // ========================================================
  // HANDLERS (AVEC REDIRECTION PAYDUNYA CORRIGÉE)
  // ========================================================
  const handleDeposit = async () => {
    const montant = parseFloat(depositMontant);
    if (isNaN(montant) || montant < 5)
      return toast.error(t("deposit.toast.min_error"));

    setLoadingDeposit(true);
    try {
      const token = getFreshToken() || "";

      let endpoint = "";
      if (depositMethod === "DEBIT_CARD") {
        endpoint = "http://localhost:8080/api/wallets/deposit/card";
      } else if (depositMethod === "MOBILE_MONEY") {
        endpoint = "http://localhost:8080/api/wallets/deposit/mobile-money";
      } else {
        throw new Error("Méthode de paiement non sélectionnée.");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ montant }),
      });
      
      // 1. Gestion des erreurs HTTP (doit lire le corps en texte avant res.json)
      if (!res.ok) {
          const errorBody = await res.text();
          let errorMessage = errorBody;
          try {
              const errorJson = JSON.parse(errorBody);
              errorMessage = errorJson.message || errorJson.error || errorBody; 
          } catch(e) {}
        throw new Error(errorMessage || t("common.server_error"));
      }
      
      // 2. 🟢 CORRECTION: Lire TOUJOURS la réponse en JSON, car le backend renvoie un JSON
      const data = await res.json(); 
      let redirectUrl = data.redirectUrl; // La clé est 'redirectUrl' dans le JSON

      if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith("http")) {
        // ACTION CLÉ : Redirection vers la passerelle de paiement
        window.location.href = redirectUrl;
      } else {
        // Si aucune URL n'est reçue, on suppose que PayDunya a échoué
        toast.error(t("deposit.failed_mm") || "Échec de l'initialisation du paiement PayDunya."); 
        setDepositMontant("");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || t("common.server_error"));
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
      if (!res.ok) throw new Error("Échec");
      toast.success(t("wallet.actions.transfer_success"));
      setMontantTransfer("");
      setSearchUser("");
      setSelectedUser(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDemandeRetrait = async () => {
    const montant = parseFloat(montantDemande);
    if (
      isNaN(montant) ||
      montant < 5 ||
      montant > (wallet?.soldeDisponible || 0)
    )
      return toast.error("Montant invalide");
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
      fetchData();
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

  return (
    <div className={styles.container}>
      {/* HEADER PREMIUM */}
      <header className={styles.header}>
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
      </header>

      <div className={styles.actionsGrid}>
        {/* DÉPÔT (CARTE / MOBILE MONEY) */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>
            💳 {t("wallet.actions.deposit_title")}
          </h3>

          <div className={styles.methodChoice}>
            <label>
              <input
                type="radio"
                checked={depositMethod === "DEBIT_CARD"}
                onChange={() => setDepositMethod("DEBIT_CARD")}
              />
              Carte Bancaire
            </label>
            <label>
              <input
                type="radio"
                checked={depositMethod === "MOBILE_MONEY"}
                onChange={() => setDepositMethod("MOBILE_MONEY")}
              />
              Mobile Money
            </label>
          </div>

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
            className={styles.btn}
          >
            {loadingDeposit
              ? depositMethod === "MOBILE_MONEY"
                ? "Demande en cours..."
                : "Redirection..."
              : depositMethod === "MOBILE_MONEY"
              ? "Dépôt Mobile Money"
              : "Payer par Carte"}
          </button>
        </div>

        {/* TRANSFERT */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>
            💸 {t("wallet.actions.transfer_title")}
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
            <>
              <input
                type="number"
                placeholder="Montant"
                value={montantTransfer}
                onChange={(e) => setMontantTransfer(e.target.value)}
                className={styles.input}
              />
              <div
                style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
              >
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
              <button onClick={handleTransfer} className={styles.btn}>
                {t("wallet.actions.transfer_btn")}
              </button>
            </>
          )}
        </div>

        {/* RETRAIT */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>
            🏧 {t("wallet.actions.withdraw_admin_title")}
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
            className={styles.btn}
          >
            {t("wallet.actions.withdraw_admin_btn")}
          </button>
          {wallet.soldeRetirable > 0 && (
            <Link to="/retrait" style={{ marginTop: "1rem", display: "block" }}>
              <button className={styles.btn} style={{ background: "#27ae60" }}>
                Retrait Direct Cash
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.historyCard}>
        <h2 className={styles.historyTitle}>📋 {t("wallet.history.title")}</h2>
        <div className={styles.tableWrapper}>
          {/* Correction HTML critique ici */}
          <table className={styles.table}><thead>
              <tr>
                <th className={styles.th}>{t("wallet.history.cols.date")}</th>
                <th className={styles.th}>{t("wallet.history.cols.type")}</th>
                <th className={styles.th}>{t("wallet.history.cols.amount")}</th>
                <th className={styles.th}>{t("wallet.history.cols.status")}</th>
              </tr></thead>
            <tbody>
              {sortedTransactions.map((tx) => {
                const info = getTransactionInfo(tx);
                return (
                  <tr key={tx.id} className={styles.trBody}>
                    <td className={styles.td}>
                      {formatDate(new Date(tx.createdAt), "dd MMM yyyy", {
                        locale: currentLocale,
                      })}
                    </td>
                    <td className={styles.td}>
                      {t(`wallet.tx_type.${tx.type}`, tx.type)}
                    </td>
                    <td className={`${styles.td} ${info.className}`}>
                      {info.sign} {format(tx.montant, "XOF")}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}