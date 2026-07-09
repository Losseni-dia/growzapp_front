import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    setVoveLoading(true);
    try {
      const session = await api.post<VoveIdSession>("/api/kyc/start-voveid");
      if (session?.widgetUrl) {
        window.open(session.widgetUrl, "_blank", "width=620,height=720");
        setVoveStarted(true);
        toast.success(
          "Fenêtre de vérification ouverte — suivez les instructions.",
        );
      } else {
        toast.error("Impossible d'ouvrir le widget de vérification.");
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          "Erreur lors du démarrage de la vérification automatique.",
      );
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.recto || !files.selfie || !user) {
      toast.error("Veuillez fournir au moins le recto et le selfie.");
      return;
    }

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
          <h2>Vérification en cours</h2>
          <p>
            Nos agents examinent vos pièces. Cela prend généralement moins de
            24h.
          </p>
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.kycWrapper}>
      <div className={styles.formKyc}>
        <h1 className={styles.title}>{t("kyc.title")}</h1>

        {/* ══ BANNIÈRE VOVE ID ══ */}
        <div className={styles.voveIdBanner}>
          <div className={styles.voveIdInfo}>
            <ShieldCheck size={28} color="#1B5E20" />
            <div>
              <strong>Vérification automatique disponible</strong>
              <p>
                Résultat immédiat · Passeports et CNI de tous pays acceptés ·
                Conforme BCEAO et RGPD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startVoveId}
            disabled={voveLoading}
            className={styles.btnVoveId}
          >
            <Zap size={16} />
            {voveLoading ? "Chargement..." : "Vérifier automatiquement"}
          </button>
        </div>

        {/* Message après ouverture du widget */}
        {voveStarted && (
          <div className={styles.voveStartedMsg}>
            ✅ Fenêtre de vérification ouverte. Suivez les instructions. Cette
            page se mettra à jour automatiquement après validation.
            <button
              type="button"
              onClick={startVoveId}
              className={styles.btnReopenVove}
            >
              Rouvrir la fenêtre
            </button>
          </div>
        )}

        {/* ══ SÉPARATEUR ══ */}
        <div className={styles.divider}>
          <span>ou remplir manuellement</span>
        </div>

        {/* ══ FORMULAIRE MANUEL ══ */}
        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Numéro de la pièce</label>
              <input
                className={styles.input}
                type="text"
                required
                placeholder="Ex: Passeport ou CNI"
                value={formData.numeroPiece}
                onChange={(e) =>
                  setFormData({ ...formData, numeroPiece: e.target.value })
                }
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Date de naissance</label>
              <input
                className={styles.input}
                type="date"
                required
                value={formData.dateNaissance}
                onChange={(e) =>
                  setFormData({ ...formData, dateNaissance: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Date de délivrance</label>
              <input
                className={styles.input}
                type="date"
                required
                value={formData.dateDelivrance}
                onChange={(e) =>
                  setFormData({ ...formData, dateDelivrance: e.target.value })
                }
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Date d'expiration</label>
              <input
                className={styles.input}
                type="date"
                required
                value={formData.dateExpiration}
                onChange={(e) =>
                  setFormData({ ...formData, dateExpiration: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Adresse de résidence</label>
            <textarea
              className={styles.textarea}
              required
              placeholder="Ville, Quartier, Rue..."
              value={formData.adresse}
              onChange={(e) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
            />
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
                      alt="Recto"
                      className={styles.previewImg}
                    />
                  ) : (
                    <>
                      <FiUploadCloud size={30} />
                      <span>Recto de la pièce</span>
                    </>
                  )}
                </div>
              </label>
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
                      alt="Verso"
                      className={styles.previewImg}
                    />
                  ) : (
                    <>
                      <FiUploadCloud size={30} />
                      <span>Verso de la pièce</span>
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
                      alt="Selfie"
                      className={styles.previewImg}
                    />
                  ) : (
                    <>
                      <FiCamera size={30} />
                      <span>Selfie avec la Pièce</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Envoi en cours..." : "Soumettre mon dossier"}
          </button>
        </form>
      </div>
    </div>
  );
}
