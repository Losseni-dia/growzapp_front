import { format as formatDate } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  CreditCard,
  Smartphone,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  X,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api, getFreshToken } from "../../service/Api";
import styles from "./WalletPage.module.css";

import type { TransactionDTO } from "../../types/transaction";
import type { WalletDTO } from "../../types/wallet";

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

// ── Config visuelle par type de transaction ─────────────────────────────────
const TX_CONFIG: Record<string, { icon: any; label: string; outbound: boolean }> = {
  DEPOT: { icon: ArrowDownToLine, label: "Dépôt", outbound: false },
  RETRAIT: { icon: ArrowUpFromLine, label: "Retrait", outbound: true },
  PAYOUT_STRIPE: { icon: ArrowUpFromLine, label: "Retrait carte", outbound: true },
  PAYOUT_OM: { icon: ArrowUpFromLine, label: "Retrait Mobile Money", outbound: true },
  PAYOUT_MTN: { icon: ArrowUpFromLine, label: "Retrait Mobile Money", outbound: true },
  PAYOUT_WAVE: { icon: ArrowUpFromLine, label: "Retrait Mobile Money", outbound: true },
  TRANSFER_IN: { icon: Send, label: "Transfert reçu", outbound: false },
  TRANSFER_OUT: { icon: Send, label: "Transfert envoyé", outbound: true },
  INVESTISSEMENT: { icon: TrendingUp, label: "Investissement", outbound: true },
  REMBOURSEMENT: { icon: RefreshCw, label: "Remboursement", outbound: false },
  DIVIDENDE: { icon: Gift, label: "Dividende", outbound: false },
  VERSEMENT_DIVIDENDE: { icon: Gift, label: "Dividende", outbound: false },
};

