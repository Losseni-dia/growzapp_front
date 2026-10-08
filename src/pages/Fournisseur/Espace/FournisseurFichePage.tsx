import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiEdit2, FiImage, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import { api, buildFileUrl } from "../../../service/Api";
import { useFournisseurEspace } from "./FournisseurEspaceLayout";
import styles from "./FournisseurEspace.module.css";

export default function FournisseurFichePage() {
  const { t } = useTranslation();
  const { fournisseur, reload } = useFournisseurEspace();
  const [savingLogo, setSavingLogo] = useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSavingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      await api.post("/api/fournisseurs/moi/logo", formData, true);
      toast.success(
        t("fournisseur.espace.toast_logo_saved", "Logo enregistré — il apparaîtra parmi nos partenaires"),
      );
      reload();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_logo_error", "Erreur lors de l'enregistrement du logo"));
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <div className={styles.ficheCard}>
      <div className={styles.ficheCardHeader}>
        <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
          {t("fournisseur.espace.fiche_title", "Ma fiche")}
        </h2>
        <Link to="/devenir-fournisseur" className={styles.btnEdit}>
          <FiEdit2 size={13} /> {t("fournisseur.espace.btn_edit_fiche", "Modifier")}
        </Link>
      </div>
      <div className={styles.ficheGrid}>
        <div>
          <span className={styles.ficheLabel}>{t("fournisseur.espace.fiche_type", "Type")}</span>
          <span className={styles.ficheValue}>
            {fournisseur.statutJuridique === "ENTREPRISE"
              ? t("fournisseur.inscription.type_entreprise", "Entreprise")
              : t("fournisseur.inscription.type_individuel", "Individuel")}
          </span>
        </div>
        <div>
          <span className={styles.ficheLabel}>{t("fournisseur.espace.fiche_secteur", "Secteur")}</span>
          <span className={styles.ficheValue}>{fournisseur.secteurNom || "—"}</span>
        </div>
        <div>
          <span className={styles.ficheLabel}>
            <FiMapPin size={13} /> {t("fournisseur.espace.fiche_location", "Localisation")}
          </span>
          <span className={styles.ficheValue}>
            {fournisseur.ville}, {fournisseur.pays}
          </span>
        </div>
        {fournisseur.telephone && (
          <div>
            <span className={styles.ficheLabel}>
              <FiPhone size={13} /> {t("fournisseur.espace.fiche_telephone", "Téléphone")}
            </span>
            <span className={styles.ficheValue}>{fournisseur.telephone}</span>
          </div>
        )}
        {fournisseur.email && (
          <div>
            <span className={styles.ficheLabel}>
              <FiMail size={13} /> {t("fournisseur.espace.fiche_email", "Email")}
            </span>
            <span className={styles.ficheValue}>{fournisseur.email}</span>
          </div>
        )}
      </div>
      {fournisseur.description && <p className={styles.ficheDescription}>{fournisseur.description}</p>}

      <div className={styles.logoField}>
        {fournisseur.logoUrl ? (
          <img src={buildFileUrl(fournisseur.logoUrl)} alt="" className={styles.logoPreview} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <FiImage size={22} />
          </div>
        )}
        <div>
          <label className={styles.photoLabel}>
            {savingLogo ? (
              t("fournisseur.espace.btn_saving", "Enregistrement...")
            ) : fournisseur.logoUrl ? (
              <FiEdit2 size={14} />
            ) : (
              t("fournisseur.espace.field_logo", "Ajouter/changer mon logo")
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              disabled={savingLogo}
            />
          </label>
          {!fournisseur.logoUrl && (
            <p className={styles.logoHint}>
              {t(
                "fournisseur.espace.logo_hint",
                "Affiché publiquement dans la section « Nos partenaires » du site.",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
