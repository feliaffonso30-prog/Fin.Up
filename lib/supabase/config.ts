// Las dos variables son públicas (van al navegador). La clave "publishable" es segura de exponer:
// la seguridad real la dan las políticas RLS del esquema SQL.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Sin las dos variables la app sigue funcionando en "modo sin cuenta" (plan en el navegador). */
export const AUTH_CONFIGURADA = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
