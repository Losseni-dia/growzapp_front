import { useTranslation } from "react-i18next";
import AdminPlaceholder from "../../../components/AdminPlaceholder/AdminPlaceholder";

export default function ContactAdminPage() {
  const { t } = useTranslation();
  return (
    <AdminPlaceholder
      title={t("admin.contact.title")}
      placeholderTitle={t("admin.contact.placeholder_title")}
      placeholderBody={t("admin.contact.placeholder_body")}
    />
  );
}
