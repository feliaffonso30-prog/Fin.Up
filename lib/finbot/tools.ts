import type { FunctionDeclaration } from "@google/genai";
import { z } from "zod";
import { obtenerCotizacion, obtenerIndicador } from "./market";
import { buscarConcepto, CATALOGO } from "./knowledge";

// Cada herramienta tiene: la declaración que ve Gemini, un esquema zod para
// validar lo que pide el modelo, y la función que la ejecuta.
interface Herramienta<T extends z.ZodTypeAny> {
  declaracion: FunctionDeclaration;
  esquema: T;
  ejecutar: (args: z.infer<T>) => Promise<unknown>;
  etiqueta: string; // texto que ve el usuario mientras corre
}

const herramienta = <T extends z.ZodTypeAny>(h: Herramienta<T>) => h;

const CATEGORIAS = ["fija", "variable", "dividendos", "liquidez", "alternativo"] as const;
const INDICADORES = ["dolar", "riesgo_pais", "inflacion", "merval", "sp500"] as const;

const HERRAMIENTAS = [
  herramienta({
    declaracion: {
      name: "cotizar_activo",
      description:
        "Precio actual y variación del día y del último mes de acciones, CEDEARs, ETFs, índices o cripto. " +
        "Símbolos: CEDEARs/acciones argentinas con sufijo .BA (AAPL.BA, GGAL.BA) en pesos; Wall Street sin sufijo (AAPL, SPY) en USD; " +
        "índices ^MERV y ^GSPC; cripto BTC-USD, ETH-USD.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          simbolos: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5, description: "Hasta 5 símbolos a cotizar" },
        },
        required: ["simbolos"],
      },
    },
    esquema: z.object({ simbolos: z.array(z.string()).min(1).max(5) }),
    ejecutar: async ({ simbolos }) => {
      const res = await Promise.allSettled(simbolos.map(obtenerCotizacion));
      return res.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        const error = String(r.reason?.message ?? r.reason);
        console.warn(`[finbot] cotización falló: ${simbolos[i]}`, error);
        return { simbolo: simbolos[i], error };
      });
    },
    etiqueta: "Consultando cotizaciones…",
  }),
  herramienta({
    declaracion: {
      name: "indicadores_mercado",
      description:
        "Indicadores clave de Argentina y el mundo en tiempo real: cotizaciones del dólar (oficial, blue, MEP, CCL, cripto, tarjeta), " +
        "riesgo país, inflación mensual de los últimos 6 meses (INDEC), índice Merval y S&P 500.",
      parametersJsonSchema: {
        type: "object",
        properties: { indicador: { type: "string", enum: [...INDICADORES] } },
        required: ["indicador"],
      },
    },
    esquema: z.object({ indicador: z.enum(INDICADORES) }),
    ejecutar: ({ indicador }) => obtenerIndicador(indicador),
    etiqueta: "Revisando indicadores del mercado…",
  }),
  herramienta({
    declaracion: {
      name: "explicar_concepto",
      description:
        "Busca un término financiero en el glosario curado de FinUp (acción, bono, ON, CEDEAR, ETF, FCI, plazo fijo, caución, Lecap, " +
        "dólar MEP, riesgo país, inflación, diversificación, volatilidad, interés compuesto, dividendo, Merval, cripto, perfil de riesgo, broker). " +
        "Usala antes de explicar cualquier concepto.",
      parametersJsonSchema: {
        type: "object",
        properties: { termino: { type: "string", description: "Término a explicar, ej. 'cedear'" } },
        required: ["termino"],
      },
    },
    esquema: z.object({ termino: z.string().min(1) }),
    ejecutar: async ({ termino }) => {
      const encontrados = buscarConcepto(termino);
      return encontrados.length
        ? encontrados
        : { sinResultados: true, nota: "No está en el glosario: explicalo con el mismo estilo simple." };
    },
    etiqueta: "Buscando en el glosario…",
  }),
  herramienta({
    declaracion: {
      name: "activos_de_ejemplo",
      description:
        "Devuelve activos de ejemplo (curados por FinUp) para una categoría de la cartera: " +
        "fija (bonos, ONs, Lecaps), variable (acciones y ETFs), dividendos, liquidez (money market, caución) o alternativo (cripto, oro). " +
        "Usala cuando el usuario pregunte en qué invertir o cómo armar cada parte de su estrategia. Los que tienen símbolo se pueden cotizar con cotizar_activo.",
      parametersJsonSchema: {
        type: "object",
        properties: { categoria: { type: "string", enum: [...CATEGORIAS] } },
        required: ["categoria"],
      },
    },
    esquema: z.object({ categoria: z.enum(CATEGORIAS) }),
    ejecutar: async ({ categoria }) => CATALOGO[categoria],
    etiqueta: "Buscando activos de ejemplo…",
  }),
];

export const DECLARACIONES: FunctionDeclaration[] = HERRAMIENTAS.map((h) => h.declaracion);

export const etiquetaDe = (nombre?: string) =>
  HERRAMIENTAS.find((h) => h.declaracion.name === nombre)?.etiqueta ?? "Pensando…";

// Ejecuta la herramienta que pidió el modelo. Nunca lanza: si los argumentos
// son inválidos o una API externa falla, devuelve el error para que el modelo
// se lo explique al usuario en vez de romper el chat.
export async function ejecutarHerramienta(nombre: string | undefined, args: unknown): Promise<Record<string, unknown>> {
  const h = HERRAMIENTAS.find((x) => x.declaracion.name === nombre);
  if (!h) return { error: `Herramienta desconocida: ${nombre}` };

  const parsed = h.esquema.safeParse(args ?? {});
  if (!parsed.success) return { error: `Argumentos inválidos: ${parsed.error.message}` };

  try {
    // ejecutar acepta el tipo de su propio esquema; el cast es seguro tras safeParse
    return { resultado: await (h.ejecutar as (a: unknown) => Promise<unknown>)(parsed.data) };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Fuente no disponible";
    console.warn(`[finbot] herramienta falló: ${nombre}`, error);
    return { error };
  }
}
