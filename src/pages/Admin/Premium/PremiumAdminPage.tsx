import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BsStarFill } from "react-icons/bs";
import { FiSearch, FiXCircle, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { api, buildProjetUrl } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import styles from "./PremiumAdminPage.module.css";

interface ProjetPremium {
  id: number;
  libelle: string;
  libelleTradu?: string;
  porteurNom?: string;
  porteurPrenom?: string;
  statutProjet: string;
  montantCollecte: number;
  objectifFinancement: number;
  premiumActif: boolean;
  premiumFin?: string;
}

interface PremiumEnAttente {
  transactionId: number;
  projetId: number;
  projetLibelle: string;
  montant: number;
  createdAt: string;
  sourcePaiement?: string;
}

type FiltreVue = "actifs" | "historique" | "tous";

export default function PremiumAdminPage() {
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const [search, setSearch] = useState("");
  const [vue, setVue] = useState<FiltreVue>("actifs");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projets-premium"],
    queryFn: () =>
      api.get<{ data: ProjetPremium[] }>(buildProjetUrl("/api/admin/projets")),
  });

  const projets = data?.data ?? [];

  const revoquer = useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/admin/projets/${id}/premium/revoquer`),
    onSuccess: () => {
      toast.success("Statut Premium révoqué");
      queryClient.invalidateQueries({ queryKey: ["admin-projets-premium"] });
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
  });

  const handleRevoquer = (p: ProjetPremium) => {
    if (
      !window.confirm(
        `Révoquer le statut Premium de « ${p.libelleTradu || p.libelle} » ? Aucun remboursement automatique.`,
      )
    )
      return;
    revoquer.mutate(p.id);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = projets.filter((p) => p.premiumFin);
    if (vue === "actifs") list = list.filter((p) => p.premiumActif);
    if (vue === "historique") list = list.filter((p) => !p.premiumActif);
    if (term) {
      list = list.filter(
        (p) =>
          (p.libelleTradu || p.libelle).toLowerCase().includes(term) ||
          (p.porteurNom || "").toLowerCase().includes(term) ||
          (p.porteurPrenom || "").toLowerCase().includes(term),
      );
    }
    return [...list].sort((a, b) => {
      if (!a.premiumFin || !b.premiumFin) return 0;
      return new Date(b.premiumFin).getTime() - new Date(a.premiumFin).getTime();
    });
  }, [projets, search, vue]);

  const nbActifs = projets.filter((p) => p.premiumActif).length;

  const { data: enAttenteData, isLoading: loadingEnAttente } = useQuery({
    queryKey: ["admin-premium-en-attente"],
    queryFn: () =>
      api.get<{ data: PremiumEnAttente[] }>(
        "/api/admin/projets/premium/en-attente",
      ),
    refetchInterval: 30000,
  });
  const enAttente = enAttenteData?.data ?? [];

  const reconcilier = useMutation({
    mutationFn: (transactionId: number) =>
      api.post<{ data: string; message: string }>(
        `/api/admin/projets/premium/en-attente/${transactionId}/reconcilier`,
      ),
    onSuccess: (res) => {
      toast.success(res.message || "Vérification effectuée");
      queryClient.invalidateQueries({ queryKey: ["admin-premium-en-attente"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projets-premium"] });
    },
    onError: (err: any) => toast.error(err.message || "Erreur de vérification"),
  });

  if (isLoading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <BsStarFill size={20} />
        </div>
        <div>
          <h1 className={styles.title}>Gestion du Premium</h1>
          <p className={styles.subtitle}>
            {nbActifs} projet{nbActifs > 1 ? "s" : ""} Premium actif
            {nbActifs > 1 ? "s" : ""} en ce moment
          </p>
        </div>
      </header>

      {!loadingEnAttente && enAttente.length > 0 && (
        <div className={styles.alertBox}>
          <div className={styles.alertHeader}>
            <FiAlertTriangle size={16} />
            <strong>
              {enAttente.length} paiement{enAttente.length > 1 ? "s" : ""} Premium
              bloqué{enAttente.length > 1 ? "s" : ""} en attente
            </strong>
          </div>
          <p className={styles.alertHint}>
            Le webhook du fournisseur de paiement n'a jamais atteint le backend
            (souvent : tunnel ngrok fermé). Cliquez sur "Vérifier" pour
            interroger directement FedaPay/PayDunya et régulariser.
          </p>
          <div className={styles.tableWrap} style={{ marginTop: 8 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Montant</th>
                  <th>Source</th>
                  <th>Initié le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enAttente.map((tx) => (
                  <tr key={tx.transactionId}>
                    <td>{tx.projetLibelle}</td>
                    <td>{format(tx.montant, "XOF")}</td>
                    <td>{tx.sourcePaiement === "CARTE_BANCAIRE" ? "Carte bancaire" : "Mobile Money"}</td>
                    <td>{new Date(tx.createdAt).toLocaleString("fr-FR")}</td>
                    <td>
                      <button
                        className={styles.btnVerifier}
                        onClick={() => reconcilier.mutate(tx.transactionId)}
                        disabled={reconcilier.isPending}
                      >
                        <FiRefreshCw size={13} />{" "}
                        {reconcilier.isPending ? "Vérification..." : "Vérifier"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par projet ou porteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${vue === "actifs" ? styles.tabActive : ""}`}
            onClick={() => setVue("actifs")}
          >
            Actifs
          </button>
          <button
            className={`${styles.tab} ${vue === "historique" ? styles.tabActive : ""}`}
            onClick={() => setVue("historique")}
          >
            Expirés / révoqués
          </button>
          <button
            className={`${styles.tab} ${vue === "tous" ? styles.tabActive : ""}`}
            onClick={() => setVue("tous")}
          >
            Tout l'historique
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Projet</th>
              <th>Porteur</th>
              <th>Statut projet</th>
              <th>Financement</th>
              <th>Premium jusqu'au</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Aucun projet Premium à afficher
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.libelleTradu || p.libelle}</td>
                  <td>
                    {p.porteurPrenom} {p.porteurNom}
                  </td>
                  <td>{p.statutProjet}</td>
                  <td>
                    {format(p.montantCollecte, "XOF")} /{" "}
                    {format(p.objectifFinancement, "XOF")}
                  </td>
                  <td>
                    {p.premiumFin
                      ? new Date(p.premiumFin).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td>
                    {p.premiumActif ? (
                      <span className={styles.badgeActif}>
                        <BsStarFill size={11} /> Actif
                      </span>
                    ) : (
                      <span className={styles.badgeExpire}>Expiré</span>
                    )}
                  </td>
                  <td>
                    {p.premiumActif && (
                      <button
                        className={styles.btnRevoquer}
                        onClick={() => handleRevoquer(p)}
                        disabled={revoquer.isPending}
                      >
                        <FiXCircle size={13} /> Révoquer
                      </button>
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
