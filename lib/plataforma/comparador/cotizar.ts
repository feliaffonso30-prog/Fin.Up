// Cotiza cada alternativa para el monto, plazo y condición (cliente o no) del
// usuario, y arma rankings. Puro y determinístico: mismos datos, mismo orden.
// El orden es por número ("mayor ganancia estimada"), nunca una recomendación.

import { interesCompuesto, interesSimple, rendimientoUva, tasaReal, tnaATea, tnaATem, teaATem } from "../finanzas";
import { ars } from "../formato";
import type { Alternativa, Consulta, Cotizacion, Inflacion, TipoAlternativa, Tramo } from "./tipos";

const DIAS_REFERENCIA = 30; // la TNA "de cartel" de un plazo fijo es a 30 días

const enRango = (x: number, min: number | null, max: number | null) =>
  (min === null || x >= min) && (max === null || x <= max);

/**
 * TNA de un plazo fijo para esta consulta.
 * - Si el banco informa tramos por plazo/monto, usa el que corresponde. Si no hay
 *   uno exacto para esos días, usa el tramo más largo que no se pase del plazo
 *   (o la tasa a 30 días) y lo aclara.
 * - No clientes: si la tasa es la misma que para clientes, los tramos valen para
 *   todos; si es distinta, se usa la tasa para no clientes (informada a 30 días).
 */
export function tnaPlazoFijo(
  alt: Alternativa,
  c: Consulta,
): { tna: number | null; nota?: string; tasaBase?: boolean } {
  const aproximada = `El banco no informa una tasa exacta para ${c.dias} días: se muestra la más cercana. Verificala en el banco.`;
  const notaBase = c.dias !== DIAS_REFERENCIA ? aproximada : undefined;

  if (!c.esCliente) {
    if (alt.tnaNoClientes == null) return { tna: null };
    if (alt.tnaNoClientes !== alt.tna) return { tna: alt.tnaNoClientes, nota: notaBase, tasaBase: true };
  }

  const porMonto = (alt.tramos ?? []).filter((t) => enRango(c.monto, t.montoMinimo, t.montoMaximo));
  const exactos = porMonto.filter((t) => enRango(c.dias, t.plazoMinDias, t.plazoMaxDias));
  if (exactos.length > 0) return { tna: Math.max(...exactos.map((t) => t.tna)) };

  const menores = porMonto.filter((t): t is Tramo & { plazoMinDias: number } => t.plazoMinDias !== null && t.plazoMinDias <= c.dias);
  if (menores.length > 0) {
    const largo = Math.max(...menores.map((t) => t.plazoMinDias));
    const tna = Math.max(...menores.filter((t) => t.plazoMinDias === largo).map((t) => t.tna));
    return { tna, nota: aproximada };
  }
  return { tna: alt.tna, nota: notaBase, tasaBase: true };
}

function noDisponible(alt: Alternativa, motivo: string, tna = alt.tna): Cotizacion {
  return {
    alternativa: alt,
    disponible: false,
    motivoNoDisponible: motivo,
    tna,
    tea: alt.tea,
    tem: alt.tem,
    ganancia: 0,
    rendimientoPeriodo: 0,
    tasaRealMensual: null,
    leGanaALaInflacion: null,
    notas: [],
    nota: alt.nota,
  };
}

