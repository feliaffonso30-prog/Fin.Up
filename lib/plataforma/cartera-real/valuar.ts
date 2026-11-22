// Valuación de "Lo que tenés". Puro y determinístico: mismas tenencias, mismos
// precios y misma fecha → mismo resultado. La fecha de hoy y el dólar llegan como
// parámetros para poder testearlo.

import { DIAS_ANIO, interesSimple, tnaATea } from "@/lib/plataforma/finanzas";
import type { Categoria, PerfilRiesgo } from "@/lib/plataforma/tipos";
import { divisorPrecio, NOMBRE_CORTO_CATEGORIA, ratioDe, simboloByma, simboloMercado } from "./activos";
import type { DiferenciaPlan, MonedaTenencia, PrecioMercado, Precios, Tenencia, TenenciaValuada, Valuacion } from "./tipos";

const CATEGORIAS: Categoria[] = ["fija", "variable", "dividendos", "liquidez", "alternativo"];

/** Días entre dos fechas AAAA-MM-DD (0 si la segunda es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${hasta}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function aUsd(monto: number, moneda: MonedaTenencia, mep: number) {
  return moneda === "USD" ? monto : monto / mep;
}
function aArs(monto: number, moneda: MonedaTenencia, mep: number) {
  return moneda === "ARS" ? monto : monto * mep;
}

/** Lo que puso, en las dos monedas, con el dólar del día en que lo anotó. */
export function costoDe(t: Tenencia): { usd: number; ars: number } {
  const { monto, moneda } = t.invertido;
  return { usd: aUsd(monto, moneda, t.mepAlAnotar), ars: aArs(monto, moneda, t.mepAlAnotar) };
}

export interface PrecioUnitario {
  /** Precio de UNA unidad (un CEDEAR, una acción, un nominal, un BTC) en USD. */
  usd: number;
  /** El dato de donde sale (para la variación del día y la hora). */
  dato: PrecioMercado;
  /** true si es el precio de BYMA; false si es de EE.UU. o cripto. */
  deByma: boolean;
}

const enUsd = (p: PrecioMercado, mep: number) => (p.moneda === "USD" ? p.precio : p.precio / mep);

/**
 * Precio de UNA unidad en USD. Primero el de BYMA (en pesos, pasado con el MEP de hoy;
 * los bonos ÷ 100 porque cotizan cada 100 nominales). Si no está, un CEDEAR se estima con
 * el activo original ÷ ratio. null si no hay precio.
 */
export function precioUnitario(t: Pick<Tenencia, "tipo" | "simbolo">, precios: Precios, mepHoy: number): PrecioUnitario | null {
  const byma = simboloByma(t);
  const pb = byma ? precios[byma] : undefined;
  if (pb && pb.precio > 0 && (pb.moneda === "USD" || mepHoy > 0)) {
    return { usd: enUsd(pb, mepHoy) / divisorPrecio(t.simbolo), dato: pb, deByma: true };
  }
  const sym = simboloMercado(t);
  const p = sym ? precios[sym] : undefined;
  if (!p || !(p.precio > 0) || p.moneda !== "USD") return null;
  if (t.tipo === "cedear") {
    const ratio = ratioDe(t.simbolo);
    return ratio ? { usd: p.precio / ratio, dato: p, deByma: false } : null;
  }
  return { usd: p.precio, dato: p, deByma: false };
}

/** Atajo: solo el precio de una unidad en USD. */
export function precioUnitarioUsd(t: Pick<Tenencia, "tipo" | "simbolo">, precios: Precios, mepHoy: number): number | null {
  return precioUnitario(t, precios, mepHoy)?.usd ?? null;
}

type MontoMoneda = { monto: number; moneda: MonedaTenencia };

/**
 * Anotado por cantidad: lo que puso es cantidad × precio de compra. Si no sabe a qué
 * precio compró, tomamos el precio de hoy como punto de partida (y lo marcamos estimado).
 */
export function costoDesdeCantidad(
  cantidad: number,
  precioCompra: MontoMoneda | null,
  precioHoy: MontoMoneda | null,
): { invertido: MontoMoneda; estimado: boolean } | null {
  if (!(cantidad > 0)) return null;
  if (precioCompra && precioCompra.monto > 0) return { invertido: { monto: cantidad * precioCompra.monto, moneda: precioCompra.moneda }, estimado: false };
  if (precioHoy && precioHoy.monto > 0) return { invertido: { monto: cantidad * precioHoy.monto, moneda: precioHoy.moneda }, estimado: true };
  return null;
}

