// src/pages/wallet/WalletPage.tsx → VERSION FINALE ULTIME — 26 NOV 2025
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import styles from "./WalletPage.module.css";

import type { WalletDTO } from "../../types/wallet";
import type { TransactionDTO } from "../../types/transaction";

interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
  image: string | null;
}

export default function WalletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // === TRANSFERT INTERNE ===
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [montantTransfer, setMontantTransfer] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [transferSource, setTransferSource] = useState<
    "DISPONIBLE" | "RETIRABLE"
  >("DISPONIBLE");

  // === DEMANDE DE RETRAIT (validation admin) ===
  const [montantDemande, setMontantDemande] = useState("");
  const [loadingDemande, setLoadingDemande] = useState(false);

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
        toast.error(err.response?.data?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Recherche utilisateur (intacte — ne touche pas)
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
        setSearchResults(res.filter((u) => u.id !== user?.id));
      } catch (err) {
        console.error("Erreur recherche", err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchUser, user?.id]);

  const getToken = (): string => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user?.token || user?.accessToken || user?.jwt || "";
      } catch {}
    }
    return "";
  };

  // === TRANSFERT INTERNE — AVEC CHOIX DE SOURCE ===
  const handleTransfer = async () => {
    if (!selectedUser) return toast.error("Sélectionne un destinataire");
    const montant = parseFloat(montantTransfer);
    if (isNaN(montant) || montant <= 0) return toast.error("Montant invalide");

    const token = getToken();
    if (!token) return toast.error("Reconnecte-toi");

    try {
      const res = await fetch("http://localhost:8080/api/wallets/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinataireUserId: selectedUser.id,
          montant,
          source: transferSource,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Transfert échoué");

      toast.success(
        transferSource === "RETIRABLE"
          ? "Transfert de gains validés envoyé instantanément !"
          : "Transfert envoyé avec succès !"
      );

      setMontantTransfer("");
      setSearchUser("");
      setSelectedUser(null);
      setSearchResults([]);
      setTransferSource("DISPONIBLE");

      const walletRes = await api.get<WalletDTO>("/api/wallets/solde");
      setWallet(walletRes);
    } catch (err: any) {
      toast.error(err.message || "Transfert échoué");
    }
  };

  // === DEMANDE DE RETRAIT (validation admin) ===
 const handleDemandeRetrait = async () => {
   const montant = parseFloat(montantDemande);
   if (montant < 5 || montant > wallet!.soldeDisponible) {
     toast.error("Montant invalide ou solde insuffisant");
     return;
   }

   setLoadingDemande(true);
   try {
     const token = getToken();
     const res = await fetch(
       "http://localhost:8080/api/wallets/demande-retrait",
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ montant }),
       }
     );

     const data = await res.json();
     if (!res.ok) throw new Error(data.message || "Échec");

     toast.success("Demande envoyée ! Visible dans l'historique");

     // Rafraîchir TOUT (solde + historique)
     const [newWallet, newTransactions] = await Promise.all([
       api.get<WalletDTO>("/api/wallets/solde"),
       api.get<TransactionDTO[]>("/api/transactions/mes-transactions"),
     ]);

     setWallet(newWallet);
     setTransactions(newTransactions);
     setMontantDemande("");
   } catch (err: any) {
     toast.error(err.message || "Erreur lors de la demande");
   } finally {
     setLoadingDemande(false);
   }
 };
  const pendingWithdrawals = transactions.filter(
    (t) => t.type === "RETRAIT" && t.statut === "EN_ATTENTE_VALIDATION"
  ).length;

  if (loading)
    return <div className={styles.loading}>Chargement du portefeuille...</div>;
  if (!wallet)
    return <div className={styles.loading}>Portefeuille introuvable</div>;

  return (
    <div className={styles.container}>
      {/* HEADER SOLDE */}
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
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>Retirable (validé admin)</div>
            <div className={styles.balanceAmount}>
              {wallet.soldeRetirable.toFixed(2)} €
            </div>
          </div>
        </div>
        <div className={styles.total}>
          Total :{" "}
          {(
            wallet.soldeDisponible +
            wallet.soldeBloque +
            wallet.soldeRetirable
          ).toFixed(2)}{" "}
          €
        </div>
      </div>

      {/* ACTIONS */}
      <div className={styles.actionsGrid}>
        {/* DÉPÔT EXTERNE */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Déposer de l'argent</h3>
          <p className={styles.actionDesc}>
            Carte bancaire, Orange Money, Wave, MTN...
          </p>
          <Link to="/depot">
            <button className={`${styles.btn} ${styles.btnDepot}`}>
              Ajouter des fonds
            </button>
          </Link>
        </div>

        {/* DEMANDE DE RETRAIT (validation admin) */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Demander un retrait</h3>
          <p className={styles.actionDesc}>
            Envoie une demande à l'admin · Fonds bloqués jusqu'à validation
          </p>
          <div style={{ margin: "1rem 0" }}>
            <input
              type="number"
              min="5"
              step="0.01"
              placeholder="Montant (min 5 €)"
              value={montantDemande}
              onChange={(e) => setMontantDemande(e.target.value)}
              className={styles.input}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <button
              onClick={handleDemandeRetrait}
              disabled={
                loadingDemande ||
                !montantDemande ||
                parseFloat(montantDemande) > wallet.soldeDisponible ||
                parseFloat(montantDemande) < 5
              }
              className={`${styles.btn} ${styles.btnRetraitAdmin}`}
            >
              {loadingDemande ? "Envoi..." : "Envoyer la demande"}
            </button>
          </div>
          {pendingWithdrawals > 0 && (
            <p
              style={{
                color: "#e67e22",
                fontSize: "0.9rem",
                marginTop: "0.5rem",
              }}
            >
              Tu as {pendingWithdrawals} demande(s) en attente
            </p>
          )}
        </div>

        {/* RETRAIT DIRECT (seulement si solde retirable > 0) */}
        {wallet.soldeRetirable > 0 && (
          <div className={styles.actionCard}>
            <h3 className={styles.actionTitle}>Retirer mes gains validés</h3>
            <p className={styles.actionDesc}>
              Vers Orange Money, Wave, MTN ou compte bancaire
            </p>
            <div style={{ textAlign: "center", margin: "1rem 0" }}>
              <p
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  color: "#27ae60",
                }}
              >
                {wallet.soldeRetirable.toFixed(2)} € disponibles
              </p>
            </div>
            <Link to="/retrait">
              <button className={`${styles.btn} ${styles.btnDepot}`}>
                Retirer maintenant
              </button>
            </Link>
          </div>
        )}

        {/* TRANSFERT INTERNE — AVEC CHOIX DE SOURCE */}
        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Transférer à un ami</h3>
          <p className={styles.actionDesc}>
            Envoie de l’argent à un autre utilisateur GrowzApp
          </p>

          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par nom ou login..."
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                setSelectedUser(null);
              }}
              className={styles.input}
            />
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {u.image ? (
                        <img
                          src={u.image}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: "#ddd",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#666",
                            fontWeight: "bold",
                          }}
                        >
                          {u.nomComplet[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.nomComplet}</div>
                        <div style={{ fontSize: "0.9rem", color: "#666" }}>
                          @{u.login}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <>
              <div
                style={{
                  margin: "1rem 0",
                  padding: "1rem",
                  background: "#f0fff4",
                  borderRadius: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontWeight: 600 }}>Destinataire :</span>
                {selectedUser.image && (
                  <img
                    src={selectedUser.image}
                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                  />
                )}
                <strong>
                  {selectedUser.nomComplet} (@{selectedUser.login})
                </strong>
              </div>

              <input
                type="number"
                placeholder="Montant à envoyer"
                value={montantTransfer}
                onChange={(e) => setMontantTransfer(e.target.value)}
                className={styles.input}
              />

              {/* CHOIX DE LA SOURCE */}
              <div style={{ margin: "1rem 0" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Payer depuis :
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="source"
                      value="DISPONIBLE"
                      checked={transferSource === "DISPONIBLE"}
                      onChange={() => setTransferSource("DISPONIBLE")}
                    />
                    <span>
                      Solde disponible ({wallet.soldeDisponible.toFixed(2)} €)
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="source"
                      value="RETIRABLE"
                      checked={transferSource === "RETIRABLE"}
                      onChange={() => setTransferSource("RETIRABLE")}
                    />
                    <span>
                      Gains validés ({wallet.soldeRetirable.toFixed(2)} €)
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleTransfer}
                disabled={
                  !selectedUser ||
                  !montantTransfer ||
                  parseFloat(montantTransfer) <= 0 ||
                  (transferSource === "DISPONIBLE" &&
                    parseFloat(montantTransfer) > wallet.soldeDisponible) ||
                  (transferSource === "RETIRABLE" &&
                    parseFloat(montantTransfer) > wallet.soldeRetirable)
                }
                className={`${styles.btn} ${styles.btnTransfer}`}
              >
                Envoyer le transfert
              </button>
            </>
          )}
        </div>
      </div>

      {/* HISTORIQUE */}
      <div className={styles.historyCard}>
        <h2 className={styles.historyTitle}>Historique des transactions</h2>
        {pendingWithdrawals > 0 && (
          <div className={styles.pendingWithdrawalsAlert}>
            {pendingWithdrawals} demande(s) de retrait en attente de validation
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
                    {tx.type === "RETRAIT" && "Demande de retrait"}
                    {tx.type === "TRANSFER_OUT" && "Transfert envoyé"}
                    {tx.type === "TRANSFER_IN" && "Transfert reçu"}
                    {tx.type === "PAYOUT_STRIPE" && "Retrait bancaire"}
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
                          : tx.statut === "REJETEE"
                          ? styles.statusFailed
                          : ""
                      }`}
                    >
                      {tx.statut === "SUCCESS"
                        ? "Validé"
                        : tx.statut === "EN_ATTENTE_VALIDATION"
                        ? "En attente admin"
                        : tx.statut === "REJETEE"
                        ? "Rejeté"
                        : tx.statut}
                    </span>
                  </td>
                  <td className={styles.td}>{tx.description || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
