import { CATALOGO } from "@/lib/finbot/knowledge";
import type {
  Analisis,
  Aviso,
  Categoria,
  PerfilRiesgo,
  Posicion,
  Respuestas,
  Volatilidad,
} from "./tipos";

// Distribución por categoría (en puntos porcentuales, siempre suma 100).
export type Distribucion = Record<Categoria, number>;

const CATEGORIAS: Categoria[] = ["fija", "variable", "dividendos", "liquidez", "alternativo"];

// Punto de partida según el perfil de riesgo.
const BASE: Record<PerfilRiesgo, Distribucion> = {
  Conservador: { fija: 55, variable: 15, dividendos: 10, liquidez: 20, alternativo: 0 },
  Moderado: { fija: 25, variable: 50, dividendos: 15, liquidez: 10, alternativo: 0 },
  Agresivo: { fija: 10, variable: 65, dividendos: 10, liquidez: 5, alternativo: 10 },
};

// Mueve hasta `puntos` de una categoría a otra, sin dejar la de origen en negativo.
function mover(d: Distribucion, desde: Categoria, hacia: Categoria, puntos: number) {
  const p = Math.min(puntos, d[desde]);
  if (p <= 0) return;
  d[desde] -= p;
  d[hacia] += p;
}

// Sube `categoria` hasta `minimo` tomando de las fuentes, en orden.
function asegurarMinimo(d: Distribucion, categoria: Categoria, minimo: number, fuentes: Categoria[]) {
  for (const f of fuentes) {
    const falta = minimo - d[categoria];
    if (falta <= 0) return;
    mover(d, f, categoria, falta);
  }
}

export function calcularDistribucion(perfil: PerfilRiesgo, r: Respuestas): Distribucion {
  const d: Distribucion = { ...BASE[perfil] };

  // Objetivo
  if (r.objetivo === "Preservar capital") {
    mover(d, "alternativo", "fija", 10);
    mover(d, "variable", "fija", 10);
  } else if (r.objetivo === "Generar ingresos") {
    mover(d, "variable", "dividendos", 10);
  }

  // Plazo menor a 2 años: sin activos que suben y bajan fuerte (acciones, ETFs,
  // dividendos, cripto). Esa plata va a renta fija corta y a liquidez.
  if (r.horizonte === "menos-2") {
    mover(d, "alternativo", "liquidez", d.alternativo);
    mover(d, "variable", "fija", d.variable);
    mover(d, "dividendos", "liquidez", d.dividendos);
  }

  // Sin colchón para imprevistos, una parte va a liquidez
  if (r.fondoEmergencia === "no") {
    asegurarMinimo(d, "liquidez", 25, ["alternativo", "variable", "dividendos", "fija"]);
  } else if (r.fondoEmergencia === "parcial") {
    asegurarMinimo(d, "liquidez", 15, ["alternativo", "variable", "dividendos", "fija"]);
  }

  return d;
}

// ---------- Contenido por categoría ----------

interface Contenido {
  nombre: string;
  color: string;
  queEs: string;
  ventaja: string;
  queSalePuedeMal: string;
  volatilidad: Volatilidad;
}

