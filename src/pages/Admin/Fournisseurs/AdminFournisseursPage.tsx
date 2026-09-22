import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiMapPin, FiTruck, FiXCircle } from "react-icons/fi";
import { api } from "../../../service/Api";
import styles from "./AdminFournisseursPage.module.css";

interface FournisseurDTO {
  id: number;
  nomContact: string;
  statutJuridique: string;
  raisonSociale: string | null;
  secteurNom: string | null;
  ville: string;
  pays: string;
  telephone: string | null;
  email: string | null;
  description: string | null;
}

export default function AdminFournisseursPage() {
  const { t } = useTranslation();
  const [fournisseurs, setFournisseurs] = useState<FournisseurDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejetId, setRejetId] = useState<number | null>(null);
  const [motif, setMotif] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<{ data: FournisseurDTO[] }>("/api/admin/fournisseurs/en-attente")
      .then((res) => setFournisseurs(res.data || []))
      .catch(() => toast.error(t("admin.fournisseurs.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValider = async (id: number) => {
    try {
      await api.post(`/api/admin/fournisseurs/${id}/valider`);
      toast.success(t("admin.fournisseurs.toast_validated", "Fournisseur validé"));
      setFournisseurs((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      toast.error(err.message || t("admin.fournisseurs.toast_error", "Erreur"));
    }
  };

  const handleRejeter = async () => {
    if (!rejetId || motif.trim().length < 3) {
      toast.error(t("admin.fournisseurs.toast_motif_required", "Le motif est obligatoire (3 caractères min.)"));
      return;
    }
    try {
      await api.post(`/api/admin/fournisseurs/${rejetId}/rejeter`, { motif });
      toast.success(t("admin.fournisseurs.toast_rejected", "Fournisseur rejeté"));
      setFournisseurs((prev) => prev.filter((f) => f.id !== rejetId));
      setRejetId(null);
      setMotif("");
    } catch (err: any) {
      toast.error(err.message || t("admin.fournisseurs.toast_error", "Erreur"));
    }
  };

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiTruck /> {t("admin.fournisseurs.title", "Fournisseurs en attente de validation")}
        </h1>
        <p>{t("admin.fournisseurs.subtitle", "{{count}} inscription(s) en attente", { count: fournisseurs.length })}</p>
      </div>

      {fournisseurs.length === 0 ? (
        <div className={styles.emptyState}>
          <FiTruck size={48} />
          <p>{t("admin.fournisseurs.empty", "Aucune inscription en attente.")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {fournisseurs.map((f) => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{f.raisonSociale || f.nomContact}</strong>
                <span className={styles.badge}>{f.statutJuridique}</span>
              </div>
              <p className={styles.secteur}>{f.secteurNom}</p>
              <p className={styles.location}>
                <FiMapPin size={14} /> {f.ville}, {f.pays}
              </p>
              {f.telephone && <p className={styles.contact}>{f.telephone}</p>}
              {f.email && <p className={styles.contact}>{f.email}</p>}
              {f.description && <p className={styles.description}>{f.description}</p>}

              <div className={styles.actions}>
                <button className={styles.btnValider} onClick={() => handleValider(f.id)}>
                  <FiCheckCircle size={14} /> {t("admin.fournisseurs.btn_validate", "Valider")}
                </button>
                <button className={styles.btnRejeter} onClick={() => setRejetId(f.id)}>
                  <FiXCircle size={14} /> {t("admin.fournisseurs.btn_reject", "Rejeter")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejetId !== null && (
        <div className={styles.modalOverlay} onClick={() => setRejetId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.fournisseurs.reject_title", "Motif du rejet")}</h2>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={t("admin.fournisseurs.reject_placeholder", "Expliquez pourquoi cette inscription est rejetée...") as string}
              rows={4}
              maxLength={500}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setRejetId(null)}>
                {t("admin.fournisseurs.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnRejeter} onClick={handleRejeter}>
                {t("admin.fournisseurs.btn_confirm_reject", "Rejeter")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
