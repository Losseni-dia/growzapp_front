import { useTranslation } from "react-i18next";
import { FiMap } from "react-icons/fi";
import LocaliteManager from "../LocalitesManager/LocaliteManager";
import ReferentielPageLayout from "./ReferentielPageLayout";

export default function LocalitesPage() {
  const { t } = useTranslation();
  return (
    <ReferentielPageLayout
      title={t("admin.settings.localities", "Villes / Localités")}
      icon={<FiMap />}
    >
      <LocaliteManager />
    </ReferentielPageLayout>
  );
}
