// src/pages/Admin/ProjetAdminDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../../service/api";
import DocumentUpload from "../../../../components/DocumentUpload/DocumentUpload";
import { useAuth } from "../../../../components/context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ProjetAdminDetail.module.css";
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiFile, // Icône existante et parfaite pour Excel/CSV
} from "react-icons/fi";
import { ApiResponse } from "../../../../types/common";
import { ProjetDTO } from "../../../../types/projet";

interface DocumentDTO {
  id: number;
  nom: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export default function ProjetAdminDetail() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProjetAndDocuments = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [projetRes, docsRes] = await Promise.all([
        api.get<ApiResponse<ProjetDTO>>(`api/projets/${id}`),
        api.get<ApiResponse<DocumentDTO[]>>(`api/documents/projet/${id}`),
      ]);

      setProjet(projetRes.data);
      setDocuments(docsRes.data || []);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du chargement du projet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadProjetAndDocuments();
  }, [id]);

 const handleDownload = async (docId: number, nom: string, type: string) => {
   try {
     const token = localStorage.getItem("access_token") || "";
     const response = await fetch(
       `http://localhost:8080/api/documents/${docId}/download`,
       {
         method: "GET",
         headers: {
           Authorization: `Bearer ${token}`,
           // Important : ne pas définir Content-Type → laisser le navigateur gérer
         },
       }
     );

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(errorText || "Téléchargement refusé");
     }

     const blob = await response.blob();
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download =
       type === "PDF"
         ? `${nom}.pdf`
         : type === "EXCEL"
         ? `${nom}.xlsx`
         : type === "CSV"
         ? `${nom}.csv`
         : nom;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     window.URL.revokeObjectURL(url);

     toast.success("Téléchargement démarré !");
   } catch (err: any) {
     toast.error(err.message || "Échec du téléchargement");
   }
 };

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FiFileText color="#d32f2f" size={28} />;
      case "EXCEL":
      case "CSV":
        return <FiFile color="#1B5E20" size={28} />; // Icône fichier générique (parfaite)
      default:
        return <FiImage color="#1B5E20" size={28} />;
    }
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (!projet) return <div className={styles.error}>Projet non trouvé</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Administration : {projet.libelle}</h1>

      {/* Upload réservé à l'admin */}
      {user?.roles?.includes("ADMIN") && (
        <DocumentUpload
          projetId={Number(id)}
          onUploadSuccess={loadProjetAndDocuments}
        />
      )}

      {/* Liste des documents */}
      <div className={styles.documentsSection}>
        <h2>Documents du projet ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className={styles.noDocs}>Aucun document uploadé pour l'instant</p>
        ) : (
          <div className={styles.grid}>
            {documents.map((doc) => (
              <div key={doc.id} className={styles.docCard}>
                <div className={styles.docIcon}>{getIcon(doc.type)}</div>
                <div className={styles.docInfo}>
                  <strong>{doc.nom}</strong>
                  <small>
                    {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                  </small>
                </div>
                <button
                  onClick={() => handleDownload(doc.id, doc.nom, doc.type)}
                  className={styles.downloadBtn}
                  title="Télécharger"
                >
                  <FiDownload />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
