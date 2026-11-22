// "Cómo se movió": un resumen de una o dos frases armado SOLO con datos y reglas fijas.
// No explica causas (eso no lo sabemos): para eso está el botón de FinBot, con la
// pregunta ya armada. Describe, nunca dice qué hacer (lo exige el test).

import { ars, pct, usd } from "@/lib/plataforma/formato";
import type { MonedaTenencia, TenenciaValuada, Valuacion } from "./tipos";

/** Debajo de este % el día se cuenta como "casi no se movió". */
export const UMBRAL_QUIETO_PCT = 0.1;
/** Si una sola inversión explica al menos esta parte del movimiento, se dice "casi todo". */
const CASI_TODO = 0.7;

export interface Resumen {
  /** Una o dos frases cortas. Vacío si no hay nada con precio del día. */
  frases: string[];
  /** La inversión que más pesó en el día (para buscar noticias y armar la pregunta). */
  protagonista: TenenciaValuada | null;
  /** Lo que se movió el día, en la moneda pedida (con signo). */
  movimientoDia: number;
  /** La pregunta para FinBot, lista para mandar. */
  preguntaFinBot: string;
}

/** Sábado o domingo (fecha AAAA-MM-DD): el "día" de las acciones es el último hábil. */
export function esFinDeSemana(fecha: string): boolean {
  const d = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
}

export function resumirMovimiento(v: Valuacion, moneda: MonedaTenencia, mepHoy: number, hoy: string): Resumen {
  const enMoneda = (montoUsd: number) => (moneda === "USD" ? montoUsd : montoUsd * mepHoy);
  const plata = (n: number) => (moneda === "USD" ? usd(Math.abs(n)) : ars(Math.abs(n)));
  const cuando = esFinDeSemana(hoy) ? "En el último día de mercado" : "Hoy";

  const conDia = v.tenencias.filter((t) => t.variacionDiaUsd !== null && t.valorUsd !== null && t.metodo !== "calculado");
  const dia = enMoneda(v.variacionDiaUsd);
  const total = moneda === "USD" ? v.totalUsd : v.totalArs;
  const ayer = total - dia;
  const diaPct = ayer > 0 ? (dia / ayer) * 100 : 0;
  const frases: string[] = [];

  // 1. El día.
  let protagonista: TenenciaValuada | null = null;
  if (conDia.length > 0) {
    if (Math.abs(diaPct) < UMBRAL_QUIETO_PCT) {
      frases.push(`${cuando} tus inversiones casi no se movieron.`);
    } else {
      const verbo = dia > 0 ? "subieron" : "bajaron";
      frases.push(`${cuando} tus inversiones ${verbo} ${plata(dia)} (${dia > 0 ? "+" : "−"}${pct(Math.abs(diaPct))}).`);

      // 2. Qué pesó más: la que más se movió en la misma dirección que el total.
      const mismoSentido = conDia
        .filter((t) => Math.sign(t.variacionDiaUsd ?? 0) === Math.sign(v.variacionDiaUsd))
        .sort((a, b) => Math.abs(b.variacionDiaUsd ?? 0) - Math.abs(a.variacionDiaUsd ?? 0));
      protagonista = mismoSentido[0] ?? null;
      if (protagonista && conDia.length > 1) {
        const aporte = enMoneda(protagonista.variacionDiaUsd ?? 0);
        const parte = Math.abs(protagonista.variacionDiaUsd ?? 0) / Math.abs(v.variacionDiaUsd || 1);
        const nombre = protagonista.tenencia.nombre;
        const cola = protagonista.tenencia.categoria === "alternativo" ? ", que es la parte que más sube y baja" : "";
        if (dia > 0) {
          frases.push(`${parte >= CASI_TODO ? "Casi toda la suba vino de" : "Lo que más sumó fue"} ${nombre} (unos ${plata(aporte)})${cola}.`);
        } else {
          frases.push(`${parte >= CASI_TODO ? "Casi toda la baja vino de" : "La baja más grande vino de"} ${nombre} (unos ${plata(aporte)})${cola}.`);
        }
      }
    }
  }
  // El resultado desde el principio no se repite acá: ya lo dice la cifra grande de arriba.

  return { frases, protagonista, movimientoDia: dia, preguntaFinBot: armarPregunta(protagonista, diaPct, cuando) };
}

/** La pregunta para FinBot: queda escrita en el chat, la persona la manda. */
export function armarPregunta(protagonista: TenenciaValuada | null, diaPct: number, cuando: string): string {
  const pie = "Explicámelo simple, decime qué noticias podrían tener que ver y aclarame qué no se sabe. No me digas qué hacer.";
  if (!protagonista || Math.abs(diaPct) < UMBRAL_QUIETO_PCT) {
    return `Tengo anotadas mis inversiones en FinUp. ¿Qué pasó en el mercado ${cuando === "Hoy" ? "hoy" : "en el último día"}? ${pie}`;
  }
  const t = protagonista.tenencia;
  const mov = protagonista.variacionDiaUsd ?? 0;
  const base = (protagonista.valorUsd ?? 0) - mov;
  const p = base > 0 ? (mov / base) * 100 : 0;
  const quien = t.simbolo ? `${t.nombre} (${t.simbolo})` : t.nombre;
  return `${quien} ${mov >= 0 ? "subió" : "bajó"} ${pct(Math.abs(p))} ${cuando === "Hoy" ? "hoy" : "en el último día de mercado"}. ¿Por qué se pudo haber movido así? ${pie}`;
}
