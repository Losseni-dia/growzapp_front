import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle,
  FiCamera,
  FiCheck,
  FiDollarSign,
  FiPieChart,
  FiSend,
  FiShield,
  FiTrendingUp
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { dataURLtoFile, getCroppedImg } from "../../../types/utils/CropImage";
import { useAuth } from "../../Context/AuthContext";
import styles from "./ProjetForm.module.css";

interface Secteur {
  id: number;
  nom: string;
}
interface Localite {
  id: number;
  nom: string;
}

export default function ProjectForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- ÉTATS FORMULAIRE (IDENTITÉ) ---
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [localiteNom, setLocaliteNom] = useState("");
  const [paysNom, setPaysNom] = useState("Côte d'Ivoire");

  // --- ÉTATS FORMULAIRE (FINANCIER - INDISPENSABLE POUR LE DTO) ---
  const [objectif, setObjectif] = useState<number>(0);
  const [prixPart, setPrixPart] = useState<number>(0);
  const [totalParts, setTotalParts] = useState<number>(0);
  const [roi, setRoi] = useState<number>(0);
  const [valuation, setValuation] = useState<number>(0);

  // --- MODAL ANTI-FRAUDE ---
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [agreedToMonitoring, setAgreedToMonitoring] = useState(false);

  // --- POSTER + CROPPER ---
  const [preview, setPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [localites, setLocalites] = useState<Localite[]>([]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const token = localStorage.getItem("access_token") || "";
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const [sectRes, locRes] = await Promise.all([
          fetch("http://localhost:8080/api/secteurs", { headers }),
          fetch("http://localhost:8080/api/localites", { headers }),
        ]);
        const sectData = await sectRes.json();
        const locData = await locRes.json();
        setSecteurs(sectData.data || []);
        setLocalites(locData.data || []);
      } catch {
        /* Fail silencieux */
      }
    };
    loadReferences();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback(
    (_: any, pixels: any) => setCroppedAreaPixels(pixels),
    [],
  );

  const createCroppedImage = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPosterFile(dataURLtoFile(cropped, "poster.jpg"));
      setShowCropper(false);
    } catch {
      toast.error("Erreur de recadrage");
    }
  };

  // ÉTAPE 1 : Validation locale et ouverture du modal
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!libelle || !description || objectif <= 0 || prixPart <= 0) {
      return toast.error(
        "Veuillez remplir les informations financières obligatoires.",
      );
    }
    setShowLegalModal(true);
  };

  // ÉTAPE 2 : Envoi final au Backend
  const handleFinalSubmit = async () => {
    if (!isCertified || !agreedToMonitoring) return;
    setLoading(true);
    setShowLegalModal(false);

    const formData = new FormData();

    // CONSTRUCTION DE L'OBJET MATCHANT LE RECORD PROJETDTO.JAVA
    const projetJson = {
      libelle,
      description,
      secteurNom,
      localiteNom,
      paysNom,
      objectifFinancement: objectif,
      prixUnePart: prixPart,
      partsDisponible: totalParts,
      roiProjete: roi,
      valuation: valuation,
      currencyCode: "XOF",
      certifiedAt: new Date().toISOString(),
      statutProjet: "SOUMIS",
    };

    formData.append(
      "projet",
      new Blob([JSON.stringify(projetJson)], { type: "application/json" }),
    );
    if (posterFile) formData.append("poster", posterFile);

    const token = localStorage.getItem("access_token") || "";

    try {
      const response = await fetch("http://localhost:8080/api/projets", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Erreur lors de la création");

      toast.success("Projet soumis avec succès !");
      navigate("/mes-projets");
    } catch (err) {
      toast.error("Le serveur n'a pas pu enregistrer le projet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Créer un nouveau projet</h1>

      <form onSubmit={handlePreSubmit} className={styles.form}>
        {/* SECTION PHOTO */}
        <div className={styles.photoSection}>
          {!showCropper ? (
            <div
              className={styles.photoUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Aperçu" className={styles.preview} />
              ) : (
                <div className={styles.placeholder}>
                  <FiCamera size={40} />
                  <p>Ajouter une image de couverture</p>
                </div>
              )}
            </div>
          ) : (
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
              <div className={styles.cropControls}>
                <button
                  type="button"
                  onClick={createCroppedImage}
                  className={styles.cropBtn}
                >
                  Valider
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            hidden
          />
        </div>

        {/* SECTION IDENTITÉ */}
        <div className={styles.inputGroup}>
          <label>Titre du projet</label>
          <input
            type="text"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            required
            placeholder="Ex: Ferme Piscicole de Korhogo"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Description détaillée</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Décrivez votre projet et son impact..."
          />
        </div>

        {/* SECTION FINANCIÈRE (GRILLE) */}
        <div className={styles.financeGrid}>
          <div className={styles.inputGroup}>
            <label>
              <FiDollarSign /> Objectif (FCFA)
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
              <FiPieChart /> Prix d'une part
            </label>
            <input
              type="number"
              value={prixPart}
              onChange={(e) => setPrixPart(Number(e.target.value))}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>
              <FiCheck /> Parts totales
            </label>
            <input
              type="number"
              value={totalParts}
              onChange={(e) => setTotalParts(Number(e.target.value))}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>
              <FiTrendingUp /> ROI attendu (%)
            </label>
            <input
              type="number"
              value={roi}
              onChange={(e) => setRoi(Number(e.target.value))}
              required
            />
          </div>
        </div>

        {/* LOCALISATION & SECTEUR */}
        <div className={styles.locationGrid}>
          <input
            type="text"
            placeholder="Secteur d'activité"
            value={secteurNom}
            onChange={(e) => setSecteurNom(e.target.value)}
            list="secteurs-list"
            required
          />
          <input
            type="text"
            placeholder="Ville / Localité"
            value={localiteNom}
            onChange={(e) => setLocaliteNom(e.target.value)}
            list="localites-list"
            required
          />
          <input
            type="text"
            placeholder="Pays"
            value={paysNom}
            onChange={(e) => setPaysNom(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.saveBtn}>
          <FiSend /> {loading ? "Envoi en cours..." : "Soumettre mon projet"}
        </button>
      </form>

      {/* MODAL ANTI-FRAUDE */}
      {showLegalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <FiShield className={styles.shieldIcon} />
              <h2>Certification du Porteur</h2>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.fraudWarning}>
                <FiAlertTriangle className={styles.alertIcon} />
                <p>
                  La falsification de documents est passible de poursuites
                  pénales.
                </p>
              </div>
              <label className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={isCertified}
                  onChange={(e) => setIsCertified(e.target.checked)}
                />
                <span>
                  Je certifie que ces informations sont{" "}
                  <strong>vraies et vérifiables</strong>.
                </span>
              </label>
              <label className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={agreedToMonitoring}
                  onChange={(e) => setAgreedToMonitoring(e.target.checked)}
                />
                <span>
                  J'accepte le <strong>monitoring de terrain</strong> par
                  Growzapp.
                </span>
              </label>
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
                Certifier et Publier
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
