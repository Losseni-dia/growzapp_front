import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiGift, FiSearch, FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { api } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import styles from "./DividendesAdminPage.module.css";

interface DividendeAdmin {
  id: number;
  montantParPart: number;
  statutDividende: "PLANIFIE" | "PAYE" | "ANNULE";
  moyenPaiement?: string;
  datePaiement?: string;
  projetLibelle?: string;
  investisseurNom?: string;
  montantTotal?: number;
  motif?: string;
}

interface DividendesPage {
  content: DividendeAdmin[];
  totalPages: number;
  totalElements: number;
}

type StatutFiltre = "TOUS" | "PLANIFIE" | "PAYE" | "ANNULE";

export default function DividendesAdminPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statut, setStatut] = useState<StatutFiltre>("TOUS");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const changeStatut = (s: StatutFiltre) => {
    setPage(0);
    setStatut(s);
  };

  const { data, isLoading, isError } = useQuery<DividendesPage>({
    queryKey: ["admin-dividendes", page, debouncedSearch, statut],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statut !== "TOUS" && { statut }),
      });
      const res = await api.get<{ data: DividendesPage }>(
        `/api/admin/dividendes?${params}`,
      );
      return res.data;
    },
  });

  const dividendes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleDelete = async (dividende: DividendeAdmin) => {
    if (!window.confirm(t("admin.dividends.confirm_delete"))) return;
    setDeletingId(dividende.id);
    try {
      await api.delete(`/api/admin/dividendes/${dividende.id}`);
      toast.success(t("admin.dividends.delete_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-dividendes"] });
    } catch (err: any) {
      toast.error(err.message || t("admin.dividends.delete_error"));
    } finally {
      setDeletingId(null);
    }
  };

  const statutBadge = (statut: string) => {
    if (statut === "PAYE") return styles.badgePaid;
    if (statut === "ANNULE") return styles.badgeCancelled;
    return styles.badgePlanned;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <FiGift /> {t("admin.dividends.title")}
        </h1>
        <p>
          {t("admin.dividends.subtitle", { count: data?.totalElements ?? 0 })}
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch size={15} />
          <input
            type="text"
            placeholder={t("admin.dividends.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.tabs}>
          {(["TOUS", "PLANIFIE", "PAYE", "ANNULE"] as StatutFiltre[]).map(
            (s) => (
              <button
                key={s}
                className={`${styles.tabBtn} ${statut === s ? styles.tabBtnActive : ""}`}
                onClick={() => changeStatut(s)}
              >
                {t(`admin.dividends.filter_${s.toLowerCase()}`)}
              </button>
            ),
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.dividends.table.project")}</th>
              <th>{t("admin.dividends.table.investor")}</th>
              <th>{t("admin.dividends.table.amount_per_share")}</th>
              <th>{t("admin.dividends.table.total")}</th>
              <th>{t("admin.dividends.table.status")}</th>
              <th>{t("admin.dividends.table.date")}</th>
              <th>{t("admin.dividends.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className={styles.loading}>
                  {t("common.loading")}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className={styles.loading}>
                  {t("admin.dividends.load_error")}
                </td>
              </tr>
            ) : dividendes.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.loading}>
                  {t("admin.dividends.empty")}
                </td>
              </tr>
            ) : (
              dividendes.map((d) => (
                <tr key={d.id}>
                  <td>{d.projetLibelle || "—"}</td>
                  <td>{d.investisseurNom || "—"}</td>
                  <td>{formatCurrency(d.montantParPart, "XOF")}</td>
                  <td>{formatCurrency(d.montantTotal ?? 0, "XOF")}</td>
                  <td>
                    <span className={statutBadge(d.statutDividende)}>
                      {d.statutDividende}
                    </span>
                  </td>
                  <td>
                    {d.datePaiement
                      ? format(new Date(d.datePaiement), "dd MMM yyyy", {
                          locale: currentLocale,
                        })
                      : "—"}
                  </td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(d)}
                      disabled={deletingId === d.id}
                      title={t("admin.dividends.delete")}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
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
