import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { useAuth } from "../../../components/context/AuthContext";
import { api } from "../../../service/api";
import styles from "./ProfileUpdateForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../../types/utils/CropImage";
import { useTranslation } from "react-i18next";
import { UserDTO } from "../../../types/user";
import { getAvatarUrl } from "../../../types/utils/UserUtils"; // Importe l'utilitaire d'URL

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface Localite {
  id: number;
  nom: string;
}
interface Langue {
  id: number;
  nom: string;
}

export default function ProfileUpdateForm() {
  const { t, i18n, ready } = useTranslation("translation", {
    useSuspense: false,
  });
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [preview, setPreview] = useState<string | null>(user?.image || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localites, setLocalites] = useState<Localite[]>([]);
  const [langues, setLangues] = useState<Langue[]>([]);
  const [selectedLangues, setSelectedLangues] = useState<number[]>(
    user?.langues?.map((l: any) => l?.id).filter((id: any) => id != null) || []
  );
  const [showLangues, setShowLangues] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    prenom: user?.prenom || "",
    nom: user?.nom || "",
    email: user?.email || "",
    contact: user?.contact || "",
    sexe: user?.sexe || "M",
    localiteId: user?.localite?.id?.toString() || "",
  });

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, langRes] = await Promise.all([
          api.get<ApiResponse<Localite[]>>("/api/localites"),
          api.get<ApiResponse<Langue[]>>("/api/langues"),
        ]);
        setLocalites(locRes.data || []);
        setLangues(langRes.data || []);
      } catch (err) {
        toast.error(t("register_page.errors.load_data"));
      }
    };
    if (ready) fetchData();
  }, [t, ready]);

  // --- LOGIQUE PHOTO ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error(t("register_page.photo.error_type"));

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback(
    (_: any, pixels: any) => setCroppedAreaPixels(pixels),
    []
  );

  const handleValidateCrop = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPhotoFile(dataURLtoFile(cropped, "profile_update.jpg"));
      setShowCropper(false);
      toast.success(t("register_page.photo.success_crop"));
    } catch {
      toast.error(t("register_page.photo.error_crop"));
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setPreview(user?.image || null);
  };

  const toggleLangue = (langueId: number) => {
    if (!langueId) return;
    setSelectedLangues((prev) =>
      prev.includes(langueId)
        ? prev.filter((id) => id !== langueId)
        : [...prev, langueId]
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    const userUpdateJson = {
      prenom: form.prenom,
      nom: form.nom,
      email: form.email,
      contact: form.contact,
      sexe: form.sexe,
      localite: { id: Number(form.localiteId) },
      langues: selectedLangues.map((id) => ({ id: Number(id) })),
    };

    formData.append(
      "user",
      new Blob([JSON.stringify(userUpdateJson)], { type: "application/json" })
    );
    if (photoFile) formData.append("image", photoFile);

    try {
      const response = await api.put<ApiResponse<UserDTO>>(
        "/api/auth/me",
        formData,
        true
      );
      if (response.success) {
        updateUserInfo(response.data);
        toast.success(t("register_page.success"));
        navigate("/mon-espace");
      }
    } catch (err: any) {
      toast.error(err.message || t("register_page.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className={styles.container} key={i18n.language}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>{t("dashboard.edit_profile")}</h2>

        <div className={styles.photoSection}>
          {!showCropper ? (
            <div
              className={styles.photoUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img
                  src={
                    preview.startsWith("data:")
                      ? preview
                      : getAvatarUrl(preview)
                  }
                  alt="Profil"
                  className={styles.preview}
                />
              ) : (
                <div className={styles.photoContent}>
                  <span className={styles.cameraIcon}>📷</span>
                  <p>{t("register_page.photo.add_text")}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.cropContainer}>
                <Cropper
                  image={preview!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className={styles.cropControls}>
                <button
                  type="button"
                  className={styles.cropBtn}
                  onClick={handleValidateCrop}
                >
                  {t("register_page.photo.validate")}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancelCrop}
                >
                  {t("register_page.photo.cancel")}
                </button>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoChange}
          />
        </div>

        <div className={styles.row}>
          <input
            name="prenom"
            placeholder={t("register_page.form.firstname")}
            value={form.prenom}
            onChange={handleChange}
            required
          />
          <input
            name="nom"
            placeholder={t("register_page.form.lastname")}
            value={form.nom}
            onChange={handleChange}
            required
          />
        </div>

        <input
          name="email"
          type="email"
          placeholder={t("register_page.form.email")}
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="contact"
          placeholder={t("register_page.form.phone")}
          value={form.contact}
          onChange={handleChange}
        />

        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="sexe"
              value="M"
              checked={form.sexe === "M"}
              onChange={() => setForm({ ...form, sexe: "M" })}
            />{" "}
            {t("register_page.form.gender_male")}
          </label>
          <label>
            <input
              type="radio"
              name="sexe"
              value="F"
              checked={form.sexe === "F"}
              onChange={() => setForm({ ...form, sexe: "F" })}
            />{" "}
            {t("register_page.form.gender_female")}
          </label>
        </div>

        <select
          name="localiteId"
          value={form.localiteId}
          onChange={handleChange}
          className={styles.select}
          required
        >
          <option value="">{t("register_page.form.select_region")}</option>
          {localites.map((loc) => (
            <option key={`loc-${loc.id}`} value={loc.id}>
              {loc.nom}
            </option>
          ))}
        </select>

        <div className={styles.languesWrapper}>
          <div
            className={`${styles.languesSelectBox} ${
              showLangues ? styles.open : ""
            }`}
            onClick={() => setShowLangues(!showLangues)}
          >
            <div className={styles.selectedTags}>
              {selectedLangues.length === 0 ? (
                <div className={styles.coolPlaceholder}>
                  <span className={styles.languageIcon}>🌍</span>
                  <span>Modifiez vos langues</span>
                </div>
              ) : (
                selectedLangues.map((id) => (
                  <span key={`tag-${id}`} className={styles.tag}>
                    {langues.find((l) => l.id === id)?.nom}
                    <span
                      className={styles.removeTag}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLangue(id);
                      }}
                    >
                      ×
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
          {showLangues && (
            <div className={styles.languesFloatingPanel}>
              {langues.map((lang) => (
                <div
                  key={`opt-${lang.id}`}
                  className={`${styles.langueOption} ${
                    selectedLangues.includes(lang.id)
                      ? styles.selectedOption
                      : ""
                  }`}
                  onClick={() => toggleLangue(lang.id)}
                >
                  <div className={styles.checkboxCustom}>
                    {selectedLangues.includes(lang.id) && "✓"}
                  </div>
                  <span>{lang.nom}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading
            ? t("register_page.buttons.submit_loading")
            : t("register_page.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
