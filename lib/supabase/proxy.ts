import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { esRutaDeAcceso, esRutaProtegida, DESTINO_POR_DEFECTO } from "@/lib/auth/rutas";
import { AUTH_CONFIGURADA, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/** Refresca la sesión en cada request y aplica las redirecciones de acceso. */
export async function actualizarSesion(request: NextRequest) {
  if (!AUTH_CONFIGURADA) return NextResponse.next({ request });

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  // getClaims valida la firma del JWT; no usar getSession() en el servidor.
  const { data } = await supabase.auth.getClaims();
  const logueado = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirigir = (ruta: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = ruta;
    url.search = "";
    Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = NextResponse.redirect(url);
    // conservar las cookies renovadas
    respuesta.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!logueado && esRutaProtegida(pathname)) return redirigir("/login", { siguiente: pathname + search });
  if (logueado && esRutaDeAcceso(pathname)) return redirigir(DESTINO_POR_DEFECTO);

  return respuesta;
}
