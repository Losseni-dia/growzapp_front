import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiSend,
  FiTrendingUp,
} from "react-icons/fi";
import styles from "./InvestissementsAdminPage.module.css";

interface InvestissementAdmin {
  id: number;
  date: string;
  investisseurNom: string;
  investisseurPrenom?: string;
  investisseurEmail?: string;
  investisseurTelephone?: string;
  projetLibelle: string;
  nombrePartsPris: number;
  prixUnePart: number;
  statutPartInvestissement: "EN_ATTENTE" | "VALIDE" | "ANNULE";
  numeroContrat?: string;
  pourcentage: number;
  lienVerification?: string;
}

interface MutationResponse {
  numeroContrat: string;
  lienVerification: string;
}

export default function InvestissementsAdminPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [investissements, setInvestissements] = useState<InvestissementAdmin[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    api
      .get<{ data: InvestissementAdmin[] }>("/api/admin/investissements")
      .then((res) => setInvestissements(res.data || []))
      .catch(() => toast.error(t("admin.withdrawals.toast.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const validerEtEnvoyer = useMutation<
    MutationResponse,
    Error,
    InvestissementAdmin
  >({
    mutationFn: async (inv) => {
      return api.post<MutationResponse>(
        `http://localhost:8080/api/admin/investissements/${inv.id}/valider-et-envoyer`
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-investissements"] });
      toast.success(
        t("admin.investments.sent", { number: data.numeroContrat }),
        { duration: 6000 }
      );
    },
    onError: (err) => {
      toast.error(err.message || t("admin.withdrawals.toast.error"));
    },
  });

  if (loading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiTrendingUp size={40} /> {t("admin.investments.title")}
        </h1>
        <p>
          {t("admin.investments.subtitle", { count: investissements.length })}
        </p>
      </div>

      <div className={styles.grid}>
        {investissements.map((inv) => {
          const montant = inv.nombrePartsPris * inv.prixUnePart;
          return (
            <div key={inv.id} className={styles.card}>
              <div className={styles.statut}>
                {inv.statutPartInvestissement === "EN_ATTENTE" && (
                  <span className={styles.pending}>
                    <FiClock /> {t("admin.investments.status.pending")}
                  </span>
                )}
                {inv.statutPartInvestissement === "VALIDE" && (
                  <span className={styles.valide}>
                    <FiCheckCircle /> {t("admin.investments.status.validated")}
                  </span>
                )}
                {inv.statutPartInvestissement === "ANNULE" && (
                  <span className={styles.annule}>
                    {t("admin.investments.status.cancelled")}
                  </span>
                )}
              </div>

              <div className={styles.investisseur}>
                <div className={styles.avatar}>
                  <FiUser size={40} />
                </div>
                <div>
                  <h3>
                    {inv.investisseurPrenom || ""} {inv.investisseurNom}
                  </h3>
                  {inv.investisseurEmail && (
                    <p>
                      <FiMail /> {inv.investisseurEmail}
                    </p>
                  )}
                  {inv.investisseurTelephone && (
                    <p>
                      <FiPhone /> {inv.investisseurTelephone}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.projet}>
                <h4>{inv.projetLibelle}</h4>
                <p>
                  {format(new Date(inv.date), "dd MMM yyyy", {
                    locale: currentLocale,
                  })}
                </p>
              </div>

              <div className={styles.montant}>
                <div>
                  <strong>{inv.nombrePartsPris}</strong> parts
                </div>
                <div className={styles.prixTotal}>
                  {montant.toLocaleString(i18n.language)} FCFA
                </div>
              </div>

              <div className={styles.actions}>
                {inv.statutPartInvestissement === "EN_ATTENTE" && (
                  <button
                    onClick={() => validerEtEnvoyer.mutate(inv)}
                    disabled={validerEtEnvoyer.isPending}
                    className={styles.btnValider}
                  >
                    {validerEtEnvoyer.isPending ? (
                      t("dashboard.loading")
                    ) : (
                      <>
                        {t("admin.investments.btn_validate")} <FiSend />
                      </>
                    )}
                  </button>
                )}
                {inv.statutPartInvestissement === "VALIDE" &&
                  inv.numeroContrat && (
                    <div className={styles.dejaValide}>
                      <FiCheckCircle />{" "}
                      {t("admin.investments.sent", {
                        number: inv.numeroContrat,
                      })}
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
