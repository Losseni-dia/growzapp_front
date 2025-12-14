// src/components/RegisterForm/RegisterForm.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import styles from "./RegisterForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../types/utils/CropImage";

// 1. IMPORT I18N
import { useTranslation } from "react-i18next";

interface Localite {
  id: number;
  nom: string;
}
interface Langue {
  id: number;
  nom: string;
}

export default function RegisterForm() {
  // 2. INITIALISATION I18N
  const { t } = useTranslation();

  // Photo + cropper
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Données
  const [localites, setLocalites] = useState<Localite[]>([]);
  const [langues, setLangues] = useState<Langue[]>([]);
  const [selectedLangues, setSelectedLangues] = useState<number[]>([]);
  const [showLangues, setShowLangues] = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    login: "",
    password: "",
    confirmPassword: "",
    prenom: "",
    nom: "",
    email: "",
    contact: "",
    sexe: "M" as "M" | "F",
    localiteId: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, langRes] = await Promise.all([
          fetch("http://localhost:8080/api/localites"),
          fetch("http://localhost:8080/api/langues"),
        ]);
        const locData = await locRes.json();
        const langData = await langRes.json();
        setLocalites(locData.data || []);
        setLangues(langData.data || []);
      } catch (err) {
        // TRADUCTION ERREUR
        toast.error(t("register_page.errors.load_data"));
      }
    };
    fetchData();
  }, [t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleLangue = (langueId: number) => {
    setSelectedLangues((prev) =>
      prev.includes(langueId)
        ? prev.filter((id) => id !== langueId)
        : [...prev, langueId]
    );
  };

  // === PHOTO + CROP ===
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TRADUCTION ERREURS PHOTO
    if (!file.type.startsWith("image/"))
      return toast.error(t("register_page.photo.error_type"));
    if (file.size > 10 * 1024 * 1024)
      return toast.error(t("register_page.photo.error_size"));

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
      setPhotoFile(dataURLtoFile(cropped, "profile.jpg"));
      setShowCropper(false);
      // TRADUCTION SUCCÈS
      toast.success(t("register_page.photo.success_crop"));
    } catch {
      toast.error(t("register_page.photo.error_crop"));
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setPhotoFile(null);
    setShowCropper(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // === SOUMISSION ===
 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);

   const formData = new FormData();

   // On crée l'objet JSON SANS la propriété image
   const userJson = {
     login: form.login.trim(),
     password: form.password,
     confirmPassword: form.confirmPassword,
     prenom: form.prenom,
     nom: form.nom,
     email: form.email,
     contact: form.contact || null,
     sexe: form.sexe,
     localite: { id: Number(form.localiteId) },
     langues: selectedLangues.map((id) => ({ id: Number(id) })),
   };

   // On ajoute le JSON en tant que Blob
   formData.append(
     "user",
     new Blob([JSON.stringify(userJson)], { type: "application/json" })
   );

   // On ajoute le fichier image séparément (MultipartFile côté Java)
   if (photoFile) {
     formData.append("image", photoFile);
   }

   try {
     const response = await fetch("http://localhost:8080/api/auth/register", {
       method: "POST",
       body: formData,
       // Ne PAS mettre de Header Content-Type, fetch le gère seul pour le FormData
     });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || t("register_page.errors.generic"));
     }

     toast.success(t("register_page.success"));
     navigate("/login");
   } catch (err: any) {
     toast.error(err.message);
   } finally {
     setLoading(false);
   }
 };

  // === RENDU ===
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{t("register_page.title")}</h2>

      {/* PHOTO + CROP */}
      <div className={styles.photoSection}>
        {!showCropper ? (
          <div
            className={styles.photoUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Profil" className={styles.preview} />
            ) : (
              <div className={styles.placeholder}>
                <span role="img" aria-label="camera">
                  📷
                </span>
                <p>{t("register_page.photo.add_text")}</p>
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
                aspect={1}
                cropShape="round"
                showGrid={false}
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
                {t("register_page.photo.validate")}
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className={styles.cancelBtn}
              >
                {t("register_page.photo.cancel")}
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: "none" }}
        />
      </div>

      {/* CHAMPS CLASSIQUES */}
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
        name="login"
        placeholder={t("register_page.form.login")}
        value={form.login}
        onChange={handleChange}
        required
      />
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

      <div className={styles.row}>
        <input
          name="password"
          type="password"
          placeholder={t("register_page.form.password")}
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder={t("register_page.form.confirm_password")}
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.radioGroup}>
        <label>
          <input
            type="radio"
            name="sexe"
            value="M"
            checked={form.sexe === "M"}
            onChange={handleChange}
          />{" "}
          {t("register_page.form.gender_male")}
        </label>
        <label>
          <input
            type="radio"
            name="sexe"
            value="F"
            checked={form.sexe === "F"}
            onChange={handleChange}
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
          <option key={loc.id} value={loc.id}>
            {loc.nom}
          </option>
        ))}
      </select>

      <div
        className={`${styles.languesDropdown} ${
          showLangues ? styles.open : ""
        }`}
        onClick={() => setShowLangues(!showLangues)}
      >
        <span className={styles.languesSelected}>
          {selectedLangues.length === 0
            ? t("register_page.form.select_languages")
            : `${selectedLangues.length} ${t(
                "register_page.form.languages_count"
              )}`}
        </span>
      </div>

      {showLangues && (
        <div className={styles.languesPanel}>
          {langues.map((lang) => (
            <label key={lang.id} className={styles.langueItem}>
              <input
                type="checkbox"
                checked={selectedLangues.includes(lang.id)}
                onChange={() => toggleLangue(lang.id)}
              />
              <span>{lang.nom}</span>
            </label>
          ))}
        </div>
      )}

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading
          ? t("register_page.buttons.submit_loading")
          : t("register_page.buttons.submit")}
      </button>

      <p className={styles.loginLink}>
        {t("register_page.footer.already_account")}{" "}
        <Link to="/login">{t("register_page.footer.login_link")}</Link>
      </p>
    </form>
  );
}
