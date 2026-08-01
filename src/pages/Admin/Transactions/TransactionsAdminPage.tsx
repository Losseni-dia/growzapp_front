import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FiActivity, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { api } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import styles from "./TransactionsAdminPage.module.css";

interface TransactionAdmin {
  id: number;
  type: string;
  walletType: "USER" | "PROJET" | "DIVIDENDE";
  montant: number;
  statut: string;
  createdAt: string;
  completedAt?: string;
  description?: string;
  referenceType?: string;
  referenceId?: number;
  referenceExterne?: string;
  utilisateurNom?: string;
  utilisateurEmail?: string;
  projetLibelle?: string;
  destinataireNom?: string;
}

interface TransactionsPage {
  content: TransactionAdmin[];
  totalPages: number;
  totalElements: number;
}

const TYPE_OPTIONS = [
  "DEPOT",
  "RETRAIT",
  "INVESTISSEMENT",
  "VERSEMENT_PORTEUR",
  "VIREMENT_PORTEUR",
  "VERSEMENT_DIVIDENDE",
  "DIVIDENDE_ENTRANT",
  "DIVIDENDE_SORTANT",
  "REMBOURSEMENT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "CREDIT_PROJET",
  "RETRAIT_ADMIN",
];

const STATUT_OPTIONS = [
  "SUCCESS",
  "EN_COURS",
  "FAILED",
  "EN_ATTENTE_VALIDATION",
  "EN_ATTENTE_PAIEMENT",
  "PAYE",
  "ECHEC_PAIEMENT",
  "REJETEE",
];

const typeBadgeClass = (type: string, styles: Record<string, string>) => {
  if (type === "DEPOT") return styles.badgeDeposit;
  if (type.includes("RETRAIT") || type.startsWith("PAYOUT")) return styles.badgeWithdraw;
  if (type === "INVESTISSEMENT") return styles.badgeInvest;
  if (type.includes("PORTEUR") || type === "CREDIT_PROJET") return styles.badgeOwner;
  if (type.includes("DIVIDENDE")) return styles.badgeDividend;
  return styles.badgeOther;
};

const statutBadgeClass = (statut: string, styles: Record<string, string>) => {
  if (statut === "SUCCESS" || statut === "PAYE") return styles.statutSuccess;
  if (statut === "FAILED" || statut === "ECHEC_PAIEMENT" || statut === "REJETEE")
    return styles.statutFailed;
  return styles.statutPending;
};

export default function TransactionsAdminPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("");
  const [walletType, setWalletType] = useState("");
  const [statut, setStatut] = useState("");

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const changeFilter = (setter: (v: string) => void, value: string) => {
    setPage(0);
    setter(value);
  };

  const { data, isLoading, isError } = useQuery<TransactionsPage>({
    queryKey: ["admin-transactions", page, debouncedSearch, type, walletType, statut],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "25",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(type && { type }),
        ...(walletType && { walletType }),
        ...(statut && { statut }),
      });
      const res = await api.get<{ data: TransactionsPage }>(
        `/api/admin/transactions?${params}`,
      );
      return res.data;
    },
  });

  const transactions = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const partyLabel = (tx: TransactionAdmin) => {
    if (tx.utilisateurNom) return tx.utilisateurNom;
    if (tx.projetLibelle) return tx.projetLibelle;
    return "—";
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <FiActivity /> {t("admin.transactions.title")}
        </h1>
        <p>
          {t("admin.transactions.subtitle", {
            count: data?.totalElements ?? 0,
          })}
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch size={15} />
          <input
            type="text"
            placeholder={t("admin.transactions.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={type}
          onChange={(e) => changeFilter(setType, e.target.value)}
        >
          <option value="">{t("admin.transactions.all_types")}</option>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`admin.transactions.type_${opt.toLowerCase()}`, {
                defaultValue: opt,
              })}
            </option>
          ))}
        </select>
        <select
          value={walletType}
          onChange={(e) => changeFilter(setWalletType, e.target.value)}
        >
          <option value="">{t("admin.transactions.all_wallets")}</option>
          <option value="USER">{t("admin.transactions.wallet_user")}</option>
          <option value="PROJET">{t("admin.transactions.wallet_projet")}</option>
          <option value="DIVIDENDE">
            {t("admin.transactions.wallet_dividende")}
          </option>
        </select>
        <select
          value={statut}
          onChange={(e) => changeFilter(setStatut, e.target.value)}
        >
          <option value="">{t("admin.transactions.all_statuts")}</option>
          {STATUT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.transactions.table.date")}</th>
              <th>{t("admin.transactions.table.type")}</th>
              <th>{t("admin.transactions.table.party")}</th>
              <th>{t("admin.transactions.table.destinataire")}</th>
              <th>{t("admin.transactions.table.amount")}</th>
              <th>{t("admin.transactions.table.status")}</th>
              <th>{t("admin.transactions.table.reference")}</th>
              <th>{t("admin.transactions.table.description")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className={styles.loading}>
                  {t("common.loading")}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className={styles.loading}>
                  {t("admin.transactions.load_error")}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.loading}>
                  {t("admin.transactions.empty")}
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className={styles.dateCell}>
                    {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm", {
                      locale: currentLocale,
                    })}
                  </td>
                  <td>
                    <span className={typeBadgeClass(tx.type, styles)}>
                      {t(`admin.transactions.type_${tx.type.toLowerCase()}`, {
                        defaultValue: tx.type,
                      })}
                    </span>
                  </td>
                  <td>
                    <div className={styles.partyCell}>{partyLabel(tx)}</div>
                    {tx.utilisateurEmail && (
                      <div className={styles.emailCell}>
                        {tx.utilisateurEmail}
                      </div>
                    )}
                  </td>
                  <td>{tx.destinataireNom || "—"}</td>
                  <td className={styles.amountCell}>
                    {formatCurrency(tx.montant, "XOF")}
                  </td>
                  <td>
                    <span className={statutBadgeClass(tx.statut, styles)}>
                      {tx.statut}
                    </span>
                  </td>
                  <td className={styles.refCell}>
                    {tx.referenceType && tx.referenceId
                      ? `${tx.referenceType} #${tx.referenceId}`
                      : tx.referenceExterne || "—"}
                  </td>
                  <td className={styles.descCell}>{tx.description || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ‹
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
