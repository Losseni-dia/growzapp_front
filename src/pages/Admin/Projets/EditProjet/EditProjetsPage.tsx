// src/pages/Admin/Projets/EditProjetPage.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../../service/api";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { FiSave } from "react-icons/fi";
import styles from "./EditProjetsPage.module.css";
import { getCroppedImg, dataURLtoFile } from "../../../../utils/CropImage";

import { ProjetDTO } from "../../../../types/projet";
import { ApiResponse } from "../../../../types/common";
import { SecteurDTO } from "../../../../types/secteur";

type SiteDTO = { id: number; nom: string };

export default function EditProjetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjetDTO>>({});

  // Photo + cropper
  const [preview, setPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [secteurs, setSecteurs] = useState<SecteurDTO[]>([]);
  const [sites, setSites] = useState<SiteDTO[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [projetRes, secteursRes, sitesRes] = await Promise.all([
          api.get<ApiResponse<ProjetDTO>>(`/admin/projets/${id}`),
          api.get<ApiResponse<SecteurDTO[]>>("/api/secteurs"),
          api.get<ApiResponse<SiteDTO[]>>("/api/localisations"),
        ]);

        const projet = projetRes.data;
        setFormData(projet);
        setPreview(projet.poster || null);
        setSecteurs(secteursRes.data || []);
        setSites(sitesRes.data || []);
      } catch {
        toast.error("Impossible de charger le projet");
        navigate("/admin/projets");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // === GESTION PHOTO ===
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  // === SOUMISSION ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // RÉCUPÉRATION DU TOKEN (la méthode qui marche à 100%)
      let token = localStorage.getItem("access_token");
      if (!token) {
        const user = localStorage.getItem("user");
        if (user) {
          const parsed = JSON.parse(user);
          token = parsed?.token || parsed?.accessToken;
        }
      }

      if (!token) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        navigate("/login");
        return;
      }

      // Debug temporaire (enlève après)
      console.log("Token envoyé :", token.substring(0, 20) + "...");

      const form = new FormData();
      form.append(
        "projet",
        new Blob([JSON.stringify(formData)], { type: "application/json" })
      );
      if (posterFile) form.append("poster", posterFile);

      const response = await fetch(
        `http://localhost:8080/api/admin/projets/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`, // Toujours envoyé
            // NE JAMAIS mettre Content-Type avec FormData !
          },
          credentials: "include",
          body: form,
        }
      );

      if (response.status === 401) {
        toast.error("Session expirée. Redirection vers login...");
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erreur ${response.status}`);
      }

      toast.success("Projet mis à jour avec succès !");
      navigate("/admin/projets");
    } catch (err: any) {
      console.error("Erreur complète :", err);
      toast.error(err.message || "Échec de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.loading}>Chargement...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Modifier le projet</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* === PHOTO === */}
        <div className={styles.photoSection}>
          {!showCropper ? (
            <div
              className={styles.photoUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Poster" className={styles.preview} />
              ) : (
                <div className={styles.placeholder}>
                  <span role="img" aria-label="camera">
                    Camera
                  </span>
                  <p>Changer le poster (16:9 recommandé)</p>
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
                  Valider le recadrage
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

        {/* === TOUS LES CHAMPS === */}
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Nom du projet *</label>
            <input
              type="text"
              value={formData.libelle || ""}
              onChange={(e) =>
                setFormData({ ...formData, libelle: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.field}>
            <label>Secteur *</label>
            <select
              value={formData.secteurId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  secteurId: { id: Number(e.target.value) } as any,
                })
              }
              required
            >
              <option value="">Choisir un secteur</option>
              {secteurs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>

          <select
            value={formData.siteId || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                siteId: { id: Number(e.target.value) } as any,
              })
            }
            required
          >
            <option value="">Sélectionner un site *</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            placeholder="Budget (en €)"
            value={formData.valuation || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                valuation: Number(e.target.value) || 0,
              })
            }
          />

          <input
            type="date"
            placeholder="Date de début"
            value={formData.dateDebut?.split("T")[0] || ""}
            onChange={(e) =>
              setFormData({ ...formData, dateDebut: e.target.value })
            }
          />

          <input
            type="date"
            placeholder="Date de fin prévue"
            value={formData.dateFin?.split("T")[0] || ""}
            onChange={(e) =>
              setFormData({ ...formData, dateFin: e.target.value })
            }
          />

          <input
            type="date"
            placeholder="Date de fin réelle"
            value={formData.dateFin?.split("T")[0] || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dateFin: e.target.value || undefined,
              })
            }
          />

          <select
            value={formData.statutProjet || ""}
            onChange={(e) =>
              setFormData({ ...formData, statutProjet: e.target.value as any })
            }
            required
          >
            <option value="">Statut du projet *</option>
            <option value="EN_COURS">En cours</option>
            <option value="VALIDE">Financement en cours</option>
            <option value="TERMINE">Terminé</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="ANNULE">Annulé</option>
          </select>

          <input
            type="text"
            placeholder="Responsable (nom)"
            value={formData.porteurNom || ""}
            onChange={(e) =>
              setFormData({ ...formData, porteurNom: e.target.value })
            }
          />
        </div>

        <textarea
          placeholder="Description complète du projet *"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={10}
          required
        />

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            <FiSave />{" "}
            {saving
              ? "Sauvegarde en cours..."
              : "Sauvegarder les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
