import { useEffect, useState } from "react";
import { api } from "../../../../service/Api";
import { FiPlus, FiTrash2, FiTag } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
// Importation du CSS depuis le dossier parent
import styles from "../ProjectSettings/Manager.module.css";

export default function SecteurManager() {
  const { t } = useTranslation();
  const [secteurs, setSecteurs] = useState<any[]>([]);
  const [newNom, setNewNom] = useState("");

  const loadSecteurs = async () => {
    try {
      const res = await api.get<any>("api/secteurs");
      setSecteurs(res.data || []);
    } catch (err) {
      toast.error(t("admin.settings.load_error"));
    }
  };

  useEffect(() => { loadSecteurs(); }, []);

  const handleAdd = async () => {
    if (!newNom.trim()) return;
    try {
      await api.post("api/secteurs", { nom: newNom });
      toast.success(t("admin.settings.sector_success"));
      setNewNom("");
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
        <button onClick={handleAdd} className={styles.btnAdd}>
          <FiPlus /> {t("admin.settings.btn_add")}
        </button>
      </div>

      <div className={styles.list}>
        {secteurs.map(s => (
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

            <button onClick={() => handleDelete(s.id)} className={styles.btnIconDel}>
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}