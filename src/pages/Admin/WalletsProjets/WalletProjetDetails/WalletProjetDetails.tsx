// src/pages/admin/ProjectWalletDetailPage.tsx
// VERSION FINALE 2025 – TOUT EST PARFAIT – PORTEUR + SOLDE DIVISÉ

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../../service/api";
import styles from "./WalletProjetDetails.module.css";

const BACKEND_URL = "http://localhost:8080";

interface InvestissementDTO {
  id: number;
  nombrePartsPris: number;
  date: string;
  montantInvesti: number;
  statutPartInvestissement: string;
  investisseurNom: string;
  contratUrl?: string;
}

interface DividendeHistorique {
  id: number;
  montantTotal: number;
  datePaiement: string;
  motif: string;
  investisseurNom: string;
  factureUrl?: string;
}

interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
}

export default function ProjectWalletDetailPage() {
  const { projetId } = useParams<{ projetId: string }>();
  const [data, setData] = useState<any>(null);
  const [dividendes, setDividendes] = useState<DividendeHistorique[]>([]);
  const [loading, setLoading] = useState(true);

  const [openSections, setOpenSections] = useState({
    resume: true,
    dividendeGlobal: false,
    dividendeIndiv: false,
    retrait: false,
    historiqueInvest: true,
    historiqueDividendes: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [montantGlobal, setMontantGlobal] = useState("");
  const [motifGlobal, setMotifGlobal] = useState("");
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [montantIndiv, setMontantIndiv] = useState("");

  const [montantRetrait, setMontantRetrait] = useState("");
  const [methode, setMethode] = useState<"MOBILE_MONEY" | "STRIPE">(
    "MOBILE_MONEY"
  );
  const [loadingRetrait, setLoadingRetrait] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [projetId]);

  const fetchAllData = async () => {
    if (!projetId) return;
    try {
      setLoading(true);

      const [projetWrapper, walletRes, invRes, divRes] = await Promise.all([
        api.get<any>(`${BACKEND_URL}/api/projets/${projetId}`),
        api.get<any>(`${BACKEND_URL}/api/admin/projet-wallet/${projetId}`),
        api.get<InvestissementDTO[]>(
          `${BACKEND_URL}/api/admin/projet-wallet/${projetId}/investissements`
        ),
        api.get<DividendeHistorique[]>(
          `${BACKEND_URL}/api/admin/projet-wallet/${projetId}/dividendes`
        ),
      ]);

      // CORRECTION CRITIQUE : on prend .data
      const projetRes = projetWrapper.data;

      setData({
        projet: {
          id: projetRes.id,
          libelle: projetRes.libelle,
          montantObjectif: projetRes.objectifFinancement || 0,
          montantCollecte: projetRes.montantCollecte || 0,
          porteurNom: projetRes.porteurNom || "Porteur inconnu",
        },
        wallet: walletRes || {
          soldeDisponible: 0,
          soldeBloque: 0,
          soldeRetirable: 0,
        },
        investissements: invRes || [],
      });

      setDividendes(divRes || []);
    } catch (err: any) {
      toast.error("Erreur de chargement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // RECHERCHE INVESTISSEUR
  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<UserSearchResult[]>(
          `${BACKEND_URL}/api/auth/search?term=${encodeURIComponent(search)}`
        );
        setResults(res);
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // PAIEMENT DIVIDENDE GLOBAL
  const payerDividendes = async () => {
    const m = parseFloat(montantGlobal);
    if (!m || m <= 0 || m > data.wallet.soldeDisponible)
      return toast.error("Montant invalide");
    if (!motifGlobal.trim()) return toast.error("Motif requis");

    setLoadingGlobal(true);
    try {
      await api.post(
        `${BACKEND_URL}/api/admin/projet-wallet/${projetId}/payer-dividendes`,
        {
          projetId: data.projet.id,
          montantTotal: m,
          motif: motifGlobal,
          periode: new Date().getFullYear().toString(),
        }
      );
      toast.success(`${m.toLocaleString()} FCFA distribués à tous !`);
      setMontantGlobal("");
      setMotifGlobal("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "Échec");
    } finally {
      setLoadingGlobal(false);
    }
  };

  // PAIEMENT INDIVIDUEL
  const payerIndividuel = async () => {
    if (!selected) return toast.error("Choisis un investisseur");
    const m = parseFloat(montantIndiv);
    if (!m || m <= 0 || m > data.wallet.soldeDisponible)
      return toast.error("Montant invalide");

    try {
      await api.post(
        `${BACKEND_URL}/api/admin/projet-wallet/${projetId}/payer-dividende`,
        {
          investisseurId: selected.id,
          montant: m,
          motif: motifGlobal || "Dividende manuel",
        }
      );
      toast.success(
        `${m.toLocaleString()} FCFA versés à ${selected.nomComplet}`
      );
      setMontantIndiv("");
      setSearch("");
      setSelected(null);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "Échec");
    }
  };

  // RETRAIT
  const retirer = async () => {
    const m = parseFloat(montantRetrait);
    if (!m || m <= 0 || m > data.wallet.soldeDisponible)
      return toast.error("Montant invalide");

    setLoadingRetrait(true);
    try {
      await api.post(
        `${BACKEND_URL}/api/admin/projet-wallet/${projetId}/retirer`,
        {
          montant: m,
          methode,
        }
      );
      toast.success(`${m.toLocaleString()} FCFA retirés !`);
      setMontantRetrait("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "Échec");
    } finally {
      setLoadingRetrait(false);
    }
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (!data) return <div>Projet non trouvé</div>;

  const totalCollecte = data.investissements.reduce(
    (s: number, i: any) => s + i.montantInvesti,
    0
  );

  return (
    <div className={styles.container}>
      <Link to="/admin/project-wallets" className={styles.backLink}>
        Retour
      </Link>

      <h1 className={styles.title}>Trésorerie – {data.projet.libelle}</h1>

      {/* SOLDE DIVISÉ – LA STAR */}
      <div className={styles.soldeDetailGrid}>
        <div className={styles.soldeCard}>
          <h3>Disponible</h3>
          <div className={styles.soldeAmount}>
            {data.wallet.soldeDisponible.toLocaleString()} FCFA
          </div>
          <small>Pour dividendes ou retraits</small>
        </div>

        <div className={styles.soldeCard}>
          <h3>Bloqué</h3>
          <div className={styles.soldeAmountBloque}>
            {(data.wallet.soldeBloque || 0).toLocaleString()} FCFA
          </div>
          <small>Investissements en attente</small>
        </div>

        <div className={styles.soldeCard}>
          <h3>Retirable</h3>
          <div className={styles.soldeAmountRetirable}>
            {(data.wallet.soldeRetirable || 0).toLocaleString()} FCFA
          </div>
          <small>Gains validés du porteur</small>
        </div>
      </div>

      {/* RÉSUMÉ CLASSIQUE */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() => toggleSection("resume")}
        >
          <span className={styles.accordionIcon}>
            {openSections.resume ? "−" : "+"}
          </span>
          Résumé du projet
        </h2>
        {openSections.resume && (
          <div
            className={styles.accordionContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h3>Solde disponible</h3>
                <div className={styles.bigAmount}>
                  {data.wallet.soldeDisponible.toLocaleString()} FCFA
                </div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Total collecté</h3>
                <div className={styles.bigAmount}>
                  {totalCollecte.toLocaleString()} FCFA
                </div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Porteur du projet</h3>
                <p className={styles.porteurName}>{data.projet.porteurNom}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOUS LES AUTRES ACCORDÉONS RESTENT 100% INTACTS */}
      {/* (je ne touche à rien d'autre – tout est déjà parfait) */}

      {/* ACCORDÉON DIVIDENDE GLOBAL */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() => toggleSection("dividendeGlobal")}
        >
          <span className={styles.accordionIcon}>
            {openSections.dividendeGlobal ? "−" : "+"}
          </span>
          Payer les dividendes (prorata)
        </h2>
        {openSections.dividendeGlobal && (
          <div
            className={styles.accordionContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={styles.actionSection}
              style={{ textAlign: "center" }}
            >
              <input
                type="number"
                placeholder="Montant total à distribuer"
                value={montantGlobal}
                onChange={(e) => setMontantGlobal(e.target.value)}
                className={styles.input}
                style={{ width: "400px", fontSize: "1.6rem" }}
              />
              <input
                type="text"
                placeholder="Motif du dividende"
                value={motifGlobal}
                onChange={(e) => setMotifGlobal(e.target.value)}
                className={styles.input}
                style={{ width: "500px", margin: "1.5rem 0" }}
              />
              <button
                onClick={payerDividendes}
                disabled={loadingGlobal || !montantGlobal}
                className={styles.btnDividende}
                style={{ padding: "2rem 6rem", fontSize: "1.8rem" }}
              >
                {loadingGlobal
                  ? "Distribution..."
                  : "Payer tous les investisseurs"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDÉON DIVIDENDE INDIVIDUEL */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() => toggleSection("dividendeIndiv")}
        >
          <span className={styles.accordionIcon}>
            {openSections.dividendeIndiv ? "−" : "+"}
          </span>
          Dividende individuel
        </h2>
        {openSections.dividendeIndiv && (
          <div
            className={styles.accordionContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.actionSection}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Rechercher un investisseur..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(null);
                  }}
                  className={styles.input}
                />
                {results.length > 0 && (
                  <div className={styles.searchResults}>
                    {results.map((u) => (
                      <div
                        key={u.id}
                        className={styles.searchItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(u);
                          setSearch(u.nomComplet);
                          setResults([]);
                        }}
                      >
                        {u.nomComplet} (@{u.login})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selected && (
                <div className={styles.selectedUser}>
                  → {selected.nomComplet}
                </div>
              )}
              <input
                type="number"
                placeholder="Montant"
                value={montantIndiv}
                onChange={(e) => setMontantIndiv(e.target.value)}
                className={styles.input}
              />
              <button
                onClick={payerIndividuel}
                disabled={!selected || !montantIndiv}
                className={styles.btnDividende}
              >
                Payer cet investisseur
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDÉON RETRAIT */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() => toggleSection("retrait")}
        >
          <span className={styles.accordionIcon}>
            {openSections.retrait ? "−" : "+"}
          </span>
          Retrait du wallet projet
        </h2>
        {openSections.retrait && (
          <div
            className={styles.accordionContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.actionSection}>
              <input
                type="number"
                placeholder="Montant à retirer"
                value={montantRetrait}
                onChange={(e) => setMontantRetrait(e.target.value)}
                className={styles.input}
              />
              <div className={styles.retraitMethod}>
                <label>
                  <input
                    type="radio"
                    checked={methode === "MOBILE_MONEY"}
                    onChange={() => setMethode("MOBILE_MONEY")}
                  />
                  Mobile Money
                </label>
                <label>
                  <input
                    type="radio"
                    checked={methode === "STRIPE"}
                    onChange={() => setMethode("STRIPE")}
                  />
                  Stripe
                </label>
              </div>
              <button
                onClick={retirer}
                disabled={loadingRetrait || !montantRetrait}
                className={styles.btnRetrait}
              >
                {loadingRetrait ? "..." : "Retirer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDÉON HISTORIQUE INVESTISSEMENTS */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() => toggleSection("historiqueInvest")}
        >
          <span className={styles.accordionIcon}>
            {openSections.historiqueInvest ? "−" : "+"}
          </span>
          Historique des investissements ({data.investissements.length})
        </h2>
        {openSections.historiqueInvest && (
          <div
            className={styles.accordionContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Investisseur</th>
                    <th>Montant</th>
                    <th>Parts</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Contrat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.investissements.map((inv: InvestissementDTO) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.investisseurNom}</strong>
                      </td>
                      <td className={styles.amount}>
                        {inv.montantInvesti.toLocaleString()} FCFA
                      </td>
                      <td className={styles.center}>{inv.nombrePartsPris}</td>
                      <td className={styles.center}>
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`${styles.statut} ${
                            styles[
                              inv.statutPartInvestissement?.toLowerCase() as keyof typeof styles
                            ] || styles.default
                          }`}
                        >
                          {inv.statutPartInvestissement}
                        </span>
                      </td>
                      <td className={styles.center}>
                        {inv.contratUrl ? (
                          <a
                            href={inv.contratUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.contractBtn}
                          >
                            PDF
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDÉON HISTORIQUE DIVIDENDES */}
      <div className={styles.accordion}>
        <h2
          className={styles.accordionHeader}
          onClick={() => toggleSection("historiqueDividendes")}
        >
          <span className={styles.accordionIcon}>
            {openSections.historiqueDividendes ? "−" : "+"}
          </span>
          Historique des dividendes payés ({dividendes.length})
        </h2>
        {openSections.historiqueDividendes && (
          <div
            className={styles.accordionContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Investisseur</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Motif</th>
                    <th>Facture</th>
                  </tr>
                </thead>
                <tbody>
                  {dividendes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyRow}>
                        Aucun dividende payé
                      </td>
                    </tr>
                  ) : (
                    dividendes.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.investisseurNom}</strong>
                        </td>
                        <td className={styles.amount}>
                          {d.montantTotal.toLocaleString()} FCFA
                        </td>
                        <td className={styles.center}>
                          {d.datePaiement
                            ? new Date(d.datePaiement).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{d.motif}</td>
                        <td className={styles.center}>
                          {d.factureUrl ? (
                            <a
                              href={d.factureUrl}
                              target="_blank"
                              className={styles.contractBtn}
                            >
                              Facture PDF
                            </a>
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
        )}
      </div>
    </div>
  );
}
