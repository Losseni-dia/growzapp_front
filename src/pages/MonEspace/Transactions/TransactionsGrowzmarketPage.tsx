import { useTranslation } from "react-i18next";
import ProjetTransactionsList from "./ProjetTransactionsList";

export default function TransactionsGrowzmarketPage() {
  const { t } = useTranslation();
  return (
    <ProjetTransactionsList
      type="VENTE_MARKET"
      title={t("porteur.transactions.growzmarket_title", "Transactions GrowzMarket")}
      subtitle={t(
        "porteur.transactions.growzmarket_subtitle",
        "Ventes réalisées sur GrowzMarket pour vos projets, tous projets confondus.",
      )}
      totalLabel={t("porteur.transactions.total_label_recu", "Total reçu")}
      countLabel={t("porteur.transactions.count_label", "Paiements")}
      emptyLabel={t("porteur.transactions.growzmarket_empty", "Aucune vente GrowzMarket pour le moment.")}
    />
  );
}
