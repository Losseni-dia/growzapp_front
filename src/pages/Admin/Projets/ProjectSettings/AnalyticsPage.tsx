import { useTranslation } from "react-i18next";
import { FiTrendingUp } from "react-icons/fi";
import AdminStatsPanel from "../../GlobalStatsGraphiques/GlobalStats";
import ReferentielPageLayout from "./ReferentielPageLayout";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  return (
    <ReferentielPageLayout
      title={t("admin.settings.analytics", "Analyses")}
      icon={<FiTrendingUp />}
    >
      <AdminStatsPanel />
    </ReferentielPageLayout>
  );
}
