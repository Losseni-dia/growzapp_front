import { useEffect, useMemo, useState } from "react";
import { FiDollarSign, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { api } from "../../../service/Api";
// Réutilisation du style déjà validé pour SecteurManager (même pattern liste + formulaire)
import styles from "../Projets/ProjectSettings/Manager.module.css";

interface DeviseAdmin {
  currencyCode: string;
  rateToBase: number;
  lastUpdated: string | null;
}

export default function DeviseManager() {
  const [devises, setDevises] = useState<DeviseAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newRate, setNewRate] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const filteredDevises = useMemo(() => {
    if (!search.trim()) return devises;
    const term = search.trim().toLowerCase();
    return devises.filter((d) => d.currencyCode.toLowerCase().includes(term));
  }, [devises, search]);

  const loadDevises = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("api/currencies/admin/liste");
      setDevises(res.data || []);
    } catch {
      toast.error("Erreur de chargement des devises");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevises();
  }, []);

  const startEdit = (d: DeviseAdmin) => {
    setEditingCode(d.currencyCode);
    setNewCode(d.currencyCode);
    setNewRate(String(d.rateToBase));
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setNewCode("");
    setNewRate("");
  };

  const handleSubmit = async () => {
    const code = newCode.trim().toUpperCase();
    const rate = parseFloat(newRate);
    if (!code || code.length < 2) {
      toast.error("Code devise invalide (ex: XOF, USD, EUR)");
      return;
    }
    if (!rate || rate <= 0) {
      toast.error("Le taux doit être un nombre strictement positif");
      return;
    }
    try {
      await api.put(`api/currencies/admin/${code}`, { rateToBase: rate });
      toast.success(editingCode ? "Devise mise à jour" : "Devise ajoutée");
      cancelEdit();
      loadDevises();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (code: string) => {
    if (code === "EUR") {
      toast.error("Impossible de supprimer la devise pivot (EUR)");
      return;
    }
    if (!window.confirm(`Supprimer la devise ${code} ?`)) return;
    try {
      await api.delete(`api/currencies/admin/${code}`);
      toast.success("Devise supprimée");
      loadDevises();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  if (loading) return <div className={styles.loader}>Chargement…</div>;

  return (
    <div className={styles.manager}>
      <div className={styles.addBar}>
        <FiDollarSign className={styles.inputIcon} />
        <input
          type="text"
          placeholder="Code (ex: XOF)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
          maxLength={5}
          style={{ maxWidth: 110 }}
          disabled={!!editingCode}
        />
        <input
          type="number"
          step="0.001"
          placeholder="Taux par rapport à 1 EUR (ex: 655.957)"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
        />
        <button onClick={handleSubmit} className={styles.btnAdd}>
          {editingCode ? <><FiEdit2 /> Enregistrer</> : <><FiPlus /> Ajouter</>}
        </button>
        {editingCode && (
          <button onClick={cancelEdit} className={styles.btnIconDel} title="Annuler">
            <FiX />
          </button>
        )}
      </div>

      <p style={{ fontSize: "0.82rem", color: "#888", margin: "0 0 1rem" }}>
        Taux exprimé par rapport à la devise pivot EUR (EUR = 1.0). Ex : si 1 EUR = 655,957 XOF, saisir 655.957 pour XOF.
      </p>

      <div className={styles.searchBar}>
        <FiSearch size={15} />
        <input
          placeholder="Rechercher une devise…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {filteredDevises.map((d) => (
          <div key={d.currencyCode} className={styles.itemCard}>
            <div className={styles.itemMain}>
              <span className={styles.itemName}>{d.currencyCode}</span>
              <span className={styles.itemBadge}>1 EUR = {d.rateToBase} {d.currencyCode}</span>
            </div>
            <div className={styles.itemDetails}>
              <small className={styles.emptyText}>
                {d.lastUpdated ? `Mis à jour le ${new Date(d.lastUpdated).toLocaleDateString()}` : "Jamais mis à jour"}
              </small>
            </div>
            <button onClick={() => startEdit(d)} className={styles.btnIconDel} title="Modifier">
              <FiEdit2 />
            </button>
            <button onClick={() => handleDelete(d.currencyCode)} className={styles.btnIconDel} title="Supprimer">
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
