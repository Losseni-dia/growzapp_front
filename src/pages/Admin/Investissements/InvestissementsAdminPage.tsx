import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiClock,
  FiMail,
  FiSearch,
  FiSend,
  FiTrendingUp,
  FiUser,
  FiX,
  FiFilter,
} from "react-icons/fi";
import { api } from "../../../service/Api";
import styles from "./InvestissementsAdminPage.module.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface InvestissementAdmin {
  id: number;
  date: string;
  investisseurNom: string;
  investisseurPrenom?: string;
  investisseurEmail?: string;
  investisseurTelephone?: string;
  projetLibelle: string;
  nombrePartsPris: number;
  prixUnePart: number;
  montantInvesti?: number;
  statutPartInvestissement: "EN_ATTENTE" | "VALIDE" | "ANNULE";
  numeroContrat?: string;
  pourcentage?: number;
}

type Filtre = "TOUS" | "EN_ATTENTE" | "VALIDE" | "ANNULE";

interface InvestissementsPage {
  content: InvestissementAdmin[];
  totalPages: number;
  totalElements: number;
}

interface StatutCounts {
  EN_ATTENTE?: number;
  VALIDE?: number;
  ANNULE?: number;
  TOUS?: number;
}

export default function InvestissementsAdminPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [filtre, setFiltre] = useState<Filtre>("EN_ATTENTE");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [refusModal, setRefusModal] = useState<{
    inv: InvestissementAdmin;
  } | null>(null);
  const [motifRefus, setMotifRefus] = useState("");

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const changeFiltre = (f: Filtre) => {
    setPage(0);
    setFiltre(f);
  };

  const { data: counts } = useQuery<StatutCounts>({
    queryKey: ["admin-investissements-counts"],
    queryFn: async () => {
      const res = await api.get<{ data: StatutCounts }>(
        "/api/admin/investissements/counts",
      );
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data, isLoading } = useQuery<InvestissementsPage>({
    queryKey: ["admin-investissements", filtre, page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        ...(filtre !== "TOUS" && { statut: filtre }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await api.get<{ data: InvestissementsPage }>(
        `/api/admin/investissements?${params}`,
      );
      return res.data;
    },
    refetchInterval: 30000,
  });

  const filtered = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const enAttenteCount = counts?.EN_ATTENTE ?? 0;
  const validesCount = counts?.VALIDE ?? 0;
  const annulesCount = counts?.ANNULE ?? 0;
  const tousCount = counts?.TOUS ?? 0;

  // ── Valider ────────────────────────────────────────────────────────────────
  const valider = async (inv: InvestissementAdmin) => {
    setLoadingId(inv.id);
    try {
      const data = await api.post<{ numeroContrat: string }>(
        `${API_BASE_URL}/api/admin/investissements/${inv.id}/valider-et-envoyer`,
      );
      toast.success(`✅ Contrat ${data.numeroContrat} envoyé`, {
        duration: 6000,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-investissements"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-investissements-counts"],
      });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la validation");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Ouvrir modal refus ─────────────────────────────────────────────────────
  const ouvrirRefusModal = (inv: InvestissementAdmin) => {
    setMotifRefus("");
    setRefusModal({ inv });
  };

  // ── Confirmer refus avec motif ─────────────────────────────────────────────
  const confirmerRefus = async () => {
    if (!refusModal) return;
    if (!motifRefus.trim()) {
      toast.error("Veuillez saisir le motif du refus");
      return;
    }
    const inv = refusModal.inv;
    setRefusModal(null);
    setLoadingId(inv.id);
    try {
      await api.post(
        `${API_BASE_URL}/api/admin/investissements/${inv.id}/annuler`,
        { motif: motifRefus.trim() },
      );
      toast.success(
        "Investissement refusé — fonds restitués et investisseur notifié",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-investissements"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-investissements-counts"],
      });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du refus");
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.container}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1>
            <FiTrendingUp /> {t("admin.investments.title")}
          </h1>
          <p>{tousCount} investissement(s) au total</p>
        </div>
        <div className={styles.headerStats}>
          <div className={`${styles.stat} ${styles.statPending}`}>
            <span className={styles.statCount}>{enAttenteCount}</span>
            <span className={styles.statLabel}>En attente</span>
          </div>
          <div className={`${styles.stat} ${styles.statValid}`}>
            <span className={styles.statCount}>{validesCount}</span>
            <span className={styles.statLabel}>Validés</span>
          </div>
          <div className={`${styles.stat} ${styles.statCancelled}`}>
            <span className={styles.statCount}>{annulesCount}</span>
            <span className={styles.statLabel}>Annulés</span>
          </div>
        </div>
      </div>

      {/* ── RECHERCHE ─────────────────────────────────────────────── */}
      <div className={styles.searchBox}>
        <FiSearch size={16} />
        <input
          type="text"
          placeholder="Rechercher par investisseur ou projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── FILTRES ───────────────────────────────────────────────── */}
      <div className={styles.filtres}>
        <FiFilter size={16} />
        {(["EN_ATTENTE", "TOUS", "VALIDE", "ANNULE"] as Filtre[]).map((f) => (
          <button
            key={f}
            onClick={() => changeFiltre(f)}
            className={`${styles.filtreBtn} ${filtre === f ? styles.filtreActif : ""}`}
          >
            {f === "EN_ATTENTE"
              ? `⏳ En attente (${enAttenteCount})`
              : f === "VALIDE"
                ? `✅ Validés (${validesCount})`
                : f === "ANNULE"
                  ? `❌ Annulés (${annulesCount})`
                  : `Tous (${tousCount})`}
          </button>
        ))}
      </div>

      {/* ── LISTE ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <FiClock size={40} />
          <p>
            Aucun investissement {filtre === "EN_ATTENTE" ? "en attente" : ""}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((inv) => {
            const montant =
              inv.montantInvesti ?? inv.nombrePartsPris * inv.prixUnePart;
            const isProcessing = loadingId === inv.id;

            return (
              <div
                key={inv.id}
                className={`${styles.card} ${
                  inv.statutPartInvestissement === "EN_ATTENTE"
                    ? styles.cardPending
                    : inv.statutPartInvestissement === "VALIDE"
                      ? styles.cardValid
                      : styles.cardCancelled
                }`}
              >
                <div className={styles.statut}>
                  {inv.statutPartInvestissement === "EN_ATTENTE" && (
                    <span className={styles.badgePending}>
                      <FiClock /> En attente
                    </span>
                  )}
                  {inv.statutPartInvestissement === "VALIDE" && (
                    <span className={styles.badgeValid}>
                      <FiCheckCircle /> Validé
                    </span>
                  )}
                  {inv.statutPartInvestissement === "ANNULE" && (
                    <span className={styles.badgeCancelled}>
                      <FiX /> Annulé
                    </span>
                  )}
                  <span className={styles.invId}>#{inv.id}</span>
                </div>

                <div className={styles.investisseur}>
                  <div className={styles.avatar}>
                    <FiUser size={24} />
                  </div>
                  <div>
                    <h3>
                      {inv.investisseurPrenom} {inv.investisseurNom}
                    </h3>
                    {inv.investisseurEmail && (
                      <p>
                        <FiMail size={13} /> {inv.investisseurEmail}
                      </p>
                    )}
                    {inv.investisseurTelephone && (
                      <p>📱 {inv.investisseurTelephone}</p>
                    )}
                  </div>
                </div>

                <div className={styles.details}>
                  <div className={styles.projet}>
                    <strong>{inv.projetLibelle}</strong>
                    <span>
                      {format(new Date(inv.date), "dd MMM yyyy", {
                        locale: currentLocale,
                      })}
                    </span>
                  </div>
                  <div className={styles.montant}>
                    <span>
                      {inv.nombrePartsPris} part
                      {inv.nombrePartsPris > 1 ? "s" : ""}
                    </span>
                    <strong>{montant.toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                </div>

                {inv.statutPartInvestissement === "VALIDE" &&
                  inv.numeroContrat && (
                    <div className={styles.contratInfo}>
                      <FiCheckCircle /> Contrat {inv.numeroContrat}
                    </div>
                  )}

                {inv.statutPartInvestissement === "EN_ATTENTE" && (
                  <div className={styles.actions}>
                    <button
                      onClick={() => valider(inv)}
                      disabled={isProcessing}
                      className={styles.btnValider}
                    >
                      {isProcessing ? (
                        "Traitement..."
                      ) : (
                        <>
                          <FiSend /> Valider et envoyer contrat
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => ouvrirRefusModal(inv)}
                      disabled={isProcessing}
                      className={styles.btnAnnuler}
                    >
                      <FiX /> Refuser
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {/* ── MODAL MOTIF REFUS ─────────────────────────────────────── */}
      {refusModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setRefusModal(null)}
        >
          <div
            className={styles.modalRefus}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalRefusHeader}>
              <h3>❌ Refuser l'investissement</h3>
              <button
                className={styles.modalClose}
                onClick={() => setRefusModal(null)}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.modalRefusInfo}>
              <div>
                <FiUser size={14} />{" "}
                <strong>
                  {refusModal.inv.investisseurPrenom}{" "}
                  {refusModal.inv.investisseurNom}
                </strong>
              </div>
              <div>📁 {refusModal.inv.projetLibelle}</div>
              <div>
                💰{" "}
                <strong>
                  {(
                    refusModal.inv.montantInvesti ??
                    refusModal.inv.nombrePartsPris * refusModal.inv.prixUnePart
                  ).toLocaleString("fr-FR")}{" "}
                  FCFA
                </strong>
              </div>
            </div>

            <label className={styles.motifLabel}>
              Motif du refus <span style={{ color: "#c62828" }}>*</span>
            </label>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              placeholder="Ex : Documents KYC insuffisants, projet non conforme, investisseur non éligible..."
              rows={4}
              className={styles.motifTextarea}
              autoFocus
            />
            <p className={styles.motifHint}>
              Ce motif sera envoyé à l'investisseur par notification.
            </p>

            <div className={styles.modalRefusActions}>
              <button
                className={styles.btnBackModal}
                onClick={() => setRefusModal(null)}
              >
                Annuler
              </button>
              <button
                className={styles.btnConfirmRefus}
                onClick={confirmerRefus}
                disabled={!motifRefus.trim()}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
