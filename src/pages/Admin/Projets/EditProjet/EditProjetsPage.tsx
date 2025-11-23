// src/pages/Admin/Projets/EditProjetPage.tsx — VERSION ULTIME 100% FONCTIONNELLE
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { FiSave } from "react-icons/fi";
import styles from "./EditProjetsPage.module.css";
import { getCroppedImg, dataURLtoFile } from "../../../../utils/CropImage";

export default function EditProjetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projet, setProjet] = useState<any>(null);

  // POSTER + CROPPER
  const [preview, setPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CHARGEMENT DU PROJET
  useEffect(() => {
    const fetchProjet = async () => {
      if (!id) return;

      const token = localStorage.getItem("access_token") || "";
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      try {
        const res = await fetch(
          `http://localhost:8080/api/admin/projets/${id}`,
          { headers }
        );
        if (!res.ok) throw new Error("Projet non trouvé");

        const data = (await res.json()).data || (await res.json());
        setProjet(data);
        setPreview(data.poster || null);
      } catch {
        toast.error("Impossible de charger le projet");
        navigate("/admin/projets");
      } finally {
        setLoading(false);
      }
    };
    fetchProjet();
  }, [id, navigate]);

  // GESTION POSTER — IDENTIQUE AU CREATE
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

  // SAUVEGARDE — IDENTIQUE AU CREATE QUI MARCHE
 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!projet) return;

   setSaving(true);

   const token = localStorage.getItem("access_token") || "";
   if (!token) {
     toast.error("Session expirée");
     navigate("/login");
     return;
   }

   const formData = new FormData();

   // ENVOIE UN OBJET SIMPLE → COMME À LA CRÉATION
   const updateData = {
     libelle: projet.libelle?.trim(),
     description: projet.description?.trim(),
     secteurNom: projet.secteurNom?.trim(),
     localiteNom: projet.localiteNom?.trim(),
     paysNom: projet.paysNom?.trim() || null,
     objectifFinancement: projet.objectifFinancement || 0,
     prixUnePart: projet.prixUnePart || 0,
     partsDisponible: projet.partsDisponible || 0,
     roiProjete: projet.roiProjete || 0,
     statutProjet: projet.statutProjet,
     dateDebut: projet.dateDebut || null,
     dateFin: projet.dateFin || null,
   };

   formData.append(
     "projet",
     new Blob([JSON.stringify(updateData)], { type: "application/json" })
   );
   if (posterFile) formData.append("poster", posterFile);

   try {
     const response = await fetch(
       `http://localhost:8080/api/admin/projets/${id}`,
       {
         method: "PUT",
         headers: { Authorization: `Bearer ${token}` },
         credentials: "include",
         body: formData,
       }
     );

     if (!response.ok) throw new Error(await response.text());

     toast.success("Projet mis à jour avec succès !");
     navigate("/admin/projets");
   } catch (err: any) {
     toast.error(err.message || "Échec de la sauvegarde");
   } finally {
     setSaving(false);
   }
 };

  if (loading)
    return <div className={styles.loading}>Chargement du projet...</div>;
  if (!projet) return <div className={styles.error}>Projet non trouvé</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Modifier : {projet.libelle}</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* POSTER — IDENTIQUE AU CREATE */}
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

        {/* TOUS LES CHAMPS MODIFIABLES */}
        <input
          type="text"
          value={projet.libelle || ""}
          onChange={(e) => setProjet({ ...projet, libelle: e.target.value })}
          placeholder="Nom du projet *"
          required
        />

        <textarea
          value={projet.description || ""}
          onChange={(e) =>
            setProjet({ ...projet, description: e.target.value })
          }
          placeholder="Description complète *"
          rows={8}
          required
        />

        <input
          type="text"
          value={projet.secteurNom || ""}
          onChange={(e) => setProjet({ ...projet, secteurNom: e.target.value })}
          placeholder="Secteur d'activité"
        />

        <input
          type="text"
          value={projet.localiteNom || ""}
          onChange={(e) =>
            setProjet({ ...projet, localiteNom: e.target.value })
          }
          placeholder="Localité"
        />

        <input
          type="text"
          value={projet.paysNom || ""}
          onChange={(e) => setProjet({ ...projet, paysNom: e.target.value })}
          placeholder="Pays"
        />

        <input
          type="number"
          step="0.01"
          value={projet.objectifFinancement || ""}
          onChange={(e) =>
            setProjet({
              ...projet,
              objectifFinancement: Number(e.target.value) || 0,
            })
          }
          placeholder="Objectif de financement (€)"
        />

        <input
          type="number"
          step="0.01"
          value={projet.prixUnePart || ""}
          onChange={(e) =>
            setProjet({ ...projet, prixUnePart: Number(e.target.value) || 0 })
          }
          placeholder="Prix d'une part (€)"
        />

        <input
          type="number"
          value={projet.partsDisponible || ""}
          onChange={(e) =>
            setProjet({
              ...projet,
              partsDisponible: Number(e.target.value) || 0,
            })
          }
          placeholder="Parts disponibles"
        />

        <input
          type="number"
          step="0.01"
          value={projet.roiProjete || ""}
          onChange={(e) =>
            setProjet({ ...projet, roiProjete: Number(e.target.value) || 0 })
          }
          placeholder="ROI projeté (%)"
        />

        <select
          value={projet.statutProjet || ""}
          onChange={(e) =>
            setProjet({ ...projet, statutProjet: e.target.value })
          }
        >
          <option value="">Statut</option>
          <option value="SOUMIS">Soumis</option>
          <option value="VALIDE">Validé</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINE">Terminé</option>
          <option value="REJETE">Rejeté</option>
        </select>

        <input
          type="date"
          value={projet.dateDebut?.split("T")[0] || ""}
          onChange={(e) =>
            setProjet({ ...projet, dateDebut: e.target.value || null })
          }
          placeholder="Date de début"
        />

        <input
          type="date"
          value={projet.dateFin?.split("T")[0] || ""}
          onChange={(e) =>
            setProjet({ ...projet, dateFin: e.target.value || null })
          }
          placeholder="Date de fin"
        />

        {/* Ajoute les autres champs que tu veux modifier */}

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            <FiSave style={{ marginRight: 8 }} />
            {saving ? "Sauvegarde..." : "Enregistrer toutes les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
