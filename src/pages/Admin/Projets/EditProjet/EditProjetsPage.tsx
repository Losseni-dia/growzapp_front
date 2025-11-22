// src/pages/Admin/Projets/EditProjetPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../../service/api";
import toast from "react-hot-toast";
import { FiCamera, FiSave } from "react-icons/fi";
import styles from "./EditProjetsPage.module.css";

import { ProjetDTO } from "../../../../types/projet";
import { ApiResponse } from "../../../../types/common";
import { SecteurDTO } from "../../../../types/secteur";

// DTO simple pour les sites (id + nom)
type SiteDTO = {
  id: number;
  nom: string;
};

export default function EditProjetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<ProjetDTO>>({
    id: Number(id),
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("/placeholder.jpg");

  const [secteurs, setSecteurs] = useState<SecteurDTO[]>([]);
  const [sites, setSites] = useState<SiteDTO[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [projetRes, secteursRes, sitesRes] = await Promise.all([
          api.get<ApiResponse<ProjetDTO>>(`/admin/projets/${id}`),
          api.get<ApiResponse<SecteurDTO[]>>("/api/secteurs"),
          api.get<ApiResponse<SiteDTO[]>>("/api/localisations"), // endpoint qui liste les sites
        ]);

        const projet = projetRes.data;

        setFormData({
          id: projet.id,
          libelle: projet.libelle || "",
          description: projet.description || "",
          reference: projet.reference || undefined,
          roiProjete: projet.roiProjete || 0,
          partsDisponible: projet.partsDisponible || 0,
          partsPrises: projet.partsPrises || 0,
          prixUnePart: projet.prixUnePart || 0,
          objectifFinancement: projet.objectifFinancement || 0,
          montantCollecte: projet.montantCollecte || 0,
          dateDebut: projet.dateDebut || "",
          dateFin: projet.dateFin || "",
          statutProjet: projet.statutProjet || "SOUMIS",
          secteurId: projet.secteurId || undefined,
          siteId: projet.siteId || undefined, // on garde l'ID du site actuel
          porteurId: projet.porteurId,
        });

        setPreview(projet.poster || "/placeholder.jpg");
        setSecteurs(secteursRes.data || []);
        setSites(sitesRes.data || []);
      } catch (err) {
        toast.error("Impossible de charger le projet");
        navigate("/admin/projets");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setSaving(true);

   const payload = new FormData();
   payload.append(
     "projet",
     new Blob([JSON.stringify(formData)], { type: "application/json" })
   );
   if (posterFile) payload.append("poster", posterFile);

   try {
     const token = getFreshToken();
     const response = await fetch(
       `http://localhost:8080/api/admin/projets/${id}`,
       {
         method: "PUT",
         headers: {
           Authorization: `Bearer ${token}`,
         },
         credentials: "include",
         body: payload,
       }
     );

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(errorText || "Erreur serveur");
     }

     toast.success("Projet mis à jour avec succès !");

     // RECHARGE LE PROJET FRAIS DEPUIS LE BACKEND
     const updated = await api.get<ApiResponse<ProjetDTO>>(
       `/admin/projets/${id}`
     );
     const newPoster = updated.data.poster || "/placeholder.jpg";

     setPreview(newPoster);
     toast.success("Image mise à jour !");

     // TU RESTES SUR LA PAGE → l'image s'affiche direct

     // Option 1 : reste sur la page avec le nouveau poster
     toast.success("Image mise à jour !");

     // Option 2 : ou va à la liste (décommente si tu préfères)
     // navigate("/admin/projets");
   } catch (err: any) {
     console.error("Erreur:", err);
     toast.error(err.message || "Échec de la sauvegarde");
   } finally {
     setSaving(false);
   }
 };

  const getFreshToken = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed?.token || "";
      } catch {}
    }
    return "";
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "5rem", fontSize: "1.8rem" }}>
        Chargement...
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Modifier le projet</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Poster */}
        <div className={styles.imageSection}>
          <img src={preview} alt="Poster" className={styles.poster} />
          <button
            type="button"
            onClick={() => document.getElementById("posterInput")?.click()}
            className={styles.cameraBtn}
          >
            <FiCamera size={28} />
          </button>
          <input
            id="posterInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
          <small>Changer le poster</small>
        </div>

        <input
          type="number"
          placeholder="Référence"
          value={formData.reference ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              reference: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />

        <input
          type="text"
          placeholder="Nom du projet *"
          value={formData.libelle || ""}
          onChange={(e) =>
            setFormData({ ...formData, libelle: e.target.value })
          }
          required
        />

        <textarea
          placeholder="Description *"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={8}
          required
        />

        <div className={styles.grid}>
          <input
            type="number"
            placeholder="ROI projeté (%)"
            value={formData.roiProjete || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                roiProjete: Number(e.target.value) || 0,
              })
            }
          />
          <input
            type="number"
            placeholder="Prix d'une part"
            value={formData.prixUnePart || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                prixUnePart: Number(e.target.value) || 0,
              })
            }
          />
          <input
            type="number"
            placeholder="Parts disponibles"
            value={formData.partsDisponible || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                partsDisponible: Number(e.target.value) || 0,
              })
            }
          />
          <input
            type="number"
            placeholder="Objectif financement"
            value={formData.objectifFinancement || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                objectifFinancement: Number(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className={styles.grid}>
          <input
            type="date"
            value={formData.dateDebut?.split("T")[0] || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dateDebut: e.target.value ? e.target.value + "T00:00:00" : "",
              })
            }
          />
          <input
            type="date"
            value={formData.dateFin?.split("T")[0] || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dateFin: e.target.value ? e.target.value + "T00:00:00" : "",
              })
            }
          />
        </div>

        {/* SECTEUR */}
        <select
          value={formData.secteurId || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              secteurId: Number(e.target.value) || undefined,
            })
          }
        >
          <option value="">Choisir un secteur</option>
          {secteurs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>

        {/* SITE (remplace Pays + Localité) */}
        <select
          value={formData.siteId || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              siteId: Number(e.target.value) || undefined,
            })
          }
        >
          <option value="">Choisir un site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.nom}
            </option>
          ))}
        </select>

        {/* STATUT */}
        <select
          value={formData.statutProjet || "SOUMIS"}
          onChange={(e) =>
            setFormData({ ...formData, statutProjet: e.target.value as any })
          }
        >
          <option value="SOUMIS">Soumis</option>
          <option value="VALIDE">Validé</option>
          <option value="REJETE">Rejeté</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINE">Terminé</option>
        </select>

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            <FiSave /> {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
}