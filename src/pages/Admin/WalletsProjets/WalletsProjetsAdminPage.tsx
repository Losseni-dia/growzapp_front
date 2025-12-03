// src/pages/admin/ProjectWalletsAdminPage.tsx
// VERSION FINALE 2025 – PORTEUR AFFICHÉ UNIQUEMENT AVEC porteurNom – RIEN D'AUTRE

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../service/api";
import styles from "./WalletsProjetsAdminPage.module.css";

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
  porteurNom: string; // ← SEUL CHAMP EXISTANT DANS TON JSON
}

export default function ProjectWalletsAdminPage() {
  const [data, setData] = useState<(WalletProjet & { projet?: Projet })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<
    (WalletProjet & { projet?: Projet }) | null
  >(null);
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
      toast.error("Impossible de charger les données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerser = async () => {
    if (!selected || !montant || parseFloat(montant) <= 0) {
      toast.error("Montant invalide");
      return;
    }

    const montantNum = parseFloat(montant);
    if (montantNum > selected.soldeDisponible) {
      toast.error("Montant supérieur au solde disponible");
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
        `${montantNum.toLocaleString("fr-FR")} FCFA versés avec succès !`
      );
      setShowModal(false);
      setMontant("");
      setMotif("");
      fetchData();
    } catch (err: any) {
      toast.error("Échec du virement");
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>Chargement des comptes séquestrés...</div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trésorerie Séquestrée – Tous les Projets</h1>

      <div className={styles.grid}>
        {data.length === 0 ? (
          <p className={styles.empty}>Aucun fonds collecté pour le moment</p>
        ) : (
          data.map((w) => (
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
                  <strong>Porteur :</strong>{" "}
                  {w.projet?.porteurNom || "Non défini"}
                </p>
                {/* TÉLÉPHONE ET EMAIL RETIRÉS – ILS N'EXISTENT PAS DANS LE JSON */}
              </div>

              <div className={styles.solde}>
                <strong>
                  {w.soldeDisponible.toLocaleString("fr-FR")} FCFA
                </strong>{" "}
                disponibles
                {w.soldeBloque > 0 && (
                  <small className={styles.bloqueText}>
                    Bloqué : {w.soldeBloque.toLocaleString("fr-FR")} FCFA
                  </small>
                )}
              </div>

              <div className={styles.actions}>
                <Link
                  to={`/admin/project-wallets/${w.projetId}`}
                  className={styles.btnDetail}
                >
                  Voir détail trésorerie
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
                  Verser au porteur
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL VERSEMENT – SIMPLIFIÉ */}
      {showModal && selected && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Versement au porteur</h2>
            <p>
              <strong>Projet :</strong> {selected.projet?.libelle || "Inconnu"}
            </p>
            <p>
              <strong>Porteur :</strong>{" "}
              {selected.projet?.porteurNom || "Non défini"}
            </p>
            <p>
              <strong>Solde disponible :</strong>{" "}
              {selected.soldeDisponible.toLocaleString("fr-FR")} FCFA
            </p>

            <div className={styles.formGroup}>
              <label>Montant à verser (FCFA)</label>
              <input
                type="number"
                step="1000"
                min="1000"
                max={selected.soldeDisponible}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Motif (facultatif)</label>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className={styles.input}
                placeholder="Ex: Clôture du projet"
              />
            </div>

            <div className={styles.modalActions}>
              <button onClick={handleVerser} className={styles.btnConfirm}>
                Confirmer le virement
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={styles.btnCancel}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
