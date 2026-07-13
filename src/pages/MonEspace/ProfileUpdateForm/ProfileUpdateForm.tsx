import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { useAuth } from "../../../components/Context/AuthContext";
import { api } from "../../../service/Api";
import styles from "./ProfileUpdateForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../../types/utils/CropImage";
import { useTranslation } from "react-i18next";
import { UserDTO } from "../../../types/user";
import { getAvatarUrl } from "../../../types/utils/UserUtils"; // Importe l'utilitaire d'URL

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface Localite {
  id: number;
  nom: string;
}
interface Langue {
  id: number;
  nom: string;
}

const LANGUES_INTERFACE = [
  { code: "fr", label: "🇫🇷 Français" },
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
];

const DEVISES = [
  { code: "XOF", label: "FCFA — Franc CFA Ouest Africain" },
  { code: "XAF", label: "FCFA — Franc CFA Afrique Centrale" },
  { code: "USD", label: "$ — Dollar américain" },
  { code: "EUR", label: "€ — Euro" },
  { code: "GBP", label: "£ — Livre sterling" },
  { code: "GNF", label: "GNF — Franc guinéen" },
  { code: "MAD", label: "MAD — Dirham marocain" },
  { code: "NGN", label: "₦ — Naira nigérian" },
  { code: "GHS", label: "₵ — Cedi ghanéen" },
  { code: "KES", label: "KES — Shilling kenyan" },
];

const FIELD_MAP: Record<string, string> = {
  prenom: "prenom",
  nom: "nom",
  email: "email",
  contact: "contact",
  sexe: "sexe",
};

type FieldKey =
  | "prenom"
  | "nom"
  | "email"
  | "contact"
  | "sexe"
  | "localiteId"
  | "langues"
  | "global";

type FormErrors = Partial<Record<FieldKey, string>>;

