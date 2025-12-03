// src/components/Contrat/ContratView.tsx → VERSION FINALE 2025
// Télécharge le VRAI PDF généré par le backend (avec le vrai numéro)

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import styles from "./ContratView.module.css";

interface ContratViewProps {
  investissement: {
    nombrePartsPris: number;
    valeurPartsPrisEnPourcent: number;
  };
  projet: {
    libelle: string;
    localisation?: string;
    prixUnePart: number;
    dureeMois?: number;
    porteurNom?: string;
  };
  investisseur: {
    prenom: string;
    nom: string;
  };
  numeroContrat: string;
  dateGeneration: string;
  lienVerification: string;
  // NOUVEAU : URL du PDF généré par le backend
  pdfUrl?: string;
}

const ContratView: React.FC<ContratViewProps> = ({
  investissement,
  projet,
  investisseur,
  numeroContrat,
  dateGeneration,
  lienVerification,
  pdfUrl,
}) => {
  const montant = investissement.nombrePartsPris * projet.prixUnePart;

  // TÉLÉCHARGEMENT DU VRAI PDF (généré par le backend)
  const handleDownload = async () => {
    if (!pdfUrl) {
      toast.error("Le PDF n'est pas encore disponible");
      return;
    }

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("PDF non trouvé");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contrat_${numeroContrat}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Contrat téléchargé avec succès !");
    } catch (err) {
      toast.error("Erreur lors du téléchargement du contrat");
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* En-tête */}
        <div className={styles.header}>
          <h1>CONTRAT D'INVESTISSEMENT</h1>
          <div className={styles.numero}>N° {numeroContrat}</div>
          <div className={styles.date}>
            Émis le{" "}
            {new Date(dateGeneration).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className={styles.content}>
          {/* RÉCAPITULATIF */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              RÉCAPITULATIF DE VOTRE INVESTISSEMENT
            </h2>
            <div className={styles.grid}>
              <div className={styles.info}>
                <strong>Investisseur :</strong>
                <span>
                  {investisseur.prenom} {investisseur.nom}
                </span>
              </div>
              <div className={styles.info}>
                <strong>Projet :</strong>
                <span>{projet.libelle}</span>
              </div>
              <div className={styles.info}>
                <strong>Localisation :</strong>
                <span>{projet.localisation || "Non précisée"}</span>
              </div>
              <div className={styles.info}>
                <strong>Parts acquises :</strong>
                <span>
                  {investissement.nombrePartsPris} ×{" "}
                  {projet.prixUnePart.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <div className={styles.info}>
                <strong>Montant investi :</strong>
                <span className={styles.montant}>
                  {montant.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <div className={styles.info}>
                <strong>Équité détenue :</strong>
                <span className={styles.equity}>
                  {investissement.valeurPartsPrisEnPourcent}%
                </span>
              </div>
            </div>
          </section>

          {/* CONDITIONS CONTRACTUELLES */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>CONDITIONS CONTRACTUELLES</h2>
            <ol className={styles.articles}>
              <li>
                L’investisseur acquiert{" "}
                <strong>{investissement.nombrePartsPris} parts sociales</strong>{" "}
                du projet <strong>{projet.libelle}</strong>.
              </li>
              <li>
                Le montant total de{" "}
                <strong>{montant.toLocaleString("fr-FR")} FCFA</strong> a été
                bloqué avec succès sur le portefeuille GrowzApp.
              </li>
              <li>
                Durée de l’investissement :{" "}
                <strong>{projet.dureeMois || 36} mois</strong> à compter de la
                validation définitive.
              </li>
              <li>
                Rémunération : dividendes annuels + plus-value à la sortie.
              </li>
              <li>
                Droits protégés : préemption, tag-along, non-dilution,
                transparence trimestrielle.
              </li>
              <li>
                Droit applicable : Acte Uniforme OHADA relatif aux sociétés
                commerciales.
              </li>
            </ol>
          </section>

          {/* QR CODE */}
          <section className={styles.qrSection}>
            <h2 className={styles.qrTitle}>
              VÉRIFICATION OFFICIELLE DU CONTRAT
            </h2>
            <div className={styles.qrWrapper}>
              <QRCodeSVG
                value={lienVerification}
                size={260}
                level="H"
                fgColor="#1B5E20"
                bgColor="transparent"
                includeMargin={true}
                imageSettings={{
                  src: "/logo-growzapp.png",
                  height: 60,
                  width: 60,
                  excavate: true,
                  opacity: 1,
                }}
              />
            </div>
            <p className={styles.verifLink}>
              <a
                href={lienVerification}
                target="_blank"
                rel="noopener noreferrer"
              >
                {lienVerification}
              </a>
            </p>
          </section>

          {/* SIGNATURES */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SIGNATURES</h2>
            <div className={styles.signatures}>
              <div className={styles.signatureBox}>
                <p className={styles.signatureLabel}>L'Investisseur</p>
                <div className={styles.signatureLine} />
                <p className={styles.signatureName}>
                  {investisseur.prenom} {investisseur.nom}
                </p>
                <p className={styles.signatureStatus}>
                  Signature électronique validée
                </p>
              </div>

              <div className={styles.signatureBox}>
                <p className={styles.signatureLabel}>
                  GrowzApp & Porteur de projet
                </p>
                <div className={styles.signatureLine} />
                <p className={styles.signatureName}>
                  {projet.porteurNom || "Le Porteur de projet"}
                </p>
                <p className={styles.signatureStatus}>Représentant légal</p>
              </div>
            </div>
          </section>

          {/* BOUTON TÉLÉCHARGEMENT DU VRAI PDF */}
          <div className={styles.downloadWrapper}>
            <button onClick={handleDownload} className={styles.downloadBtn}>
              Télécharger le contrat officiel (PDF)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <strong>GrowzApp</strong> • Investissement agricole durable
          <br />
          Abidjan, Côte d’Ivoire • contact@growzapp.com • +225 07 00 00 00 00
        </div>
      </div>
    </div>
  );
};

export default ContratView;
