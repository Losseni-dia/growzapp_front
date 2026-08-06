import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiFileText, FiSearch, FiDownload, FiCheck, FiX } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { api, buildFileUrl } from "../../../service/Api";
import styles from "./DocumentsAdminPage.module.css";

interface DocumentAdmin {
  id: number;
  nom: string;
  url: string;
  type: string;
  description?: string;
  statut: string;
  uploadedAt: string;
  projetId?: number;
  projetLibelle?: string;
}

type StatutFiltre = "TOUS" | "EN_ATTENTE" | "APPROUVE" | "REJETE";

export default function DocumentsAdminPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<StatutFiltre>("TOUS");

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const { data, isLoading, isError } = useQuery<{ data: DocumentAdmin[] }>({
    queryKey: ["admin-documents", statutFiltre],
    queryFn: () =>
      api.get(
        `/api/documents/admin/all${statutFiltre !== "TOUS" ? `?statut=${statutFiltre}` : ""}`,
      ),
  });

  const documents = data?.data ?? [];

  const filtered = documents.filter(
    (doc) =>
      (doc.projetLibelle || "").toLowerCase().includes(search.toLowerCase()) ||
      doc.nom.toLowerCase().includes(search.toLowerCase()),
  );

  const handleApprouver = async (id: number) => {
    try {
      await api.patch(`/api/documents/${id}/approuver`, {});
      toast.success(t("admin.documents.toast.approved"));
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    } catch {
      toast.error(t("admin.documents.toast.error"));
    }
  };

  const handleRejeter = async (id: number) => {
    try {
      await api.patch(`/api/documents/${id}/rejeter`, {});
      toast.success(t("admin.documents.toast.rejected"));
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    } catch {
      toast.error(t("admin.documents.toast.error"));
    }
  };

const handleDownload = (id: number) => {
  window.open(buildFileUrl(`/api/documents/${id}/download`), "_blank");
};

  const statutBadge = (statut: string) => {
    if (statut === "EN_ATTENTE")
      return (
        <span className={styles.badgePending}>
          {t("admin.documents.status_pending")}
        </span>
      );
    if (statut === "REJETE")
      return (
        <span className={styles.badgeRejected}>
          {t("admin.documents.status_rejected")}
        </span>
      );
    return (
      <span className={styles.badgeApproved}>
        {t("admin.documents.status_approved")}
      </span>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>
          <FiFileText /> {t("admin.documents.title")}
        </h1>
        <p className={styles.subtitle}>{t("admin.documents.subtitle")}</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder={t("admin.documents.search_placeholder") || ""}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {(["TOUS", "EN_ATTENTE", "APPROUVE", "REJETE"] as StatutFiltre[]).map(
            (f) => (
              <button
                key={f}
                className={
                  statutFiltre === f ? styles.filterActive : styles.filterBtn
                }
                onClick={() => setStatutFiltre(f)}
              >
                {t(`admin.documents.filter_${f.toLowerCase()}`)}
              </button>
            ),
          )}
        </div>
      </div>

      {isLoading && <p>{t("admin.documents.loading")}</p>}
      {isError && (
        <p className={styles.error}>{t("admin.documents.load_error")}</p>
      )}

      {!isLoading && !isError && (
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>{t("admin.documents.empty")}</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("admin.documents.col_name")}</th>
                  <th>{t("admin.documents.col_project")}</th>
                  <th>{t("admin.documents.col_status")}</th>
                  <th>{t("admin.documents.col_date")}</th>
                  <th>{t("admin.documents.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <strong>{doc.nom}</strong>
                      {doc.description && (
                        <div className={styles.docDescription}>
                          {doc.description}
                        </div>
                      )}
                    </td>
                    <td>{doc.projetLibelle || "—"}</td>
                    <td>{statutBadge(doc.statut)}</td>
                    <td>
                      {format(new Date(doc.uploadedAt), "dd MMM yyyy", {
                        locale: currentLocale,
                      })}
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        title={t("admin.documents.download") || ""}
                        onClick={() => handleDownload(doc.id)}
                      >
                        <FiDownload />
                      </button>
                      {doc.statut === "EN_ATTENTE" && (
                        <>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApprouver(doc.id)}
                          >
                            <FiCheck /> {t("admin.documents.approve")}
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleRejeter(doc.id)}
                          >
                            <FiX /> {t("admin.documents.reject")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
