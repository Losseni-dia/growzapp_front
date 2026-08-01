import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { api } from "../../../service/Api";
import styles from "./KycHistoriquePanel.module.css";

type StatutFiltre = "TOUS" | "VALIDE" | "REJETE";

interface KycHistoriqueRow {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  kycStatus: "VALIDE" | "REJETE" | string;
  kycNumeroPiece?: string;
  kycDateExpiration?: string;
  kycDateValidation?: string;
  kycCommentaireRejet?: string;
}

interface HistoriquePage {
  content: KycHistoriqueRow[];
  totalPages: number;
  totalElements: number;
}

export default function KycHistoriquePanel() {
  const { t, i18n } = useTranslation();
  const [statut, setStatut] = useState<StatutFiltre>("TOUS");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const { data, isLoading, isError } = useQuery<HistoriquePage>({
    queryKey: ["kyc-historique", statut, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        statut,
        page: page.toString(),
        size: "20",
        ...(search && { search }),
      });
      const res = await api.get<{ data: HistoriquePage }>(
        `/api/kyc/admin/historique?${params}`,
      );
      return res.data;
    },
  });

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const changeStatut = (s: StatutFiltre) => {
    setPage(0);
    setStatut(s);
  };

  const handleSearchChange = (value: string) => {
    setPage(0);
    setSearch(value);
  };

  const formatDate = (value?: string) =>
    value
      ? format(new Date(value), "dd MMM yyyy", { locale: currentLocale })
      : "—";

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {(["TOUS", "VALIDE", "REJETE"] as StatutFiltre[]).map((s) => (
            <button
              key={s}
              className={`${styles.tabBtn} ${statut === s ? styles.tabBtnActive : ""}`}
              onClick={() => changeStatut(s)}
            >
              {t(`admin.kyc.historique.filter_${s.toLowerCase()}`)}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <FiSearch size={15} />
          <input
            type="text"
            placeholder={t("admin.kyc.historique.search_placeholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.kyc.historique.table.name")}</th>
              <th>{t("admin.kyc.historique.table.status")}</th>
              <th>{t("admin.kyc.historique.table.piece_no")}</th>
              <th>{t("admin.kyc.historique.table.expiration")}</th>
              <th>{t("admin.kyc.historique.table.decision_date")}</th>
              <th>{t("admin.kyc.historique.table.motif")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  {t("common.loading")}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  {t("admin.kyc.historique.load_error")}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  {t("admin.kyc.historique.empty")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.nameCell}>
                      {row.prenom} {row.nom}
                    </div>
                    <div className={styles.emailCell}>{row.email}</div>
                  </td>
                  <td>
                    <span
                      className={
                        row.kycStatus === "VALIDE"
                          ? styles.badgeValide
                          : styles.badgeRejete
                      }
                    >
                      {row.kycStatus === "VALIDE"
                        ? t("admin.kyc.historique.status_valide")
                        : t("admin.kyc.historique.status_rejete")}
                    </span>
                  </td>
                  <td>{row.kycNumeroPiece || "—"}</td>
                  <td>{formatDate(row.kycDateExpiration)}</td>
                  <td>{formatDate(row.kycDateValidation)}</td>
                  <td className={styles.motifCell}>
                    {row.kycCommentaireRejet || "—"}
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