function getTxConfig(type: string) {
  const key = type.toUpperCase();
  return TX_CONFIG[key] || { icon: WalletIcon, label: type, outbound: false };
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
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>("MOBILE_MONEY");
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
    if (isNaN(montant)) return toast.error("Montant invalide");
    if (depositMethod === "MOBILE_MONEY" && montant < 200)
      return toast.error("Minimum 200 FCFA pour Mobile Money");
    if (montant < 5) return toast.error("Montant minimum : 5 €");

    setLoadingDeposit(true);
    try {
      const token = getFreshToken() || "";
      const endpoint =
        depositMethod === "DEBIT_CARD"
          ? "http://localhost:8080/api/wallets/deposit/card"
          : "http://localhost:8080/api/wallets/deposit/mobile-money";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        toast.error("Échec de l'initialisation du paiement");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur serveur");
    } finally {
      setLoadingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    const montant = parseFloat(withdrawMontant);
    if (isNaN(montant) || montant <= 0) return toast.error("Montant invalide");
    if (montant > (wallet?.soldeDisponible || 0)) return toast.error("Solde disponible insuffisant");
    if (withdrawMethod === "MOBILE_MONEY" && !withdrawPhone.trim())
      return toast.error("Numéro de téléphone requis");

    setLoadingWithdraw(true);
    try {
      const token = getFreshToken() || "";
      const res = await fetch("http://localhost:8080/api/wallets/retrait", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ montant, methode: withdrawMethod, phone: withdrawPhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Retrait effectué avec succès !");
      } else {
        toast.error(data.error || "Le retrait a échoué — fonds remboursés");
      }
      setWithdrawMontant("");
      setWithdrawPhone("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erreur serveur");
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser) return toast.error("Sélectionnez un destinataire");
    const montant = parseFloat(montantTransfer);
    if (isNaN(montant) || montant <= 0) return toast.error("Montant invalide");
    if (montant > (wallet?.soldeDisponible || 0)) return toast.error("Solde disponible insuffisant");

    setLoadingTransfer(true);
    try {
      const token = getFreshToken() || "";
      const res = await fetch("http://localhost:8080/api/wallets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          destinataireUserId: selectedUser.id,
          montant,
          source: "DISPONIBLE",
        }),
      });
      if (!res.ok) throw new Error("Échec du transfert");
      toast.success(`${format(montant, "XOF")} envoyés à ${selectedUser.nomComplet}`);
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
        <p>Chargement de votre portefeuille...</p>
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
            <h1 className={styles.title}>Mon portefeuille</h1>
            <p className={styles.subtitle}>Gérez vos fonds GrowzApp</p>
          </div>
        </div>

        <div className={styles.balanceHero}>
          <span className={styles.balanceHeroLabel}>Solde total</span>
          <span className={styles.balanceHeroAmount}>{format(totalBalance, "XOF")}</span>
        </div>

        <div className={styles.balanceGrid}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceDot} style={{ background: "var(--wallet-available)" }} />
            <div>
              <span className={styles.balanceLabel}>Disponible</span>
              <span className={styles.balanceAmount}>{format(wallet.soldeDisponible, "XOF")}</span>
            </div>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.balanceDot} style={{ background: "var(--wallet-blocked)" }} />
            <div>
              <span className={styles.balanceLabel}>Bloqué</span>
              <span className={styles.balanceAmount}>{format(wallet.soldeBloque, "XOF")}</span>
            </div>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.balanceDot} style={{ background: "var(--wallet-withdrawable)" }} />
            <div>
              <span className={styles.balanceLabel}>Retirable</span>
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
            <ArrowDownToLine size={17} /> Déposer
          </button>
          <button
            className={`${styles.tab} ${activeTab === "withdraw" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("withdraw")}
          >
            <ArrowUpFromLine size={17} /> Retirer
          </button>
          <button
            className={`${styles.tab} ${activeTab === "transfer" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("transfer")}
          >
            <Send size={17} /> Transférer
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
                  <span>Carte bancaire</span>
                </button>
                <button
                  className={`${styles.methodCard} ${depositMethod === "MOBILE_MONEY" ? styles.methodCardActive : ""}`}
                  onClick={() => setDepositMethod("MOBILE_MONEY")}
                >
                  <Smartphone size={20} />
                  <span>Mobile Money</span>
                </button>
              </div>

              <label className={styles.fieldLabel}>Montant (FCFA)</label>
              <input
                type="number"
                placeholder="Ex : 50 000"
                value={depositMontant}
                onChange={(e) => setDepositMontant(e.target.value)}
                className={styles.input}
              />

              {depositMethod === "DEBIT_CARD" && depositMontant && !isNaN(parseFloat(depositMontant)) && (
                <div className={styles.conversionPreview}>
                  <span>Stripe facturera</span>
                  <strong>{(parseFloat(depositMontant) / TAUX_FCFA_PAR_EUR).toFixed(2)} €</strong>
                </div>
              )}

              <button onClick={handleDeposit} disabled={loadingDeposit} className={styles.submitBtn}>
                {loadingDeposit ? "Redirection..." : "Continuer le dépôt"}
              </button>
            </div>
          )}

          {/* ── RETRAIT ── */}
          {activeTab === "withdraw" && (
            <div className={styles.panelContent}>
              <div className={styles.availableHint}>
                Solde disponible : <strong>{format(wallet.soldeDisponible, "XOF")}</strong>
              </div>

              <div className={styles.withdrawInfoBox}>
                <Smartphone size={18} />
                <span>Les retraits sont actuellement disponibles uniquement via Mobile Money (Orange Money, MTN, Wave). Le virement bancaire direct arrive bientôt.</span>
              </div>

              {withdrawMethod === "MOBILE_MONEY" && (
                <>
                  <label className={styles.fieldLabel}>Numéro Mobile Money</label>
                  <input
                    type="tel"
                    placeholder="Ex : 0700000000"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    className={styles.input}
                  />
                </>
              )}

              <label className={styles.fieldLabel}>Montant</label>
              <input
                type="number"
                placeholder="Montant à retirer"
                value={withdrawMontant}
                onChange={(e) => setWithdrawMontant(e.target.value)}
                className={styles.input}
              />

              <button onClick={handleWithdraw} disabled={loadingWithdraw} className={styles.submitBtn}>
                {loadingWithdraw ? "Traitement..." : "Retirer maintenant"}
              </button>
              <p className={styles.helperText}>
                Le retrait est traité immédiatement. En cas d'échec, les fonds sont automatiquement remboursés.
              </p>
            </div>
          )}

          {/* ── TRANSFERT ── */}
          {activeTab === "transfer" && (
            <div className={styles.panelContent}>
              <label className={styles.fieldLabel}>Destinataire</label>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  placeholder="Nom ou identifiant..."
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
                  <label className={styles.fieldLabel}>Montant</label>
                  <input
                    type="number"
                    placeholder="Montant à transférer"
                    value={montantTransfer}
                    onChange={(e) => setMontantTransfer(e.target.value)}
                    className={styles.input}
                  />
                  <button onClick={handleTransfer} disabled={loadingTransfer} className={styles.submitBtn}>
                    {loadingTransfer ? "Envoi..." : `Envoyer à ${selectedUser.nomComplet}`}
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
          <h2 className={styles.historyTitle}>Historique</h2>
          <span className={styles.historyCount}>{sortedTransactions.length} mouvement{sortedTransactions.length > 1 ? "s" : ""}</span>
        </div>

        <div className={styles.historyFilters}>
          <button
            className={`${styles.filterChip} ${historyFilter === "ALL" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterChange("ALL")}
          >
            Tout
          </button>
          <button
            className={`${styles.filterChip} ${historyFilter === "IN" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterChange("IN")}
          >
            Entrées
          </button>
          <button
            className={`${styles.filterChip} ${historyFilter === "OUT" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterChange("OUT")}
          >
            Sorties
          </button>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className={styles.emptyState}>
            <WalletIcon size={32} />
            <p>Aucune transaction pour le moment</p>
          </div>
        ) : (
          <>
            <div className={styles.txList}>
              {visibleTransactions.map((tx) => {
                const config = getTxConfig(tx.type);
                const Icon = config.icon;
                const isSuccess = tx.statut === "SUCCESS";
                const isPending = tx.statut?.includes("ATTENTE");

                return (
                  <div key={tx.id} className={styles.txRow}>
                    <div className={`${styles.txIcon} ${config.outbound ? styles.txIconOut : styles.txIconIn}`}>
                      <Icon size={18} />
                    </div>

                    <div className={styles.txInfo}>
                      <span className={styles.txLabel}>{config.label}</span>
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
                        {isSuccess ? "Réussi" : isPending ? "En cours" : "Échoué"}
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
                Voir plus ({sortedTransactions.length - historyLimit} restant{sortedTransactions.length - historyLimit > 1 ? "s" : ""})
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}