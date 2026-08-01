import { useEffect, useMemo, useState } from "react";
import { api } from "../../../../service/Api";
import { FiPlus, FiTrash2, FiTag, FiEdit2, FiX, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
// Importation du CSS depuis le dossier parent
import styles from "../ProjectSettings/Manager.module.css";

export default function SecteurManager() {
  const { t } = useTranslation();
  const [secteurs, setSecteurs] = useState<any[]>([]);
  const [newNom, setNewNom] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredSecteurs = useMemo(() => {
    if (!search.trim()) return secteurs;
    const term = search.trim().toLowerCase();
    return secteurs.filter((s) => (s.nom || "").toLowerCase().includes(term));
  }, [secteurs, search]);

  const loadSecteurs = async () => {
    try {
      const res = await api.get<any>("api/secteurs");
      setSecteurs(res.data || []);
    } catch (err) {
      toast.error(t("admin.settings.load_error"));
    }
  };

  useEffect(() => { loadSecteurs(); }, []);

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setNewNom(s.nom);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewNom("");
  };

  const handleSubmit = async () => {
    if (!newNom.trim()) return;
    try {
      if (editingId) {
        await api.put(`api/secteurs/${editingId}`, { nom: newNom });
        toast.success(t("admin.settings.sector_update_success"));
      } else {
        await api.post("api/secteurs", { nom: newNom });
        toast.success(t("admin.settings.sector_success"));
      }
      setNewNom("");
      setEditingId(null);
      loadSecteurs();
    } catch (err) {
      toast.error(t("admin.settings.save_error"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.settings.confirm_delete"))) return;
    try {
      await api.delete(`api/secteurs/${id}`);
      toast.success(t("admin.settings.delete_success"));
      loadSecteurs();
    } catch (err) {
      toast.error(t("admin.settings.delete_error_linked"));
    }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.addBar}>
        <FiTag className={styles.inputIcon} />
        <input
          type="text"
          placeholder={t("admin.settings.new_sector_placeholder")}
          value={newNom}
          onChange={(e) => setNewNom(e.target.value.toUpperCase())}
        />
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

      <div className={styles.list}>
        {filteredSecteurs.map(s => (
          <div key={s.id} className={styles.itemCard}>
            <div className={styles.itemMain}>
              <span className={styles.itemName}>{s.nom}</span>
              <span className={styles.itemBadge}>
                {t("admin.settings.stats_projects", { count: s.projets?.length || 0 })}
              </span>
            </div>

            <div className={styles.itemDetails}>
              {s.projets && s.projets.length > 0 ? (
                <ul className={styles.projectMiniList}>
                  {/* Utilisation de l'index pour garantir une clé unique si nécessaire */}
                  {s.projets.map((pNom: string, idx: number) => (
                    <li key={`${s.id}-proj-${idx}`}>• {pNom}</li>
                  ))}
                </ul>
              ) : (
                <small className={styles.emptyText}>{t("admin.settings.no_projects")}</small>
              )}
            </div>

            <button onClick={() => startEdit(s)} className={styles.btnIconDel} title={t("admin.settings.btn_edit")}>
              <FiEdit2 />
            </button>
            <button onClick={() => handleDelete(s.id)} className={styles.btnIconDel}>
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