/** Si no sabe cuántas unidades tiene: lo que puso ÷ el precio del día en que lo anota. */
export function estimarCantidad(costoUsd: number, precioUnitario: number): number {
  return costoUsd / precioUnitario;
}

export function valuarTenencia(t: Tenencia, precios: Precios, mepHoy: number, hoy: string): TenenciaValuada {
  const costo = costoDe(t);
  const base = { tenencia: t, costoUsd: costo.usd, costoArs: costo.ars };
  const desdeUsd = (usd: number) => ({ valorUsd: usd, valorArs: usd * mepHoy });
  const enMoneda = (monto: number, moneda: MonedaTenencia) => ({
    valorUsd: aUsd(monto, moneda, mepHoy),
    valorArs: aArs(monto, moneda, mepHoy),
  });

  switch (t.tipo) {
    case "cedear":
    case "byma":
    case "cripto": {
      const u = precioUnitario(t, precios, mepHoy);
      const estimado = t.tipo === "cedear" && !u?.deByma;
      const metodo = estimado ? "estimado-subyacente" : "mercado";
      const fuente =
        t.tipo === "cripto"
          ? `Precio de ${t.simbolo} en dólares`
          : u?.deByma || t.tipo === "byma"
            ? `Precio de ${t.simbolo} en BYMA`
            : `Estimado desde ${simboloMercado(t) ?? t.simbolo} en Nueva York`;
      if (!u || t.cantidad === null) {
        return { ...base, valorUsd: null, valorArs: null, variacionDiaUsd: null, metodo, fuente, actualizado: null };
      }
      const p = u.dato;
      const valorUsd = u.usd * t.cantidad;
      const v = p.variacionDiaPct;
      return {
        ...base,
        ...desdeUsd(valorUsd),
        // Si hoy vale V y subió v%, ayer valía V / (1 + v): la diferencia es lo que se movió hoy.
        // Lo invertido hoy no tiene "ayer": no se movió para esta persona.
        variacionDiaUsd: v === null ? null : t.fecha >= hoy ? 0 : valorUsd - valorUsd / (1 + v / 100),
        metodo,
        fuente,
        actualizado: p.actualizado,
      };
    }
    case "dolares": {
      const usd = costo.usd;
      return { ...base, ...desdeUsd(usd), variacionDiaUsd: 0, metodo: "mercado", fuente: "Dólares que tenés", actualizado: null };
    }
    case "plazo-fijo":
    case "rinde-diario": {
      const dias = diasEntre(t.fecha, hoy);
      const tna = t.tna ?? 0;
      const { monto, moneda } = t.invertido;
      const valor =
        t.tipo === "plazo-fijo"
          ? monto + interesSimple(monto, tna, dias)
          : monto * Math.pow(1 + tnaATea(tna, 1), dias / DIAS_ANIO);
      return {
        ...base,
        ...enMoneda(valor, moneda),
        variacionDiaUsd: null,
        metodo: "calculado",
        fuente: `Calculado con la tasa que cargaste`,
        actualizado: null,
      };
    }
    case "manual": {
      const vm = t.valorManual;
      if (!vm) return { ...base, valorUsd: null, valorArs: null, variacionDiaUsd: null, metodo: "manual", fuente: "Valor que cargaste", actualizado: null };
      return { ...base, ...enMoneda(vm.monto, vm.moneda), variacionDiaUsd: null, metodo: "manual", fuente: "Valor que cargaste", actualizado: vm.fecha };
    }
  }
}

/**
 * Reparte 100 entre las categorías según su valor, con enteros que siempre suman 100
 * (método del resto mayor). Sin valor, todo en 0.
 */
export function pesosPorCategoria(valores: Record<Categoria, number>): Record<Categoria, number> {
  const total = CATEGORIAS.reduce((s, c) => s + valores[c], 0);
  const vacio = { fija: 0, variable: 0, dividendos: 0, liquidez: 0, alternativo: 0 };
  if (!(total > 0)) return vacio;
  const exactos = CATEGORIAS.map((c) => ({ c, x: (valores[c] / total) * 100 }));
  const res = { ...vacio };
  let asignado = 0;
  for (const { c, x } of exactos) {
    res[c] = Math.floor(x);
    asignado += res[c];
  }
  const porResto = [...exactos].sort((a, b) => b.x - Math.floor(b.x) - (a.x - Math.floor(a.x)));
  for (let i = 0; i < 100 - asignado; i++) res[porResto[i].c] += 1;
  return res;
}

