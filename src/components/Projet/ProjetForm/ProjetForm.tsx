// src/pages/Projets/ProjectForm.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/context/AuthContext";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { FiCamera, FiSend } from "react-icons/fi";
import styles from "./ProjetForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../../types/utils/CropImage";
import { useTranslation } from "react-i18next"; // <--- IMPORT

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
  const { t } = useTranslation(); // <--- HOOK

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
        // Pas besoin d'embêter l'utilisateur avec ça si ça fail silencieusement
      }
    };
    loadReferences();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error(t("project_form.photo.error_type"));
    if (file.size > 10 * 1024 * 1024)
      return toast.error(t("project_form.photo.error_size"));

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
      toast.success(t("project_form.photo.success_crop"));
    } catch {
      // erreur
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setPosterFile(null);
    setShowCropper(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!libelle.trim())
      return toast.error(t("project_form.errors.required_name"));
    if (!description.trim())
      return toast.error(t("project_form.errors.required_desc"));
    if (!secteurNom.trim())
      return toast.error(t("project_form.errors.required_sector"));
    if (!localiteNom.trim())
      return toast.error(t("project_form.errors.required_city"));

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

      if (!response.ok) throw new Error();
      toast.success(t("project_form.success"));
      navigate("/mes-projets");
    } catch (err: any) {
      toast.error(t("project_form.errors.server"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t("project_form.title")}</h1>

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
                  <p>{t("project_form.photo.placeholder")}</p>
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
                  {t("project_form.photo.crop_validate")}
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className={styles.cancelBtn}
                >
                  {t("project_form.photo.crop_cancel")}
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

        <input
          type="text"
          placeholder={t("project_form.fields.name_placeholder")}
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          required
        />
        <textarea
          placeholder={t("project_form.fields.desc_placeholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          required
        />
        <input
          type="text"
          placeholder={t("project_form.fields.sector_placeholder")}
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
          placeholder={t("project_form.fields.city_placeholder")}
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
          placeholder={t("project_form.fields.country_placeholder")}
          value={paysNom}
          onChange={(e) => setPaysNom(e.target.value)}
        />

        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.saveBtn}>
            <FiSend style={{ marginRight: 8 }} />
            {loading
              ? t("project_form.buttons.sending")
              : t("project_form.buttons.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
