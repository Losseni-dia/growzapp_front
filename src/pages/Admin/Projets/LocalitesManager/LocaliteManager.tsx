import { useEffect, useMemo, useState } from "react";
import { api } from "../../../../service/Api";
import { FiPlus, FiTrash2, FiGlobe, FiEdit2, FiX, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import styles from "../ProjectSettings/Manager.module.css";

const emptyForm = { nom: "", codePostal: "", paysNom: "COTE D'IVOIRE" };

export default function LocaliteManager() {
  const { t } = useTranslation();
  const [localites, setLocalites] = useState<any[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredLocalites = useMemo(() => {
    if (!search.trim()) return localites;
    const term = search.trim().toLowerCase();
    return localites.filter(
      (l) =>
        (l.nom || "").toLowerCase().includes(term) ||
        (l.paysNom || "").toLowerCase().includes(term),
    );
  }, [localites, search]);

  const loadLocalites = async () => {
    try {
      const res = await api.get<any>("api/localites");
      setLocalites(res.data || []);
    } catch (err) {}
  };

  useEffect(() => { loadLocalites(); }, []);

  const countriesCount = new Set(localites.map(l => l.paysNom)).size;

  const startEdit = (l: any) => {
    setEditingId(l.id);
    setFormData({ nom: l.nom, codePostal: l.codePostal || "", paysNom: l.paysNom || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    if (!formData.nom) return toast.error(t("admin.settings.name_required"));
    try {
      if (editingId) {
        await api.put(`api/localites/${editingId}`, formData);
        toast.success(t("admin.settings.locality_update_success"));
      } else {
        await api.post("api/localites", formData);
        toast.success(t("admin.settings.locality_success"));
      }
      setFormData(emptyForm);
      setEditingId(null);
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
        <button onClick={handleSubmit} className={styles.btnAdd}>
          {editingId ? <><FiEdit2 /> {t("admin.settings.btn_save")}</> : <><FiPlus /> {t("admin.settings.btn_add")}</>}
        </button>
        {editingId && (
          <button onClick={cancelEdit} className={styles.btnIconDel} title={t("admin.settings.btn_cancel")}>
            <FiX />
          </button>
        )}
      </div>

      <div className={styles.searchBar}>
        <FiSearch size={15} />
        <input
          placeholder={t("admin.settings.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
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
          {filteredLocalites.map(l => (
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
                <button onClick={() => startEdit(l)} className={styles.btnIconDel} title={t("admin.settings.btn_edit")}>
                  <FiEdit2 />
                </button>
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
    </div>
  );
}
