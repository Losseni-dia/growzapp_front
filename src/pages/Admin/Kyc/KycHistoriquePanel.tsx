import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FiEye, FiSearch, FiX, FiZoomIn } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { api } from "../../../service/Api";
import styles from "./KycHistoriquePanel.module.css";

type StatutFiltre = "TOUS" | "VALIDE" | "REJETE";
type DocType = "recto" | "verso" | "selfie";
type DocState = "loading" | "ready" | "missing";

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

  const [viewingUser, setViewingUser] = useState<KycHistoriqueRow | null>(null);
  const [docUrls, setDocUrls] = useState<Record<DocType, string | undefined>>({
    recto: undefined,
    verso: undefined,
    selfie: undefined,
  });
  const [docStates, setDocStates] = useState<Record<DocType, DocState | undefined>>({
    recto: undefined,
    verso: undefined,
    selfie: undefined,
  });
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const docUrlsRef = useRef<string[]>([]);

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

  // Chargées uniquement à la demande (clic sur "Voir documents"), pas pour
  // toute la page visible — évite d'appeler l'API pour rien sur des dossiers
  // que l'admin ne consultera jamais.
  const openDocuments = (row: KycHistoriqueRow) => {
    setViewingUser(row);
    setDocUrls({ recto: undefined, verso: undefined, selfie: undefined });
    setDocStates({ recto: undefined, verso: undefined, selfie: undefined });

    (["recto", "verso", "selfie"] as DocType[]).forEach(async (type) => {
      setDocStates((prev) => ({ ...prev, [type]: "loading" }));
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const response = await fetch(
          `${baseUrl}/api/kyc/admin/document/${row.id}/${type}`,
          { method: "GET", credentials: "include" },
        );
        if (!response.ok) {
          setDocStates((prev) => ({ ...prev, [type]: "missing" }));
          return;
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        docUrlsRef.current.push(blobUrl);
        setDocUrls((prev) => ({ ...prev, [type]: blobUrl }));
        setDocStates((prev) => ({ ...prev, [type]: "ready" }));
      } catch {
        setDocStates((prev) => ({ ...prev, [type]: "missing" }));
      }
    });
  };

  const closeDocuments = () => setViewingUser(null);

  useEffect(() => {
    return () => {
      docUrlsRef.current.forEach((url) => window.URL.revokeObjectURL(url));
    };
  }, []);

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
              <th>{t("admin.kyc.historique.table.documents")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  {t("common.loading")}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  {t("admin.kyc.historique.load_error")}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
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
                  <td>
                    <button
                      type="button"
                      className={styles.btnViewDocs}
                      onClick={() => openDocuments(row)}
                    >
                      <FiEye size={14} /> {t("admin.kyc.historique.btn_view_docs")}
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

      {viewingUser && (
        <div className={styles.modalOverlay} onClick={closeDocuments}>
          <div className={styles.docsModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeDocuments} aria-label="Fermer">
              <FiX size={18} />
            </button>
            <h3>
              {viewingUser.prenom} {viewingUser.nom}
            </h3>
            <div className={styles.docsGrid}>
              {(["recto", "verso", "selfie"] as DocType[]).map((type) => {
                const state = docStates[type];
                const url = docUrls[type];
                return (
                  <div key={type} className={styles.docCell}>
                    <span className={styles.docLabel}>
                      {t(`admin.kyc.doc_${type}`)}
                    </span>
                    {state === "ready" && url ? (
                      <button
                        type="button"
                        className={styles.docThumbBtn}
                        onClick={() => setZoomedUrl(url)}
                      >
                        <img src={url} alt={type} />
                        <span className={styles.docThumbOverlay}>
                          <FiZoomIn size={14} />
                        </span>
                      </button>
                    ) : state === "missing" ? (
                      <div className={styles.docMissing}>
                        {t("admin.kyc.doc_missing")}
                      </div>
                    ) : (
                      <div className={styles.docLoadingCell}>
                        <div className={styles.docSpinner} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {zoomedUrl && (
        <div className={styles.zoomOverlay} onClick={() => setZoomedUrl(null)}>
          <button className={styles.zoomClose} onClick={() => setZoomedUrl(null)}>
            <FiX size={20} />
          </button>
          <img
            src={zoomedUrl}
            alt="document"
            className={styles.zoomImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