export function cotizar(alt: Alternativa, c: Consulta, inflacion: Inflacion | null): Cotizacion {
  if (!(c.monto > 0) || !(c.dias > 0)) return noDisponible(alt, "Ingresá un monto y un plazo.");
  if (alt.montoMinimo !== null && c.monto < alt.montoMinimo) {
    return noDisponible(alt, `Monto mínimo: ${ars(alt.montoMinimo)}.`);
  }
  if (alt.montoMaximo !== null && c.monto > alt.montoMaximo) {
    return noDisponible(alt, `Monto máximo: ${ars(alt.montoMaximo)}.`);
  }
  if (alt.plazoMinDias !== null && c.dias < alt.plazoMinDias) {
    return noDisponible(alt, `Plazo mínimo: ${alt.plazoMinDias} días.`);
  }

  const notas: string[] = [];
  let nota = alt.nota;
  let tna = alt.tna;
  let tea = alt.tea;
  let tem = alt.tem;
  let rendimientoPeriodo: number;
  let temNominal: number; // lo que rinde en un mes, antes de descontar inflación

  switch (alt.capitalizacion) {
    case "simple": {
      const r = alt.tipo === "plazo-fijo" ? tnaPlazoFijo(alt, c) : { tna: alt.tna, tasaBase: true };
      if (r.tna === null) return noDisponible(alt, "No ofrece plazo fijo a no clientes.");
      if (r.nota) notas.push(r.nota);
      // Las condiciones que informa el banco describen su tasa de cartel (30 días):
      // si se usa la tasa de otro tramo, no aplican.
      if (!r.tasaBase && c.dias !== DIAS_REFERENCIA) nota = undefined;
      tna = r.tna;
      tea = tnaATea(tna);
      tem = tnaATem(tna);
      rendimientoPeriodo = interesSimple(1, tna, c.dias);
      temNominal = tem;
      break;
    }
    case "compuesta":
      rendimientoPeriodo = interesCompuesto(1, tea, c.dias);
      temNominal = teaATem(tea);
      break;
    case "uva":
      if (!inflacion) return noDisponible(alt, "Falta el dato de inflación para estimarlo.");
      rendimientoPeriodo = rendimientoUva(tna, inflacion.mensual, c.dias);
      temNominal = rendimientoUva(tna, inflacion.mensual, 30);
      notas.push(
        `Estimado suponiendo que la inflación sigue en ${(inflacion.mensual * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}% mensual. Si cambia, cambia la ganancia.`,
      );
      break;
  }

  const tasaRealMensual = inflacion ? tasaReal(temNominal, inflacion.mensual) : null;
  return {
    alternativa: alt,
    disponible: true,
    tna,
    tea,
    tem,
    ganancia: c.monto * rendimientoPeriodo,
    rendimientoPeriodo,
    tasaRealMensual,
    leGanaALaInflacion: tasaRealMensual === null ? null : tasaRealMensual > 0,
    notas,
    nota,
  };
}

export type Orden = "ganancia" | "tna" | "patrimonio";

/** Disponibles primero, de mayor a menor según `orden`; desempate por nombre. */
export function ranking(cotizaciones: Cotizacion[], orden: Orden = "ganancia"): Cotizacion[] {
  const valor = (x: Cotizacion) =>
    orden === "ganancia" ? x.ganancia : orden === "tna" ? x.tna : (x.alternativa.patrimonio ?? 0);
  return [...cotizaciones].sort(
    (a, b) =>
      Number(b.disponible) - Number(a.disponible) ||
      valor(b) - valor(a) ||
      a.alternativa.entidad.localeCompare(b.alternativa.entidad, "es") ||
      a.alternativa.producto.localeCompare(b.alternativa.producto, "es"),
  );
}

export function cotizarTodas(alternativas: Alternativa[], c: Consulta, inflacion: Inflacion | null, orden?: Orden) {
  return ranking(
    alternativas.map((a) => cotizar(a, c, inflacion)),
    orden,
  );
}

/** La de mayor ganancia estimada de cada tipo (solo entre las disponibles). */
export function mejorPorTipo(cotizaciones: Cotizacion[]): Partial<Record<TipoAlternativa, Cotizacion>> {
  const mejores: Partial<Record<TipoAlternativa, Cotizacion>> = {};
  for (const c of ranking(cotizaciones)) {
    if (c.disponible && !mejores[c.alternativa.tipo]) mejores[c.alternativa.tipo] = c;
  }
  return mejores;
}
