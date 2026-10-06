import { NextResponse, type NextRequest } from "next/server";
import { destinoSeguro } from "@/lib/auth/rutas";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

// Destino del link del email de confirmación: canjea el código por una sesión.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const codigo = searchParams.get("code");
  const siguiente = destinoSeguro(searchParams.get("siguiente"));

  if (AUTH_CONFIGURADA && codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(siguiente, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=enlace", request.url));
}
