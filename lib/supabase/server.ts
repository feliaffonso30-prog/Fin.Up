import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: no se pueden escribir cookies. proxy.ts ya refresca la sesión.
        }
      },
    },
  });
}
