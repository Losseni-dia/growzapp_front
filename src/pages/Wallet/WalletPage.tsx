import { format as formatDate } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Gift,
  RefreshCw,
  Send,
  Smartphone,
  TrendingUp,
  Wallet as WalletIcon,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api } from "../../service/Api";
import styles from "./WalletPage.module.css";

import type { TransactionDTO } from "../../types/transaction";
import type { WalletDTO } from "../../types/wallet";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
  image: string | null;
}

type Tab = "deposit" | "withdraw" | "transfer";
type DepositMethod = "DEBIT_CARD" | "MOBILE_MONEY";
type WithdrawMethod = "MOBILE_MONEY"; // Stripe désactivé temporairement — voir STRIPE_PAYOUT_ROADMAP.md

// Taux fixe BCEAO — identique au backend (StripeDepositService)
const TAUX_FCFA_PAR_EUR = 655.957;

// ── Config visuelle par type de transaction (clé i18n dans wallet.tx_types) ─
const TX_CONFIG: Record<string, { icon: any; key: string; outbound: boolean }> = {
  DEPOT: { icon: ArrowDownToLine, key: "deposit", outbound: false },
  RETRAIT: { icon: ArrowUpFromLine, key: "withdrawal", outbound: true },
  PAYOUT_STRIPE: { icon: ArrowUpFromLine, key: "payout_card", outbound: true },
  PAYOUT_OM: { icon: ArrowUpFromLine, key: "payout_mobile", outbound: true },
  PAYOUT_MTN: { icon: ArrowUpFromLine, key: "payout_mobile", outbound: true },
  PAYOUT_WAVE: { icon: ArrowUpFromLine, key: "payout_mobile", outbound: true },
  TRANSFER_IN: { icon: Send, key: "transfer_in", outbound: false },
  TRANSFER_OUT: { icon: Send, key: "transfer_out", outbound: true },
  INVESTISSEMENT: { icon: TrendingUp, key: "investment", outbound: true },
  REMBOURSEMENT: { icon: RefreshCw, key: "refund", outbound: false },
  DIVIDENDE: { icon: Gift, key: "dividend", outbound: false },
  VERSEMENT_DIVIDENDE: { icon: Gift, key: "dividend", outbound: false },
};

