// src/pages/wallet/WalletPage.tsx → VERSION FINALE ULTIME (25 NOV 2025) – CORRIGÉE

import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import styles from "./WalletPage.module.css";

import type { WalletDTO } from "../../types/wallet";
import type { TransactionDTO } from "../../types/transaction";

// DTO pour la recherche utilisateur (correspond exactement à ce que renvoie le backend)
interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
  image: string | null;
}

export default function WalletPage() {
  const { user } = useAuth();

  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaires
  const [montantDepot, setMontantDepot] = useState("");
  const [montantRetrait, setMontantRetrait] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [montantTransfer, setMontantTransfer] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  // Chargement initial
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, txData] = await Promise.all([
          api.get<WalletDTO>("/api/wallets/solde"),
          api.get<TransactionDTO[]>("/api/transactions/mes-transactions"),
        ]);
        setWallet(walletData);
        setTransactions(txData);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Erreur de chargement du portefeuille"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // RECHERCHE UTILISATEUR – CORRIGÉE
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
        // Exclure soi-même
        setSearchResults(res.filter((u) => u.id !== user?.id));
      } catch (err) {
        console.error("Erreur recherche utilisateur", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchUser, user?.id]);

  // Dépôt
  const handleDepot = async () => {
    const montant = parseFloat(montantDepot);
    if (isNaN(montant) || montant <= 0) return toast.error("Montant invalide");
    try {
      const updatedWallet = await api.post<WalletDTO>("/api/wallets/depot", {
        montant,
      });
      setWallet(updatedWallet);
      setMontantDepot("");
      toast.success("Dépôt effectué !");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec du dépôt");
    }
  };

  // Retrait
  const handleRetrait = async () => {
    const montant = parseFloat(montantRetrait);
    if (isNaN(montant) || montant <= 0) return toast.error("Montant invalide");
    try {
      await api.post("/api/wallets/retrait", { montant });
      setMontantRetrait("");
      toast.success("Demande de retrait envoyée");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec du retrait");
    }
  };

  // Transfert
  const handleTransfer = async () => {
    if (!selectedUser) return toast.error("Sélectionne un destinataire");
    const montant = parseFloat(montantTransfer);
    if (isNaN(montant) || montant <= 0) return toast.error("Montant invalide");

    try {
      await api.post("/api/wallets/transfer", {
        destinataireUserId: selectedUser.id,
        montant,
      });
      toast.success(`Transfert envoyé à ${selectedUser.nomComplet} !`);
      setMontantTransfer("");
      setSearchUser("");
      setSelectedUser(null);
      setSearchResults([]);
      const updatedWallet = await api.get<WalletDTO>("/api/wallets/solde");
      setWallet(updatedWallet);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfert échoué");
    }
  };

  if (loading)
    return <div className={styles.loading}>Chargement du portefeuille...</div>;
  if (!wallet)
    return (
      <div className={styles.loading}>
        Impossible de charger le portefeuille
      </div>
    );

  const pendingWithdrawals = transactions.filter(
    (t) => t.type === "RETRAIT" && t.statut === "EN_ATTENTE_VALIDATION"
  ).length;

  return (
    <div className={styles.container}>
      {/* Header Solde */}
      <div className={styles.header}>
        <h1 className={styles.title}>Mon Portefeuille</h1>
        <div className={styles.balanceGrid}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>Solde disponible</div>
            <div className={styles.balanceAmount}>
              {wallet.soldeDisponible.toFixed(2)} €
            </div>
          </div>
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>Bloqué (en attente)</div>
            <div className={styles.balanceAmount}>
              {wallet.soldeBloque.toFixed(2)} €
            </div>
          </div>
        </div>
        <div className={styles.total}>
          Total : {(wallet.soldeDisponible + wallet.soldeBloque).toFixed(2)} €
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsGrid}>
        {/* Dépôt */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Déposer des fonds</h3>
          <input
            type="number"
            placeholder="Montant en €"
            value={montantDepot}
            onChange={(e) => setMontantDepot(e.target.value)}
            className={styles.input}
          />
          <button
            onClick={handleDepot}
            className={`${styles.btn} ${styles.btnDepot}`}
          >
            Déposer
          </button>
        </div>

        {/* Retrait */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Retirer des fonds</h3>
          <input
            type="number"
            placeholder="Montant en €"
            value={montantRetrait}
            onChange={(e) => setMontantRetrait(e.target.value)}
            className={styles.input}
          />
          <button
            onClick={handleRetrait}
            className={`${styles.btn} ${styles.btnRetrait}`}
          >
            Demander un retrait
          </button>
        </div>

        {/* Transfert – CORRIGÉ */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Transférer à un ami</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou login..."
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                setSelectedUser(null); // Réinitialise la sélection
              }}
              className={styles.input}
            />

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    className={styles.searchItem}
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchUser(`${u.nomComplet} (@${u.login})`);
                      setSearchResults([]);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt={u.login}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                          {u.nomComplet[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{u.nomComplet}</div>
                        <div className="text-sm text-gray-500">@{u.login}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affichage du destinataire sélectionné */}
          {selectedUser && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <span className="text-sm font-medium">Destinataire :</span>
              {selectedUser.image && (
                <img
                  src={selectedUser.image}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>
                <strong>{selectedUser.nomComplet}</strong> (@
                {selectedUser.login})
              </span>
            </div>
          )}

          <input
            type="number"
            placeholder="Montant à envoyer"
            value={montantTransfer}
            onChange={(e) => setMontantTransfer(e.target.value)}
            className={styles.input}
            disabled={!selectedUser}
          />
          <button
            onClick={handleTransfer}
            disabled={!selectedUser || !montantTransfer}
            className={`${styles.btn} ${styles.btnTransfer} ${
              !selectedUser || !montantTransfer
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Envoyer le transfert
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className={styles.historyCard}>
        <h2 className={styles.historyTitle}>Historique des transactions</h2>
        {pendingWithdrawals > 0 && (
          <div className={styles.pendingWithdrawalsAlert}>
            {pendingWithdrawals} retrait{pendingWithdrawals > 1 ? "s" : ""} en
            attente de validation admin
          </div>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Montant</th>
              <th className={styles.th}>Statut</th>
              <th className={styles.th}>Détail</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Aucune transaction pour le moment
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className={styles.td}>
                    {format(new Date(tx.createdAt), "dd MMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </td>
                  <td className={styles.td}>
                    {tx.type === "DEPOT" && "Dépôt"}
                    {tx.type === "RETRAIT" && "Retrait"}
                    {tx.type === "TRANSFER_OUT" && "Transfert envoyé"}
                    {tx.type === "TRANSFER_IN" && "Transfert reçu"}
                    {tx.type === "INVESTISSEMENT" && "Investissement"}
                  </td>
                  <td
                    className={`${styles.td} ${
                      tx.type.includes("IN") || tx.type === "DEPOT"
                        ? styles.amountPositive
                        : styles.amountNegative
                    }`}
                  >
                    {tx.type.includes("IN") || tx.type === "DEPOT" ? "+" : "-"}
                    {tx.montant.toFixed(2)} €
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.status} ${
                        tx.statut === "SUCCESS"
                          ? styles.statusSuccess
                          : tx.statut === "EN_ATTENTE_VALIDATION"
                          ? styles.statusPending
                          : styles.statusFailed
                      }`}
                    >
                      {tx.statut === "SUCCESS"
                        ? "Succès"
                        : tx.statut === "EN_ATTENTE_VALIDATION"
                        ? "En attente"
                        : tx.statut === "REJETEE"
                        ? "Rejeté"
                        : tx.statut}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {tx.description ? (
                      <span className={styles.detailRejected}>
                        Rejeté : {tx.description}
                      </span>
                    ) : tx.type === "RETRAIT" &&
                      tx.statut === "EN_ATTENTE_VALIDATION" ? (
                      <span className={styles.detailPending}>
                        En attente de validation admin
                      </span>
                    ) : tx.type === "RETRAIT" && tx.statut === "SUCCESS" ? (
                      <span className={styles.detailSuccess}>
                        Retrait validé
                      </span>
                    ) : tx.type === "TRANSFER_OUT" &&
                      tx.destinataireNomComplet ? (
                      <span className={styles.detailTransfer}>
                        → {tx.destinataireNomComplet} (@{tx.destinataireLogin})
                      </span>
                    ) : tx.type === "TRANSFER_IN" && tx.expediteurNomComplet ? (
                      <span className={styles.detailTransfer}>
                        ← {tx.expediteurNomComplet} (@{tx.expediteurLogin})
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
