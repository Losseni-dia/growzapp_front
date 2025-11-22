// vite-env.d.ts  (à la racine !)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_OTHER_VAR?: string;
  // ajoute tes vars ici
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
