import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiSettings, FiUsers, FiGlobe } from "react-icons/fi";
import { api } from "../../../service/Api";
import styles from "./ParametresAdminPage.module.css";

interface SiteSetting {
  defaultLanguage: string;
}

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export default function ParametresAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<SiteSetting>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await api.get<{ data: SiteSetting }>("/api/site-settings");
      return res.data;
    },
  });

  const handleLanguageChange = async (language: string) => {
    setSaving(true);
    try {
      await api.put("/api/site-settings/admin", { defaultLanguage: language });
      toast.success(t("admin.parameters.language_saved"));
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err: any) {
      toast.error(err.message || t("admin.parameters.language_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <FiSettings /> {t("admin.parameters.title")}
        </h1>
        <p>{t("admin.parameters.subtitle")}</p>
      </header>

      <section className={styles.card}>
        <h2>
          <FiUsers size={16} /> {t("admin.parameters.roles_section")}
        </h2>
        <p className={styles.hint}>{t("admin.parameters.roles_hint")}</p>
        <Link to="/admin/users" className={styles.linkBtn}>
          {t("admin.sidebar.users")}
        </Link>
      </section>

      <section className={styles.card}>
        <h2>
          <FiGlobe size={16} /> {t("admin.parameters.language_section")}
        </h2>
        <p className={styles.hint}>{t("admin.parameters.language_hint")}</p>
        {isLoading ? (
          <div className={styles.loading}>{t("common.loading")}</div>
        ) : (
          <div className={styles.languageOptions}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`${styles.languageBtn} ${
                  data?.defaultLanguage === lang.code
                    ? styles.languageBtnActive
                    : ""
                }`}
                disabled={saving}
                onClick={() => handleLanguageChange(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
