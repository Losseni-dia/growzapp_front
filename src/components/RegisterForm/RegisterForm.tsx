// src/components/RegisterForm/RegisterForm.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import styles from "./RegisterForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../utils/CropImage";

interface Localite {
  id: number;
  nom: string;
}
interface Langue {
  id: number;
  nom: string;
}

export default function RegisterForm() {
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
        toast.error("Impossible de charger les données");
      }
    };
    fetchData();
  }, []);

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
      setPhotoFile(dataURLtoFile(cropped, "profile.jpg"));
      setShowCropper(false);
      toast.success("Photo recadrée !");
    } catch {
      toast.error("Erreur recadrage");
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setPhotoFile(null);
    setShowCropper(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // === SOUMISSION – IDENTIQUE À TON PROJET ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error("Mots de passe différents");
    if (!form.localiteId) return toast.error("Choisissez une région");
    if (selectedLangues.length === 0)
      return toast.error("Choisissez au moins une langue");

    setLoading(true);

    const formData = new FormData();

    // JSON utilisateur
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

    formData.append(
      "user",
      new Blob([JSON.stringify(userJson)], { type: "application/json" })
    );

    if (photoFile) {
      formData.append("image", photoFile);
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur inscription");
      }

    
      toast.success("Inscription réussie ! Bienvenue !");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // === RENDU (identique à ton style) ===
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Créer votre compte GrowzApp</h2>

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
                  Camera
                </span>
                <p>Ajouter une photo</p>
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
          style={{ display: "none" }}
        />
      </div>

      {/* CHAMPS CLASSIQUES */}
      <div className={styles.row}>
        <input
          name="prenom"
          placeholder="Prénom"
          value={form.prenom}
          onChange={handleChange}
          required
        />
        <input
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
          required
        />
      </div>

      <input
        name="login"
        placeholder="Login"
        value={form.login}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        name="contact"
        placeholder="Téléphone (facultatif)"
        value={form.contact}
        onChange={handleChange}
      />

      <div className={styles.row}>
        <input
          name="password"
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirmer"
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
          Homme
        </label>
        <label>
          <input
            type="radio"
            name="sexe"
            value="F"
            checked={form.sexe === "F"}
            onChange={handleChange}
          />{" "}
          Femme
        </label>
      </div>

      <select
        name="localiteId"
        value={form.localiteId}
        onChange={handleChange}
        className={styles.select}
        required
      >
        <option value="">Choisir votre région / ville</option>
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
            ? "Langues parlées (cliquez)"
            : `${selectedLangues.length} langue(s)`}
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
        {loading ? "Création..." : "S'inscrire gratuitement"}
      </button>

      <p className={styles.loginLink}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </form>
  );
}
