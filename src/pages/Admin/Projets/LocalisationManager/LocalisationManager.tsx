import { useEffect, useState } from "react";
import { api } from "../../../../service/api";
import { FiPlus, FiTrash2, FiMapPin, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import styles from "../ProjectSettings/Manager.module.css";

export default function LocalisationManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [localites, setLocalites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nom: "", adresse: "", contact: "", responsable: "", localiteNom: "" });

  const loadData = async () => {
    try {
      const [resLoc, resCities] = await Promise.all([
        api.get<any>("api/localisations"),
        api.get<any>("api/localites")
      ]);
      setItems(resLoc.data || []);
      setLocalites(resCities.data || []);
    } catch (err) {
      toast.error(t("admin.settings.load_error"));
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!formData.nom || !formData.localiteNom) return toast.error(t("admin.settings.required_fields"));
    try {
      await api.post("api/localisations", formData);
      toast.success(t("admin.settings.site_success"));
      setFormData({ nom: "", adresse: "", contact: "", responsable: "", localiteNom: "" });
      loadData();
    } catch (err) { toast.error(t("admin.settings.save_error")); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.settings.confirm_delete_site"))) return;
    try {
      await api.delete(`api/localisations/${id}`);
      loadData();
      toast.success(t("admin.settings.delete_success"));
    } catch (err) { toast.error(t("admin.settings.delete_error_linked")); }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.addForm}>
        <h3>{t("admin.settings.add_site_title")}</h3>
        <div className={styles.gridInputs}>
          <input placeholder={t("admin.settings.site_name_placeholder")} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
          <select value={formData.localiteNom} onChange={e => setFormData({...formData, localiteNom: e.target.value})}>
            <option value="">-- {t("admin.settings.choose_city")} --</option>
            {localites.map(l => <option key={l.id} value={l.nom}>{l.nom} ({l.paysNom})</option>)}
          </select>
          <input placeholder={t("admin.settings.label_manager")} value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} />
          <input placeholder={t("admin.settings.label_contact")} value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
          <input placeholder={t("admin.settings.label_address")} className={styles.fullWidth} value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} />
        </div>
        <button onClick={handleSave} className={styles.btnSave}><FiPlus /> {t("admin.settings.btn_add_site")}</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("admin.settings.col_name")}</th>
            <th>{t("admin.settings.col_city")}</th>
            <th>{t("admin.settings.col_projects")}</th>
            <th>{t("admin.settings.col_actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <strong>{item.nom}</strong><br/>
                <small>{item.adresse}</small>
              </td>
              <td>{item.localiteNom}</td>
             <td>
                <div className={styles.nestedProjectList}>
                    {item.projets?.length > 0 ? (
                    item.projets.map((p: any, idx: number) => (
                        /* Correction : On ajoute une key unique en combinant l'ID du site et l'index ou l'ID du projet */
                        <div key={`${item.id}-p-${p.id || idx}`} className={styles.projectLine}>
                        <FiPackage size={12} /> {p.libelle || p}
                        </div>
                    ))
                    ) : (
                    <span className={styles.emptyText}>{t("admin.settings.no_projects")}</span>
                    )}
                </div>
                </td>
              <td className={styles.actions}>
                <button onClick={() => handleDelete(item.id)} className={styles.btnDel}><FiTrash2 /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}