export default function ProfileUpdateForm() {
  const { t, i18n, ready } = useTranslation("translation", {
    useSuspense: false,
  });
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [preview, setPreview] = useState<string | null>(user?.image || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localites, setLocalites] = useState<Localite[]>([]);
  const [langues, setLangues] = useState<Langue[]>([]);
  const [selectedLangues, setSelectedLangues] = useState<number[]>(
    user?.langues?.map((l: any) => l?.id).filter((id: any) => id != null) || [],
  );
  const [showLangues, setShowLangues] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Localité et langue personnalisées
  const [customLocalite, setCustomLocalite] = useState("");
  const [showCustomLocalite, setShowCustomLocalite] = useState(false);
  const [customLangue, setCustomLangue] = useState("");
  const [customLangues, setCustomLangues] = useState<string[]>([]);

const [form, setForm] = useState({
  prenom: user?.prenom || "",
  nom: user?.nom || "",
  email: user?.email || "",
  contact: user?.contact || "",
  sexe: user?.sexe || "M",
  localiteId: user?.localite?.id?.toString() || "",
  interfaceLanguage: (user as any)?.interfaceLanguage || i18n.language || "fr",
  devisePreferee: (user as any)?.devisePreferee || "XOF",
});

useEffect(() => {
  if (!user) return;
  setForm({
    prenom: user.prenom || "",
    nom: user.nom || "",
    email: user.email || "",
    contact: user.contact || "",
    sexe: user.sexe || "M",
    localiteId: user.localite?.id?.toString() || "",
    interfaceLanguage: (user as any).interfaceLanguage || i18n.language || "fr",
    devisePreferee: (user as any).devisePreferee || "XOF",
  });
  setSelectedLangues(
    user.langues?.map((l: any) => l?.id).filter((id: any) => id != null) || [],
  );
  setPreview(user.image || null);
}, [user]);

// Chargement des données
useEffect(() => {
  const fetchData = async () => {
    try {
      const [locRes, langRes] = await Promise.all([
        api.get<ApiResponse<Localite[]>>("/api/localites"),
        api.get<ApiResponse<Langue[]>>("/api/langues"),
      ]);
      setLocalites(locRes.data || []);
      setLangues(langRes.data || []);
    } catch (err) {
      toast.error(t("register_page.errors.load_data"));
    }
  };
  if (ready) fetchData();
}, [t, ready]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as FieldKey]) {
      setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggleLangue = (langueId: number) => {
    if (!langueId) return;
    setSelectedLangues((prev) =>
      prev.includes(langueId)
        ? prev.filter((id) => id !== langueId)
        : [...prev, langueId],
    );
    if (errors.langues)
      setErrors((prev: FormErrors) => ({ ...prev, langues: undefined }));
  };

  const addCustomLangue = () => {
    const trimmed = customLangue.trim();
    if (!trimmed) return;
    setCustomLangues((prev) => [...prev, trimmed]);
    setCustomLangue("");
    if (errors.langues)
      setErrors((prev: FormErrors) => ({ ...prev, langues: undefined }));
  };

  const removeCustomLangue = (idx: number) => {
    setCustomLangues((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- LOGIQUE PHOTO ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error(t("register_page.photo.error_type"));
    if (file.size > 10 * 1024 * 1024)
      return toast.error(t("register_page.photo.error_size"));

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback(
    (_: any, pixels: any) => setCroppedAreaPixels(pixels),
    [],
  );

  const handleValidateCrop = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPhotoFile(dataURLtoFile(cropped, "profile_update.jpg"));
      setShowCropper(false);
      toast.success(t("register_page.photo.success_crop"));
    } catch {
      toast.error(t("register_page.photo.error_crop"));
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setPreview(user?.image || null);
  };

  // --- VALIDATION FRONTEND ---
  const validateFrontend = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.prenom.trim())
      errs.prenom = "register_page.errors.firstname_required";
    if (!form.nom.trim()) errs.nom = "register_page.errors.lastname_required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "register_page.errors.email_invalid";
    if (!form.contact.trim())
      errs.contact = "register_page.errors.phone_required";
    else if (!/^\+?[0-9]{8,15}$/.test(form.contact.trim()))
      errs.contact = "register_page.errors.phone_invalid";
    if (!form.localiteId) {
      errs.localiteId = "register_page.errors.region_required";
    } else if (form.localiteId === "autre" && !customLocalite.trim()) {
      errs.localiteId = "register_page.errors.region_required";
    }
    if (selectedLangues.length === 0 && customLangues.length === 0)
      errs.langues = "register_page.errors.language_required";
    return errs;
  };

  // --- PARSING ERREURS BACKEND ---
  const parseBackendErrors = (message: string): FormErrors => {
    const errs: FormErrors = {};
    const parts = message.split(", ");
    parts.forEach((part) => {
      const colonIdx = part.indexOf(" : ");
      if (colonIdx !== -1) {
        const field = part.substring(0, colonIdx).trim();
        const msg = part.substring(colonIdx + 3).trim();
        const mappedField = FIELD_MAP[field];
        if (mappedField) errs[mappedField as FieldKey] = msg;
        else errs.global = msg;
      } else {
        errs.global = part;
      }
    });
    return errs;
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const frontendErrors = validateFrontend();
    if (Object.keys(frontendErrors).length > 0) {
      setErrors(frontendErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const formData = new FormData();
    const userUpdateJson = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim().toLowerCase() || null,
      contact: form.contact.trim(),
      sexe: form.sexe,
      localite:
        form.localiteId === "autre" && customLocalite.trim()
          ? { nom: customLocalite.trim() }
          : form.localiteId
            ? { id: Number(form.localiteId) }
            : null,
      langues: [
        ...selectedLangues.map((id) => ({ id })),
        ...customLangues.map((nom) => ({ nom })),
      ],
      interfaceLanguage: form.interfaceLanguage,
      devisePreferee: form.devisePreferee,
    };

    formData.append(
      "user",
      new Blob([JSON.stringify(userUpdateJson)], { type: "application/json" }),
    );
    if (photoFile) formData.append("image", photoFile);

    try {
      const response = await api.put<ApiResponse<UserDTO>>(
        "/api/auth/me",
        formData,
        true,
      );
      if (response.success) {
        updateUserInfo(response.data);
        if (
          form.interfaceLanguage &&
          form.interfaceLanguage !== i18n.language
        ) {
          i18n.changeLanguage(form.interfaceLanguage);
        }
        toast.success(t("register_page.success"));
        navigate("/mon-espace");
      }
    } catch (err: any) {
      const msg = err.message || t("register_page.errors.generic");
      const backendErrors = parseBackendErrors(msg);
      setErrors(backendErrors);
      if (backendErrors.global) toast.error(backendErrors.global);
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className={styles.container} key={i18n.language}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>{t("dashboard.edit_profile")}</h2>

        {/* ── PHOTO ── */}
        <div className={styles.photoSection}>
          {!showCropper ? (
            <div
              className={styles.photoUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img
                  src={
                    preview.startsWith("data:")
                      ? preview
                      : getAvatarUrl(preview)
                  }
                  alt="Profil"
                  className={styles.preview}
                />
              ) : (
                <div className={styles.photoContent}>
                  <span className={styles.cameraIcon}>📷</span>
                  <p>{t("register_page.photo.add_text")}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.cropContainer}>
                <Cropper
                  image={preview!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className={styles.cropControls}>
                <button
                  type="button"
                  className={styles.cropBtn}
                  onClick={handleValidateCrop}
                >
                  ✓ {t("register_page.photo.validate")}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancelCrop}
                >
                  ✕ {t("register_page.photo.cancel")}
                </button>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoChange}
          />
        </div>

        {/* ── IDENTITÉ ── */}
        <div className={styles.sectionLabel}>
          👤 {t("register_page.sections.identity")}
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <input
              name="prenom"
              placeholder={t("register_page.form.firstname")}
              value={form.prenom}
              onChange={handleChange}
              className={errors.prenom ? styles.inputError : ""}
            />
            {errors.prenom && (
              <span className={styles.errorMsg}>⚠ {t(errors.prenom)}</span>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <input
              name="nom"
              placeholder={t("register_page.form.lastname")}
              value={form.nom}
              onChange={handleChange}
              className={errors.nom ? styles.inputError : ""}
            />
            {errors.nom && (
              <span className={styles.errorMsg}>⚠ {t(errors.nom)}</span>
            )}
          </div>
        </div>

        {/* ── CONTACT ── */}
        <div className={styles.sectionLabel}>
          📞 {t("register_page.sections.contact")}
        </div>

        <div className={styles.fieldGroup}>
          <input
            name="email"
            type="email"
            placeholder={t("register_page.form.email")}
            value={form.email}
            onChange={handleChange}
            className={errors.email ? styles.inputError : ""}
          />
          {errors.email ? (
            <span className={styles.errorMsg}>⚠ {t(errors.email)}</span>
          ) : (
            <span className={styles.hintMsg}>
              💡 {t("register_page.hints.email_optional")}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <input
            name="contact"
            placeholder={t("register_page.form.phone")}
            value={form.contact}
            onChange={handleChange}
            className={errors.contact ? styles.inputError : ""}
          />
          {errors.contact ? (
            <span className={styles.errorMsg}>⚠ {t(errors.contact)}</span>
          ) : (
            <span className={styles.hintMsg}>
              💡 {t("register_page.hints.phone")}
            </span>
          )}
        </div>

        {/* ── GENRE ── */}
        <div className={styles.sectionLabel}>
          ⚧ {t("register_page.sections.gender")}
        </div>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="sexe"
              value="M"
              checked={form.sexe === "M"}
              onChange={() => setForm({ ...form, sexe: "M" })}
            />{" "}
            {t("register_page.form.gender_male")}
          </label>
          <label>
            <input
              type="radio"
              name="sexe"
              value="F"
              checked={form.sexe === "F"}
              onChange={() => setForm({ ...form, sexe: "F" })}
            />{" "}
            {t("register_page.form.gender_female")}
          </label>
        </div>

        {/* ── LOCALISATION ── */}
        <div className={styles.sectionLabel}>
          📍 {t("register_page.sections.location")}
        </div>

        <select
          name="localiteId"
          value={form.localiteId}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "autre") {
              setShowCustomLocalite(true);
              setForm((prev) => ({ ...prev, localiteId: "autre" }));
            } else {
              setShowCustomLocalite(false);
              setCustomLocalite("");
              handleChange(e);
            }
            if (errors.localiteId)
              setErrors((prev: FormErrors) => ({
                ...prev,
                localiteId: undefined,
              }));
          }}
          className={styles.select}
        >
          <option value="">{t("register_page.form.select_region")}</option>
          {localites.map((loc) => (
            <option key={`loc-${loc.id}`} value={loc.id}>
              {loc.nom}
            </option>
          ))}
          <option value="autre">
            ➕ {t("register_page.form.other_region")}
          </option>
        </select>

        {showCustomLocalite && (
          <input
            type="text"
            placeholder={t("register_page.form.other_region_placeholder")}
            value={customLocalite}
            onChange={(e) => {
              setCustomLocalite(e.target.value);
              if (errors.localiteId)
                setErrors((prev: FormErrors) => ({
                  ...prev,
                  localiteId: undefined,
                }));
            }}
          />
        )}
        {errors.localiteId && (
          <span className={styles.errorMsg}>⚠ {t(errors.localiteId)}</span>
        )}

        {/* ── LANGUES ── */}
        <div className={styles.languesWrapper}>
          <div
            className={`${styles.languesSelectBox} ${
              showLangues ? styles.open : ""
            }`}
            onClick={() => setShowLangues(!showLangues)}
          >
            <div className={styles.selectedTags}>
              {selectedLangues.length === 0 && customLangues.length === 0 ? (
                <div className={styles.coolPlaceholder}>
                  <span className={styles.languageIcon}>🌍</span>
                  <span>{t("register_page.form.select_languages")}</span>
                </div>
              ) : (
                <>
                  {selectedLangues.map((id) => (
                    <span key={`tag-${id}`} className={styles.tag}>
                      {langues.find((l) => l.id === id)?.nom}
                      <span
                        className={styles.removeTag}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLangue(id);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                  {customLangues.map((nom, idx) => (
                    <span key={`custom-tag-${idx}`} className={styles.tag}>
                      {nom}
                      <span
                        className={styles.removeTag}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomLangue(idx);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
          {errors.langues && (
            <span className={styles.errorMsg}>⚠ {t(errors.langues)}</span>
          )}
          {showLangues && (
            <div className={styles.languesFloatingPanel}>
              {langues.map((lang) => (
                <div
                  key={`opt-${lang.id}`}
                  className={`${styles.langueOption} ${
                    selectedLangues.includes(lang.id)
                      ? styles.selectedOption
                      : ""
                  }`}
                  onClick={() => toggleLangue(lang.id)}
                >
                  <div className={styles.checkboxCustom}>
                    {selectedLangues.includes(lang.id) && "✓"}
                  </div>
                  <span>{lang.nom}</span>
                </div>
              ))}
              <div className={styles.addCustomLangue}>
                <input
                  type="text"
                  placeholder={t(
                    "register_page.form.other_language_placeholder",
                  )}
                  value={customLangue}
                  onChange={(e) => setCustomLangue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomLangue();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCustomLangue();
                  }}
                >
                  ➕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── PRÉFÉRENCES ── */}
        <div className={styles.sectionLabel}>
          ⚙️ {t("register_page.sections.preferences")}
        </div>

        <div className={styles.row}>
          <div>
            <label className={styles.prefLabel}>
              🌐 {t("register_page.form.interface_language")}
            </label>
            <select
              name="interfaceLanguage"
              value={form.interfaceLanguage}
              onChange={handleChange}
              className={styles.select}
            >
              {LANGUES_INTERFACE.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className={styles.hintMsg}>
              💡 {t("register_page.hints.interface_language")}
            </span>
          </div>

          <div>
            <label className={styles.prefLabel}>
              💱 {t("register_page.form.devise")}
            </label>
            <select
              name="devisePreferee"
              value={form.devisePreferee}
              onChange={handleChange}
              className={styles.select}
            >
              {DEVISES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
            <span className={styles.hintMsg}>
              💡 {t("register_page.hints.devise")}
            </span>
          </div>
        </div>

        {/* ── ERREUR GLOBALE ── */}
        {errors.global && (
          <div className={styles.errorMsg}>⚠ {errors.global}</div>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading
            ? t("register_page.buttons.submit_loading")
            : t("register_page.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
