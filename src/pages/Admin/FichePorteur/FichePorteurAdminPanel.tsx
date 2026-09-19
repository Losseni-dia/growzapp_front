import { Check, Edit2, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, buildFileUrl } from "../../../service/Api";
import { StatutJuridiquePorteur } from "../../../types/enum";
import styles from "../Kyc/KycAdminPanel.module.css";

interface FicheAdmin {
  userId: number;
  nom: string;
  prenom: string;
  login: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  statutJuridique?: string;
  raisonSociale?: string;
  anneesExperience?: number;
  projetsPrecedents?: string;
  contactTelephone?: string;
  contactEmail?: string;
  siteWeb?: string;
  linkedin?: string;
  reseauxAutres?: string;
  ficheStatut: string;
  submittedAt?: string;
  kycStatus?: string;
}

interface UserSearchResult {
  id: number;
  nomComplet: string;
  login: string;
}

interface ListPage {
  content: FicheAdmin[];
  totalPages: number;
  totalElements: number;
}

const emptyForm = {
  bio: "",
  statutJuridique: StatutJuridiquePorteur.INDIVIDUEL as string,
  raisonSociale: "",
  anneesExperience: "",
  projetsPrecedents: "",
  contactTelephone: "",
  contactEmail: "",
  siteWeb: "",
  linkedin: "",
  reseauxAutres: "",
};

