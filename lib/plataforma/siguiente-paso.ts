import { AVISO_DEUDAS, AVISO_FONDO } from "./cartera";
import { hrefComparador } from "./comparador/desde-cartera";
import type { Categoria, Plan } from "./tipos";

// "Tu siguiente paso": una sola acción sugerida arriba de Mi plan, por reglas fijas.
// Primero lo que protege (deudas caras, colchón de emergencia) y recién después
// entender la parte más grande del plan. Nunca dice qué comprar.

export type AccionPaso =
  | { tipo: "enlace"; href: string; etiqueta: string }
  | { tipo: "finbot"; pregunta: string; etiqueta: string }
  | { tipo: "parte"; categoria: Categoria; etiqueta: string };

export interface SiguientePaso {
  titulo: string;
  texto: string;
  accion: AccionPaso;
  /** Título del aviso del plan que este paso ya cubre: no hace falta repetirlo abajo. */
  aviso?: string;
}

export function siguientePaso(plan: Plan): SiguientePaso {
  const r = plan.respuestas;

  if (r.deudasCaras) {
    return {
      titulo: "Primero, tus deudas caras",
      texto:
        "Pagar una deuda con tasa alta te ahorra más de lo que te daría casi cualquier inversión, y sin riesgo. Empezá por ahí: tu plan te espera.",
      accion: {
        tipo: "finbot",
        pregunta: "Tengo deudas con tasas altas. ¿Cómo las ordeno antes de empezar a invertir?",
        etiqueta: "Preguntale a FinBot cómo empezar",
      },
      aviso: AVISO_DEUDAS,
    };
  }

  if (r.fondoEmergencia !== "si") {
    const liquidez = plan.posiciones.find((p) => p.categoria === "liquidez");
    return {
      titulo: "Armá tu colchón de emergencia",
      texto:
        "Antes que lo demás, separá entre 3 y 6 meses de gastos en algo que puedas sacar al instante. Así un imprevisto no te obliga a vender con pérdida.",
      accion: {
        tipo: "enlace",
        href: (liquidez && hrefComparador(liquidez)) ?? "/comparador?tab=billeteras",
        etiqueta: "Ver dónde dejar esos pesos",
      },
      aviso: AVISO_FONDO,
    };
  }

  const mayor = plan.posiciones.reduce((a, b) => (b.porcentaje > a.porcentaje ? b : a));
  return {
    titulo: "Entendé la parte más grande de tu plan",
    texto: `${mayor.nombre} es el ${mayor.porcentaje}% de tu plan. Antes de invertir, mirá qué es, por qué está y qué puede salir mal.`,
    accion: { tipo: "parte", categoria: mayor.categoria, etiqueta: "Ver esa parte" },
  };
}
