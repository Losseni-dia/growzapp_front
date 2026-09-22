import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiArrowLeft, FiSave, FiSend, FiTruck } from "react-icons/fi";
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

interface FournisseurDTO {
  statutJuridique: string | null;
  raisonSociale: string | null;
  secteurNom: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  description: string | null;
  statut: "BROUILLON" | "EN_ATTENTE" | "VALIDE" | "REJETE";
  motifRejet: string | null;
}

export default function FournisseurInscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [motifRejet, setMotifRejet] = useState<string | null>(null);
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
  const [submitting, setSubmitting] = useState(false);
  const [dejaValide, setDejaValide] = useState(false);

  useEffect(() => {
    api
      .get<{ data: FournisseurDTO }>("/api/fournisseurs/moi")
      .then((res) => {
        const f = res.data;
        if (f.statut === "EN_ATTENTE") {
          // En attente du premier examen admin — pas de modification possible
          // depuis cet écran tant que ce n'est pas traité.
          navigate("/mon-espace/fournisseur");
          return;
        }
        setDejaValide(f.statut === "VALIDE");
        if (f.statutJuridique) setType(f.statutJuridique as "INDIVIDUEL" | "ENTREPRISE");
        setRaisonSociale(f.raisonSociale || "");
        setSecteurNom(f.secteurNom || "");
        setVille(f.ville || "");
        setPays(f.pays || "");
        setTelephone(f.telephone || "");
        setEmail(f.email || "");
        setDescription(f.description || "");
        setMotifRejet(f.motifRejet);
      })
      .catch(() => {
        // Pas encore de fiche — formulaire vierge, comportement normal.
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const buildPayload = () => ({
    statutJuridique: type,
    raisonSociale: type === "ENTREPRISE" ? raisonSociale : null,
    secteurNom: secteurNom || null,
    ville: ville || null,
    pays: pays || null,
    telephone: telephone || null,
    email: email || null,
    description: description || null,
  });

  const handleEnregistrerBrouillon = async () => {
    setSaving(true);
    try {
      await api.put("/api/fournisseurs/moi", buildPayload());
      toast.success(t("fournisseur.inscription.toast_draft_saved", "Brouillon enregistré — vous pourrez continuer plus tard"));
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.inscription.toast_error", "Erreur lors de l'enregistrement"));
    } finally {
      setSaving(false);
    }
  };

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "ENTREPRISE" && raisonSociale.trim().length < 2) {
      toast.error(t("fournisseur.inscription.toast_raison_sociale_required", "La raison sociale est obligatoire pour une entreprise"));
      return;
    }
    if (!secteurNom.trim() || !ville.trim() || !pays.trim()) {
      toast.error(t("fournisseur.inscription.toast_validation_error", "Secteur, ville et pays sont obligatoires"));
      return;
    }

    // Une fiche déjà validée se met simplement à jour, sans repasser par
    // une nouvelle demande d'agrément ni le règlement (déjà accepté une
    // première fois à l'inscription).
    if (dejaValide) {
      setSubmitting(true);
      try {
        await api.put("/api/fournisseurs/moi", buildPayload());
        toast.success(t("fournisseur.inscription.toast_updated", "Fiche mise à jour"));
        navigate("/mon-espace/fournisseur");
      } catch (err: any) {
        toast.error(err.message || t("fournisseur.inscription.toast_error", "Erreur lors de la mise à jour"));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!accepteReglement) {
      toast.error(t("fournisseur.inscription.toast_reglement_required", "Vous devez accepter le règlement avant de soumettre votre inscription"));
      return;
    }
    setSubmitting(true);
    try {
      await api.put("/api/fournisseurs/moi", buildPayload());
      await api.post("/api/fournisseurs/moi/soumettre");
      toast.success(t("fournisseur.inscription.toast_sent", "Inscription envoyée, en attente de validation par l'équipe GrowzApp"));
      navigate("/mon-espace/fournisseur");
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.inscription.toast_error", "Erreur lors de l'inscription"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.container}>{t("dashboard.loading")}</div>;

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

      {motifRejet && (
        <div className={styles.rejetBox}>
          <FiAlertTriangle size={18} />
          <div>
            <strong>{t("fournisseur.inscription.rejet_title", "Votre précédente soumission a été rejetée")}</strong>
            <p>{motifRejet}</p>
            <p className={styles.rejetHint}>
              {t("fournisseur.inscription.rejet_hint", "Corrigez les informations ci-dessous puis soumettez à nouveau.")}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSoumettre} className={styles.form}>
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

        {!dejaValide && (
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
        )}

        <div className={styles.formActions}>
          {!dejaValide && (
            <button
              type="button"
              className={styles.btnDraft}
              onClick={handleEnregistrerBrouillon}
              disabled={saving || submitting}
            >
              <FiSave /> {saving ? t("fournisseur.inscription.btn_saving", "Enregistrement...") : t("fournisseur.inscription.btn_draft", "Enregistrer et continuer plus tard")}
            </button>
          )}
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={saving || submitting || (!dejaValide && !accepteReglement)}
          >
            <FiSend />{" "}
            {submitting
              ? t("fournisseur.inscription.btn_sending", "Envoi...")
              : dejaValide
                ? t("fournisseur.inscription.btn_update", "Enregistrer les modifications")
                : t("fournisseur.inscription.btn_send", "Soumettre mon inscription")}
          </button>
        </div>
      </form>
    </div>
  );
}