export default function FichePorteurAdminPanel() {
  const [items, setItems] = useState<FicheAdmin[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ── Modal création/édition ──────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetUserLabel, setTargetUserLabel] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchListe = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await api.get<{ data: ListPage }>(`/api/porteur/fiche/admin/liste?${params}`);
      setItems(res.data.content || []);
      setTotalPages(res.data.totalPages ?? 1);
      setTotalElements(res.data.totalElements ?? 0);
    } catch {
      toast.error("Erreur de chargement des fiches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  // ── Recherche d'utilisateur pour créer une nouvelle fiche ───────────────
  useEffect(() => {
    if (userSearchTerm.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get<UserSearchResult[]>(`/api/auth/search?term=${encodeURIComponent(userSearchTerm)}`)
        .then((res) => setUserSearchResults(Array.isArray(res) ? res : []))
        .catch(() => setUserSearchResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  const openCreate = () => {
    setTargetUserId(null);
    setTargetUserLabel("");
    setUserSearchTerm("");
    setUserSearchResults([]);
    setForm({ ...emptyForm });
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEdit = async (fiche: FicheAdmin) => {
    setTargetUserId(fiche.userId);
    setTargetUserLabel(`${fiche.prenom} ${fiche.nom} (@${fiche.login})`);
    setUserSearchTerm("");
    setUserSearchResults([]);
    setPhotoFile(null);
    try {
      const res = await api.get<{ data: any }>(`/api/porteur/fiche/admin/${fiche.userId}`);
      const f = res.data;
      setForm({
        bio: f.bio || "",
        statutJuridique: f.statutJuridique || StatutJuridiquePorteur.INDIVIDUEL,
        raisonSociale: f.raisonSociale || "",
        anneesExperience: f.anneesExperience != null ? String(f.anneesExperience) : "",
        projetsPrecedents: f.projetsPrecedents || "",
        contactTelephone: f.contactTelephone || "",
        contactEmail: f.contactEmail || "",
        siteWeb: f.siteWeb || "",
        linkedin: f.linkedin || "",
        reseauxAutres: f.reseauxAutres || "",
      });
      setPhotoPreview(f.photoUrl ? buildFileUrl(f.photoUrl) : null);
    } catch {
      toast.error("Impossible de charger la fiche existante");
    }
    setShowModal(true);
  };

  const selectUser = async (u: UserSearchResult) => {
    setTargetUserId(u.id);
    setTargetUserLabel(`${u.nomComplet} (@${u.login})`);
    setUserSearchResults([]);
    setUserSearchTerm("");
    setPhotoFile(null);
    setPhotoPreview(null);
    // Précharge le contact déjà saisi à l'inscription (email, téléphone),
    // pour ne pas forcer l'admin à ressaisir une info déjà connue.
    try {
      const res = await api.get<{ data: any }>(`/api/porteur/fiche/admin/${u.id}`);
      const f = res.data;
      setForm((prev) => ({
        ...prev,
        contactTelephone: f.contactTelephone || "",
        contactEmail: f.contactEmail || "",
      }));
    } catch {
      // Pas bloquant — l'admin peut toujours saisir les champs à la main.
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE") => {
    if (!targetUserId) {
      toast.error("Sélectionnez d'abord un porteur");
      return;
    }
    setSaving(true);
    try {
      const params = new URLSearchParams({ statut });
      const ficheJson = {
        bio: form.bio.trim(),
        statutJuridique: form.statutJuridique,
        raisonSociale: form.statutJuridique === StatutJuridiquePorteur.SOCIETE ? form.raisonSociale.trim() : null,
        anneesExperience: form.anneesExperience === "" ? null : parseInt(form.anneesExperience, 10),
        projetsPrecedents: form.projetsPrecedents.trim() || null,
        contactTelephone: form.contactTelephone.trim(),
        contactEmail: form.contactEmail.trim(),
        siteWeb: form.siteWeb.trim() || null,
        linkedin: form.linkedin.trim() || null,
        reseauxAutres: form.reseauxAutres.trim() || null,
      };
      const formData = new FormData();
      formData.append("fiche", new Blob([JSON.stringify(ficheJson)], { type: "application/json" }));
      if (photoFile) formData.append("photo", photoFile);

      await api.post(`/api/porteur/fiche/admin/${targetUserId}?${params}`, formData, true);
      toast.success(
        statut === "VALIDEE" ? "Fiche publiée" : statut === "REJETEE" ? "Fiche marquée non conforme" : "Brouillon enregistré"
      );
      setShowModal(false);
      fetchListe();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, nom: string) => {
    if (!window.confirm(`Supprimer définitivement la fiche de ${nom} ? Le porteur ne pourra plus soumettre de projet tant qu'une nouvelle fiche n'est pas créée.`)) return;
    try {
      await api.delete(`/api/porteur/fiche/admin/${userId}`);
      toast.success("Fiche supprimée");
      fetchListe();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <ShieldCheck size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className={styles.title}>Fiches de présentation porteur</h1>
          <p className={styles.subtitle}>
            {totalElements} fiche{totalElements > 1 ? "s" : ""} créée{totalElements > 1 ? "s" : ""} — rédigées et
            validées exclusivement par l'admin
          </p>
        </div>
        <button onClick={openCreate} className={styles.btnApprove} style={{ whiteSpace: "nowrap" }}>
          <Plus size={16} /> Nouvelle fiche
        </button>
      </header>

      <div className={styles.pendingSearchWrapper}>
        <Search size={15} />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={32} />
          <p>Aucune fiche créée pour l'instant — cliquez sur "Nouvelle fiche" pour en créer une.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((f) => (
            <div key={f.userId} className={styles.card}>
              <div className={styles.cardAccent} />
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {f.photoUrl ? (
                    <img
                      src={buildFileUrl(f.photoUrl)}
                      alt={f.prenom}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <>
                      {f.prenom?.[0]}
                      {f.nom?.[0]}
                    </>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>
                    {f.prenom} {f.nom}
                  </p>
                  <div className={styles.statusRow}>
                    <span className={styles.userLogin}>@{f.login}</span>
                    <span
                      className={`${styles.badge} ${
                        f.ficheStatut === "VALIDEE"
                          ? styles.badgeGreen
                          : f.ficheStatut === "EN_ATTENTE"
                          ? styles.badgeOrange
                          : styles.badgeRed
                      }`}
                    >
                      {f.ficheStatut}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <strong>Statut</strong>
                  <span>
                    {f.statutJuridique === "SOCIETE" ? `Société — ${f.raisonSociale || "?"}` : "Entrepreneur individuel"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Expérience</strong>
                  <span>{f.anneesExperience ?? "?"} an(s)</span>
                </div>
                <div className={styles.detailItem}>
                  <span style={{ whiteSpace: "pre-wrap" }}>{f.bio}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button onClick={() => openEdit(f)} className={styles.btnApprove}>
                  <Edit2 size={16} /> Modifier
                </button>
                <button onClick={() => handleDelete(f.userId, `${f.prenom} ${f.nom}`)} className={styles.btnReject}>
                  <X size={16} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pendingPagination}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ‹
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            ›
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 className={styles.modalTitle}>
              {targetUserId ? "Modifier la fiche" : "Créer une fiche de présentation"}
            </h3>

            {!targetUserId ? (
              <div style={{ marginBottom: "1rem" }}>
                <input
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder="Rechercher un porteur par nom, prénom ou login…"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
                {userSearchResults.length > 0 && (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 6 }}>
                    {userSearchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => selectUser(u)}
                        style={{ padding: "0.6rem 0.9rem", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                      >
                        {u.nomComplet} <span style={{ color: "#888" }}>@{u.login}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className={styles.modalUser}>Porteur : {targetUserLabel}</p>
            )}

            {targetUserId && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: "#999",
                      }}
                    >
                      Aucune photo
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
                      Photo de la fiche (distincte de l'avatar de compte)
                    </label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} />
                  </div>
                </div>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Bio — qui est ce porteur, son parcours…"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
                <select
                  value={form.statutJuridique}
                  onChange={(e) => setForm({ ...form, statutJuridique: e.target.value })}
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                >
                  <option value={StatutJuridiquePorteur.INDIVIDUEL}>Entrepreneur individuel</option>
                  <option value={StatutJuridiquePorteur.SOCIETE}>Société</option>
                </select>
                {form.statutJuridique === StatutJuridiquePorteur.SOCIETE && (
                  <input
                    className={styles.modalTextarea}
                    style={{ minHeight: "auto" }}
                    placeholder="Raison sociale"
                    value={form.raisonSociale}
                    onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                  />
                )}
                <input
                  type="number"
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder="Années d'expérience"
                  value={form.anneesExperience}
                  onChange={(e) => setForm({ ...form, anneesExperience: e.target.value })}
                />
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Projets précédents (facultatif)"
                  value={form.projetsPrecedents}
                  onChange={(e) => setForm({ ...form, projetsPrecedents: e.target.value })}
                />
                <input
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder="Téléphone (interne, jamais affiché)"
                  value={form.contactTelephone}
                  onChange={(e) => setForm({ ...form, contactTelephone: e.target.value })}
                />
                <input
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder="Email (interne, jamais affiché)"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
            )}

            <div className={styles.modalFooter} style={{ flexWrap: "wrap" }}>
              <button onClick={() => setShowModal(false)} className={styles.btnCancel}>
                Annuler
              </button>
              {targetUserId && (
                <>
                  <button onClick={() => handleSave("EN_ATTENTE")} className={styles.btnCancel} disabled={saving}>
                    Enregistrer (brouillon)
                  </button>
                  <button
                    onClick={() => handleSave("REJETEE")}
                    className={styles.btnReject}
                    disabled={saving}
                  >
                    <X size={16} /> Marquer non conforme
                  </button>
                  <button onClick={() => handleSave("VALIDEE")} className={styles.btnApprove} disabled={saving}>
                    <Check size={16} /> {saving ? "Publication…" : "Publier"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
