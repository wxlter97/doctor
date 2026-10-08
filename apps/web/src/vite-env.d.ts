/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  /** Origen público del catálogo (p. ej. el bucket de Supabase Storage). Vacío = solo la copia incluida en la app. */
  readonly VITE_CATALOG_BASE_URL?: string;
}