const CONTENIDO: Record<Categoria, Contenido> = {
  fija: {
    nombre: "Renta fija (bonos, Lecaps y ONs)",
    color: "bg-blue-600",
    queEs: "Préstamos que le hacés al Estado o a empresas: te devuelven tu plata más intereses en fechas pactadas.",
    ventaja: "Ingresos más previsibles y menos sobresaltos que las acciones.",
    queSalePuedeMal:
      "Si quien emitió el bono no paga (default), perdés parte o todo. Además, si suben las tasas el precio del bono baja, y en pesos la inflación puede dejar el rendimiento por debajo de los precios.",
    volatilidad: "Baja",
  },
  variable: {
    nombre: "Acciones y ETFs (vía CEDEARs)",
    color: "bg-cyan-500",
    queEs:
      "Partes de empresas, o canastas con muchas empresas. Su valor sube y baja según los resultados de las empresas y el humor del mercado.",
    ventaja: "Históricamente es lo que más crece en plazos largos.",
    queSalePuedeMal:
      "Puede caer 30% o 40% en un mal año y tardar años en recuperarse. Si necesitás la plata justo cuando está abajo, la perdés.",
    volatilidad: "Alta",
  },
  dividendos: {
    nombre: "Acciones y ETFs de dividendos",
    color: "bg-sky-400",
    queEs: "Empresas maduras que reparten parte de sus ganancias en efectivo, de forma periódica.",
    ventaja: "Te generan ingresos aunque el precio no suba.",
    queSalePuedeMal:
      "Los dividendos no están garantizados: una empresa puede reducirlos o suspenderlos, y el precio puede caer igual.",
    volatilidad: "Media",
  },
  liquidez: {
    nombre: "Liquidez (FCI money market y cauciones)",
    color: "bg-slate-400",
    queEs: "Plata disponible casi al instante que rinde algo mientras tanto.",
    ventaja: "Es tu colchón: podés usarla sin vender nada con pérdida.",
    queSalePuedeMal:
      "Rinde poco y, si la inflación es alta, puede perder poder de compra. En un FCI el rendimiento no está garantizado.",
    volatilidad: "Muy baja",
  },
  alternativo: {
    nombre: "Alternativos (cripto y oro)",
    color: "bg-indigo-400",
    queEs: "Activos que no son ni empresas ni préstamos, como las criptomonedas o el oro.",
    ventaja: "Se mueven distinto al resto, lo que puede ayudar a diversificar.",
    queSalePuedeMal:
      "Las criptomonedas pueden perder más de la mitad de su valor en un año y no tienen respaldo de nadie. Es la parte más riesgosa de la cartera.",
    volatilidad: "Muy alta",
  },
};

function porQue(cat: Categoria, pct: number, perfil: PerfilRiesgo, r: Respuestas): string {
  switch (cat) {
    case "fija":
      if (perfil === "Conservador") return `Es la base de tu cartera (${pct}%) porque priorizás no tener sobresaltos: te da ingresos más previsibles.`;
      if (perfil === "Moderado") return `Un ${pct}% en renta fija amortigua los golpes cuando las acciones caen.`;
      return `Solo un ${pct}%: alcanza para tener un amortiguador sin frenar demasiado el crecimiento.`;
    case "variable":
      if (perfil === "Conservador") return `Una parte chica (${pct}%) para que tu plata no pierda contra la inflación a largo plazo.`;
      if (perfil === "Moderado") return `Es el motor de crecimiento (${pct}%): con tu horizonte podés aguantar las subas y bajas.`;
      return `Es el centro de tu estrategia (${pct}%): buscás crecer a largo plazo y aceptás caídas fuertes en el camino.`;
    case "dividendos":
      if (r.objetivo === "Generar ingresos") return `Como tu objetivo es generar ingresos, le damos un ${pct}% a empresas que reparten ganancias de forma periódica.`;
      return `Suma ingresos periódicos (${pct}%) y suele moverse menos que el resto de las acciones.`;
    case "liquidez":
      if (r.fondoEmergencia === "no") return `Subimos tu liquidez a ${pct}% porque todavía no tenés un fondo de emergencia: así evitás vender inversiones con pérdida ante un imprevisto.`;
      if (r.fondoEmergencia === "parcial") return `Reforzamos la liquidez (${pct}%) porque tu fondo de emergencia todavía no está completo.`;
      if (r.horizonte === "menos-2") return `Como vas a necesitar la plata pronto, dejamos ${pct}% disponible al instante.`;
      return `Un colchón del ${pct}% para imprevistos y para no tener que vender inversiones con pérdida.`;
    case "alternativo":
      return `Una porción chica (${pct}%) para diversificar. Es la parte más riesgosa: no pongas acá plata que no estés dispuesto a perder.`;
  }
}

