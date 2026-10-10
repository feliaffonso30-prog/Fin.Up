// Biblioteca de instrumentos: fichas EDUCATIVAS de instrumentos reales, agrupadas
// para conectarlas con las categorías de la cartera sugerida. No es una
// recomendación de compra: cada instrumento está en la lista por criterios
// objetivos (liquidez, tamaño, diversificación) que la ficha explica.
//
// El schema valida `datos.ts` al cargarlo (ver catalogo.ts): si un instrumento
// está mal cargado se descarta, sin romper la página.

import { z } from "zod";

export const CATEGORIAS_INSTRUMENTO = ["cedear-etf", "cedear-empresa", "accion-ar", "renta-fija"] as const;
export const NIVELES_RIESGO = ["bajo", "medio", "alto"] as const;
export const MONEDAS = ["ARS", "USD"] as const;
export const HORIZONTES = ["corto", "mediano", "largo"] as const;
export const PERFILES = ["Conservador", "Moderado", "Agresivo"] as const;
// Las mismas categorías que la cartera (lib/plataforma/cartera.ts).
export const CATEGORIAS_CARTERA = ["fija", "variable", "dividendos", "liquidez", "alternativo"] as const;
export const CRITERIOS = ["liquidez", "tamano", "diversificacion", "trayectoria", "referencia-local"] as const;

const textoCorto = z.string().trim().min(3).max(400);

export const instrumentoSchema = z
  .object({
    // Letras, números y guiones. En la URL se usa tal cual (/instrumentos/SPY).
    ticker: z.string().regex(/^[A-Z0-9-]{1,12}$/, "Ticker en mayúsculas, sin espacios"),
    nombre: z.string().trim().min(2).max(120),
    tipo: z.enum(["CEDEAR de ETF", "CEDEAR de acción", "Acción argentina", "Bono soberano", "Obligación negociable"]),
    categoria: z.enum(CATEGORIAS_INSTRUMENTO),
    sector: z.string().trim().min(2).max(60),
    // Monedas en las que se puede operar en el mercado local (BYMA).
    monedas: z.array(z.enum(MONEDAS)).min(1),
    // Cuántos CEDEARs equivalen a 1 acción (o cuota) del activo original. null si no es CEDEAR.
    ratio: z.number().positive().nullable(),
    riesgo: z.enum(NIVELES_RIESGO),
    horizonte: z.enum(HORIZONTES),
    descripcion: textoCorto,
    porQueEnLaLista: textoCorto,
    criterios: z.array(z.enum(CRITERIOS)).min(1),
    riesgos: z.array(textoCorto).min(1).max(5),
    // Perfiles para los que sirve como EJEMPLO educativo (nunca "lo que te conviene").
    perfilesEjemplo: z.array(z.enum(PERFILES)).min(1),
    // En qué categorías de la cartera sugerida aparece como ejemplo.
    categoriasCartera: z.array(z.enum(CATEGORIAS_CARTERA)).min(1),
    fechaRevision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha AAAA-MM-DD"),
  })
  .refine((i) => (i.ratio !== null) === i.tipo.startsWith("CEDEAR"), {
    message: "Los CEDEARs llevan ratio y el resto no",
    path: ["ratio"],
  })
  .refine((i) => !(i.riesgo === "alto" && i.perfilesEjemplo.includes("Conservador")), {
    message: "Un instrumento de riesgo alto no puede ser ejemplo para el perfil conservador",
    path: ["perfilesEjemplo"],
  });

export type Instrumento = z.infer<typeof instrumentoSchema>;
export type CategoriaInstrumento = Instrumento["categoria"];
export type NivelRiesgo = Instrumento["riesgo"];
export type Moneda = (typeof MONEDAS)[number];
export type HorizonteInstrumento = Instrumento["horizonte"];
export type Criterio = (typeof CRITERIOS)[number];

// ---------- Textos para mostrar ----------

export const NOMBRE_CATEGORIA: Record<CategoriaInstrumento, string> = {
  "cedear-etf": "CEDEARs de ETFs",
  "cedear-empresa": "CEDEARs de empresas",
  "accion-ar": "Acciones argentinas",
  "renta-fija": "Bonos y ONs",
};

export const NOMBRE_RIESGO: Record<NivelRiesgo, string> = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" };

export const NOMBRE_HORIZONTE: Record<HorizonteInstrumento, string> = {
  corto: "Menos de 2 años",
  mediano: "2 a 5 años",
  largo: "Más de 5 años",
};

export const NOMBRE_CRITERIO: Record<Criterio, string> = {
  liquidez: "Muy negociado (líquido)",
  tamano: "Empresa o fondo de gran tamaño",
  diversificacion: "Diversifica en muchas empresas",
  trayectoria: "Larga trayectoria",
  "referencia-local": "Referencia del mercado local",
};
