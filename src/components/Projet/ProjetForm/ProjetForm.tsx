import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiCamera,
  FiDollarSign,
  FiPieChart,
  FiSend,
  FiShield,
  FiAlertTriangle,
  FiCheck,
  FiMapPin,
  FiTag,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { dataURLtoFile, getCroppedImg } from "../../../types/utils/CropImage";
import styles from "./ProjetForm.module.css";

export default function ProjectForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ÉTATS
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [localiteNom, setLocaliteNom] = useState("");
  const [paysNom, setPaysNom] = useState("Côte d'Ivoire");
  const [objectif, setObjectif] = useState<number>(0);
  const [prixPart, setPrixPart] = useState<number>(10000);

  // CALCUL AUTO
  const totalParts = prixPart > 0 ? Math.floor(objectif / prixPart) : 0;

  const [loading, setLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [agreedToMonitoring, setAgreedToMonitoring] = useState(false);

  // IMAGE & CROP
  const [preview, setPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback(
    (_: any, p: any) => setCroppedAreaPixels(p),
    [],
  );

  const createCroppedImage = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPosterFile(dataURLtoFile(cropped, `pitch_${Date.now()}.jpg`));
      setShowCropper(false);
      toast.success("Image recadrée !");
    } catch {
      toast.error("Erreur de recadrage");
    }
  };

  const handleFinalSubmit = async () => {
    if (!isCertified || !agreedToMonitoring) return;
    setLoading(true);
    const formData = new FormData();
    const projetJson = {
      libelle,
      description,
      secteurNom,
      localiteNom,
      paysNom,
      objectifFinancement: objectif,
      prixUnePart: prixPart,
      partsDisponible: totalParts,
      roiProjete: 0,
      valuation: objectif,
      dureeMois: 36,
      currencyCode: "XOF",
      statutProjet: "SOUMIS",
      certifiedAt: new Date().toISOString(),
    };

    formData.append(
      "projet",
      new Blob([JSON.stringify(projetJson)], { type: "application/json" }),
    );
    if (posterFile) formData.append("poster", posterFile);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8080/api/projets", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      toast.success("Projet soumis avec succès !");
      navigate("/mes-projets");
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lancer mon projet</h1>
      <p className={styles.subtitle}>
        Présentez votre idée en quelques étapes simples.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowLegalModal(true);
        }}
        className={styles.form}
      >
        {/* SECTION PHOTO : STUDIO DE RECADRAGE LARGE */}
        <div className={styles.photoSection}>
          {!showCropper ? (
            <div
              className={styles.photoUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} className={styles.preview} alt="Aperçu" />
              ) : (
                <div className={styles.placeholder}>
                  <FiCamera size={48} />
                  <p>Cliquez pour ajouter une photo de couverture</p>
                  <span>Format 16:9 recommandé</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.cropWrapper}>
              <div className={styles.cropContainer}>
                <Cropper
                  image={preview!}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className={styles.cropControls}>
                <button
                  type="button"
                  onClick={() => setShowCropper(false)}
                  className={styles.cancelBtn}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={createCroppedImage}
                  className={styles.cropBtn}
                >
                  Valider l'image
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setPreview(reader.result as string);
                  setShowCropper(true);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        {/* CHAMPS DE TEXTE */}
        <div className={styles.inputGroup}>
          <label>
            <FiTag /> Titre du projet
          </label>
          <input
            type="text"
            placeholder="Ex: Ferme de Korhogo"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Pitch & Besoins</label>
          <textarea
            rows={4}
            placeholder="Décrivez votre projet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* GRILLE FINANCIÈRE AVEC CALCUL AUTO */}
        <div className={styles.financeGrid}>
          <div className={styles.inputGroup}>
            <label>
              <FiDollarSign /> Budget global (CFA)
            </label>
            <input
              type="number"
              value={objectif}
              onChange={(e) => setObjectif(Number(e.target.value))}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>
              <FiPieChart /> Prix d'une part souhaité
            </label>
            <input
              type="number"
              value={prixPart}
              onChange={(e) => setPrixPart(Number(e.target.value))}
              required
            />
          </div>
        </div>

        {/* INFO PARTS CALCULÉES */}
        <div className={styles.autoCalcInfo}>
          <FiCheck /> Votre projet sera divisé en{" "}
          <strong>{totalParts} parts</strong> de {prixPart} FCFA.
        </div>

        <div className={styles.locationGrid}>
          <div className={styles.inputGroup}>
            <label>
              <FiMapPin /> Secteur
            </label>
            <input
              type="text"
              placeholder="Agriculture, Tech..."
              value={secteurNom}
              onChange={(e) => setSecteurNom(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>
              <FiMapPin /> Ville
            </label>
            <input
              type="text"
              placeholder="Yamoussoukro"
              value={localiteNom}
              onChange={(e) => setLocaliteNom(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>
              <FiMapPin /> Pays
            </label>
            <input
              type="text"
              placeholder="Côte d'Ivoire"
              value={paysNom}
              onChange={(e) => setPaysNom(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          <FiSend /> {loading ? "Traitement..." : "Soumettre aux experts"}
        </button>
      </form>

      {showLegalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            {/* HEADER : VERT INSTITUTIONNEL */}
            <header className={styles.modalHeader}>
              <FiShield className={styles.shieldIcon} />
              <h2>Engagement & Certification</h2>
            </header>

            <div className={styles.modalBody}>
              {/* ALERTE : ROUGE DOUX MAIS VISIBLE */}
              <div className={styles.alertBox}>
                <FiAlertTriangle className={styles.alertIcon} />
                <p>
                  Attention : toute fausse déclaration ou falsification de
                  documents est passible de poursuites pénales.
                </p>
              </div>

              {/* LISTE DE CHECK : ALIGNEMENT PARFAIT */}
              <div className={styles.legalList}>
                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={isCertified}
                    onChange={(e) => setIsCertified(e.target.checked)}
                  />
                  <span className={styles.checkText}>
                    Je certifie sur l'honneur que toutes les informations
                    fournies sont <strong>vraies et vérifiables</strong>.
                  </span>
                </label>

                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={agreedToMonitoring}
                    onChange={(e) => setAgreedToMonitoring(e.target.checked)}
                  />
                  <span className={styles.checkText}>
                    J'accepte le <strong>monitoring de terrain</strong> et les
                    audits réguliers par les experts Growzapp.
                  </span>
                </label>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button
                className={styles.btnBack}
                onClick={() => setShowLegalModal(false)}
              >
                Retour
              </button>
              <button
                className={styles.btnFinalSubmit}
                disabled={!isCertified || !agreedToMonitoring}
                onClick={handleFinalSubmit}
              >
                Confirmer et Publier le projet
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

