// src/css.d.ts
// src/types/css.d.ts
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

// Bonus : ça marche aussi pour les images, svg, etc.
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