export function valuar(tenencias: readonly Tenencia[], precios: Precios, mepHoy: number, hoy: string): Valuacion {
  const valuadas = tenencias.map((t) => valuarTenencia(t, precios, mepHoy, hoy));
  const conValor = valuadas.filter((v) => v.valorUsd !== null);
  const porCategoria = { fija: 0, variable: 0, dividendos: 0, liquidez: 0, alternativo: 0 };
  for (const v of conValor) porCategoria[v.tenencia.categoria] += v.valorUsd ?? 0;
  const suma = (f: (v: TenenciaValuada) => number) => conValor.reduce((s, v) => s + f(v), 0);
  return {
    tenencias: valuadas,
    totalUsd: suma((v) => v.valorUsd ?? 0),
    totalArs: suma((v) => v.valorArs ?? 0),
    // El costo se compara solo contra lo que tiene valor, así la ganancia no sale inflada.
    costoUsd: suma((v) => v.costoUsd),
    costoArs: suma((v) => v.costoArs),
    variacionDiaUsd: suma((v) => v.variacionDiaUsd ?? 0),
    incompleta: conValor.length < valuadas.length,
    pesos: pesosPorCategoria(porCategoria),
  };
}

/** Diferencia con el plan, de la más grande a la más chica. Solo las partes que existen en alguno de los dos. */
export function compararConPlan(pesos: Record<Categoria, number>, plan: Record<Categoria, number>): DiferenciaPlan[] {
  return CATEGORIAS.filter((c) => pesos[c] > 0 || plan[c] > 0)
    .map((c) => ({ categoria: c, planPct: plan[c], tuyoPct: pesos[c], diferencia: pesos[c] - plan[c] }))
    .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));
}

/** Debajo de esta diferencia (en puntos) decimos que se parece a tu plan. */
export const UMBRAL_PARECIDO = 5;

const SI_TENES_MAS: Record<Categoria, string> = {
  fija: "Tu plata se mueve menos, y también puede crecer menos.",
  variable: "Eso hace que tu plata suba y baje más.",
  dividendos: "Dependés más de que esas empresas sigan pagando.",
  liquidez: "Tenés más a mano, aunque esa parte rinde poco.",
  alternativo: "Es la parte que más sube y baja de todas.",
};

const SI_TENES_MENOS: Record<Categoria, string> = {
  fija: "Tenés menos amortiguador para cuando las acciones caen.",
  variable: "Tu plata se mueve menos, y también puede crecer menos.",
  dividendos: "Te entra menos plata que no depende de que suba el precio.",
  liquidez: "Tenés menos colchón para una urgencia sin vender nada.",
  alternativo: "Tu plata depende menos de lo más riesgoso.",
};

/**
 * La frase de cada diferencia. Describe lo que pasa, nunca dice qué hacer:
 * nada de "comprá", "vendé" ni "rebalanceá" (lo exige el test).
 */
export function describirDiferencia(d: DiferenciaPlan, perfil: PerfilRiesgo): string {
  const nombre = NOMBRE_CORTO_CATEGORIA[d.categoria];
  if (Math.abs(d.diferencia) < UMBRAL_PARECIDO) return `En ${nombre} estás parecido a tu plan.`;
  if (d.diferencia > 0) return `Tenés más en ${nombre} de lo que sugiere tu perfil ${perfil.toLowerCase()}. ${SI_TENES_MAS[d.categoria]}`;
  return `Tenés menos en ${nombre} de lo que sugiere tu perfil ${perfil.toLowerCase()}. ${SI_TENES_MENOS[d.categoria]}`;
}

/** Ganancia o pérdida total, en la moneda pedida. `pct` es null si no hay costo. */
export function resultado(v: Valuacion, moneda: MonedaTenencia): { monto: number; pct: number | null } {
  const total = moneda === "USD" ? v.totalUsd : v.totalArs;
  const costo = moneda === "USD" ? v.costoUsd : v.costoArs;
  return { monto: total - costo, pct: costo > 0 ? ((total - costo) / costo) * 100 : null };
}
