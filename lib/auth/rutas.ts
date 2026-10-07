// Reglas de navegación del login. Puras (sin Next ni red) para poder testearlas.

export const RUTAS_PROTEGIDAS = ["/dashboard", "/aprender", "/onboarding"];
export const RUTAS_DE_ACCESO = ["/login", "/registro"];
export const DESTINO_POR_DEFECTO = "/dashboard";

const coincide = (ruta: string, base: string) => ruta === base || ruta.startsWith(base + "/");

export const esRutaProtegida = (ruta: string) => RUTAS_PROTEGIDAS.some((b) => coincide(ruta, b));
export const esRutaDeAcceso = (ruta: string) => RUTAS_DE_ACCESO.some((b) => coincide(ruta, b));

/**
 * Valida el parámetro `siguiente` para evitar "open redirect": solo se aceptan rutas internas
 * ("/algo"), nunca URLs completas ni "//dominio" ni barras invertidas.
 */
export function destinoSeguro(valor: string | null | undefined): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return DESTINO_POR_DEFECTO;
  if (/[\u0000-\u001f]/.test(valor)) return DESTINO_POR_DEFECTO;
  return valor;
}

/** Traduce los errores de Supabase a mensajes claros, sin revelar si un email existe. */
export function mensajeDeError(codigo?: string, mensaje?: string): string {
  switch (codigo) {
    case "invalid_credentials":
      return "El email o la contraseña no coinciden.";
    case "email_not_confirmed":
      return "Todavía no confirmaste tu email. Revisá tu bandeja de entrada (y spam).";
    case "weak_password":
      return "La contraseña es muy débil. Usá al menos 8 caracteres, mezclando letras y números.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.";
    case "signup_disabled":
      return "El registro está deshabilitado por ahora.";
    case "validation_failed":
      return "Revisá que el email esté bien escrito.";
    default:
      return mensaje && /password/i.test(mensaje) ? "La contraseña no cumple los requisitos." : "No pudimos completar la acción. Probá de nuevo en un rato.";
  }
}

export const validarEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export const validarPassword = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
