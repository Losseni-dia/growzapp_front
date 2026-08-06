import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import {
  FiCamera,
  FiInfo,
  FiSave,
  FiTag,
  FiUpload
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import ComboBox from "../../../../components/ui/ComboBox/ComboBox";
import { api } from "../../../../service/Api";
import type { SecteurDTO } from "../../../../types/secteur";
import {
  dataURLtoFile,
  getCroppedImg,
} from "../../../../types/utils/CropImage";
import styles from "./EditProjetsPage.module.css";

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

function toDisplay(val: number | null | undefined): string {
  if (val === null || val === undefined || val === 0) return "";
  return String(val);
}
function parseNum(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
function parseInt_(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, "");
  return cleaned === "" ? 0 : parseInt(cleaned, 10);
}

export default function EditProjetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projet, setProjet] = useState<any>(null);

  // ── SECTEURS (liste + création à la volée, même pattern que ProjetForm) ────
  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [loadingSecteurs, setLoadingSecteurs] = useState(false);

  useEffect(() => {
    setLoadingSecteurs(true);
    api
      .get<ApiWrapper<SecteurDTO[]>>("/api/secteurs")
      .then((res) => setSecteurs((res.data ?? []).map((s) => s.nom)))
      .catch(() => setSecteurs([]))
      .finally(() => setLoadingSecteurs(false));
  }, []);

  // ── IMAGE ─────────────────────────────────────────────────────────────────
  const [preview, setPreview] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // ── DISPLAYS NUMÉRIQUES ───────────────────────────────────────────────────
  const [objectifDisplay, setObjectifDisplay] = useState("");
  const [prixPartDisplay, setPrixPartDisplay] = useState("");
  const [roiDisplay, setRoiDisplay] = useState("");
  const [partsDisponibleDisplay, setPartsDisponibleDisplay] = useState("");
  const [partsALeverDisplay, setPartsALeverDisplay] = useState("");
  const [valuationDisplay, setValuationDisplay] = useState("");

  // ── CHARGEMENT ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: any }>(`/api/projets/slug/${id}`)
      .then((res) => {
        const data = res.data;

        // Recalcul au chargement — on ne fait pas confiance aux valeurs stockées
        const objectif = Number(data.objectifFinancement || 0);
        const prixPart = Number(data.prixUnePart || 0);
        const valuation = Number(data.valuation || 0);
        const parts = prixPart > 0 ? Math.floor(objectif / prixPart) : 0;
        const pct =
          valuation > 0 ? Math.round((objectif / valuation) * 100) : 0;

        const dataCalc = {
          ...data,
          partsDisponible: parts,
          valeurTotalePartsEnPourcent: pct,
        };
        setProjet(dataCalc);
        setPreview(data.poster || null);
        setObjectifDisplay(toDisplay(objectif));
        setPrixPartDisplay(toDisplay(prixPart));
        setRoiDisplay(toDisplay(data.roiProjete));
        setPartsDisponibleDisplay(toDisplay(parts));
        setPartsALeverDisplay(toDisplay(pct));
        setValuationDisplay(toDisplay(valuation));
      })
      .catch(() => {
        toast.error("Impossible de charger le projet");
        navigate("/admin/projets");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // ── CALCUL AUTO ───────────────────────────────────────────────────────────
  const updateFinances = (field: "objectif" | "prix", raw: string) => {
    const value = parseInt_(raw);
    const newObjectif =
      field === "objectif" ? value : projet.objectifFinancement;
    const newPrix = field === "prix" ? value : projet.prixUnePart;
    const newParts = newPrix > 0 ? Math.floor(newObjectif / newPrix) : 0;
    const newPct =
      (projet.valuation || 0) > 0
        ? Math.round((newObjectif / projet.valuation) * 100)
        : 0;

    if (field === "objectif") setObjectifDisplay(raw.replace(/[^0-9]/g, ""));
    else setPrixPartDisplay(raw.replace(/[^0-9]/g, ""));

    setPartsDisponibleDisplay(toDisplay(newParts));
    setPartsALeverDisplay(toDisplay(newPct));
    setProjet({
      ...projet,
      objectifFinancement:
        field === "objectif" ? value : projet.objectifFinancement,
      prixUnePart: field === "prix" ? value : projet.prixUnePart,
      partsDisponible: newParts,
      valeurTotalePartsEnPourcent: newPct,
    });
  };

  const updateValuation = (raw: string) => {
    const value = parseInt_(raw);
    const objectif = projet.objectifFinancement || 0;
    const newPct = value > 0 ? Math.round((objectif / value) * 100) : 0;
    setValuationDisplay(raw.replace(/[^0-9]/g, ""));
    setPartsALeverDisplay(toDisplay(newPct));
    setProjet({
      ...projet,
      valuation: value,
      valeurTotalePartsEnPourcent: newPct,
    });
  };

  // ── IMAGE ─────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      setRawPreview(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback(
    (_: any, p: any) => setCroppedAreaPixels(p),
    [],
  );

  const confirmCrop = async () => {
    if (!rawPreview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(rawPreview, croppedAreaPixels);
      setPreview(cropped);
      setRawPreview(null);
      setPosterFile(dataURLtoFile(cropped, `update_poster_${id}.jpg`));
      setShowCropper(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      toast.success("Poster mis à jour !");
    } catch {
      toast.error("Erreur de recadrage");
    }
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setRawPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // ── CHANGEMENT DE STATUT (action séparée, déclenche les notifications) ─────
  const [changingStatut, setChangingStatut] = useState(false);
  const handleChangerStatut = async (nouveauStatut: string) => {
    if (!projet || nouveauStatut === projet.statutProjet) return;

    const estValidation = nouveauStatut === "VALIDE";
    const confirmMessage = estValidation
      ? "Valider ce projet ? Tous les utilisateurs de la plateforme seront notifiés qu'un nouveau projet est disponible."
      : `Changer le statut du projet en "${nouveauStatut}" ?`;
    if (!window.confirm(confirmMessage)) return;

    const ancienStatut = projet.statutProjet;
    try {
      setChangingStatut(true);
      await api.patch(
        `/api/admin/projets/${projet.id}/statut`,
        nouveauStatut,
      );
      setProjet({ ...projet, statutProjet: nouveauStatut });
      toast.success("Statut mis à jour");
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
      setProjet({ ...projet, statutProjet: ancienStatut });
    } finally {
      setChangingStatut(false);
    }
  };

  // ── SAUVEGARDE ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projet) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append(
        "projet",
        new Blob(
          [
            JSON.stringify({
              ...projet,
              dateDebut: projet.dateDebut || null,
              dateFin: projet.dateFin || null,
              dureeMois: projet.dureeMois || 36,
            }),
          ],
          { type: "application/json" },
        ),
      );
      if (posterFile) formData.append("poster", posterFile);
      await api.put(`/api/admin/projets/${projet.id}`, formData, true);
      toast.success("Projet enregistré !");
      navigate("/admin/projets");
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loader}>Chargement...</div>;

  return (
    <div className={styles.container}>
      {/* ── MODAL CROPPER PLEIN ÉCRAN ────────────────────────────────────── */}
      {showCropper && rawPreview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#000",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Zone crop — hauteur calculée = 100vh - hauteur barre boutons (80px) */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "calc(100vh - 80px)",
            }}
          >
            <Cropper
              image={rawPreview}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              minZoom={0.1}
              objectFit="horizontal-cover"
              style={{
                containerStyle: {
                  width: "100%",
                  height: "100%",
                  background: "#000",
                },
                cropAreaStyle: {
                  border: "3px solid #4CAF76",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                },
                mediaStyle: {
                  maxHeight: "none",
                },
              }}
            />
          </div>
          {/* Barre boutons — hauteur fixe 80px */}
          <div
            style={{
              height: 80,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              flexShrink: 0,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={cancelCrop}
              style={{
                padding: "10px 28px",
                borderRadius: 50,
                border: "2px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              style={{
                padding: "10px 32px",
                borderRadius: 50,
                border: "none",
                background: "#1A6B3C",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              ✓ Valider l'image
            </button>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>
          Expertise Technique : <span>{projet.libelle}</span>
        </h1>
        <div className={`${styles.statusBadge} ${styles[projet.statutProjet]}`}>
          {projet.statutProjet}
        </div>
      </header>

      <div className={styles.mainGrid}>
        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <aside className={styles.sidebar}>
          {/* POSTER */}
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
            {posterFile && (
              <p className={styles.posterReady}>✓ Nouveau poster prêt</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </section>
        </aside>

        {/* ── FORMULAIRE ─────────────────────────────────────────────────── */}
        <main className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* 1. Infos de base */}
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
                  <ComboBox
                    label="Secteur"
                    icon={<FiTag />}
                    placeholder="Secteur d'activité"
                    value={projet.secteurNom || ""}
                    onChange={(v) =>
                      setProjet({ ...projet, secteurNom: v })
                    }
                    options={secteurs}
                    loading={loadingSecteurs}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Analyse financière */}
            <div className={styles.fieldGroup}>
              <h4>2. Analyse Financière</h4>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Objectif Financement (FCFA)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex : 5000000"
                    value={objectifDisplay}
                    onChange={(e) => updateFinances("objectif", e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>Prix de la Part (FCFA)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex : 10000"
                    value={prixPartDisplay}
                    onChange={(e) => updateFinances("prix", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Valorisation Totale (FCFA)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex : 25000000"
                    value={valuationDisplay}
                    onChange={(e) => updateValuation(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>ROI (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex : 15"
                    value={roiDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, "");
                      setRoiDisplay(raw);
                      setProjet({ ...projet, roiProjete: parseNum(raw) });
                    }}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Parts totales (auto)</label>
                  <div className={styles.autoCalculatedField}>
                    <FiInfo />
                    {partsDisponibleDisplay
                      ? Number(partsDisponibleDisplay).toLocaleString("fr-FR")
                      : "0"}{" "}
                    parts de {projet.prixUnePart?.toLocaleString("fr-FR") ?? 0}{" "}
                    FCFA
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Parts à lever (%) — auto</label>
                  <div className={styles.autoCalculatedField}>
                    <FiInfo />
                    {partsALeverDisplay
                      ? `${partsALeverDisplay}%`
                      : "Saisir objectif et valorisation"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Publication */}
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
                    min={projet.dateDebut?.split("T")[0] || undefined}
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
                  disabled={changingStatut}
                  onChange={(e) => handleChangerStatut(e.target.value)}
                >
                  <option value="SOUMIS">🟠 Soumis</option>
                  <option value="VALIDE">🟢 Validé</option>
                  <option value="EN_COURS">🔵 En cours</option>
                  <option value="TERMINE">🏁 Terminé</option>
                  <option value="REJETE">🔴 Rejeté</option>
                </select>
                <p className={styles.statutHint}>
                  Le changement de statut est appliqué immédiatement et
                  séparément du bouton "Enregistrer".
                </p>
              </div>
            </div>

            <button type="submit" className={styles.btnSave} disabled={saving}>
              <FiSave /> {saving ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
