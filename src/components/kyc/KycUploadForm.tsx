import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { api } from "../../service/Api";
import { toast } from "react-hot-toast";
import { FiUploadCloud, FiAlertCircle, FiCamera } from "react-icons/fi";
import { ShieldCheck, Zap } from "lucide-react";
import styles from "./KycUploardForm.module.css";
import { useTranslation } from "react-i18next";

interface VoveIdSession {
  refId: string;
  widgetUrl: string;
  publicKey: string;
}

export default function KYCUploadForm() {
  const { user, reloadUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [voveLoading, setVoveLoading] = useState(false);
  const [voveStarted, setVoveStarted] = useState(false);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    recto: null,
    verso: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({
    recto: null,
    verso: null,
    selfie: null,
  });
  const [formData, setFormData] = useState({
    dateNaissance: "",
    adresse: "",
    numeroPiece: "",
    dateDelivrance: "",
    dateExpiration: "",
  });

  // ── VOVE ID ───────────────────────────────────────────────────────────────
  const startVoveId = async () => {
    if (!consentRgpd) {
      setErrors((prev) => ({ ...prev, consent: t("kyc.error_consent_required") }));
      toast.error(t("kyc.error_consent_required"));
      return;
    }
    setVoveLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: VoveIdSession;
      }>("/api/kyc/start-voveid");
      if (response?.data?.widgetUrl) {
        window.open(response.data.widgetUrl, "_blank", "width=620,height=720");
        setVoveStarted(true);
        toast.success(t("kyc.toast_voveid_opened"));
      } else {
        toast.error(t("kyc.toast_voveid_open_error"));
      }
    } catch (err: any) {
      toast.error(err.message || t("kyc.toast_voveid_start_error"));
    } finally {
      setVoveLoading(false);
    }
  };

  // ── FORMULAIRE MANUEL ─────────────────────────────────────────────────────
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFiles((prev) => ({ ...prev, [type]: selectedFile }));
      setPreviews((prev) => ({
        ...prev,
        [type]: URL.createObjectURL(selectedFile),
      }));
      setErrors((prev) => ({ ...prev, [type]: "" }));
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Même whitelist de caractères que la validation serveur — évite un
  // aller-retour réseau juste pour découvrir qu'un caractère est refusé,
  // et bloque toute tentative d'injection de balises/scripts dès la saisie.
  const NUMERO_PIECE_REGEX = /^[\p{L}0-9 .\-]+$/u;

  const validate = () => {
    const e: Record<string, string> = {};
    const numeroPiece = formData.numeroPiece.trim();
    if (!numeroPiece) {
      e.numeroPiece = t("kyc.error_numero_piece_required");
    } else if (numeroPiece.length > 50) {
      e.numeroPiece = t("kyc.error_numero_piece_length");
    } else if (!NUMERO_PIECE_REGEX.test(numeroPiece)) {
      e.numeroPiece = t("kyc.error_numero_piece_chars");
    }
    if (!formData.dateNaissance) e.dateNaissance = t("kyc.error_date_naissance_required");
    if (!formData.dateDelivrance) e.dateDelivrance = t("kyc.error_date_delivrance_required");
    if (!formData.dateExpiration) {
      e.dateExpiration = t("kyc.error_date_expiration_required");
    } else if (formData.dateDelivrance && formData.dateExpiration <= formData.dateDelivrance) {
      e.dateExpiration = t("kyc.error_date_expiration_order");
    }
    const adresse = formData.adresse.trim();
    if (!adresse) {
      e.adresse = t("kyc.error_adresse_required");
    } else if (adresse.length > 500) {
      e.adresse = t("kyc.error_adresse_length");
    }
    if (!files.recto) e.recto = t("kyc.error_recto_required");
    if (!files.selfie) e.selfie = t("kyc.error_selfie_required");
    if (!consentRgpd) e.consent = t("kyc.error_consent_required_submit");
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error(t("kyc.toast_fix_fields"));
      return;
    }
    if (!user) return;

    setLoading(true);
    const data = new FormData();
    if (files.recto) data.append("fileRecto", files.recto);
    if (files.verso) data.append("fileVerso", files.verso);
    if (files.selfie) data.append("fileSelfie", files.selfie);
    data.append("dateNaissance", formData.dateNaissance);
    data.append("adresse", formData.adresse);
    data.append("numeroPiece", formData.numeroPiece);
    data.append("dateDelivrance", formData.dateDelivrance);
    data.append("dateExpiration", formData.dateExpiration);
    data.append("userId", user.id.toString());

    try {
      await api.post("/api/kyc/soumettre", data, true);
      toast.success(t("kyc.success_message"));
      if (reloadUser) await reloadUser();
      navigate("/mon-espace");
    } catch (error: any) {
      toast.error(error.message || t("kyc.error_message"));
    } finally {
      setLoading(false);
    }
  };

  // ── STATUT EN ATTENTE ─────────────────────────────────────────────────────
  if (user?.kycStatus === "EN_ATTENTE") {
    return (
      <div className={styles.kycWrapper}>
        <div className={styles.statusBox}>
          <FiAlertCircle className={styles.iconPending} size={50} />
          <h2>{t("kyc.status_pending_title")}</h2>
          <p>{t("kyc.status_pending_body")}</p>
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.kycWrapper}>
      <div className={styles.formKyc}>
        <h1 className={styles.title}>{t("kyc.title")}</h1>

        {/* ══ CONSENTEMENT RGPD (commun aux deux méthodes ci-dessous) ══ */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "0 0 4px" }}>
          <input
            type="checkbox"
            checked={consentRgpd}
            onChange={(e) => {
              setConsentRgpd(e.target.checked);
              setErrors((prev) => ({ ...prev, consent: "" }));
            }}
            style={{ marginTop: 3 }}
          />
          <span>
            {t("kyc.consent_text")}{" "}
            <Link to="/rgpd" target="_blank" rel="noopener noreferrer">
              {t("kyc.consent_link")}
            </Link>
            .
          </span>
        </label>
        {errors.consent && <span className={styles.fieldError}>{errors.consent}</span>}
        <div style={{ marginBottom: 16 }} />

        {/* ══ BANNIÈRE VOVE ID ══ */}
        <div className={styles.voveIdBanner}>
          <div className={styles.voveIdInfo}>
            <ShieldCheck size={28} color="#1B5E20" />
            <div>
              <strong>{t("kyc.voveid_banner_title")}</strong>
              <p>{t("kyc.voveid_banner_body")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={startVoveId}
            disabled={voveLoading || !consentRgpd}
            className={styles.btnVoveId}
          >
            <Zap size={16} />
            {voveLoading ? t("kyc.btn_loading") : t("kyc.btn_voveid_start")}
          </button>
        </div>
        {!consentRgpd && (
          <span className={styles.fieldError}>{t("kyc.hint_consent_voveid")}</span>
        )}

        {/* Message après ouverture du widget */}
        {voveStarted && (
          <div className={styles.voveStartedMsg}>
            {t("kyc.voveid_started_message")}
            <button
              type="button"
              onClick={startVoveId}
              className={styles.btnReopenVove}
            >
              {t("kyc.btn_reopen_voveid")}
            </button>
          </div>
        )}

        {/* ══ SÉPARATEUR ══ */}
        <div className={styles.divider}>
          <span>{t("kyc.divider_manual")}</span>
        </div>

        {/* ══ FORMULAIRE MANUEL ══ */}
        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>{t("kyc.label_numero_piece")}</label>
              <input
                className={`${styles.input} ${errors.numeroPiece ? styles.inputError : ""}`}
                type="text"
                maxLength={50}
                placeholder={t("kyc.placeholder_numero_piece") as string}
                value={formData.numeroPiece}
                onChange={(e) => updateField("numeroPiece", e.target.value)}
              />
              {errors.numeroPiece && <span className={styles.fieldError}>{errors.numeroPiece}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>{t("kyc.label_birthdate")}</label>
              <input
                className={`${styles.input} ${errors.dateNaissance ? styles.inputError : ""}`}
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => updateField("dateNaissance", e.target.value)}
              />
              {errors.dateNaissance && <span className={styles.fieldError}>{errors.dateNaissance}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>{t("kyc.label_date_delivrance")}</label>
              <input
                className={`${styles.input} ${errors.dateDelivrance ? styles.inputError : ""}`}
                type="date"
                value={formData.dateDelivrance}
                onChange={(e) => updateField("dateDelivrance", e.target.value)}
              />
              {errors.dateDelivrance && <span className={styles.fieldError}>{errors.dateDelivrance}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>{t("kyc.label_date_expiration")}</label>
              <input
                className={`${styles.input} ${errors.dateExpiration ? styles.inputError : ""}`}
                type="date"
                value={formData.dateExpiration}
                onChange={(e) => updateField("dateExpiration", e.target.value)}
              />
              {errors.dateExpiration && <span className={styles.fieldError}>{errors.dateExpiration}</span>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>{t("kyc.label_address")}</label>
            <textarea
              className={`${styles.textarea} ${errors.adresse ? styles.inputError : ""}`}
              maxLength={500}
              placeholder={t("kyc.placeholder_address") as string}
              value={formData.adresse}
              onChange={(e) => updateField("adresse", e.target.value)}
            />
            {errors.adresse && <span className={styles.fieldError}>{errors.adresse}</span>}
          </div>

          <div className={styles.photoGrid}>
            {/* RECTO */}
            <div className={styles.uploadContainer}>
              <label className={styles.photoLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "recto")}
                  hidden
                />
                <div
                  className={`${styles.uploadPlaceholder} ${
                    previews.recto ? styles.hasImage : ""
                  }`}
                >
                  {previews.recto ? (
                    <img
                      src={previews.recto}
                      alt={t("kyc.doc_recto") as string}
                      className={styles.previewImg}
                    />
                  ) : (
                    <>
                      <FiUploadCloud size={30} />
                      <span>{t("kyc.doc_recto")}</span>
                    </>
                  )}
                </div>
              </label>
              {errors.recto && <span className={styles.fieldError}>{errors.recto}</span>}
            </div>

            {/* VERSO */}
            <div className={styles.uploadContainer}>
              <label className={styles.photoLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "verso")}
                  hidden
                />
                <div
                  className={`${styles.uploadPlaceholder} ${
                    previews.verso ? styles.hasImage : ""
                  }`}
                >
                  {previews.verso ? (
                    <img
                      src={previews.verso}
                      alt={t("kyc.doc_verso") as string}
                      className={styles.previewImg}
                    />
                  ) : (
                    <>
                      <FiUploadCloud size={30} />
                      <span>{t("kyc.doc_verso")}</span>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* SELFIE */}
            <div className={styles.uploadContainer}>
              <label className={styles.photoLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "selfie")}
                  hidden
                />
                <div
                  className={`${styles.uploadPlaceholder} ${
                    previews.selfie ? styles.hasImage : ""
                  }`}
                >
                  {previews.selfie ? (
                    <img
                      src={previews.selfie}
                      alt={t("kyc.doc_selfie") as string}
                      className={styles.previewImg}
                    />
                  ) : (
                    <>
                      <FiCamera size={30} />
                      <span>{t("kyc.doc_selfie")}</span>
                    </>
                  )}
                </div>
              </label>
              {errors.selfie && <span className={styles.fieldError}>{errors.selfie}</span>}
            </div>
          </div>

          <button type="submit" disabled={loading || !consentRgpd} className={styles.submitBtn}>
            {loading ? t("kyc.btn_submitting") : t("kyc.btn_submit_dossier")}
          </button>
          {!consentRgpd && (
            <span className={styles.fieldError}>{t("kyc.hint_consent_submit")}</span>
          )}
        </form>
      </div>
    </div>
  );
}
