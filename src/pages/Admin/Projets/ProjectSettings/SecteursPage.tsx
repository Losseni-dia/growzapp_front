import { useTranslation } from "react-i18next";
import { FiGrid } from "react-icons/fi";
import SecteurManager from "../SecteurManager/SecteurManager";
import ReferentielPageLayout from "./ReferentielPageLayout";

export default function SecteursPage() {
  const { t } = useTranslation();
  return (
    <ReferentielPageLayout
      title={t("admin.settings.sectors", "Secteurs")}
      icon={<FiGrid />}
    >
      <SecteurManager />
    </ReferentielPageLayout>
  );
}