export function armarPosiciones(d: Distribucion, perfil: PerfilRiesgo, r: Respuestas): Posicion[] {
  return CATEGORIAS.filter((c) => d[c] > 0)
    .map((c): Posicion => {
      const base = CONTENIDO[c];
      return {
        categoria: c,
        nombre: base.nombre,
        porcentaje: d[c],
        montoInicial: Math.round((r.capitalInicial * d[c]) / 100),
        color: base.color,
        queEs: base.queEs,
        ventaja: base.ventaja,
        porQueEnTuCartera: porQue(c, d[c], perfil, r),
        queSalePuedeMal: base.queSalePuedeMal,
        volatilidad: base.volatilidad,
        ejemplos: CATALOGO[c].slice(0, 3),
      };
    })
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

// ---------- Análisis ----------
// Supuestos ILUSTRATIVOS por categoría. No son promesas ni datos reales: sirven
// para mostrar un rango razonable y, sobre todo, cuánto podría caer en un mal año.

const SUPUESTOS: Record<Categoria, { min: number; max: number; caida: number }> = {
  fija: { min: 3, max: 7, caida: -8 },
  variable: { min: 4, max: 10, caida: -35 },
  alternativo: { min: -10, max: 25, caida: -60 },
  liquidez: { min: 1, max: 4, caida: 0 },
  dividendos: { min: 4, max: 8, caida: -25 },
};

export function analizar(d: Distribucion): Analisis {
  let retornoMin = 0;
  let retornoMax = 0;
  let caida = 0;
  for (const c of CATEGORIAS) {
    const s = SUPUESTOS[c];
    retornoMin += (d[c] * s.min) / 100;
    retornoMax += (d[c] * s.max) / 100;
    caida += (d[c] * s.caida) / 100;
  }
  const nivelRiesgo = caida > -12 ? "Bajo" : caida > -22 ? "Medio" : "Alto";
  return { retornoMin, retornoMax, caida, nivelRiesgo };
}

// ---------- Avisos ----------

export const DESCARGO =
  "FinUp es una herramienta educativa. No es asesoramiento financiero ni garantiza resultados: toda inversión puede perder valor, y los rendimientos pasados no aseguran los futuros.";

export function generarAvisos(perfil: PerfilRiesgo, d: Distribucion, r: Respuestas): Aviso[] {
  const avisos: Aviso[] = [];

  if (r.deudasCaras) {
    avisos.push({
      nivel: "atencion",
      titulo: "Primero, tus deudas",
      texto:
        "Tenés deudas con tasas altas. Cancelarlas suele ser la \"inversión\" más segura que existe: ningún activo te rinde de forma garantizada lo que ahorrás en intereses.",
    });
  }
  if (r.fondoEmergencia !== "si") {
    avisos.push({
      nivel: "atencion",
      titulo: "Armá tu fondo de emergencia",
      texto:
        "Antes de invertir en activos que suben y bajan, conviene tener guardado entre 3 y 6 meses de gastos. Así no te ves obligado a vender con pérdida si surge un imprevisto.",
    });
  }
  if (r.horizonte === "menos-2") {
    avisos.push({
      nivel: "atencion",
      titulo: "Plazo muy corto",
      texto:
        "Con menos de 2 años dejamos tu cartera sin acciones ni cripto. Aun así, los bonos pueden oscilar de precio antes de vencer: si ese monto es clave para vos, mantené la mayor parte disponible.",
    });
  }
  if (perfil === "Agresivo" && r.objetivo === "Preservar capital") {
    avisos.push({
      nivel: "atencion",
      titulo: "Tu perfil y tu objetivo se contradicen",
      texto:
        "Tolerás mucho riesgo, pero tu objetivo es preservar capital. Ajustamos la cartera hacia renta fija; conviene que revises cuál de los dos pesa más para vos.",
    });
  }
  if (d.alternativo > 0) {
    avisos.push({
      nivel: "info",
      titulo: "Sobre los alternativos",
      texto:
        "Las criptomonedas pueden caer más de 50% en un año. Por eso les damos una porción chica: invertí ahí solo lo que podrías perder sin que cambie tu vida.",
    });
  }
  return avisos;
}

