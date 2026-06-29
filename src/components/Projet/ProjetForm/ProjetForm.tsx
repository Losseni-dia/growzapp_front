// src/components/Projet/ProjetForm/ProjetForm.tsx
import { useCallback, useEffect, useRef, useState } from "react";
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
  FiClock,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { dataURLtoFile, getCroppedImg } from "../../../types/utils/CropImage";
import { api } from "../../../service/Api";
import type { SecteurDTO } from "../../../types/secteur";
import type { PaysDTO } from "../../../types/pays";
import type { LocaliteDTO } from "../../../types/localite";

// Enveloppe retournée par tous les endpoints GrowzApp
interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}
import ComboBox from "../../ui/ComboBox/ComboBox";
import styles from "./ProjetForm.module.css";

// ─── Helpers champs numériques (saisie texte, valeur number) ─────────────────

/** Formate un number en string lisible (vide si 0 initial) */
function numToDisplay(val: number): string {
  return val === 0 ? "" : String(val);
}

/** Filtre les caractères non numériques et retourne un number */
function parseNumericInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, "");
  return cleaned === "" ? 0 : parseInt(cleaned, 10);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // ── CHAMPS TEXTE ────────────────────────────────────────────────────────────
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [localiteNom, setLocaliteNom] = useState("");
  const [paysNom, setPaysNom] = useState("");

  // ── CHAMPS NUMÉRIQUES (stockés en number, affichés en string) ───────────────
  const [valuation, setValuation] = useState<number>(0);
  const [valuationDisplay, setValuationDisplay] = useState<string>("");

  const [objectif, setObjectif] = useState<number>(0);
  const [objectifDisplay, setObjectifDisplay] = useState<string>("");

  const [prixPart, setPrixPart] = useState<number>(0);
  const [prixPartDisplay, setPrixPartDisplay] = useState<string>("");

  const [roi, setRoi] = useState<number>(0);
  const [roiDisplay, setRoiDisplay] = useState<string>("");

  const [dureeMois, setDureeMois] = useState<number | null>(null); // null = durée indéterminée

  // Calculs automatiques
  const totalParts = prixPart > 0 ? Math.floor(objectif / prixPart) : 0;
  const partsEnPourcent =
    valuation > 0 ? Math.round((objectif / valuation) * 100) : 0;

  // ── DONNÉES RÉFÉRENTIELS ────────────────────────────────────────────────────
  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [pays, setPays] = useState<string[]>([]);
  const [localites, setLocalites] = useState<string[]>([]);
  const [loadingSecteurs, setLoadingSecteurs] = useState(false);
  const [loadingPays, setLoadingPays] = useState(false);
  const [loadingLocalites, setLoadingLocalites] = useState(false);

  // ── ÉTATS UI ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [agreedToMonitoring, setAgreedToMonitoring] = useState(false);

  // ── IMAGE & CROP ────────────────────────────────────────────────────────────
  const [preview, setPreview] = useState<string | null>(null); // image finale
  const [rawPreview, setRawPreview] = useState<string | null>(null); // brut pour Cropper
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // ── CHARGEMENT DES RÉFÉRENTIELS AU MONTAGE ──────────────────────────────────
  useEffect(() => {
    // Secteurs — réponse enveloppée : { success, data: SecteurDTO[] }
    setLoadingSecteurs(true);
    api
      .get<ApiWrapper<SecteurDTO[]>>("/api/secteurs")
      .then((res) => setSecteurs((res.data ?? []).map((s) => s.nom)))
      .catch(() => setSecteurs([]))
      .finally(() => setLoadingSecteurs(false));

    // Pays — réponse enveloppée : { success, data: PaysDTO[] }
    setLoadingPays(true);
    api
      .get<ApiWrapper<PaysDTO[]>>("/api/pays")
      .then((res) => setPays((res.data ?? []).map((p) => p.nom)))
      .catch(() => setPays([]))
      .finally(() => setLoadingPays(false));

    // Localités — réponse enveloppée : { success, data: LocaliteDTO[] }
    setLoadingLocalites(true);
    api
      .get<ApiWrapper<LocaliteDTO[]>>("/api/localites")
      .then((res) => setLocalites((res.data ?? []).map((l) => l.nom)))
      .catch(() => setLocalites([]))
      .finally(() => setLoadingLocalites(false));
  }, []);

  // ── HANDLERS NUMÉRIQUES ─────────────────────────────────────────────────────

  const handleObjectifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // N'accepter que les chiffres
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    setObjectifDisplay(digitsOnly);
    setObjectif(digitsOnly === "" ? 0 : parseInt(digitsOnly, 10));
  };

  const handlePrixPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    setPrixPartDisplay(digitsOnly);
    setPrixPart(digitsOnly === "" ? 0 : parseInt(digitsOnly, 10));
  };

  const handleRoiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setRoiDisplay(raw);
    setRoi(raw === "" ? 0 : parseFloat(raw));
  };

  const handleDureeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setDureeMois(val === "" ? null : parseInt(val, 10));
  };

  const handleValuationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setValuationDisplay(digitsOnly);
    setValuation(digitsOnly === "" ? 0 : parseInt(digitsOnly, 10));
  };

  // ── CROP ─────────────────────────────────────────────────────────────────────
  const onCropComplete = useCallback(
    (_: any, p: any) => setCroppedAreaPixels(p),
    [],
  );

  const createCroppedImage = async () => {
    if (!rawPreview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(rawPreview, croppedAreaPixels);
      setPreview(cropped);
      setRawPreview(null);
      setPosterFile(dataURLtoFile(cropped, `pitch_${Date.now()}.jpg`));
      setShowCropper(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      toast.success("Image recadrée !");
    } catch {
      toast.error("Erreur de recadrage");
    }
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setRawPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // ── SOUMISSION ────────────────────────────────────────────────────────────────
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
      valeurTotalePartsEnPourcent: partsEnPourcent,
      roiProjete: roi,
      valuation: valuation,
      dureeMois: dureeMois ?? null, // null = durée indéterminée
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

  // ─────────────────────────────────────────────────────────────────────────────

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
        {/* ── PHOTO STUDIO ────────────────────────────────────────────────── */}
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
              <div className={styles.cropContainer} ref={cropContainerRef}>
                <Cropper
                  image={rawPreview!}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: { background: "#1a1a1a" },
                    cropAreaStyle: {
                      border: "3px solid #4CAF76",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                    },
                  }}
                  minZoom={0.4}
                  initialCroppedAreaPercentages={{
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                  }}
                />
              </div>
              <div className={styles.cropControls}>
                <button
                  type="button"
                  onClick={cancelCrop}
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
            style={{ display: "none" }}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              const reader = new FileReader();
              reader.onload = () => {
                setRawPreview(reader.result as string);
                setShowCropper(true);
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        {/* ── TITRE & DESCRIPTION ─────────────────────────────────────────── */}
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
          <label>Pitch et besoins</label>
          <textarea
            rows={4}
            placeholder="Décrivez votre projet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* ── GRILLE FINANCIÈRE — saisie texte, chiffres seulement ─────────── */}
        <div className={styles.financeGrid}>
          <div className={styles.inputGroup}>
            <label>
              <FiDollarSign /> Montant à lever (FCFA)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex : 5000000"
              value={objectifDisplay}
              onChange={handleObjectifChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>
              <FiPieChart /> Prix d'une part (FCFA)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex : 10000"
              value={prixPartDisplay}
              onChange={handlePrixPartChange}
              required
            />
          </div>
        </div>

        {/* ── VALORISATION TOTALE ──────────────────────────────────────────── */}
        <div className={styles.inputGroup}>
          <label>
            <FiDollarSign /> Valorisation totale du projet (FCFA)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ex : 25000000 — valeur totale de votre entreprise/projet"
            value={valuationDisplay}
            onChange={handleValuationChange}
            required
          />
        </div>

        {/* ── ROI — saisi par le porteur ───────────────────────────────────── */}
        <div className={styles.inputGroup}>
          <label>
            <FiPieChart /> ROI projeté (% annuel)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ex : 15 — rendement annuel estimé pour les investisseurs"
            value={roiDisplay}
            onChange={handleRoiChange}
            required
          />
        </div>

        {/* ── DURÉE DU PROJET ─────────────────────────────────────────── */}
        <div className={styles.inputGroup}>
          <label>
            <FiClock /> Durée du projet (en mois)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ex : 24 — laisser vide si durée indéterminée"
            value={dureeMois ?? ""}
            onChange={handleDureeChange}
          />
          {dureeMois === null && (
            <span className={styles.durationHint}>
              ⏳ Durée indéterminée (renouvelable)
            </span>
          )}
          {dureeMois !== null && dureeMois > 0 && (
            <span className={styles.durationHint}>
              📅 {dureeMois} mois
              {dureeMois === 12
                ? " (1 an)"
                : dureeMois === 24
                  ? " (2 ans)"
                  : dureeMois === 36
                    ? " (3 ans)"
                    : dureeMois % 12 === 0
                      ? ` (${dureeMois / 12} ans)`
                      : ""}
            </span>
          )}
        </div>

        {/* ── RÉSULTATS CALCULÉS AUTO ──────────────────────────────────────── */}
        {totalParts > 0 && (
          <div className={styles.autoCalcInfo}>
            <FiCheck />
            <div>
              <div>
                Nombre de parts :{" "}
                <strong>{totalParts.toLocaleString("fr-FR")} parts</strong> de{" "}
                {prixPart.toLocaleString("fr-FR")} FCFA
              </div>
              {partsEnPourcent > 0 && (
                <div>
                  Parts à lever : <strong>{partsEnPourcent}%</strong> de la
                  valorisation totale
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECTEUR / VILLE / PAYS — ComboBox avec données API ─────────── */}
        <div className={styles.locationGrid}>
          <ComboBox
            label="Secteur"
            icon={<FiTag />}
            placeholder="Agriculture, Tech..."
            value={secteurNom}
            onChange={setSecteurNom}
            options={secteurs}
            loading={loadingSecteurs}
            required
          />

          <ComboBox
            label="Ville"
            icon={<FiMapPin />}
            placeholder="Yamoussoukro"
            value={localiteNom}
            onChange={setLocaliteNom}
            options={localites}
            loading={loadingLocalites}
            required
          />

          <ComboBox
            label="Pays"
            icon={<FiMapPin />}
            placeholder="Côte d'Ivoire"
            value={paysNom}
            onChange={setPaysNom}
            options={pays}
            loading={loadingPays}
            required
          />
        </div>

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          <FiSend /> {loading ? "Traitement..." : "Soumettre aux experts"}
        </button>
      </form>

      {/* ── MODAL LÉGAL ──────────────────────────────────────────────────── */}
      {showLegalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <FiShield className={styles.shieldIcon} />
              <h2>Engagement & Certification</h2>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.alertBox}>
                <FiAlertTriangle className={styles.alertIcon} />
                <p>
                  Attention : toute fausse déclaration ou falsification de
                  documents est passible de poursuites pénales.
                </p>
              </div>

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