function getTxConfig(type: string) {
  const key = type.toUpperCase();
  return TX_CONFIG[key] || { icon: WalletIcon, key: null, outbound: false };
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
  const [activeTab, setActiveTab] = useState<Tab>("deposit");

  // Historique : pagination + filtre
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "IN" | "OUT">("ALL");

  const handleFilterChange = (f: "ALL" | "IN" | "OUT") => {
    setHistoryFilter(f);
    setHistoryLimit(10);
  };

  // Dépôt
  const [depositMontant, setDepositMontant] = useState("");
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("DEBIT_CARD");
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  // Retrait
  const [withdrawMontant, setWithdrawMontant] = useState("");
  const [withdrawMethod] = useState<WithdrawMethod>("MOBILE_MONEY");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  // Transfert
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [montantTransfer, setMontantTransfer] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        api.get<WalletDTO>("/api/wallets/solde"),
        api.get<TransactionDTO[]>("/api/wallets/transactions"),
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
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (historyFilter === "ALL") return sorted;
    return sorted.filter((tx) => {
      const outbound = getTxConfig(tx.type).outbound;
      return historyFilter === "OUT" ? outbound : !outbound;
    });
  }, [transactions, historyFilter]);

  const visibleTransactions = useMemo(
    () => sortedTransactions.slice(0, historyLimit),
    [sortedTransactions, historyLimit]
  );

  const hasMore = historyLimit < sortedTransactions.length;

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    const montant = parseFloat(depositMontant);
    if (isNaN(montant)) return toast.error(t("wallet.toast.invalid_amount"));
    if (depositMethod === "MOBILE_MONEY" && montant < 200)
      return toast.error(t("wallet.toast.min_mobile_money"));
    if (montant < 5) return toast.error(t("wallet.toast.min_amount"));

    setLoadingDeposit(true);
    try {
     const endpoint =
        depositMethod === "DEBIT_CARD"
          ? `${API_BASE_URL}/api/wallets/deposit/card`
          : `${API_BASE_URL}/api/wallets/deposit/mobile-money`;
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        let msg = errBody;
        try { msg = JSON.parse(errBody).error || JSON.parse(errBody).message || errBody; } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      if (data.redirectUrl?.startsWith("http")) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error(t("wallet.toast.payment_init_failed"));
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || t("wallet.toast.server_error"));
    } finally {
      setLoadingDeposit(false);
    }
  };

 const handleWithdraw = async () => {
    const montant = parseFloat(withdrawMontant);
    if (isNaN(montant) || montant <= 0) return toast.error(t("wallet.toast.invalid_amount"));
    if (montant > (wallet?.soldeDisponible || 0)) return toast.error(t("wallet.toast.insufficient_balance"));
    if (withdrawMethod === "MOBILE_MONEY" && !withdrawPhone.trim())
      return toast.error(t("wallet.toast.phone_required"));
    setLoadingWithdraw(true);
    try {
      // Clé unique générée à chaque clic — si l'utilisateur double-clique ou
      // que la requête est relancée après un souci réseau, le backend
      // rejette la deuxième tentative comme déjà traitée (HIGH-06)
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch(`${API_BASE_URL}/api/wallets/retrait`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant, methode: withdrawMethod, phone: withdrawPhone, idempotencyKey }),
      });
     const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || t("wallet.toast.withdraw_success"));
      } else if (data.errorCode === "WITHDRAWAL_FAILED_REFUNDED") {
        toast.error(t("wallet.toast.withdraw_failed_refunded"));
      } else {
        toast.error(data.error || t("wallet.toast.withdraw_failed"));
      }
      setWithdrawMontant("");
      setWithdrawPhone("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t("wallet.toast.server_error"));
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser) return toast.error(t("wallet.toast.select_recipient"));
    const montant = parseFloat(montantTransfer);
    if (isNaN(montant) || montant <= 0) return toast.error(t("wallet.toast.invalid_amount"));
    if (montant > (wallet?.soldeDisponible || 0)) return toast.error(t("wallet.toast.insufficient_balance"));

    setLoadingTransfer(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallets/transfer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinataireUserId: selectedUser.id,
          montant,
          source: "DISPONIBLE",
        }),
      });
      if (!res.ok) throw new Error(t("wallet.toast.transfer_failed"));
      toast.success(
        t("wallet.toast.transfer_success", {
          amount: format(montant, "XOF"),
          name: selectedUser.nomComplet,
        })
      );
      setMontantTransfer("");
      setSearchUser("");
      setSelectedUser(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingTransfer(false);
    }
  };

  if (loading || !wallet) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>{t("wallet.loading")}</p>
      </div>
    );
  }

  const totalBalance = wallet.soldeDisponible + wallet.soldeBloque + wallet.soldeRetirable;
  const pctDispo = totalBalance > 0 ? (wallet.soldeDisponible / totalBalance) * 100 : 0;
  const pctBloque = totalBalance > 0 ? (wallet.soldeBloque / totalBalance) * 100 : 0;
  const pctRetirable = totalBalance > 0 ? (wallet.soldeRetirable / totalBalance) * 100 : 0;

  return (
    <div className={styles.page}>
      {/* ═══════════ HEADER SOLDES ═══════════ */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerIcon}><WalletIcon size={22} /></div>
          <div>
            <h1 className={styles.title}>{t("wallet.title")}</h1>
            <p className={styles.subtitle}>{t("wallet.subtitle")}</p>
          </div>
        </div>

        <div className={styles.balanceHero}>
          <span className={styles.balanceHeroLabel}>{t("wallet.total_balance")}</span>
          <span className={styles.balanceHeroAmount}>{format(totalBalance, "XOF")}</span>
        </div>

        <div className={styles.balanceGrid}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceDot} style={{ background: "var(--wallet-available)" }} />
            <div>
              <span className={styles.balanceLabel}>{t("wallet.available")}</span>
              <span className={styles.balanceAmount}>{format(wallet.soldeDisponible, "XOF")}</span>
            </div>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.balanceDot} style={{ background: "var(--wallet-blocked)" }} />
            <div>
              <span className={styles.balanceLabel}>{t("wallet.blocked")}</span>
              <span className={styles.balanceAmount}>{format(wallet.soldeBloque, "XOF")}</span>
            </div>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.balanceDot} style={{ background: "var(--wallet-withdrawable)" }} />
            <div>
              <span className={styles.balanceLabel}>{t("wallet.withdrawable")}</span>
              <span className={styles.balanceAmount}>{format(wallet.soldeRetirable, "XOF")}</span>
            </div>
          </div>
        </div>

        <div className={styles.distributionBar}>
          <div style={{ width: `${pctDispo}%`, background: "var(--wallet-available)" }} />
          <div style={{ width: `${pctBloque}%`, background: "var(--wallet-blocked)" }} />
          <div style={{ width: `${pctRetirable}%`, background: "var(--wallet-withdrawable)" }} />
        </div>
      </header>

      {/* ═══════════ ACTIONS (ONGLETS) ═══════════ */}
      <section className={styles.actionsSection}>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === "deposit" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("deposit")}
          >
            <ArrowDownToLine size={17} /> {t("wallet.tabs.deposit")}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "withdraw" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("withdraw")}
          >
            <ArrowUpFromLine size={17} /> {t("wallet.tabs.withdraw")}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "transfer" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("transfer")}
          >
            <Send size={17} /> {t("wallet.tabs.transfer")}
          </button>
        </div>

        <div className={styles.tabPanel}>
          {/* ── DÉPÔT ── */}
          {activeTab === "deposit" && (
            <div className={styles.panelContent}>
              <div className={styles.methodGrid}>
                <button
                  className={`${styles.methodCard} ${depositMethod === "DEBIT_CARD" ? styles.methodCardActive : ""}`}
                  onClick={() => setDepositMethod("DEBIT_CARD")}
                >
                  <CreditCard size={20} />
                  <span>{t("wallet.deposit.card")}</span>
                </button>
                <button
                  className={`${styles.methodCard} ${depositMethod === "MOBILE_MONEY" ? styles.methodCardActive : ""}`}
                  onClick={() => setDepositMethod("MOBILE_MONEY")}
                >
                  <Smartphone size={20} />
                  <span>{t("wallet.deposit.mobile_money")}</span>
                </button>
              </div>

              <label className={styles.fieldLabel}>{t("wallet.deposit.amount_label")}</label>
              <input
                type="number"
                placeholder={t("wallet.deposit.amount_placeholder") as string}
                value={depositMontant}
                onChange={(e) => setDepositMontant(e.target.value)}
                className={styles.input}
              />

              {depositMethod === "DEBIT_CARD" && depositMontant && !isNaN(parseFloat(depositMontant)) && (
                <div className={styles.conversionPreview}>
                  <span>{t("wallet.deposit.stripe_charges")}</span>
                  <strong>{(parseFloat(depositMontant) / TAUX_FCFA_PAR_EUR).toFixed(2)} €</strong>
                </div>
              )}

              <button onClick={handleDeposit} disabled={loadingDeposit} className={styles.submitBtn}>
                {loadingDeposit ? t("wallet.deposit.btn_loading") : t("wallet.deposit.btn")}
              </button>
            </div>
          )}

          {/* ── RETRAIT ── */}
          {activeTab === "withdraw" && (
            <div className={styles.panelContent}>
              <div className={styles.availableHint}>
                {t("wallet.withdraw.available_hint")} <strong>{format(wallet.soldeDisponible, "XOF")}</strong>
              </div>

              <div className={styles.withdrawInfoBox}>
                <Smartphone size={18} />
                <span>{t("wallet.withdraw.info_box")}</span>
              </div>

              {withdrawMethod === "MOBILE_MONEY" && (
                <>
                  <label className={styles.fieldLabel}>{t("wallet.withdraw.phone_label")}</label>
                  <input
                    type="tel"
                    placeholder={t("wallet.withdraw.phone_placeholder") as string}
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    className={styles.input}
                  />
                </>
              )}

              <label className={styles.fieldLabel}>{t("wallet.withdraw.amount_label")}</label>
              <input
                type="number"
                placeholder={t("wallet.withdraw.amount_placeholder") as string}
                value={withdrawMontant}
                onChange={(e) => setWithdrawMontant(e.target.value)}
                className={styles.input}
              />

              <button onClick={handleWithdraw} disabled={loadingWithdraw} className={styles.submitBtn}>
                {loadingWithdraw ? t("wallet.withdraw.btn_loading") : t("wallet.withdraw.btn")}
              </button>
              <p className={styles.helperText}>
                {t("wallet.withdraw.helper")}
              </p>
            </div>
          )}

          {/* ── TRANSFERT ── */}
          {activeTab === "transfer" && (
            <div className={styles.panelContent}>
              <label className={styles.fieldLabel}>{t("wallet.transfer.recipient_label")}</label>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  placeholder={t("wallet.transfer.search_placeholder") as string}
                  value={searchUser}
                  onChange={(e) => { setSearchUser(e.target.value); setSelectedUser(null); }}
                  className={styles.searchInput}
                />
                {selectedUser && (
                  <button className={styles.clearSearch} onClick={() => { setSelectedUser(null); setSearchUser(""); }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && !selectedUser && (
                <div className={styles.searchResults}>
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className={styles.searchItem}
                      onClick={() => { setSelectedUser(u); setSearchUser(u.nomComplet); setSearchResults([]); }}
                    >
                      <div className={styles.searchAvatar}>{u.nomComplet[0]}</div>
                      <div>
                        <strong>{u.nomComplet}</strong>
                        <span>@{u.login}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <>
                  <label className={styles.fieldLabel}>{t("wallet.transfer.amount_label")}</label>
                  <input
                    type="number"
                    placeholder={t("wallet.transfer.amount_placeholder") as string}
                    value={montantTransfer}
                    onChange={(e) => setMontantTransfer(e.target.value)}
                    className={styles.input}
                  />
                  <button onClick={handleTransfer} disabled={loadingTransfer} className={styles.submitBtn}>
                    {loadingTransfer
                      ? t("wallet.transfer.btn_loading")
                      : t("wallet.transfer.btn", { name: selectedUser.nomComplet })}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ HISTORIQUE ═══════════ */}
      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>{t("wallet.history.title")}</h2>
          <span className={styles.historyCount}>
            {sortedTransactions.length} {t("wallet.history.count", { count: sortedTransactions.length })}
          </span>
        </div>

        <div className={styles.historyFilters}>
          <button
            className={`${styles.filterChip} ${historyFilter === "ALL" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterChange("ALL")}
          >
            {t("wallet.history.filter_all")}
          </button>
          <button
            className={`${styles.filterChip} ${historyFilter === "IN" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterChange("IN")}
          >
            {t("wallet.history.filter_in")}
          </button>
          <button
            className={`${styles.filterChip} ${historyFilter === "OUT" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterChange("OUT")}
          >
            {t("wallet.history.filter_out")}
          </button>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className={styles.emptyState}>
            <WalletIcon size={32} />
            <p>{t("wallet.history.empty")}</p>
          </div>
        ) : (
          <>
            <div className={styles.txList}>
              {visibleTransactions.map((tx) => {
                const config = getTxConfig(tx.type);
                const Icon = config.icon;
                const isSuccess = tx.statut === "SUCCESS";
                const isPending = tx.statut?.includes("ATTENTE");
                const txLabel = config.key ? t(`wallet.tx_types.${config.key}`) : tx.type;

                return (
                  <div key={tx.id} className={styles.txRow}>
                    <div className={`${styles.txIcon} ${config.outbound ? styles.txIconOut : styles.txIconIn}`}>
                      <Icon size={18} />
                    </div>

                    <div className={styles.txInfo}>
                      <span className={styles.txLabel}>{txLabel}</span>
                      <span className={styles.txDate}>
                        {formatDate(new Date(tx.createdAt), "dd MMM yyyy · HH:mm", { locale: currentLocale })}
                      </span>
                    </div>

                    <div className={styles.txRight}>
                      <span className={`${styles.txAmount} ${config.outbound ? styles.txAmountOut : styles.txAmountIn}`}>
                        {config.outbound ? "−" : "+"} {format(tx.montant, "XOF")}
                      </span>
                      <span className={`${styles.txStatus} ${
                        isSuccess ? styles.statusSuccess : isPending ? styles.statusPending : styles.statusFailed
                      }`}>
                        {isSuccess ? <CheckCircle2 size={12} /> : isPending ? <Clock size={12} /> : <XCircle size={12} />}
                        {isSuccess
                          ? t("wallet.history.status_success")
                          : isPending
                            ? t("wallet.history.status_pending")
                            : t("wallet.history.status_failed")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => setHistoryLimit((prev) => prev + 15)}
              >
                <ChevronDown size={16} />
                {t("wallet.history.load_more", { count: sortedTransactions.length - historyLimit })}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}