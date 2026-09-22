import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiArrowLeft, FiTruck } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import ComboBox from "../../components/ui/ComboBox/ComboBox";
import { api } from "../../service/Api";
import styles from "./FournisseurInscriptionPage.module.css";

const SECTEURS_SUGGESTIONS = [
  "Matériaux de construction",
  "Transport",
  "Restauration",
  "Agro-alimentaire",
  "Équipement agricole",
  "Électricité / Plomberie",
  "Mobilier / Ameublement",
  "Informatique / Bureautique",
];

export default function FournisseurInscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [type, setType] = useState<"INDIVIDUEL" | "ENTREPRISE">("INDIVIDUEL");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [accepteReglement, setAccepteReglement] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "ENTREPRISE" && raisonSociale.trim().length < 2) {
      toast.error(t("fournisseur.inscription.toast_raison_sociale_required", "La raison sociale est obligatoire pour une entreprise"));
      return;
    }
    if (!secteurNom.trim() || !ville.trim() || !pays.trim()) {
      toast.error(t("fournisseur.inscription.toast_validation_error", "Secteur, ville et pays sont obligatoires"));
      return;
    }
    if (!accepteReglement) {
      toast.error(t("fournisseur.inscription.toast_reglement_required", "Vous devez accepter le règlement avant de soumettre votre inscription"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/fournisseurs", {
        statutJuridique: type,
        raisonSociale: type === "ENTREPRISE" ? raisonSociale : null,
        secteurNom,
        ville,
        pays,
        telephone: telephone || null,
        email: email || null,
        description: description || null,
      });
      toast.success(t("fournisseur.inscription.toast_sent", "Inscription envoyée, en attente de validation par l'équipe GrowzApp"));
      navigate("/mon-espace/fournisseur");
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.inscription.toast_error", "Erreur lors de l'inscription"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiTruck /> {t("fournisseur.inscription.title", "Devenir fournisseur GrowzApp")}
        </h1>
        <p>
          {t(
            "fournisseur.inscription.subtitle",
            "Proposez vos matériaux ou services aux porteurs de projets — vous êtes payé directement, sans intermédiaire.",
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.typeSwitch}>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === "INDIVIDUEL" ? styles.typeBtnActive : ""}`}
            onClick={() => setType("INDIVIDUEL")}
          >
            {t("fournisseur.inscription.type_individuel", "Individuel")}
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === "ENTREPRISE" ? styles.typeBtnActive : ""}`}
            onClick={() => setType("ENTREPRISE")}
          >
            {t("fournisseur.inscription.type_entreprise", "Entreprise")}
          </button>
        </div>

        {type === "ENTREPRISE" && (
          <div className={styles.field}>
            <label>{t("fournisseur.inscription.field_raison_sociale", "Raison sociale")}</label>
            <input
              type="text"
              value={raisonSociale}
              onChange={(e) => setRaisonSociale(e.target.value)}
              placeholder="Ex. SARL Matériaux Plus"
              maxLength={150}
              required
            />
          </div>
        )}

        <div className={styles.field}>
          <ComboBox
            label={t("fournisseur.inscription.field_secteur", "Secteur d'activité")}
            value={secteurNom}
            onChange={setSecteurNom}
            options={SECTEURS_SUGGESTIONS}
            placeholder="Ex. Matériaux de construction"
            required
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>{t("fournisseur.inscription.field_ville", "Ville")}</label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex. Abidjan"
              maxLength={100}
              required
            />
          </div>
          <div className={styles.field}>
            <label>{t("fournisseur.inscription.field_pays", "Pays")}</label>
            <input
              type="text"
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              placeholder="Ex. Côte d'Ivoire"
              maxLength={100}
              required
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>{t("fournisseur.inscription.field_telephone", "Téléphone")}</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              maxLength={30}
            />
          </div>
          <div className={styles.field}>
            <label>{t("fournisseur.inscription.field_email", "Email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@exemple.com"
              maxLength={191}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>{t("fournisseur.inscription.field_description", "Description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(
              "fournisseur.inscription.field_description_placeholder",
              "Décrivez ce que vous proposez (matériaux, services, zones de livraison...)",
            ) as string}
            maxLength={2000}
            rows={4}
          />
        </div>

        <div className={styles.warningBox}>
          <FiAlertTriangle size={20} className={styles.warningIcon} />
          <div>
            <p className={styles.warningTitle}>
              {t("fournisseur.inscription.warning_title", "Avertissement important")}
            </p>
            <p className={styles.warningText}>
              {t(
                "fournisseur.inscription.warning_text",
                "Toute fausse facture, surfacturation, ou commande fictive (produit/service non réellement livré) constitue une fraude. GrowzApp se réserve le droit de suspendre définitivement votre compte, de rembourser les fonds concernés au projet lésé, et de transmettre le dossier aux autorités compétentes en cas de préjudice avéré. En vous inscrivant, vous vous engagez à ne fournir que des informations exactes et à honorer chaque commande validée.",
              )}
            </p>
            <label className={styles.warningCheckbox}>
              <input
                type="checkbox"
                checked={accepteReglement}
                onChange={(e) => setAccepteReglement(e.target.checked)}
              />
              {t(
                "fournisseur.inscription.warning_checkbox",
                "J'ai lu et j'accepte ces règles, et je certifie que les informations fournies sont exactes.",
              )}
            </label>
          </div>
        </div>

        <button type="submit" className={styles.btnSubmit} disabled={saving || !accepteReglement}>
          {saving ? t("fournisseur.inscription.btn_sending", "Envoi...") : t("fournisseur.inscription.btn_send", "Soumettre mon inscription")}
        </button>
      </form>
    </div>
  );
}
