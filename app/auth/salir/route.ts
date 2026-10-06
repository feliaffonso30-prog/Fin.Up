import { NextResponse, type NextRequest } from "next/server";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

// Solo POST (un GET podría dispararse desde un <img> de otro sitio).
export async function POST(request: NextRequest) {
  if (AUTH_CONFIGURADA) {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
