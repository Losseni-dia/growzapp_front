import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiCamera, FiDollarSign, FiPieChart, FiSend,
  FiShield, FiAlertTriangle, FiCheck, FiMapPin, FiTag, FiClock,
} from "react-icons/fi";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { dataURLtoFile, getCroppedImg } from "../../../types/utils/CropImage";
import { api } from "../../../service/Api";
import { useAuth } from "../../Context/AuthContext";
import { KycStatus, StatutFichePorteur } from "../../../types/enum";
import type { SecteurDTO } from "../../../types/secteur";
import type { PaysDTO } from "../../../types/pays";
import type { LocaliteDTO } from "../../../types/localite";
import ComboBox from "../../ui/ComboBox/ComboBox";
import styles from "./ProjetForm.module.css";

interface ApiWrapper<T> { success: boolean; message: string; data: T; }

type FormErrors = Partial<Record<
  | "libelle" | "description" | "secteurNom" | "localiteNom" | "paysNom"
  | "objectif" | "prixPart" | "valuation" | "roi" | "dureeMois"
  | "dateDebut" | "dateFin" | "coherence" | "global",
  string
>>;

export default function ProjectForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const [draftId, setDraftId] = useState<number | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);

  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [localiteNom, setLocaliteNom] = useState("");
  const [paysNom, setPaysNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];

  const [valuation, setValuation] = useState<number>(0);
  const [valuationDisplay, setValuationDisplay] = useState("");
  const [objectif, setObjectif] = useState<number>(0);
  const [objectifDisplay, setObjectifDisplay] = useState("");
  const [prixPart, setPrixPart] = useState<number>(0);
  const [prixPartDisplay, setPrixPartDisplay] = useState("");
  const [roi, setRoi] = useState<number>(0);
  const [roiDisplay, setRoiDisplay] = useState("");
  const [dureeMois, setDureeMois] = useState<number | null>(null);

  const totalParts = prixPart > 0 ? Math.floor(objectif / prixPart) : 0;
  const partsEnPourcent = valuation > 0 ? Math.round((objectif / valuation) * 100) : 0;

  const [secteurs, setSecteurs] = useState<string[]>([]);
  const [pays, setPays] = useState<string[]>([]);
  const [localites, setLocalites] = useState<string[]>([]);
  const [loadingSecteurs, setLoadingSecteurs] = useState(false);
  const [loadingPays, setLoadingPays] = useState(false);
  const [loadingLocalites, setLoadingLocalites] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [agreedToMonitoring, setAgreedToMonitoring] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [preview, setPreview] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Galerie de photos additionnelles — distinctes du poster (épinglé,
  // affiché en vignette catalogue), simplement consultables sur la page
  // détail. Pas de recadrage ici, contrairement au poster.
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{ id: number; url: string }[]>([]);

  useEffect(() => {
    setLoadingSecteurs(true);
    api.get<ApiWrapper<SecteurDTO[]>>("/api/secteurs")
      .then((res) => setSecteurs((res.data ?? []).map((s) => s.nom)))
      .catch(() => setSecteurs([]))
      .finally(() => setLoadingSecteurs(false));

    setLoadingPays(true);
    api.get<ApiWrapper<PaysDTO[]>>("/api/pays")
      .then((res) => setPays((res.data ?? []).map((p) => p.nom)))
      .catch(() => setPays([]))
      .finally(() => setLoadingPays(false));

    setLoadingLocalites(true);
    api.get<ApiWrapper<LocaliteDTO[]>>("/api/localites")
      .then((res) => setLocalites((res.data ?? []).map((l) => l.nom)))
      .catch(() => setLocalites([]))
      .finally(() => setLoadingLocalites(false));
  }, []);

  // Reprise d'un brouillon existant (lien "Continuer" depuis "Mes projets")
  // — on passe par mes-projets (scopé au porteur connecté côté backend) plutôt
  // que par GET /api/projets/{id} qui est public et ne devrait jamais exposer
  // un brouillon à quelqu'un d'autre que son propriétaire.
  useEffect(() => {
    const brouillonId = searchParams.get("brouillonId");
    if (!brouillonId) return;

    setLoadingDraft(true);
    api.get<ApiWrapper<any[]>>("/api/projets/mes-projets")
      .then((res) => {
        const projets = res.data ?? [];
        const draft = projets.find((p) => String(p.id) === brouillonId);
        if (!draft) {
          toast.error(t("project_form.draft.not_found", "Brouillon introuvable"));
          return;
        }
        setDraftId(draft.id);
        setLibelle(draft.libelle ?? "");
        setDescription(draft.description ?? "");
        setSecteurNom(draft.secteurNom ?? "");
        setLocaliteNom(draft.localiteNom ?? "");
        setPaysNom(draft.paysNom ?? "");
        setDateDebut(draft.dateDebut ?? "");
        setDateFin(draft.dateFin ?? "");
        setDureeMois(draft.dureeMois ?? null);
        if (draft.objectifFinancement) { setObjectif(draft.objectifFinancement); setObjectifDisplay(String(draft.objectifFinancement)); }
        if (draft.prixUnePart) { setPrixPart(draft.prixUnePart); setPrixPartDisplay(String(draft.prixUnePart)); }
        if (draft.valuation) { setValuation(draft.valuation); setValuationDisplay(String(draft.valuation)); }
        if (draft.roiProjete) { setRoi(draft.roiProjete); setRoiDisplay(String(draft.roiProjete)); }
        if (draft.poster) setPreview(draft.poster);

        api
          .get<ApiWrapper<{ id: number; url: string }[]>>(`/api/projets/${draft.id}/photos`)
          .then((r) => setExistingPhotos(r.data ?? []))
          .catch(() => setExistingPhotos([]));
      })
      .catch(() => toast.error(t("project_form.draft.not_found", "Brouillon introuvable")))
      .finally(() => setLoadingDraft(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev: FormErrors) => ({ ...prev, [field]: undefined }));
  };

  const handleNumeric = (
    raw: string,
    setDisplay: (v: string) => void,
    setValue: (v: number) => void,
    field: keyof FormErrors
  ) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setDisplay(digits);
    setValue(digits === "" ? 0 : parseInt(digits, 10));
    clearError(field);
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};

    if (!libelle.trim()) errs.libelle = "project_form.errors.required_name";
    else if (libelle.trim().length < 3) errs.libelle = "project_form.errors.required_name_min";

    if (!description.trim()) errs.description = "project_form.errors.required_desc";
    else if (description.trim().length < 20) errs.description = "project_form.errors.required_desc_min";

    if (!secteurNom.trim()) errs.secteurNom = "project_form.errors.required_sector";
    if (!localiteNom.trim()) errs.localiteNom = "project_form.errors.required_city";

    if (!objectif || objectif < 100000) errs.objectif = "project_form.errors.required_objectif";
    if (!prixPart || prixPart < 1000) errs.prixPart = "project_form.errors.required_prix_part";
    if (!valuation || valuation < 100000) errs.valuation = "project_form.errors.required_valuation";
    if (!roi || roi <= 0) errs.roi = "project_form.errors.required_roi";
    else if (roi > 100) errs.roi = "project_form.errors.required_roi_max";

    if (!dateDebut) errs.dateDebut = "project_form.errors.required_date_debut";
    else if (dateDebut < todayStr)
      errs.dateDebut = "project_form.errors.date_debut_past";
    if (!dateFin) errs.dateFin = "project_form.errors.required_date_fin";
    else if (dateDebut && dateFin && dateFin < dateDebut)
      errs.dateFin = "project_form.errors.date_fin_before_debut";

    if (objectif > 0 && prixPart > 0 && valuation > 0) {
      const total = prixPart * totalParts;
      if (Math.abs(total - objectif) > prixPart)
        errs.coherence = "project_form.errors.coherence";
    }

    return errs;
  };

  const onCropComplete = useCallback((_: any, p: any) => setCroppedAreaPixels(p), []);

  const createCroppedImage = async () => {
    if (!rawPreview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(rawPreview, croppedAreaPixels);
      setPreview(cropped);
      setRawPreview(null);
      setPosterFile(dataURLtoFile(cropped, `pitch_${Date.now()}.jpg`));
      setShowCropper(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      toast.success(t("project_form.photo.cropped"));
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

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = async (photoId: number, projetId: number) => {
    try {
      await api.delete(`/api/projets/${projetId}/photos/${photoId}`);
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      toast.error(err.message || t("project_form.errors.server"));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setShowLegalModal(true);
  };

  // Payload permissif utilisé pour l'enregistrement d'un brouillon — les
  // champs pas encore remplis sont envoyés à null plutôt que 0/"" pour ne
  // déclencher aucune validation côté backend (ProjetBrouillonDTO).
  const buildBrouillonPayload = () => ({
    libelle: libelle.trim() || null,
    description: description.trim() || null,
    secteurNom: secteurNom.trim() || null,
    localiteNom: localiteNom.trim() || null,
    paysNom: paysNom.trim() || null,
    objectifFinancement: objectif > 0 ? objectif : null,
    prixUnePart: prixPart > 0 ? prixPart : null,
    partsDisponible: totalParts > 0 ? totalParts : null,
    roiProjete: roi > 0 ? roi : null,
    valuation: valuation > 0 ? valuation : null,
    dureeMois: dureeMois ?? null,
    currencyCode: "XOF",
    dateDebut: dateDebut || null,
    dateFin: dateFin || null,
  });

  // Enregistre l'état courant du formulaire comme brouillon (crée le
  // brouillon au premier appel, le met à jour ensuite) — aucune validation
  // requise, utilisable à n'importe quelle étape de saisie.
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const formData = new FormData();
      formData.append("projet", new Blob([JSON.stringify(buildBrouillonPayload())], { type: "application/json" }));
      if (posterFile) formData.append("poster", posterFile);
      galleryFiles.forEach((f) => formData.append("photos", f));

      const res: any = draftId
        ? await api.put(`/api/projets/brouillon/${draftId}`, formData, true)
        : await api.post("/api/projets/brouillon", formData, true);

      if (res?.data?.id) setDraftId(res.data.id);
      // Les fichiers en attente viennent d'être envoyés et persistés côté
      // serveur — on vide la file locale pour ne pas les renvoyer en
      // double au prochain enregistrement.
      setGalleryFiles([]);
      setGalleryPreviews([]);
      if (res?.data?.id) {
        api
          .get<ApiWrapper<{ id: number; url: string }[]>>(`/api/projets/${res.data.id}/photos`)
          .then((r) => setExistingPhotos(r.data ?? []))
          .catch(() => {});
      }
      toast.success(t("project_form.draft.saved", "Brouillon enregistré"));
    } catch (err: any) {
      toast.error(err.message || t("project_form.errors.server"));
    } finally {
      setSavingDraft(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!isCertified || !agreedToMonitoring) return;
    setLoading(true);

    try {
      // 1. On (re)synchronise systématiquement le brouillon avec l'état
      // actuel du formulaire avant de soumettre — garantit que la
      // soumission porte exactement sur ce qui est affiché à l'écran,
      // que l'utilisateur ait cliqué "Enregistrer brouillon" avant ou non.
      const formData = new FormData();
      formData.append("projet", new Blob([JSON.stringify(buildBrouillonPayload())], { type: "application/json" }));
      if (posterFile) formData.append("poster", posterFile);
      galleryFiles.forEach((f) => formData.append("photos", f));

      const draftRes: any = draftId
        ? await api.put(`/api/projets/brouillon/${draftId}`, formData, true)
        : await api.post("/api/projets/brouillon", formData, true);

      const id = draftRes?.data?.id ?? draftId;
      if (!id) throw new Error(t("project_form.errors.server"));
      setDraftId(id);

      // 2. Validation complète + transition BROUILLON → SOUMIS côté backend.
      await api.post(`/api/projets/brouillon/${id}/soumettre`);

      toast.success(t("project_form.success"));
      navigate("/mon-dashboard-porteur");
    } catch (err: any) {
      const msg = err.message || t("project_form.errors.server");
      setErrors({ global: msg });
      toast.error(msg);
      setShowLegalModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.kycGate}>
          <p>{t("project_form.draft.loading", "Chargement du brouillon…")}</p>
        </div>
      </div>
    );
  }

  // Seul un KYC VALIDÉ par l'admin permet de soumettre un projet — un
  // dossier simplement soumis (EN_ATTENTE) ne suffit pas, même règle que
  // pour investir (cf InvestissementService.investir côté backend).
  if (user && user.kycStatus !== KycStatus.VALIDE) {
    const isEnAttente = user.kycStatus === KycStatus.EN_ATTENTE;
    const isRejete = user.kycStatus === KycStatus.REJETE;

    return (
      <div className={styles.pageWrapper}>
        <div className={styles.kycGate}>
          <h2>🛡 {t("project_form.kyc_gate.title", "Vérification d'identité requise")}</h2>
          <p>
            {isEnAttente
              ? t(
                  "project_form.kyc_gate.message_pending",
                  "Votre dossier KYC a bien été soumis et est en cours d'examen par notre équipe. Vous pourrez soumettre un projet dès qu'il sera validé."
                )
              : isRejete
              ? t(
                  "project_form.kyc_gate.message_rejected",
                  "Votre dossier KYC a été rejeté. Merci de le resoumettre avec les documents corrigés avant de pouvoir soumettre un projet."
                )
              : t(
                  "project_form.kyc_gate.message",
                  "Avant de pouvoir soumettre un projet, vous devez d'abord soumettre votre dossier KYC (vérification d'identité). Cela nous permet de garantir la fiabilité des porteurs de projet auprès des investisseurs."
                )}
          </p>
          {!isEnAttente && (
            <Link to="/profile/kyc" className={styles.kycGateBtn}>
              {t("project_form.kyc_gate.cta", "Soumettre mon KYC")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Deuxième garde-fou : la fiche de présentation professionnelle du
  // porteur doit elle aussi être validée par un admin (distincte du KYC,
  // qui ne couvre que l'identité civile) — même règle appliquée strictement
  // côté backend (ProjetService.requireFichePorteurValidee).
  if (user && user.ficheStatut !== StatutFichePorteur.VALIDEE) {
    const isRejetee = user.ficheStatut === StatutFichePorteur.REJETEE;

    return (
      <div className={styles.pageWrapper}>
        <div className={styles.kycGate}>
          <h2>📋 {t("project_form.fiche_gate.title", "Fiche de présentation requise")}</h2>
          <p>
            {isRejetee
              ? t(
                  "project_form.fiche_gate.message_rejected",
                  "Votre fiche de présentation a été marquée non conforme par notre équipe. Contactez GrowzApp pour la faire corriger avant de pouvoir soumettre un projet."
                )
              : t(
                  "project_form.fiche_gate.message",
                  "Avant de pouvoir soumettre un projet, votre profil doit être vérifié par notre équipe (fiche de présentation professionnelle). Contactez GrowzApp pour engager cette vérification — elle rassure les investisseurs sur le sérieux des porteurs de projet."
                )}
          </p>
          <Link to="/profile/fiche-porteur" className={styles.kycGateBtn}>
            {t("project_form.fiche_gate.cta", "Voir l'état de ma fiche")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        <div className={styles.formHeader}>
          <h1 className={styles.title}> {t("project_form.title")}</h1>
          <p className={styles.subtitle}>{t("project_form.subtitle")}</p>
        </div>

        <form onSubmit={handleFormSubmit} className={styles.form} noValidate>

          {/* ── PHOTO ── */}
          <div className={styles.sectionLabel}>📸 {t("project_form.sections.photo")}</div>
          <div className={styles.photoSection}>
            {!showCropper ? (
              <div className={styles.photoUpload} onClick={() => fileInputRef.current?.click()}>
                {preview ? (
                  <img src={preview} className={styles.preview} alt="Aperçu" />
                ) : (
                  <div className={styles.placeholder}>
                    <FiCamera size={40} />
                    <p>{t("project_form.photo.click_to_add")}</p>
                    <span>{t("project_form.photo.format_hint")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.cropWrapper}>
                <div className={styles.cropContainer} ref={cropContainerRef}>
                  <Cropper
                    image={rawPreview!} crop={crop} zoom={zoom} aspect={16 / 9}
                    onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}
                    style={{
                      containerStyle: { background: "#1a1a1a" },
                      cropAreaStyle: { border: "3px solid #1B5E20", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" },
                    }}
                    minZoom={0.4}
                    initialCroppedAreaPercentages={{ x: 0, y: 0, width: 100, height: 100 }}
                  />
                </div>
                <div className={styles.cropControls}>
                  <button type="button" onClick={cancelCrop} className={styles.cancelBtn}>
                    {t("project_form.photo.cancel")}
                  </button>
                  <button type="button" onClick={createCroppedImage} className={styles.cropBtn}>
                    ✓ {t("project_form.photo.validate")}
                  </button>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" style={{ display: "none" }} accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                const reader = new FileReader();
                reader.onload = () => { setRawPreview(reader.result as string); setShowCropper(true); };
                reader.readAsDataURL(file);
              }} />
          </div>

          {/* ── GALERIE DE PHOTOS ADDITIONNELLES ── */}
          <div className={styles.sectionLabel}>
            🖼️ {t("project_form.sections.gallery", "Photos supplémentaires (facultatif)")}
          </div>
          <div className={styles.photoSection} style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.6rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>
              {t(
                "project_form.gallery.hint",
                "Le poster ci-dessus reste l'image mise en avant. Ajoutez ici d'autres photos consultables dans le détail du projet (chantier, produits, équipe...).",
              )}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {existingPhotos.map((p) => (
                <div key={p.id} style={{ position: "relative", width: 90, height: 90 }}>
                  <img
                    src={p.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                  />
                  <button
                    type="button"
                    onClick={() => draftId && removeExistingPhoto(p.id, draftId)}
                    style={{
                      position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%",
                      background: "#c62828", color: "white", border: "none", cursor: "pointer", fontSize: "0.75rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {galleryPreviews.map((src, i) => (
                <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removeGalleryFile(i)}
                    style={{
                      position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%",
                      background: "#c62828", color: "white", border: "none", cursor: "pointer", fontSize: "0.75rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label
                style={{
                  width: 90, height: 90, borderRadius: 8, border: "2px dashed #ccc",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#888", fontSize: "1.6rem",
                }}
              >
                +
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleGalleryChange} />
              </label>
            </div>
          </div>

          {/* ── PRÉSENTATION ── */}
          <div className={styles.sectionLabel}>📋 {t("project_form.sections.presentation")}</div>

          <div className={styles.fieldGroup}>
            <label><FiTag /> {t("project_form.fields.title")}</label>
            <input
              type="text"
              placeholder={t("project_form.fields.title_placeholder")}
              value={libelle}
              onChange={(e) => { setLibelle(e.target.value); clearError("libelle"); }}
              className={errors.libelle ? styles.inputError : ""}
            />
            {errors.libelle && <span className={styles.errorMsg}>⚠ {t(errors.libelle)}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label>{t("project_form.fields.description")}</label>
            <textarea
              rows={4}
              placeholder={t("project_form.fields.description_placeholder")}
              value={description}
              onChange={(e) => { setDescription(e.target.value); clearError("description"); }}
              className={errors.description ? styles.inputError : ""}
            />
            {errors.description
              ? <span className={styles.errorMsg}>⚠ {t(errors.description)}</span>
              : <span className={styles.hintMsg}>
                   {t("project_form.fields.description_hint")} {description.length} {t("project_form.fields.description_chars")}
                </span>}
          </div>

          {/* ── FINANCES ── */}
          <div className={styles.sectionLabel}>💰 {t("project_form.sections.finances")}</div>

          <div className={styles.financeGrid}>
            <div className={styles.fieldGroup}>
              <label><FiDollarSign /> {t("project_form.fields.objectif")}</label>
              <input
                type="text" inputMode="numeric"
                placeholder={t("project_form.fields.objectif_placeholder")}
                value={objectifDisplay}
                onChange={(e) => handleNumeric(e.target.value, setObjectifDisplay, setObjectif, "objectif")}
                className={errors.objectif ? styles.inputError : ""}
              />
              {errors.objectif && <span className={styles.errorMsg}>⚠ {t(errors.objectif)}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label><FiPieChart /> {t("project_form.fields.prix_part")}</label>
              <input
                type="text" inputMode="numeric"
                placeholder={t("project_form.fields.prix_part_placeholder")}
                value={prixPartDisplay}
                onChange={(e) => handleNumeric(e.target.value, setPrixPartDisplay, setPrixPart, "prixPart")}
                className={errors.prixPart ? styles.inputError : ""}
              />
              {errors.prixPart && <span className={styles.errorMsg}>⚠ {t(errors.prixPart)}</span>}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label><FiDollarSign /> {t("project_form.fields.valuation")}</label>
            <input
              type="text" inputMode="numeric"
              placeholder={t("project_form.fields.valuation_placeholder")}
              value={valuationDisplay}
              onChange={(e) => handleNumeric(e.target.value, setValuationDisplay, setValuation, "valuation")}
              className={errors.valuation ? styles.inputError : ""}
            />
            {errors.valuation && <span className={styles.errorMsg}>⚠ {t(errors.valuation)}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label><FiPieChart /> {t("project_form.fields.roi")}</label>
            <input
              type="text" inputMode="decimal"
              placeholder={t("project_form.fields.roi_placeholder")}
              value={roiDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, "");
                setRoiDisplay(raw);
                setRoi(raw === "" ? 0 : parseFloat(raw));
                clearError("roi");
              }}
              className={errors.roi ? styles.inputError : ""}
            />
            {errors.roi && <span className={styles.errorMsg}>⚠ {t(errors.roi)}</span>}
          </div>

          {errors.coherence && (
            <div className={styles.coherenceWarning}>⚠ {t(errors.coherence)}</div>
          )}

          {totalParts > 0 && !errors.coherence && (
            <div className={styles.autoCalcInfo}>
              <FiCheck />
              <div>
                <div>
                  {t("project_form.calc.parts")} :{" "}
                  <strong>{totalParts.toLocaleString("fr-FR")} {t("project_form.calc.parts_of")}</strong>{" "}
                  {prixPart.toLocaleString("fr-FR")} FCFA
                </div>
                {partsEnPourcent > 0 && (
                  <div>
                    {t("project_form.calc.equity")} :{" "}
                    <strong>{partsEnPourcent}%</strong>{" "}
                    {t("project_form.calc.equity_of")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DURÉE ── */}
          <div className={styles.sectionLabel}>⏱ {t("project_form.sections.duration")}</div>

          <div className={styles.fieldGroup}>
            <label><FiClock /> {t("project_form.fields.duree")}</label>
            <input
              type="text" inputMode="numeric"
              placeholder={t("project_form.fields.duree_placeholder")}
              value={dureeMois ?? ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setDureeMois(val === "" ? null : parseInt(val, 10));
              }}
            />
            {dureeMois === null && (
              <span className={styles.hintMsg}>⏳ {t("project_form.fields.duree_indeterminate")}</span>
            )}
            {dureeMois !== null && dureeMois > 0 && (
              <span className={styles.hintMsg}>
                📅 {dureeMois} {t("project_form.fields.duree")}
                {dureeMois === 12 ? " (1 an)" : dureeMois === 24 ? " (2 ans)"
                  : dureeMois === 36 ? " (3 ans)" : dureeMois % 12 === 0
                  ? ` (${dureeMois / 12} ans)` : ""}
              </span>
            )}
          </div>

          <div className={styles.financeGrid}>
            <div className={styles.fieldGroup}>
              <label>📅 {t("project_form.fields.date_debut")}</label>
              <input
                type="date" value={dateDebut} min={todayStr}
                onChange={(e) => { setDateDebut(e.target.value); clearError("dateDebut"); }}
                className={errors.dateDebut ? styles.inputError : ""}
              />
              {errors.dateDebut && <span className={styles.errorMsg}>⚠ {t(errors.dateDebut)}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label>📅 {t("project_form.fields.date_fin")}</label>
              <input
                type="date" value={dateFin}
                onChange={(e) => { setDateFin(e.target.value); clearError("dateFin"); }}
                className={errors.dateFin ? styles.inputError : ""}
              />
              {errors.dateFin && <span className={styles.errorMsg}>⚠ {t(errors.dateFin)}</span>}
            </div>
          </div>

          {/* ── LOCALISATION ── */}
          <div className={styles.sectionLabel}>📍 {t("project_form.sections.location")}</div>

          <div className={styles.locationGrid}>
            <div className={styles.fieldGroup}>
              <ComboBox
                label={t("project_form.fields.secteur")}
                icon={<FiTag />}
                placeholder={t("project_form.fields.secteur_placeholder")}
                value={secteurNom}
                onChange={(v) => { setSecteurNom(v); clearError("secteurNom"); }}
                options={secteurs} loading={loadingSecteurs} required
              />
              {errors.secteurNom && <span className={styles.errorMsg}>⚠ {t(errors.secteurNom)}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <ComboBox
                label={t("project_form.fields.ville")}
                icon={<FiMapPin />}
                placeholder={t("project_form.fields.ville_placeholder")}
                value={localiteNom}
                onChange={(v) => { setLocaliteNom(v); clearError("localiteNom"); }}
                options={localites} loading={loadingLocalites} required
              />
              {errors.localiteNom && <span className={styles.errorMsg}>⚠ {t(errors.localiteNom)}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <ComboBox
                label={t("project_form.fields.pays")}
                icon={<FiMapPin />}
                placeholder={t("project_form.fields.pays_placeholder")}
                value={paysNom}
                onChange={setPaysNom}
                options={pays} loading={loadingPays}
              />
            </div>
          </div>

          {errors.global && (
            <div className={styles.globalError}>⚠ {errors.global}</div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.draftBtn}
              disabled={savingDraft || loading}
              onClick={handleSaveDraft}
            >
              {savingDraft
                ? t("project_form.draft.saving", "Enregistrement…")
                : t("project_form.draft.save", "Enregistrer comme brouillon")}
            </button>

            <button type="submit" className={styles.saveBtn} disabled={loading}>
              <FiSend />
              {loading ? t("project_form.buttons.processing") : t("project_form.buttons.submit")}
            </button>
          </div>

        </form>
      </div>

      {/* ── MODAL LÉGAL ── */}
      {showLegalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <FiShield className={styles.shieldIcon} />
              <h2>{t("project_form.modal.title")}</h2>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.alertBox}>
                <FiAlertTriangle className={styles.alertIcon} />
                <p>{t("project_form.modal.alert")}</p>
              </div>

              <div className={styles.legalList}>
                <label className={styles.checkItem}>
                  <input type="checkbox" checked={isCertified}
                    onChange={(e) => setIsCertified(e.target.checked)} />
                  <span className={styles.checkText}>
                    {t("project_form.modal.certified")}
                  </span>
                </label>

                <label className={styles.checkItem}>
                  <input type="checkbox" checked={agreedToMonitoring}
                    onChange={(e) => setAgreedToMonitoring(e.target.checked)} />
                  <span className={styles.checkText}>
                    {t("project_form.modal.monitoring")}
                  </span>
                </label>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button className={styles.btnBack} onClick={() => setShowLegalModal(false)}>
                {t("project_form.modal.back")}
              </button>
              <button
                className={styles.btnFinalSubmit}
                disabled={!isCertified || !agreedToMonitoring || loading}
                onClick={handleFinalSubmit}
              >
                {loading ? t("project_form.modal.sending") : t("project_form.modal.confirm")}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}