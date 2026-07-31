import { useTranslation } from "react-i18next";
import AdminPlaceholder from "../../../components/AdminPlaceholder/AdminPlaceholder";

export default function CommentairesAdminPage() {
  const { t } = useTranslation();
  return (
    <AdminPlaceholder
      title={t("admin.comments.title")}
      placeholderTitle={t("admin.comments.placeholder_title")}
      placeholderBody={t("admin.comments.placeholder_body")}
    />
  );
}
