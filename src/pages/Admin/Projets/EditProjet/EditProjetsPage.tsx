import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiFileText,
  FiSave,
  FiUpload,
  FiX,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiCamera,
  FiInfo,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../../service/Api";
import {
  dataURLtoFile,
  getCroppedImg,
} from "../../../../types/utils/CropImage";
import styles from "./EditProjetsPage.module.css";

export default function EditProjetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projet, setProjet] = useState<any>(null);

  // --- ÉTATS POSTER + CROPPER ---
  const [preview, setPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ÉTATS DOCUMENTS ---
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [docNom, setDocNom] = useState("");
  const docInputRef = useRef<HTMLInputElement>(null);

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const fetchProjet = async () => {
      if (!id) return;
      try {
        const res = await api.get<{ data: any }>(`/api/admin/projets/${id}`);
        const data = res.data;
        setProjet(data);
        setPreview(data.poster || null);
      } catch (err) {
        toast.error("Impossible de charger le projet");
        navigate("/admin/projets");
      } finally {
        setLoading(false);
      }
    };
    fetchProjet();
  }, [id, navigate]);

  // --- LOGIQUE DE CALCUL AUTOMATIQUE ---
  const updateFinances = (field: string, value: number) => {
    let newObjectif = field === "objectif" ? value : projet.objectifFinancement;
    let newPrixPart = field === "prix" ? value : projet.prixUnePart;

    // Calcul automatique des parts (Objectif / Prix)
    let newParts = newPrixPart > 0 ? Math.floor(newObjectif / newPrixPart) : 0;

    setProjet({
      ...projet,
      [field === "objectif" ? "objectifFinancement" : "prixUnePart"]: value,
      partsDisponible: newParts,
    });
  };

  // --- LOGIQUE POSTER ---
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

  const createCroppedImage = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPosterFile(dataURLtoFile(cropped, `update_poster_${id}.jpg`));
      setShowCropper(false);
      toast.success("Nouveau poster prêt !");
    } catch {
      toast.error("Erreur de recadrage");
    }
  };

  // --- LOGIQUE DOCUMENTS ---
  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDoc(file);
      setDocNom(file.name.split(".").slice(0, -1).join("."));
    }
  };

  const uploadDocument = async () => {
    if (!selectedDoc || !docNom.trim()) return toast.error("Nom requis");
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", selectedDoc);
    formData.append("nom", docNom.trim());
    formData.append("type", selectedDoc.type.includes("pdf") ? "PDF" : "IMAGE");

    try {
      await api.post(`/api/documents/projet/${id}`, formData);
      toast.success("Document ajouté !");
      setSelectedDoc(null);
      setDocNom("");
    } catch {
      toast.error("Échec de l'upload");
    } finally {
      setUploadingDoc(false);
    }
  };

  // --- SAUVEGARDE FINALE ---
  // Dans EditProjetsPage.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projet) return;

    setSaving(true);

    try {
      const formData = new FormData();

      const updateData = {
        ...projet,
        // On s'assure que les dates sont bien formatées ou nulles
        dateDebut: projet.dateDebut || null,
        dateFin: projet.dateFin || null,
        dureeMois: projet.dureeMois || 36,
      };

      // --- LA CORRECTION EST ICI ---
      // On emballe le JSON dans un Blob pour forcer le Content-Type de cette PARTIE
      const projetBlob = new Blob([JSON.stringify(updateData)], {
        type: "application/json",
      });

      formData.append("projet", projetBlob);

      if (posterFile) {
        formData.append("poster", posterFile);
      }

      // On utilise ton utilitaire api.put avec le flag isFormData = true
      await api.put(`/api/admin/projets/${id}`, formData, true);

      toast.success("Expertise technique enregistrée !");
      navigate("/admin/projets");
    } catch (err: any) {
      console.error("Erreur lors de la soumission :", err);
      toast.error("Erreur : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className={styles.loader}>Analyse du dossier en cours...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Expertise Technique : <span>{projet.libelle}</span>
        </h1>
        <div className={`${styles.statusBadge} ${styles[projet.statutProjet]}`}>
          {projet.statutProjet}
        </div>
      </header>

      <div className={styles.mainGrid}>
        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h3>
              <FiCamera /> Poster Officiel
            </h3>
            <div
              className={styles.posterBox}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Aperçu" />
              ) : (
                <div className={styles.noImg}>Aucun poster</div>
              )}
              <div className={styles.overlay}>
                <FiUpload /> Modifier
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handlePhotoChange}
            />
            {showCropper && (
              <div className={styles.miniCropper}>
                <Cropper
                  image={preview!}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, p) => setCroppedAreaPixels(p)}
                />
                <button
                  type="button"
                  onClick={createCroppedImage}
                  className={styles.btnApply}
                >
                  Appliquer
                </button>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h3>
              <FiFileText /> Pièces Jointes
            </h3>
            <div className={styles.docUploadZone}>
              <input
                ref={docInputRef}
                type="file"
                hidden
                onChange={handleDocSelect}
              />
              {!selectedDoc ? (
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className={styles.btnAddDoc}
                >
                  <FiUpload /> Choisir un document
                </button>
              ) : (
                <div className={styles.selectedDoc}>
                  <input
                    type="text"
                    value={docNom}
                    onChange={(e) => setDocNom(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={uploadDocument}
                    disabled={uploadingDoc}
                    className={styles.btnConfirmDoc}
                  >
                    {uploadingDoc ? "..." : "OK"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className={styles.btnCancelDoc}
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </div>
          </section>
        </aside>

        <main className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <h4>1. Informations de base</h4>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Libellé</label>
                  <input
                    type="text"
                    value={projet.libelle}
                    onChange={(e) =>
                      setProjet({ ...projet, libelle: e.target.value })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Secteur</label>
                  <input
                    type="text"
                    value={projet.secteurNom}
                    onChange={(e) =>
                      setProjet({ ...projet, secteurNom: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <h4>2. Analyse Financière</h4>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Objectif Financement (CFA)</label>
                  <input
                    type="number"
                    value={projet.objectifFinancement}
                    onChange={(e) =>
                      updateFinances("objectif", Number(e.target.value))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Prix de la Part (CFA)</label>
                  <input
                    type="number"
                    value={projet.prixUnePart}
                    onChange={(e) =>
                      updateFinances("prix", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Parts totales (Calculé automatiquement)</label>
                  <div className={styles.autoCalculatedField}>
                    <FiInfo /> {projet.partsDisponible} parts de{" "}
                    {projet.prixUnePart} FCFA
                  </div>
                </div>
                <div className={styles.field}>
                  <label>ROI (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={projet.roiProjete}
                    onChange={(e) =>
                      setProjet({
                        ...projet,
                        roiProjete: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Parts à lever (%)</label>
                  <input
                    type="number"
                    value={projet.valeurTotalePartsEnPourcent}
                    onChange={(e) =>
                      setProjet({
                        ...projet,
                        valeurTotalePartsEnPourcent: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Valorisation Totale (CFA)</label>
                  <input
                    type="number"
                    value={projet.valuation}
                    onChange={(e) =>
                      setProjet({
                        ...projet,
                        valuation: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <h4>3. Publication</h4>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Date Début</label>
                  <input
                    type="date"
                    value={projet.dateDebut?.split("T")[0] || ""}
                    onChange={(e) =>
                      setProjet({ ...projet, dateDebut: e.target.value })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Date Fin</label>
                  <input
                    type="date"
                    value={projet.dateFin?.split("T")[0] || ""}
                    onChange={(e) =>
                      setProjet({ ...projet, dateFin: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Statut</label>
                <select
                  value={projet.statutProjet}
                  onChange={(e) =>
                    setProjet({ ...projet, statutProjet: e.target.value })
                  }
                >
                  <option value="SOUMIS">🟠 Soumis</option>
                  <option value="VALIDE">🟢 Validé</option>
                  <option value="EN_COURS">🔵 En cours</option>
                  <option value="TERMINE">🏁 Terminé</option>
                  <option value="REJETE">🔴 Rejeté</option>
                </select>
              </div>
            </div>

            <button type="submit" className={styles.btnSave} disabled={saving}>
              <FiSave /> {saving ? "Sauvegarde..." : "Enregistrer l'expertise"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
