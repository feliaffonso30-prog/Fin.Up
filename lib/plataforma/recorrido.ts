import { AVISO_DEUDAS, AVISO_FONDO } from "./cartera";
import { hrefComparador } from "./comparador/desde-cartera";
import { ejemplosPara } from "./instrumentos/catalogo";
import type { Categoria, Plan } from "./tipos";

// El recorrido guiado: unos pocos pasos, en orden, armados por reglas fijas según
// las respuestas. Primero lo que protege (deudas caras, colchón de emergencia),
// después entender el plan, ver ejemplos reales y aprender a detectar el humo
// antes de salir a comparar tasas. Nada se bloquea y nunca dice qué comprar.
// "Tu siguiente paso" en Mi plan es el primer paso que falta.

export type AccionPaso =
  | { tipo: "enlace"; href: string; etiqueta: string }
  | { tipo: "finbot"; pregunta: string; etiqueta: string }
  | { tipo: "parte"; categoria: Categoria; etiqueta: string };

export type IdPaso = "perfil" | "deudas" | "colchon" | "cartera" | "ejemplos" | "humo" | "pesos";

export interface PasoRecorrido {
  id: IdPaso;
  /** Nombre corto para la lista de pasos. */
  corto: string;
  titulo: string;
  texto: string;
  /** El primer paso (armar el perfil) ya está hecho y no tiene acción. */
  accion: AccionPaso | null;
  /** Título del aviso del plan que este paso ya cubre: no hace falta repetirlo abajo. */
  aviso?: string;
}

export const LECCION_HUMO = "anti-humo";

export function armarRecorrido(plan: Plan): PasoRecorrido[] {
  const r = plan.respuestas;
  const porTamanio = [...plan.posiciones].sort((a, b) => b.porcentaje - a.porcentaje);
  const mayor = porTamanio[0];
  const liquidez = plan.posiciones.find((p) => p.categoria === "liquidez");
  const hrefLiquidez = (liquidez && hrefComparador(liquidez)) ?? "/comparador?tab=billeteras";

  const pasos: PasoRecorrido[] = [
    { id: "perfil", corto: "Armá tu perfil", titulo: "Armaste tu perfil", texto: "Ya sabemos qué buscás y cuánto riesgo tolerás.", accion: null },
  ];

  if (r.deudasCaras) {
    pasos.push({
      id: "deudas",
      corto: "Ordená tus deudas caras",
      titulo: "Primero, tus deudas caras",
      texto:
        "Pagar una deuda con tasa alta te ahorra más de lo que te daría casi cualquier inversión, y sin riesgo. Empezá por ahí: tu plan te espera.",
      accion: {
        tipo: "finbot",
        pregunta: "Tengo deudas con tasas altas. ¿Cómo las ordeno antes de empezar a invertir?",
        etiqueta: "Preguntale a FinBot cómo empezar",
      },
      aviso: AVISO_DEUDAS,
    });
  }

  if (r.fondoEmergencia !== "si") {
    pasos.push({
      id: "colchon",
      corto: "Armá tu colchón",
      titulo: "Armá tu colchón de emergencia",
      texto:
        "Antes que lo demás, separá entre 3 y 6 meses de gastos en algo que puedas sacar al instante. Así un imprevisto no te obliga a vender con pérdida.",
      accion: { tipo: "enlace", href: hrefLiquidez, etiqueta: "Ver dónde dejar esos pesos" },
      aviso: AVISO_FONDO,
    });
  }

  pasos.push({
    id: "cartera",
    corto: "Entendé tu plan",
    titulo: "Entendé la parte más grande de tu plan",
    texto: `${mayor.nombre} es el ${mayor.porcentaje}% de tu plan. Antes de invertir, mirá qué es, por qué está y qué puede salir mal.`,
    accion: { tipo: "parte", categoria: mayor.categoria, etiqueta: "Ver esa parte" },
  });

  // La parte más grande que tenga fichas de ejemplo para este perfil.
  const conEjemplo = porTamanio
    .map((p) => ({ p, ejemplo: ejemplosPara(p.categoria, plan.perfil.perfil, 1)[0] }))
    .find((x) => x.ejemplo);
  pasos.push({
    id: "ejemplos",
    corto: "Mirá qué hay adentro",
    titulo: "Mirá qué hay adentro",
    texto: conEjemplo
      ? `Cómo es de verdad un instrumento de "${conEjemplo.p.nombre}", explicado en una ficha: qué es y qué puede salir mal.`
      : "Cómo son de verdad los instrumentos que hay detrás de cada parte, explicados en fichas.",
    accion: {
      tipo: "enlace",
      href: conEjemplo ? `/instrumentos/${conEjemplo.ejemplo.ticker}` : "/instrumentos",
      etiqueta: "Ver un ejemplo real",
    },
  });

  pasos.push({
    id: "humo",
    corto: "Aprendé a detectar el humo",
    titulo: "Aprendé a detectar el humo",
    texto: "Las señales de una estafa o de un falso gurú, en 2 minutos. Conviene leerlo antes de salir a buscar dónde poner tu plata.",
    accion: { tipo: "enlace", href: `/aprender#${LECCION_HUMO}`, etiqueta: "Leer la lección" },
  });

  // Con el colchón ya armado, el paso de comparar tasas va al final, después de la lección.
  if (r.fondoEmergencia === "si") {
    pasos.push({
      id: "pesos",
      corto: "Mirá dónde dejar tus pesos",
      titulo: "Mirá dónde dejar tus pesos",
      texto: "Compará cuánto rendiría la parte de tu plan para tener disponible, y si le gana a la inflación.",
      accion: { tipo: "enlace", href: hrefLiquidez, etiqueta: "Comparar opciones" },
    });
  }

  return pasos;
}

/** El primer paso que falta, o null si terminó. "perfil" siempre cuenta como hecho. */
export function pasoActual(pasos: PasoRecorrido[], hechos: readonly string[]): PasoRecorrido | null {
  return pasos.find((p) => p.id !== "perfil" && !hechos.includes(p.id)) ?? null;
}

/** Cuántos pasos están hechos, contando el perfil. */
export function cantidadHechos(pasos: PasoRecorrido[], hechos: readonly string[]): number {
  return pasos.filter((p) => p.id === "perfil" || hechos.includes(p.id)).length;
}
