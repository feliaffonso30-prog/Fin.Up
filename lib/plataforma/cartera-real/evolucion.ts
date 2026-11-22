// "Cómo fue cambiando lo que tenés": dos formas de ver la evolución del total.
// - Desde que compraste: reconstruida con los cierres de cada día (series históricas).
// - Desde que usás FinUp: una foto por día con lo que la pantalla mostró ese día.
// Puro: series, fotos y fecha llegan de afuera.

import { simbolosPrecio } from "./activos";
import { cierreEnFecha, restarDias, type Cierre } from "./historico";
import { costoDe, valuarTenencia } from "./valuar";
import type { Precios, Tenencia, Valuacion } from "./tipos";

export interface PuntoEvolucion {
  /** AAAA-MM-DD */
  fecha: string;
  valorArs: number;
  valorUsd: number;
  /** Lo que había puesto hasta ese día. */
  costoArs: number;
  costoUsd: number;
}

/** Máximo de puntos del gráfico: con más días, se toma uno cada tanto. */
export const MAX_PUNTOS = 120;

function sumarDias(fecha: string, dias: number): string {
  return restarDias(fecha, -dias);
}

/** Las fechas del gráfico, de `desde` a `hasta`, como mucho `max` (siempre incluye la última). */
export function fechasDelGrafico(desde: string, hasta: string, max = MAX_PUNTOS): string[] {
  if (desde > hasta) return [];
  const todas: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) todas.push(d);
  if (todas.length <= max) return todas;
  const paso = Math.ceil(todas.length / max);
  const elegidas = todas.filter((_, i) => i % paso === 0);
  if (elegidas.at(-1) !== hasta) elegidas.push(hasta);
  return elegidas;
}

/**
 * Reconstruye cuánto valía todo cada día, desde la primera compra hasta hoy.
 * - Lo que tiene precio (CEDEARs, BYMA, cripto): cantidad × cierre de ese día.
 * - Plazo fijo y cuentas que rinden: calculado con la tasa hasta ese día.
 * - Lo cargado a mano: lo que puso hasta que cargó un valor, después ese valor.
 * - Si un día falta el precio, cuenta lo que puso (la línea queda plana, no inventa).
 */
export function reconstruirEvolucion(
  tenencias: readonly Tenencia[],
  series: Record<string, Cierre[]>,
  mep: readonly Cierre[],
  hoy: string,
  max = MAX_PUNTOS,
): PuntoEvolucion[] {
  if (tenencias.length === 0) return [];
  const desde = tenencias.reduce((m, t) => (t.fecha < m ? t.fecha : m), hoy);
  return fechasDelGrafico(desde, hoy, max).map((dia) => {
    const mepDia = cierreEnFecha(mep, dia)?.cierre;
    const punto: PuntoEvolucion = { fecha: dia, valorArs: 0, valorUsd: 0, costoArs: 0, costoUsd: 0 };
    for (const t of tenencias) {
      if (t.fecha > dia) continue;
      const costo = costoDe(t);
      const mepRef = mepDia ?? t.mepAlAnotar;
      punto.costoUsd += costo.usd;
      punto.costoArs += costo.ars;

      let valorUsd: number | null = null;
      if (t.tipo === "manual") {
        const vm = t.valorManual;
        if (vm && vm.fecha <= dia) valorUsd = vm.moneda === "USD" ? vm.monto : vm.monto / mepRef;
      } else {
        const precios: Precios = {};
        for (const s of simbolosPrecio(t)) {
          const c = cierreEnFecha(series[s] ?? [], dia);
          if (c) precios[s] = { simbolo: s, precio: c.cierre, moneda: s.includes(":") ? "ARS" : "USD", variacionDiaPct: null, actualizado: c.fecha, fuente: "" };
        }
        valorUsd = valuarTenencia(t, precios, mepRef, dia).valorUsd;
      }
      const usdFinal = valorUsd ?? costo.usd;
      punto.valorUsd += usdFinal;
      punto.valorArs += usdFinal * mepRef;
    }
    return punto;
  });
}

/** El último punto se reemplaza por la valuación en vivo, para que el gráfico termine donde termina la cifra grande. */
export function conPuntoDeHoy(puntos: PuntoEvolucion[], v: Valuacion, hoy: string): PuntoEvolucion[] {
  if (v.incompleta || !(v.totalUsd > 0)) return puntos;
  const hoyPunto: PuntoEvolucion = { fecha: hoy, valorArs: v.totalArs, valorUsd: v.totalUsd, costoArs: v.costoArs, costoUsd: v.costoUsd };
  return [...puntos.filter((p) => p.fecha < hoy), hoyPunto];
}

// ---------- Fotos diarias (desde que usás FinUp) ----------

export type FotoDia = PuntoEvolucion;

/** Cuántos días guardamos como mucho (unos tres años). */
export const MAX_FOTOS = 1100;

/** Agrega o reemplaza la foto del día. Ordenadas por fecha, sin pasarse de MAX_FOTOS. */
export function registrarFoto(fotos: readonly FotoDia[], foto: FotoDia, max = MAX_FOTOS): FotoDia[] {
  const otras = fotos.filter((f) => f.fecha !== foto.fecha);
  return [...otras, foto].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-max);
}

/** La foto de hoy, solo si la valuación está completa (si falta un precio, no se guarda un total falso). */
export function fotoDeHoy(v: Valuacion, hoy: string): FotoDia | null {
  if (v.incompleta || !(v.totalUsd > 0)) return null;
  return { fecha: hoy, valorArs: v.totalArs, valorUsd: v.totalUsd, costoArs: v.costoArs, costoUsd: v.costoUsd };
}
