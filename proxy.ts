import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Todo menos archivos estáticos, imágenes e íconos. /api/chat queda fuera: valida su propio acceso.
  matcher: ["/((?!_next/static|_next/image|api/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)"],
};
