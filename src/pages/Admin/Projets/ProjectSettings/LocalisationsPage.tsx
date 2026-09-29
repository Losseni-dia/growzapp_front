import { useTranslation } from "react-i18next";
import { FiMapPin } from "react-icons/fi";
import LocalisationManager from "../LocalisationManager/LocalisationManager";
import ReferentielPageLayout from "./ReferentielPageLayout";

export default function LocalisationsPage() {
  const { t } = useTranslation();
  return (
    <ReferentielPageLayout
      title={t("admin.settings.sites", "Sites Projets")}
      icon={<FiMapPin />}
    >
      <LocalisationManager />
    </ReferentielPageLayout>
  );
}
