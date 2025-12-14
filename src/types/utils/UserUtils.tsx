const BASE_URL = "http://localhost:8080";

export const getAvatarUrl = (imageName: string | null | undefined) => {
  if (!imageName) return "/default-avatar.png";
  if (imageName.startsWith("http")) return imageName;
  return `${BASE_URL}/uploads/avatars/${imageName}`;
};
