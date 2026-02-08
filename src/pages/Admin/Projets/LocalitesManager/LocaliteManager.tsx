import { useEffect, useState } from "react";
import { api } from "../../../../service/Api";
import { FiPlus, FiTrash2, FiGlobe } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import styles from "../ProjectSettings/Manager.module.css";

export default function LocaliteManager() {
  const { t } = useTranslation();
  const [localites, setLocalites] = useState<any[]>([]);
  const [formData, setFormData] = useState({ nom: "", codePostal: "", paysNom: "COTE D'IVOIRE" });

  const loadLocalites = async () => {
    try {
      const res = await api.get<any>("api/localites");
      setLocalites(res.data || []);
    } catch (err) {}
  };

  useEffect(() => { loadLocalites(); }, []);

  const countriesCount = new Set(localites.map(l => l.paysNom)).size;

  const handleAdd = async () => {
    if (!formData.nom) return toast.error(t("admin.settings.name_required"));
    try {
      await api.post("api/localites", formData);
      toast.success(t("admin.settings.locality_success"));
      setFormData({ nom: "", codePostal: "", paysNom: "COTE D'IVOIRE" });
      loadLocalites();
    } catch (err) { toast.error(t("admin.settings.save_error")); }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.statsHeader}>
        <FiGlobe /> {t("admin.settings.presence_countries", { count: countriesCount })}
      </div>

      <div className={styles.addGrid}>
        <input placeholder={t("admin.settings.city_placeholder")} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value.toUpperCase()})} />
        <input placeholder={t("admin.settings.zip_placeholder")} value={formData.codePostal} onChange={e => setFormData({...formData, codePostal: e.target.value})} />
        <input placeholder={t("admin.settings.country_placeholder")} value={formData.paysNom} onChange={e => setFormData({...formData, paysNom: e.target.value.toUpperCase()})} />
        <button onClick={handleAdd} className={styles.btnAdd}><FiPlus /> {t("admin.settings.btn_add")}</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("admin.settings.col_city")}</th>
            <th>{t("admin.settings.col_country")}</th>
            <th>{t("admin.settings.col_projects")}</th>
            <th>{t("admin.settings.col_actions")}</th>
          </tr>
        </thead>
        <tbody>
          {localites.map(l => (
            <tr key={l.id}>
              <td><strong>{l.nom}</strong> <small>({l.codePostal})</small></td>
              <td>{l.paysNom}</td>
              <td>
                <div className={styles.tagCloud}>
                   {/* On affiche les sites et leurs projets rattachés à la ville */}
                   {l.localisations && l.localisations.length > 0 ? (
                     l.localisations.map((site: any) => (
                       <span key={site.id} className={styles.miniTag}>{site.nom}</span>
                     ))
                   ) : "---"}
                </div>
              </td>
              <td>
                <button onClick={async () => {
                  if(window.confirm(t("admin.settings.confirm_delete"))) {
                    await api.delete(`api/localites/${l.id}`);
                    loadLocalites();
                  }
                }} className={styles.btnIconDel}><FiTrash2 /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}