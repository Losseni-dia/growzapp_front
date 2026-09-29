import { useTranslation } from "react-i18next";
import { FiDollarSign } from "react-icons/fi";
import DeviseManager from "../../Devises/DeviseManager";
import ReferentielPageLayout from "./ReferentielPageLayout";

export default function DevisesPage() {
  const { t } = useTranslation();
  return (
    <ReferentielPageLayout
      title={t("admin.settings.currencies", "Devises")}
      icon={<FiDollarSign />}
    >
      <DeviseManager />
    </ReferentielPageLayout>
  );
}
