// src/pages/Admin/WalletsProjets/WalletsProjetsAdminPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../service/api";
import styles from "./WalletsProjetsAdminPage.module.css";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/context/CurrencyContext"; // <--- IMPORT

interface WalletProjet {
  id: number;
  projetId: number | null;
  soldeDisponible: number;
  soldeBloque: number;
  soldeRetirable: number;
  walletType: string;
}

interface Projet {
  id: number;
  libelle: string;
  statutProjet: string;
  porteurNom: string;
}

export default function ProjectWalletsAdminPage() {
  const { t } = useTranslation();
  const { format } = useCurrency(); // <--- HOOK
  const [data, setData] = useState<(WalletProjet & { projet?: Projet })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<
    (WalletProjet & { projet?: Projet }) | null
  >(null);
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [showModal, setShowModal] = useState(false);

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
      await api.post(
        `/api/admin/projet-wallet/${selected.projetId}/verser-porteur`,
        {
          montant: montantNum,
          motif: motif || "Versement administrateur",
        }
      );
      toast.success(
        t("admin.wallets.toast.success", {
          amount: format(montantNum, "XOF"), // <--- Formaté
        })
      );
      setShowModal(false);
      setMontant("");
      setMotif("");
      fetchData();
    } catch (err: any) {
      toast.error(t("admin.wallets.toast.error"));
    }
  };

  if (loading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t("admin.wallets.title")}</h1>
      <div className={styles.grid}>
        {data.map((w) => (
          <div key={w.id} className={styles.card}>
            <div className={styles.header}>
              <h3>{w.projet?.libelle || `Projet #${w.projetId}`}</h3>
              <span
                className={`${styles.statut} ${
                  styles[(w.projet?.statutProjet || "inconnu").toLowerCase()]
                }`}
              >
                {w.projet?.statutProjet || "Inconnu"}
              </span>
            </div>
            <div className={styles.info}>
              <p>
                <strong>{t("admin.wallets.modal.owner")} :</strong>{" "}
                {w.projet?.porteurNom || "Non défini"}
              </p>
            </div>
            <div className={styles.solde}>
              {/* MONTANT DYNAMIQUE */}
              <strong>{format(w.soldeDisponible, "XOF")}</strong>{" "}
              {t("admin.wallets.available")}
              {w.soldeBloque > 0 && (
                <small className={styles.bloqueText}>
                  {t("admin.wallets.blocked")} : {format(w.soldeBloque, "XOF")}
                </small>
              )}
            </div>
            <div className={styles.actions}>
              <Link
                to={`/admin/project-wallets/${w.projetId}`}
                className={styles.btnDetail}
              >
                {t("admin.wallets.detail_btn")}
              </Link>
              <button
                onClick={() => {
                  setSelected(w);
                  setMontant(w.soldeDisponible.toString());
                  setShowModal(true);
                }}
                className={styles.btnVerser}
                disabled={w.soldeDisponible <= 0}
              >
                {t("admin.wallets.pay_owner_btn")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selected && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.wallets.modal.title")}</h2>
            <p>
              <strong>{t("admin.wallets.modal.available")} :</strong>{" "}
              {format(selected.soldeDisponible, "XOF")}
            </p>
            <div className={styles.formGroup}>
              <label>{t("admin.wallets.modal.amount_label")}</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t("admin.wallets.modal.reason_label")}</label>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleVerser} className={styles.btnConfirm}>
                {t("admin.wallets.modal.confirm")}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={styles.btnCancel}
              >
                {t("admin.wallets.modal.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
