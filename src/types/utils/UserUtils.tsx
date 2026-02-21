export const getAvatarUrl = (imageName: string | null | undefined): string => {
  // 1. Si pas d'image, avatar par défaut
  if (!imageName || imageName.trim() === "") {
    return "/default-avatar.png";
  }

  // 2. Si c'est une URL Google/OAuth2, on la prend telle quelle
  if (imageName.startsWith("http")) {
    return imageName;
  }

  // 3. Image locale : On utilise le chemin relatif grâce à ton proxy Vite
  // Ton proxy redirige déjà "/uploads" vers "http://localhost:8080/uploads"
  return `/uploads/avatars/${imageName}`;
};
