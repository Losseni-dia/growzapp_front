import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispUserHandler = () => {
  useEffect(() => {
    // 1. On récupère l'utilisateur stocké lors du login
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        // On vérifie que l'email existe avant d'envoyer
        if (user && user.email) {
          // Identifie l'utilisateur par son email
          Crisp.user.setEmail(user.email);
          
          // Formate le nom (ex: "Los Diakite")
          const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
          if (name) Crisp.user.setNickname(name);

          // Ajoute des infos personnalisées visibles dans votre tableau de bord
          Crisp.session.setData({
            "user_id": user.id || "inconnu",
            "kyc": user.kycStatus || "en_attente"
          });
          
          console.log("✅ Crisp : Utilisateur identifié", user.email);
        }
      } catch (e) {
        console.error("Erreur parsing user pour Crisp", e);
      }
    }
  }, []);

  return null;
};

export default CrispUserHandler;