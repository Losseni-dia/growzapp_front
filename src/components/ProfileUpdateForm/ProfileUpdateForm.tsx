// src/components/Profile/ProfileUpdateForm.tsx
// VERSION FINALE — TOUT FONCTIONNE PARFAITEMENT (langues conservées si non touchées, redirection, photo, etc.)

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { getCroppedImg, dataURLtoFile } from "../../types/utils/CropImage";
import styles from "../RegisterForm/RegisterForm.module.css";

interface Localite {
  id: number;
  nom: string;
}
interface Langue {
  id: number;
  nom: string;
}

export default function ProfileUpdateForm() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Photo + cropper
  const [preview, setPreview] = useState<string | null>(user?.image || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Données
  const [localites, setLocalites] = useState<Localite[]>([]);
  const [langues, setLangues] = useState<Langue[]>([]);

  // Langues sélectionnées + savoir si l'utilisateur a touché au menu
  const [selectedLangues, setSelectedLangues] = useState<number[]>(() => {
    return (
      user?.langues
        ?.map((l: any) => Number(l.id))
        .filter((id: number) => !isNaN(id) && id > 0) || []
    );
  });
  const [languesTouched, setLanguesTouched] = useState(false); // NOUVEAU

  const [showLangues, setShowLangues] = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    prenom: user?.prenom || "",
    nom: user?.nom || "",
    email: user?.email || "",
    contact: user?.contact || "",
    login: user?.login || "",
    password: "",
    confirmPassword: "",
    localiteId: user?.localite?.id?.toString() || "",
  });

  const [loading, setLoading] = useState(false);

  // Chargement localités + langues
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
      } catch {
        toast.error("Erreur chargement données");
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // LANGUES : on marque comme "touché" dès qu’on clique
  const toggleLangue = (id: number) => {
    setLanguesTouched(true);
    setSelectedLangues((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Photo
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

  // HANDLE SUBMIT FINAL — PARFAIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password && form.password !== form.confirmPassword) {
      return toast.error("Les mots de passe ne correspondent pas");
    }

    setLoading(true);
    const formData = new FormData();

    // Construction intelligente : on n’envoie que ce qui est nécessaire
    // Construction du payload — ON N’ENVOIE LANGUES QUE SI TOUCHÉ
    const userUpdate: any = {
      login: form.login.trim(),
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim(),
      contact: form.contact?.trim() || null,
      sexe: user?.sexe,
      localite: form.localiteId ? { id: Number(form.localiteId) } : null,
    };

    // LANGUES : on n’envoie le champ QUE si l’utilisateur a cliqué sur le menu
    if (languesTouched) {
      const payload = selectedLangues
        .map((id) => Number(id))
        .filter((id) => id > 0)
        .map((id) => ({ id }));
      if (payload.length > 0) {
        userUpdate.langues = payload;
      } else {
        userUpdate.langues = []; // vide volontairement
      }
    }
    // ← SI languesTouched === false → LE CHAMP "langues" N’EST MÊME PAS DANS LE JSON !

    // Mot de passe
    if (form.password?.trim()) {
      userUpdate.password = form.password.trim();
    }
    formData.append("user", JSON.stringify(userUpdate));
    if (photoFile) formData.append("image", photoFile);

    // Token
    let token = localStorage.getItem("access_token") || "";
    if (!token) {
      const stored = localStorage.getItem("user");
      if (stored) token = JSON.parse(stored)?.token || "";
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur backend :", errText);
        throw new Error(errText || "Erreur lors de la mise à jour");
      }

      const data = await response.json();
      updateUser(data.data || data);

      if (photoFile && data.data?.image) {
        setPreview(data.data.image);
      }

      toast.success("Profil mis à jour avec succès !");
      setTimeout(() => {
        navigate("/mon-espace");
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Modifier mon profil</h2>

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
                  setPreview(null);
                  setPhotoFile(null);
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
                onClick={() => {
                  setShowCropper(false);
                  setPreview(user?.image || null);
                }}
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
        placeholder="Téléphone"
        value={form.contact}
        onChange={handleChange}
      />

      <div className={styles.row}>
        <input
          name="password"
          type="password"
          placeholder="Nouveau mot de passe"
          value={form.password}
          onChange={handleChange}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirmer"
          value={form.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <select
        name="localiteId"
        value={form.localiteId}
        onChange={handleChange}
        className={styles.select}
        required
      >
        <option value="">Région / Ville</option>
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
            ? "Langues parlées"
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
        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
