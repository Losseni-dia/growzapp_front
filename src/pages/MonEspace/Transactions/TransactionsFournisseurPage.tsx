import { useTranslation } from "react-i18next";
import ProjetTransactionsList from "./ProjetTransactionsList";

export default function TransactionsFournisseurPage() {
  const { t } = useTranslation();
  return (
    <ProjetTransactionsList
      type="PAIEMENT_FOURNISSEUR"
      title={t("porteur.transactions.fournisseur_title", "Transactions Fournisseur")}
      subtitle={t(
        "porteur.transactions.fournisseur_subtitle",
        "Paiements versés aux fournisseurs pour vos projets, tous projets confondus.",
      )}
      totalLabel={t("porteur.transactions.total_label", "Total payé")}
      countLabel={t("porteur.transactions.count_label", "Paiements")}
      emptyLabel={t("porteur.transactions.fournisseur_empty", "Aucun paiement fournisseur pour le moment.")}
    />
  );
}
