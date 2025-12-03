// src/pages/VerifierContrat/VerifierContrat.tsx → LA PAGE LA PLUS CLASSE D'AFRIQUE 2025

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../service/api";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import styles from "./VerifierContrat.module.css";
import {
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiShield,
  FiArrowLeft,
} from "react-icons/fi";

interface ContratPublic {
  valide: boolean;
  numeroContrat: string;
  projet: string;
  investisseur: string;
  montant: number;
  date: string;
}

export default function VerifierContrat() {
  const { code } = useParams<{ code?: string }>();
  const [input, setInput] = useState(code?.toUpperCase() || "");
  const [result, setResult] = useState<ContratPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const verifier = async () => {
    const numero = input.trim().toUpperCase();
    if (!numero) {
      toast.error("Entrez un numéro de contrat");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await api.get<ContratPublic>(
        `/api/contrats/public/verifier/${numero}`
      );
      setResult(res);
      toast.success("Contrat authentique !");
    } catch (err) {
      setResult(null);
      toast.error("Contrat non trouvé ou invalide");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) verifier();
  }, [code]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* En-tête */}
          <div className={styles.header}>
            <FiShield size={60} />
            <h1>Vérification d’authenticité</h1>
            <p>Entrez le numéro du contrat ou scannez le QR code</p>
          </div>

          {/* Barre de recherche */}
          <div className={styles.search}>
            <div className={styles.inputWrapper}>
              <FiSearch size={28} />
              <input
                type="text"
                placeholder="CTR-2025-000127"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && verifier()}
              />
            </div>
            <button
              onClick={verifier}
              disabled={loading}
              className={styles.btn}
            >
              {loading ? "Vérification..." : "Vérifier"}
            </button>
          </div>

          {/* Résultat */}
          {searched && (
            <div className={styles.result}>
              {result ? (
                <div className={styles.success}>
                  <FiCheckCircle size={100} />
                  <h2>Contrat 100% authentique</h2>

                  <div className={styles.details}>
                    <p>
                      <strong>N° contrat :</strong> {result.numeroContrat}
                    </p>
                    <p>
                      <strong>Projet :</strong> {result.projet}
                    </p>
                    <p>
                      <strong>Investisseur :</strong> {result.investisseur}
                    </p>
                    <p>
                      <strong>Montant :</strong>{" "}
                      {result.montant.toLocaleString()} FCFA
                    </p>
                    <p>
                      <strong>Date :</strong>{" "}
                      {new Date(result.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className={styles.qr}>
                    <QRCodeSVG
                      value={window.location.href}
                      size={180}
                      fgColor="#1B5E20"
                    />
                    <small>Partagez ce lien pour prouver l’authenticité</small>
                  </div>
                </div>
              ) : (
                <div className={styles.error}>
                  <FiXCircle size={100} />
                  <h2>Contrat non trouvé</h2>
                  <p>
                    Ce contrat n’existe pas dans notre base ou a été falsifié.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.logo}>
              <h3>growzapp</h3>
            </div>
            <p>
              Tous les contrats GrowzApp sont signés électroniquement
              <br />
              et protégés par blockchain — Impossibles à falsifier.
            </p>
            <Link to="/" className={styles.back}>
              <FiArrowLeft /> Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
