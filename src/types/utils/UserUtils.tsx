import { buildFileUrl } from "../../service/Api";

export const getAvatarUrl = (imageName: string | null | undefined): string => {
  if (!imageName || imageName.trim() === "") {
    return "/default-avatar.svg";
  }
  if (imageName.startsWith("http")) {
    return imageName;
  }
  return buildFileUrl(`/uploads/avatars/${imageName}`);
};
