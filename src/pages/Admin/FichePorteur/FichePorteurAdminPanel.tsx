import { Check, Edit2, Languages, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
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

interface PorteurProjet {
  id: number;
  libelle: string;
  statutProjet: string;
  montantCollecte: number;
  objectifFinancement: number;
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
  const { t } = useTranslation();
  const [items, setItems] = useState<FicheAdmin[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [retraducing, setRetraducing] = useState(false);

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
  const [porteurProjets, setPorteurProjets] = useState<PorteurProjet[]>([]);
  const [selectedProjetIds, setSelectedProjetIds] = useState<Set<number>>(new Set());

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
      toast.error(t("admin.fiche_porteur.toast_load_error", "Erreur de chargement des fiches"));
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
    setPorteurProjets([]);
    setSelectedProjetIds(new Set());
    setShowModal(true);
  };

  // Charge les projets du porteur pour lui permettre de choisir lesquels
  // mettre en avant dans "Projets précédents", plutôt que de les retaper
  // à la main (le porteur est identifié par son ID utilisateur, pas
  // ressaisi manuellement).
  const loadPorteurProjets = async (userId: number) => {
    try {
      const res = await api.get<{ data: PorteurProjet[] }>(
        `/api/admin/projets/porteur/${userId}`,
      );
      setPorteurProjets(res.data || []);
    } catch {
      setPorteurProjets([]);
    }
  };

  const toggleProjet = (p: PorteurProjet) => {
    const next = new Set(selectedProjetIds);
    if (next.has(p.id)) next.delete(p.id);
    else next.add(p.id);
    setSelectedProjetIds(next);
  };

  const openEdit = async (fiche: FicheAdmin) => {
    setTargetUserId(fiche.userId);
    setTargetUserLabel(`${fiche.prenom} ${fiche.nom} (@${fiche.login})`);
    setUserSearchTerm("");
    setUserSearchResults([]);
    setPhotoFile(null);
    setSelectedProjetIds(new Set());
    loadPorteurProjets(fiche.userId);
    try {
      const res = await api.get<{ data: any }>(`/api/porteur/fiche/admin/${fiche.userId}`);
      const f = res.data;
      setSelectedProjetIds(new Set(f.projetsMisEnAvantIds || []));
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
      toast.error(t("admin.fiche_porteur.toast_load_one_error", "Impossible de charger la fiche existante"));
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
    setSelectedProjetIds(new Set());
    loadPorteurProjets(u.id);
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
      toast.error(t("admin.fiche_porteur.toast_select_porteur", "Sélectionnez d'abord un porteur"));
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
        projetsMisEnAvantIds: Array.from(selectedProjetIds),
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
        statut === "VALIDEE"
          ? t("admin.fiche_porteur.toast_published", "Fiche publiée")
          : statut === "REJETEE"
          ? t("admin.fiche_porteur.toast_rejected", "Fiche marquée non conforme")
          : t("admin.fiche_porteur.toast_draft_saved", "Brouillon enregistré")
      );
      setShowModal(false);
      fetchListe();
    } catch (err: any) {
      toast.error(err.message || t("admin.fiche_porteur.toast_save_error", "Erreur lors de l'enregistrement"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, nom: string) => {
    if (
      !window.confirm(
        t(
          "admin.fiche_porteur.confirm_delete",
          "Supprimer définitivement la fiche de {{nom}} ? Le porteur ne pourra plus soumettre de projet tant qu'une nouvelle fiche n'est pas créée.",
          { nom }
        )
      )
    )
      return;
    try {
      await api.delete(`/api/porteur/fiche/admin/${userId}`);
      toast.success(t("admin.fiche_porteur.toast_deleted", "Fiche supprimée"));
      fetchListe();
    } catch (err: any) {
      toast.error(err.message || t("admin.fiche_porteur.toast_delete_error", "Erreur lors de la suppression"));
    }
  };

  const handleRetraduireBios = async () => {
    setRetraducing(true);
    try {
      const res = await api.post<{ message?: string }>("/api/porteur/fiche/admin/retraduire-bios", {});
      toast.success(res.message || t("admin.fiche_porteur.toast_retraduit", "Bios retraduites"));
    } catch (err: any) {
      toast.error(err.message || t("admin.fiche_porteur.toast_retraduit_error", "Erreur lors de la retraduction"));
    } finally {
      setRetraducing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>{t("dashboard.loading", "Chargement…")}</p>
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
          <h1 className={styles.title}>{t("admin.fiche_porteur.title", "Fiches de présentation porteur")}</h1>
          <p className={styles.subtitle}>
            {t("admin.fiche_porteur.subtitle", "{{count}} fiche(s) créée(s) — rédigées et validées exclusivement par l'admin", {
              count: totalElements,
            })}
          </p>
        </div>
        <button
          onClick={handleRetraduireBios}
          className={styles.btnCancel}
          disabled={retraducing}
          style={{ whiteSpace: "nowrap" }}
          title={t(
            "admin.fiche_porteur.retraduire_hint",
            "Retraduit via DeepL la bio de toutes les fiches déjà soumises (à utiliser une fois après le déploiement)"
          ) as string}
        >
          <Languages size={16} />{" "}
          {retraducing
            ? t("admin.fiche_porteur.retraduire_loading", "Retraduction…")
            : t("admin.fiche_porteur.retraduire_bios", "Retraduire les bios (DeepL)")}
        </button>
        <button onClick={openCreate} className={styles.btnApprove} style={{ whiteSpace: "nowrap" }}>
          <Plus size={16} /> {t("admin.fiche_porteur.new_fiche", "Nouvelle fiche")}
        </button>
      </header>

      <div className={styles.pendingSearchWrapper}>
        <Search size={15} />
        <input
          type="text"
          placeholder={t("admin.fiche_porteur.search_placeholder", "Rechercher par nom, prénom ou email…") as string}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={32} />
          <p>
            {t(
              "admin.fiche_porteur.empty",
              'Aucune fiche créée pour l\'instant — cliquez sur "Nouvelle fiche" pour en créer une.'
            )}
          </p>
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
                      {t(`admin.fiche_porteur.statut.${f.ficheStatut}`, { defaultValue: f.ficheStatut })}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <strong>{t("admin.fiche_porteur.statut_label", "Statut")}</strong>
                  <span>
                    {f.statutJuridique === "SOCIETE"
                      ? `${t("admin.fiche_porteur.societe", "Société")} — ${f.raisonSociale || "?"}`
                      : t("admin.fiche_porteur.individuel", "Entrepreneur individuel")}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <strong>{t("admin.fiche_porteur.experience", "Expérience")}</strong>
                  <span>
                    {f.anneesExperience ?? "?"} {t("admin.fiche_porteur.annees_suffix", "an(s)")}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span style={{ whiteSpace: "pre-wrap" }}>{f.bio}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button onClick={() => openEdit(f)} className={styles.btnApprove}>
                  <Edit2 size={16} /> {t("admin.fiche_porteur.btn_edit", "Modifier")}
                </button>
                <button onClick={() => handleDelete(f.userId, `${f.prenom} ${f.nom}`)} className={styles.btnReject}>
                  <X size={16} /> {t("admin.fiche_porteur.btn_delete", "Supprimer")}
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
              {targetUserId
                ? t("admin.fiche_porteur.modal_title_edit", "Modifier la fiche")
                : t("admin.fiche_porteur.modal_title_create", "Créer une fiche de présentation")}
            </h3>

            {!targetUserId ? (
              <div style={{ marginBottom: "1rem" }}>
                <input
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder={t("admin.fiche_porteur.search_user_placeholder", "Rechercher un porteur par nom, prénom ou login…") as string}
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
              <p className={styles.modalUser}>
                {t("admin.fiche_porteur.porteur_label", "Porteur")} : {targetUserLabel}
              </p>
            )}

            {targetUserId && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={t("admin.fiche_porteur.photo_preview_alt", "Aperçu") as string}
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
                      {t("admin.fiche_porteur.no_photo", "Aucune photo")}
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
                      {t("admin.fiche_porteur.photo_label", "Photo de la fiche (distincte de l'avatar de compte)")}
                    </label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} />
                  </div>
                </div>
                <textarea
                  className={styles.modalTextarea}
                  placeholder={t("admin.fiche_porteur.bio_placeholder", "Bio — qui est ce porteur, son parcours…") as string}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
                <select
                  value={form.statutJuridique}
                  onChange={(e) => setForm({ ...form, statutJuridique: e.target.value })}
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                >
                  <option value={StatutJuridiquePorteur.INDIVIDUEL}>
                    {t("admin.fiche_porteur.individuel", "Entrepreneur individuel")}
                  </option>
                  <option value={StatutJuridiquePorteur.SOCIETE}>{t("admin.fiche_porteur.societe", "Société")}</option>
                </select>
                {form.statutJuridique === StatutJuridiquePorteur.SOCIETE && (
                  <input
                    className={styles.modalTextarea}
                    style={{ minHeight: "auto" }}
                    placeholder={t("admin.fiche_porteur.raison_sociale_placeholder", "Raison sociale") as string}
                    value={form.raisonSociale}
                    onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                  />
                )}
                <input
                  type="number"
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder={t("admin.fiche_porteur.annees_experience_placeholder", "Années d'expérience") as string}
                  value={form.anneesExperience}
                  onChange={(e) => setForm({ ...form, anneesExperience: e.target.value })}
                />
                {porteurProjets.length > 0 && (
                  <div style={{ marginTop: "0.2rem" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
                      {t(
                        "admin.fiche_porteur.projets_label",
                        "Projets à mettre en avant (libellé et statut affichés automatiquement, déjà traduits dans la langue de l'investisseur)"
                      )}
                    </label>
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        maxHeight: 150,
                        overflowY: "auto",
                        padding: "0.4rem 0.6rem",
                      }}
                    >
                      {porteurProjets.map((p) => (
                        <label
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "0.35rem 0",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProjetIds.has(p.id)}
                            onChange={() => toggleProjet(p)}
                          />
                          {p.libelle}{" "}
                          <span style={{ color: "#888" }}>
                            ({t(`admin.projects_list.status.${p.statutProjet}`, { defaultValue: p.statutProjet })})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  className={styles.modalTextarea}
                  placeholder={
                    t(
                      "admin.fiche_porteur.note_libre_placeholder",
                      "Note libre complémentaire (facultatif) — pour des projets hors GrowzApp, non traduite automatiquement"
                    ) as string
                  }
                  value={form.projetsPrecedents}
                  onChange={(e) => setForm({ ...form, projetsPrecedents: e.target.value })}
                />
                <input
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder={t("admin.fiche_porteur.telephone_placeholder", "Téléphone (interne, jamais affiché)") as string}
                  value={form.contactTelephone}
                  onChange={(e) => setForm({ ...form, contactTelephone: e.target.value })}
                />
                <input
                  className={styles.modalTextarea}
                  style={{ minHeight: "auto" }}
                  placeholder={t("admin.fiche_porteur.email_placeholder", "Email (interne, jamais affiché)") as string}
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
            )}

            <div className={styles.modalFooter} style={{ flexWrap: "wrap" }}>
              <button onClick={() => setShowModal(false)} className={styles.btnCancel}>
                {t("admin.fiche_porteur.btn_cancel", "Annuler")}
              </button>
              {targetUserId && (
                <>
                  <button onClick={() => handleSave("EN_ATTENTE")} className={styles.btnCancel} disabled={saving}>
                    {t("admin.fiche_porteur.btn_save_draft", "Enregistrer (brouillon)")}
                  </button>
                  <button
                    onClick={() => handleSave("REJETEE")}
                    className={styles.btnReject}
                    disabled={saving}
                  >
                    <X size={16} /> {t("admin.fiche_porteur.btn_mark_rejected", "Marquer non conforme")}
                  </button>
                  <button onClick={() => handleSave("VALIDEE")} className={styles.btnApprove} disabled={saving}>
                    <Check size={16} />{" "}
                    {saving
                      ? t("admin.fiche_porteur.btn_publishing", "Publication…")
                      : t("admin.fiche_porteur.btn_publish", "Publier")}
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
