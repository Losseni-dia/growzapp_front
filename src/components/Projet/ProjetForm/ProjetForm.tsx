// src/pages/Projets/ProjectForm.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/context/AuthContext";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { FiCamera, FiSend } from "react-icons/fi";
import styles from "./ProjetForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../../utils/CropImage";

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

  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [localiteNom, setLocaliteNom] = useState("");
  const [paysNom, setPaysNom] = useState("Côte d'Ivoire");

  // POSTER + CROPPER
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

  // CHARGEMENT DES RÉFÉRENCES
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

        if (!sectRes.ok || !locRes.ok) throw new Error();

        const sectData = await sectRes.json();
        const locData = await locRes.json();

        setSecteurs(sectData.data || []);
        setLocalites(locData.data || []);
      } catch {
        toast.error("Impossible de charger les données");
      }
    };
    loadReferences();
  }, []);

  // GESTION PHOTO
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Image uniquement");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10 Mo");

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPosterFile(dataURLtoFile(cropped, "poster.jpg"));
      setShowCropper(false);
      toast.success("Poster recadré !");
    } catch {
      toast.error("Erreur recadrage");
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setPosterFile(null);
    setShowCropper(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // SOUMISSION — LA LIGNE MAGIQUE QUI RÉSOUT TOUT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!libelle.trim()) return toast.error("Le nom du projet est obligatoire");
    if (!description.trim())
      return toast.error("La description est obligatoire");
    if (!secteurNom.trim()) return toast.error("Le secteur est obligatoire");
    if (!localiteNom.trim()) return toast.error("La localité est obligatoire");

    setLoading(true);
    const formData = new FormData();

    const projetJson = {
      libelle: libelle.trim(),
      description: description.trim(),
      secteurNom: secteurNom.trim(),
      localiteNom: localiteNom.trim(),
      paysNom: paysNom.trim() || null,
    };

    formData.append(
      "projet",
      new Blob([JSON.stringify(projetJson)], { type: "application/json" })
    );
    if (posterFile) formData.append("poster", posterFile);

    const token = localStorage.getItem("access_token") || "";

    try {
      const response = await fetch("http://localhost:8080/api/projets", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Erreur serveur");
      }

      toast.success("Projet soumis avec succès !");
      navigate("/mes-projets");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Soumettre un nouveau projet</h1>

      <div className={styles.userInfo}>
        <strong>
          {user?.prenom} {user?.nom}
        </strong>
        <br />
        <span>{user?.email}</span>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* POSTER + CROPPER */}
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
                  <FiCamera size={48} />
                  <p>Ajouter un poster (16:9 recommandé)</p>
                </div>
              )}
              {preview && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto();
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <div className={styles.cropContainer}>
              {preview && (
                <Cropper
                  image={preview}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
              <div className={styles.cropControls}>
                <button
                  type="button"
                  onClick={createCroppedImage}
                  className={styles.cropBtn}
                >
                  Valider
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className={styles.cancelBtn}
                >
                  Annuler
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

        {/* CHAMPS */}
        <input
          type="text"
          placeholder="Nom du projet *"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description détaillée *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          required
        />
        <input
          type="text"
          placeholder="Secteur d'activité *"
          value={secteurNom}
          onChange={(e) => setSecteurNom(e.target.value)}
          list="secteurs-list"
          required
        />
        <datalist id="secteurs-list">
          {secteurs.map((s) => (
            <option key={s.id} value={s.nom} />
          ))}
        </datalist>
        <input
          type="text"
          placeholder="Ville / Localité *"
          value={localiteNom}
          onChange={(e) => setLocaliteNom(e.target.value)}
          list="localites-list"
          required
        />
        <datalist id="localites-list">
          {localites.map((l) => (
            <option key={l.id} value={l.nom} />
          ))}
        </datalist>
        <input
          type="text"
          placeholder="Pays (Côte d'Ivoire par défaut)"
          value={paysNom}
          onChange={(e) => setPaysNom(e.target.value)}
        />

        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.saveBtn}>
            <FiSend style={{ marginRight: 8 }} />
            {loading ? "Envoi..." : "Soumettre le projet"}
          </button>
        </div>
      </form>
    </div>
  );
}
