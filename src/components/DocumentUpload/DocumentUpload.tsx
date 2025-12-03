// src/components/admin/DocumentUpload.tsx
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "../../service/api";
import styles from "./DocumentUpload.module.css";
import { FiUpload, FiX, FiFileText, FiCheckCircle } from "react-icons/fi";

interface DocumentUploadProps {
  projetId: number;
  onUploadSuccess: () => void; // pour recharger la liste
}

export default function DocumentUpload({
  projetId,
  onUploadSuccess,
}: DocumentUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [nom, setNom] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      (droppedFile && droppedFile.type.includes("pdf")) ||
      droppedFile.type.includes("excel") ||
      droppedFile.type.includes("csv") ||
      droppedFile.type.includes("image")
    ) {
      setFile(droppedFile);
      setNom(droppedFile.name.split(".").slice(0, -1).join("."));
    } else {
      toast.error("Format non supporté (PDF, Excel, CSV, Image uniquement)");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setNom(selected.name.split(".").slice(0, -1).join("."));
    }
  };

  const handleUpload = async () => {
    if (!file || !nom.trim()) {
      toast.error("Nom du document requis");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nom", nom.trim());
    formData.append("type", getFileType(file));

    try {
      await api.post(`/api/documents/projet/${projetId}`, formData, true);
      toast.success("Document uploadé avec succès !");
      setFile(null);
      setNom("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (file: File) => {
    if (file.type.includes("pdf")) return "PDF";
    if (file.type.includes("excel") || file.type.includes("spreadsheet"))
      return "EXCEL";
    if (file.type.includes("csv")) return "CSV";
    return "IMAGE";
  };

  const cancel = () => {
    setFile(null);
    setNom("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={styles.uploadContainer}>
      <h3 className={styles.title}>
        <FiUpload /> Ajouter un document (bilan, rapport, photo...)
      </h3>

      {!file ? (
        <div
          className={`${styles.dropZone} ${dragging ? styles.dragging : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FiFileText size={48} color="#1B5E20" />
          <p>Déposez votre fichier ici ou cliquez pour sélectionner</p>
          <small>PDF, Excel, CSV, Images • Max 20 Mo</small>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            hidden
          />
        </div>
      ) : (
        <div className={styles.preview}>
          <div className={styles.fileInfo}>
            <FiCheckCircle color="#1B5E20" size={32} />
            <div>
              <strong>{file.name}</strong>
              <br />
              <small>{(file.size / 1024 / 1024).toFixed(2)} Mo</small>
            </div>
          </div>

          <input
            type="text"
            placeholder="Nom du document (ex: Bilan 2024)"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={styles.nomInput}
          />

          <div className={styles.actions}>
            <button onClick={cancel} className={styles.cancelBtn}>
              <FiX /> Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={styles.uploadBtn}
            >
              {uploading ? "Upload en cours..." : "Uploader le document"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
