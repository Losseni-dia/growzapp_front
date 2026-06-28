// src/types/utils/CropImage.ts

export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: any,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    // Nécessaire si l'image vient d'un domaine différent (évite l'erreur canvas tainted)
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      // On génère en 16/9 HD (1600×900) quelle que soit la taille du crop
      const OUTPUT_WIDTH = 1600;
      const OUTPUT_HEIGHT = 900;

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      ctx.drawImage(
        image,
        pixelCrop.x, // sx — départ X dans l'image source
        pixelCrop.y, // sy — départ Y dans l'image source
        pixelCrop.width, // sWidth — largeur à prendre dans la source
        pixelCrop.height, // sHeight — hauteur à prendre dans la source
        0, // dx — destination X sur le canvas
        0, // dy — destination Y sur le canvas
        OUTPUT_WIDTH, // dWidth — étire au format 1600px
        OUTPUT_HEIGHT, // dHeight — étire au format 900px
      );

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };

    image.onerror = () => reject(new Error("Impossible de charger l'image"));

    // Assigner src APRÈS onload/onerror pour éviter les problèmes de cache
    image.src = imageSrc;

    // Si l'image est déjà en cache (complete) → déclencher manuellement
    if (image.complete && image.naturalWidth !== 0) {
      image.dispatchEvent(new Event("load"));
    }
  });
};

export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
};
