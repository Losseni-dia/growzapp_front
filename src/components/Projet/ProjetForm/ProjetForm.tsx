import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../service/api";
import { useAuth } from "../../../components/context/AuthContext";
import toast from "react-hot-toast";
import { FiCamera, FiSend } from "react-icons/fi";
import styles from "./ProjetForm.module.css";

import { SecteurDTO } from "../../../types/secteur";
import { LocaliteDTO } from "../../../types/localite";
import { ApiResponse } from "../../../types/common";

export default function ProjectForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [secteurNom, setSecteurNom] = useState("");
  const [localiteNom, setLocaliteNom] = useState("");
  const [paysNom, setPaysNom] = useState("Côte d'Ivoire");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("/placeholder.jpg");
  const [loading, setLoading] = useState(false);

  const [secteurs, setSecteurs] = useState<SecteurDTO[]>([]);
  const [localites, setLocalites] = useState<LocaliteDTO[]>([]);

  // Chargement des listes pour les suggestions
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [secteursRes, localitesRes] = await Promise.all([
          api.get<ApiResponse<SecteurDTO[]>>("/secteurs"),
          api.get<ApiResponse<LocaliteDTO[]>>("/localites"),
        ]);

        setSecteurs(secteursRes.data || []);
        setLocalites(localitesRes.data || []);
      } catch (err) {
        console.error("Erreur chargement références", err);
      }
    };

    loadReferences();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secteurNom.trim() || !localiteNom.trim()) {
      toast.error("Veuillez remplir le secteur et la localité");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    const projetJson = {
      libelle: libelle.trim(),
      description: description.trim(),
      secteurNom: secteurNom.trim(),
      localiteNom: localiteNom.trim(),
      paysNom: paysNom.trim() || null,
    };

    formData.append(
      "projet",
      new Blob([JSON.stringify(projetJson)], { type: "application/json" })
    );

    if (posterFile) {
      formData.append("poster", posterFile);
    }

    try {
      // Récupération fiable du token
      let token = "";
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          token = parsed?.token || "";
        } catch {}
      }
      if (!token) token = localStorage.getItem("access_token") || "";

      const response = await fetch("http://localhost:8080/api/projets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur serveur");
      }

      const data = await response.json();
      toast.success(data.message || "Projet soumis avec succès ! 🚀");
      navigate("/mon-espace");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la soumission du projet");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Soumettre un nouveau projet</h1>

      <div className={styles.userInfo}>
        <strong>
          {user?.prenom} {user?.nom}
        </strong>
        <br />
        {user?.email}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Poster */}
        <div className={styles.imageSection}>
          <img src={preview} alt="Aperçu" className={styles.poster} />
          <button
            type="button"
            onClick={() => document.getElementById("posterInput")?.click()}
            className={styles.cameraBtn}
          >
            <FiCamera size={28} />
          </button>
          <input
            id="posterInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
          <small>Poster (facultatif)</small>
        </div>

        <input
          type="text"
          placeholder="Nom du projet *"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          required
        />

        <textarea
          placeholder="Description détaillée *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          required
        />

        {/* Secteur */}
        <input
          type="text"
          placeholder="Secteur d'activité * (ex: Agroalimentaire)"
          value={secteurNom}
          onChange={(e) => setSecteurNom(e.target.value)}
          list="secteurs-list"
          required
        />
        <datalist id="secteurs-list">
          {secteurs.map((s) => (
            <option key={s.id} value={s.nom} />
          ))}
        </datalist>

        {/* Localité */}
        <input
          type="text"
          placeholder="Ville / Localité * (ex: Abidjan)"
          value={localiteNom}
          onChange={(e) => setLocaliteNom(e.target.value)}
          list="localites-list"
          required
        />
        <datalist id="localites-list">
          {localites.map((l) => (
            <option key={l.id} value={l.nom} />
          ))}
        </datalist>

        {/* Pays (facultatif) */}
        <input
          type="text"
          placeholder="Pays (facultatif)"
          value={paysNom}
          onChange={(e) => setPaysNom(e.target.value)}
        />

        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.saveBtn}>
            <FiSend /> {loading ? "Envoi en cours..." : "Soumettre le projet"}
          </button>
        </div>
      </form>
    </div>
  );
}
