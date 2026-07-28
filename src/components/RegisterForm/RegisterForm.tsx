import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import styles from "./RegisterForm.module.css";
import { getCroppedImg, dataURLtoFile } from "../../types/utils/CropImage";
import { useTranslation } from "react-i18next";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
  login: "login",
  password: "password",
  confirmPassword: "confirmPassword",
  prenom: "prenom",
  nom: "nom",
  email: "email",
  contact: "contact",
  sexe: "sexe",
};

type FieldKey =
  | "prenom"
  | "nom"
  | "login"
  | "password"
  | "confirmPassword"
  | "email"
  | "contact"
  | "sexe"
  | "localiteId"
  | "langues"
  | "global";

type FormErrors = Partial<Record<FieldKey, string>>;

export default function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Photo + cropper
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Données
  const [localites, setLocalites] = useState<Localite[]>([]);
  const [langues, setLangues] = useState<Langue[]>([]);
  const [selectedLangues, setSelectedLangues] = useState<number[]>([]);
  const [showLangues, setShowLangues] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Localité et langue personnalisées
  const [customLocalite, setCustomLocalite] = useState("");
  const [showCustomLocalite, setShowCustomLocalite] = useState(false);
  const [customLangue, setCustomLangue] = useState("");
  const [customLangues, setCustomLangues] = useState<string[]>([]);

  const [form, setForm] = useState({
    login: "",
    password: "",
    confirmPassword: "",
    prenom: "",
    nom: "",
    email: "",
    contact: "",
    sexe: "M" as "M" | "F",
    localiteId: "",
    interfaceLanguage: "fr",
    devisePreferee: "XOF",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, langRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/localites`),
          fetch(`${API_BASE_URL}/api/langues`),
        ]);
        const locData = await locRes.json();
        const langData = await langRes.json();
        setLocalites(locData.data || []);
        setLangues(langData.data || []);
      } catch {
        toast.error(t("register_page.errors.load_data"));
      }
    };
    fetchData();
  }, [t]);

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

  // === PHOTO + CROP ===
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

  const onCropComplete = useCallback((_: any, cap: any) => {
    setCroppedAreaPixels(cap);
  }, []);

  const createCroppedImage = async () => {
    if (!preview || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(cropped);
      setPhotoFile(dataURLtoFile(cropped, "profile.jpg"));
      setShowCropper(false);
      toast.success(t("register_page.photo.success_crop"));
    } catch {
      toast.error(t("register_page.photo.error_crop"));
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setPhotoFile(null);
    setShowCropper(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // === VALIDATION FRONTEND ===
  const validateFrontend = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.prenom.trim())
      errs.prenom = "register_page.errors.firstname_required";
    if (!form.nom.trim()) errs.nom = "register_page.errors.lastname_required";
    if (!form.login.trim()) errs.login = "register_page.errors.login_required";
    else if (form.login.trim().length < 3)
      errs.login = "register_page.errors.login_min";
    if (!form.password)
      errs.password = "register_page.errors.password_required";
    else if (form.password.length < 6)
      errs.password = "register_page.errors.password_min";
    if (!form.confirmPassword)
      errs.confirmPassword = "register_page.errors.confirm_required";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "register_page.errors.password_mismatch";
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

  // === PARSING ERREURS BACKEND ===
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

  // === SOUMISSION ===
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
    const userJson = {
      login: form.login.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
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
      new Blob([JSON.stringify(userJson)], { type: "application/json" }),
    );
    if (photoFile) formData.append("image", photoFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.message || t("register_page.errors.generic");
        const backendErrors = parseBackendErrors(msg);
        setErrors(backendErrors);
        if (backendErrors.global) toast.error(backendErrors.global);
        return;
      }

      toast.success(t("register_page.success"));
      navigate("/login");
    } catch (err: any) {
      setErrors({ global: err.message });
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.formHeader}>
          <h2>{t("register_page.title")}</h2>
        </div>

        {/* ── PHOTO ── */}
        <div className={styles.photoSection}>
          {!showCropper ? (
            <div
              className={styles.photoUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Profil" className={styles.preview} />
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
                </>
              ) : (
                <div className={styles.placeholder}>
                  <span className={styles.cameraIcon}>📷</span>
                  <p>{t("register_page.photo.add_text")}</p>
                  <span className={styles.photoHint}>
                    {t("register_page.hints.email_optional")}
                  </span>
                </div>
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
                  ✓ {t("register_page.photo.validate")}
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className={styles.cancelBtn}
                >
                  ✕ {t("register_page.photo.cancel")}
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

        {/* ── CONNEXION ── */}
        <div className={styles.sectionLabel}>
          🔐 {t("register_page.sections.connection")}
        </div>

        <div className={styles.fieldGroup}>
          <input
            name="login"
            placeholder={t("register_page.form.login")}
            value={form.login}
            onChange={handleChange}
            className={errors.login ? styles.inputError : ""}
            autoComplete="username"
          />
          {errors.login && (
            <span className={styles.errorMsg}>⚠ {t(errors.login)}</span>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <input
              name="password"
              type="password"
              placeholder={t("register_page.form.password")}
              value={form.password}
              onChange={handleChange}
              className={errors.password ? styles.inputError : ""}
              autoComplete="new-password"
            />
            {errors.password ? (
              <span className={styles.errorMsg}>⚠ {t(errors.password)}</span>
            ) : (
              <span className={styles.hintMsg}>
                💡 {t("register_page.hints.password")}
              </span>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <input
              name="confirmPassword"
              type="password"
              placeholder={t("register_page.form.confirm_password")}
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? styles.inputError : ""}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className={styles.errorMsg}>
                ⚠ {t(errors.confirmPassword)}
              </span>
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
            autoComplete="email"
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
        <div
          className={`${styles.radioGroup} ${errors.sexe ? styles.radioError : ""}`}
        >
          <label className={form.sexe === "M" ? styles.radioActive : ""}>
            <input
              type="radio"
              name="sexe"
              value="M"
              checked={form.sexe === "M"}
              onChange={handleChange}
            />
            {t("register_page.form.gender_male")}
          </label>
          <label className={form.sexe === "F" ? styles.radioActive : ""}>
            <input
              type="radio"
              name="sexe"
              value="F"
              checked={form.sexe === "F"}
              onChange={handleChange}
            />
            {t("register_page.form.gender_female")}
          </label>
        </div>
        {errors.sexe && (
          <span className={styles.errorMsg} style={{ paddingLeft: "2.8rem" }}>
            ⚠ {t(errors.sexe)}
          </span>
        )}

        {/* ── LOCALISATION ── */}
        <div className={styles.sectionLabel}>
          📍 {t("register_page.sections.location")}
        </div>

        <div className={styles.fieldGroupPadded}>
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
            className={`${styles.select} ${errors.localiteId ? styles.selectError : ""}`}
          >
            <option value="">{t("register_page.form.select_region")}</option>
            {localites.map((loc) => (
              <option key={loc.id} value={loc.id}>
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
              className={`${styles.customInput} ${errors.localiteId ? styles.inputError : ""}`}
            />
          )}
          {errors.localiteId && (
            <span className={styles.errorMsg}>⚠ {t(errors.localiteId)}</span>
          )}
        </div>

        {/* ── LANGUES ── */}
        <div className={styles.fieldGroupPadded}>
          <div
            className={`${styles.languesDropdown} ${showLangues ? styles.open : ""} ${errors.langues ? styles.languesError : ""}`}
            onClick={() => setShowLangues(!showLangues)}
          >
            <span className={styles.languesSelected}>
              {selectedLangues.length === 0 && customLangues.length === 0
                ? t("register_page.form.select_languages")
                : `${selectedLangues.length + customLangues.length} ${t("register_page.form.languages_count")}`}
            </span>
          </div>
          {errors.langues && (
            <span className={styles.errorMsg}>⚠ {t(errors.langues)}</span>
          )}
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

            {customLangues.map((nom, idx) => (
              <label
                key={`custom-${idx}`}
                className={`${styles.langueItem} ${styles.langueItemCustom}`}
              >
                <input type="checkbox" checked readOnly />
                <span>{nom}</span>
                <button
                  type="button"
                  className={styles.removeCustomBtn}
                  onClick={() => removeCustomLangue(idx)}
                >
                  ×
                </button>
              </label>
            ))}

            <div className={styles.addCustomLangue}>
              <input
                type="text"
                placeholder={t("register_page.form.other_language_placeholder")}
                value={customLangue}
                onChange={(e) => setCustomLangue(e.target.value)}
                className={styles.customInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomLangue();
                  }
                }}
              />
              <button
                type="button"
                className={styles.addCustomBtn}
                onClick={addCustomLangue}
              >
                ➕
              </button>
            </div>
          </div>
        )}

        {/* ── PRÉFÉRENCES ── */}
        <div className={styles.sectionLabel}>
          ⚙️ {t("register_page.sections.preferences")}
        </div>

        <div className={styles.row}>
          <div
            className={styles.fieldGroupPadded}
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            <label className={styles.prefLabel}>
              🌐 {t("register_page.form.interface_language")}
            </label>
            <select
              name="interfaceLanguage"
              value={form.interfaceLanguage}
              onChange={handleChange}
              className={styles.select}
              style={{ width: "100%", margin: 0 }}
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

          <div
            className={styles.fieldGroupPadded}
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            <label className={styles.prefLabel}>
              💱 {t("register_page.form.devise")}
            </label>
            <select
              name="devisePreferee"
              value={form.devisePreferee}
              onChange={handleChange}
              className={styles.select}
              style={{ width: "100%", margin: 0 }}
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
          <div className={styles.globalError}>⚠ {errors.global}</div>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? (
            <span className={styles.loadingContent}>
              <span className={styles.spinner} />
              {t("register_page.buttons.submit_loading")}
            </span>
          ) : (
            t("register_page.buttons.submit")
          )}
        </button>

        <p className={styles.loginLink}>
          {t("register_page.footer.already_account")}{" "}
          <Link to="/login">{t("register_page.footer.login_link")}</Link>
        </p>
      </form>
    </div>
  );
}
