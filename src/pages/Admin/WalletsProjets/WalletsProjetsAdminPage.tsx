// src/pages/Admin/WalletsProjets/WalletsProjetsAdminPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../service/Api";
import styles from "./WalletsProjetsAdminPage.module.css";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import {
  FiArrowRight,
  FiClock,
  FiSearch,
  FiDollarSign,
  FiX,
} from "react-icons/fi";

interface WalletProjet {
  id: number;
  projetId: number | null;
  soldeDisponible: number;
  soldeBloque: number;
  soldeRetirable: number;
  walletType: string;
  dernierInvestissement: string | null;
}

interface Projet {
  id: number;
  libelle: string;
  statutProjet: string;
  porteurNom: string;
}

type Filter = "ALL" | "ACTIVE" | "EMPTY";

export default function ProjectWalletsAdminPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [data, setData] = useState<(WalletProjet & { projet?: Projet })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const [selected, setSelected] = useState<
    (WalletProjet & { projet?: Projet }) | null
  >(null);
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletsRes, projetsWrapped] = await Promise.all([
        api.get<WalletProjet[]>("/api/admin/projet-wallet/list"),
        api.get<any>("/api/projets"),
      ]);
      const projetsRes: Projet[] = projetsWrapped.data || [];
      const projetsMap = new Map(projetsRes.map((p) => [p.id, p]));
      const enriched = walletsRes
        .filter((w) => w.projetId !== null)
        .map((w) => ({
          ...w,
          projet: projetsMap.get(w.projetId!) || undefined,
        }));
      setData(enriched);
    } catch (err: any) {
      toast.error(t("admin.withdrawals.toast.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerser = async () => {
    if (!selected || !montant || parseFloat(montant) <= 0) {
      toast.error(t("admin.wallets.toast.invalid_amount"));
      return;
    }
    const montantNum = parseFloat(montant);
    if (montantNum > selected.soldeDisponible) {
      toast.error(t("admin.wallets.toast.insufficient_funds"));
      return;
    }

    try {
      setSubmitting(true);
      await api.post(
        `/api/admin/projet-wallet/${selected.projetId}/verser-porteur`,
        { montant: montantNum, motif: motif || "Versement administrateur" },
      );
      toast.success(
        t("admin.wallets.toast.success", { amount: format(montantNum, "XOF") }),
      );
      setShowModal(false);
      setMontant("");
      setMotif("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t("admin.wallets.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = data.filter((w) => {
    const matchesSearch =
      (w.projet?.libelle || "").toLowerCase().includes(search.toLowerCase()) ||
      (w.projet?.porteurNom || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "ALL" ||
      (filter === "ACTIVE" && w.soldeDisponible > 0) ||
      (filter === "EMPTY" && w.soldeDisponible <= 0);
    return matchesSearch && matchesFilter;
  });

  const totalDisponible = data.reduce((sum, w) => sum + w.soldeDisponible, 0);

  const formatRelativeDate = (iso: string | null) => {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 30) return `Il y a ${days} j`;
    const months = Math.floor(days / 30);
    if (months < 12) return `Il y a ${months} mois`;
    return new Date(iso).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ═══════════ HEADER ═══════════ */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("admin.wallets.title")}</h1>
          <p className={styles.subtitle}>
            {data.length} projet{data.length > 1 ? "s" : ""} · Trésorerie totale
            disponible : <strong>{format(totalDisponible, "XOF")}</strong>
          </p>
        </div>
      </header>

      {/* ═══════════ FILTRES ═══════════ */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Rechercher un projet ou un porteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterChips}>
          <button
            className={`${styles.chip} ${filter === "ALL" ? styles.chipActive : ""}`}
            onClick={() => setFilter("ALL")}
          >
            Tous
          </button>
          <button
            className={`${styles.chip} ${filter === "ACTIVE" ? styles.chipActive : ""}`}
            onClick={() => setFilter("ACTIVE")}
          >
            Avec solde
          </button>
          <button
            className={`${styles.chip} ${filter === "EMPTY" ? styles.chipActive : ""}`}
            onClick={() => setFilter("EMPTY")}
          >
            Vides
          </button>
        </div>
      </div>

      {/* ═══════════ LISTE ═══════════ */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <FiDollarSign size={32} />
          <p>Aucun projet ne correspond à votre recherche</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((w) => {
            const relDate = formatRelativeDate(w.dernierInvestissement);
            return (
              <div key={w.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowInfo}>
                    <h3 className={styles.rowTitle}>
                      {w.projet?.libelle || `Projet #${w.projetId}`}
                    </h3>
                    <div className={styles.rowMeta}>
                      <span>
                        {w.projet?.porteurNom || "Porteur non défini"}
                      </span>
                      {relDate && (
                        <span className={styles.rowDate}>
                          <FiClock size={12} /> {relDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.rowAmount}>
                    <span className={styles.amountValue}>
                      {format(w.soldeDisponible, "XOF")}
                    </span>
                    <span className={styles.amountLabel}>disponible</span>
                    {w.soldeBloque > 0 && (
                      <span className={styles.amountBlocked}>
                        +{format(w.soldeBloque, "XOF")} bloqué
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <Link
                    to={`/admin/project-wallets/${w.projetId}`}
                    className={styles.btnSecondary}
                  >
                    Détails <FiArrowRight size={14} />
                  </Link>
                  <button
                    onClick={() => {
                      setSelected(w);
                      setMontant(w.soldeDisponible.toString());
                      setShowModal(true);
                    }}
                    className={styles.btnPrimary}
                    disabled={w.soldeDisponible <= 0}
                  >
                    Verser au porteur
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ MODAL VERSEMENT ═══════════ */}
      {showModal && selected && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Versement au porteur</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <p className={styles.modalProjet}>
              {selected.projet?.libelle} · {selected.projet?.porteurNom}
            </p>

            <div className={styles.modalBalance}>
              Solde disponible :{" "}
              <strong>{format(selected.soldeDisponible, "XOF")}</strong>
            </div>

            <label className={styles.modalLabel}>Montant à verser (FCFA)</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className={styles.modalInput}
            />

            <label className={styles.modalLabel}>Motif</label>
            <input
              type="text"
              placeholder="Ex : Versement trimestriel T4 2025"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className={styles.modalInput}
            />

            <p className={styles.modalHint}>
              Le porteur et tous les investisseurs du projet seront notifiés
              (in-app + email).
            </p>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                className={styles.btnCancel}
              >
                Annuler
              </button>
              <button
                onClick={handleVerser}
                className={styles.btnConfirm}
                disabled={submitting}
              >
                {submitting ? "Traitement..." : "Confirmer le virement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
