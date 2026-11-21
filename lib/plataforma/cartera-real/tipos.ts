// "Lo que tenés": la cartera REAL que la persona anota a mano (no operamos ni
// conectamos brokers). Dominio puro: sin React, sin red, sin window.
//
// Cómo se valúa cada cosa (y por qué):
// - CEDEAR: estimado desde el precio del activo original en Nueva York ÷ ratio.
//   Mostrar el precio de BYMA requiere licencia de Market Data, así que no lo usamos.
// - Cripto: precio de mercado en USD.
// - Dólares: valen lo que dicen (1 USD = 1 USD).
// - Plazo fijo / billetera o FCI que rinde: calculado con la tasa que cargó la persona.
// - Acciones argentinas, bonos, ONs y "otro": el valor que la persona copia de la app
//   donde invirtió, con la fecha en que lo actualizó. Sin licencia no hay precio en vivo.

import { z } from "zod";
import type { Categoria } from "@/lib/plataforma/tipos";

export const TIPOS_ACTIVO = ["cedear", "cripto", "dolares", "plazo-fijo", "rinde-diario", "manual"] as const;
export type TipoActivo = (typeof TIPOS_ACTIVO)[number];

export const MONEDAS_TENENCIA = ["ARS", "USD"] as const;
export type MonedaTenencia = (typeof MONEDAS_TENENCIA)[number];

/** Cómo se obtuvo el valor de hoy. Se muestra siempre al lado de la cifra. */
export type MetodoValuacion = "mercado" | "estimado-subyacente" | "calculado" | "manual";

const CATEGORIAS = ["fija", "variable", "dividendos", "liquidez", "alternativo"] as const satisfies readonly Categoria[];

const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha AAAA-MM-DD");
const monto = z.number().finite().positive().max(1e12);

const montoConMoneda = z.object({ monto, moneda: z.enum(MONEDAS_TENENCIA) });

export const tenenciaSchema = z
  .object({
    id: z.string().min(1).max(64),
    tipo: z.enum(TIPOS_ACTIVO),
    /** Ticker del catálogo (CEDEAR, acción), símbolo cripto (BTC) o null. */
    simbolo: z.string().regex(/^[A-Z0-9-]{1,12}$/).nullable(),
    /** Nombre en simple, como lo eligió o lo escribió la persona. */
    nombre: z.string().trim().min(1).max(80),
    categoria: z.enum(CATEGORIAS),
    /** Lo que puso. */
    invertido: montoConMoneda,
    /** Unidades (CEDEARs, cripto). null si no aplica (plazo fijo, manual, dólares). */
    cantidad: z.number().finite().positive().nullable(),
    /** true si la cantidad la estimamos nosotros con el precio del día en que lo anotó. */
    cantidadEstimada: z.boolean(),
    /** Tasa nominal anual en decimal (0.3 = 30%) para plazo fijo y "rinde a diario". */
    tna: z.number().finite().min(0).max(10).nullable(),
    /** Para "manual": cuánto vale hoy según la app donde invirtió, y cuándo lo actualizó. */
    valorManual: montoConMoneda.extend({ fecha: fechaIso }).nullable(),
    /** Cuándo invirtió (aproximado está bien). */
    fecha: fechaIso,
    /** Dólar MEP del momento en que lo anotó: para pasar lo invertido de una moneda a la otra. */
    mepAlAnotar: z.number().finite().positive(),
  })
  .refine((t) => t.tipo !== "cedear" && t.tipo !== "cripto" ? true : t.cantidad !== null && t.simbolo !== null, {
    message: "CEDEARs y cripto llevan símbolo y cantidad",
  })
  .refine((t) => (t.tipo === "plazo-fijo" || t.tipo === "rinde-diario" ? t.tna !== null : true), {
    message: "Plazo fijo y cuentas que rinden llevan tasa",
  })
  .refine((t) => (t.tipo === "manual" ? t.valorManual !== null : true), {
    message: "Lo manual lleva el valor de hoy",
  });

export type Tenencia = z.infer<typeof tenenciaSchema>;

/** Precio de mercado de un símbolo, en USD, tal como llega de /api/precios. */
export interface PrecioMercado {
  simbolo: string;
  precioUsd: number;
  variacionDiaPct: number | null;
  /** ISO de la última operación según la fuente. */
  actualizado: string | null;
  fuente: string;
}

export type Precios = Record<string, PrecioMercado>;

/** Una tenencia ya valuada, en las dos monedas. */
export interface TenenciaValuada {
  tenencia: Tenencia;
  /** null si todavía no hay precio (cargando o la fuente falló). */
  valorUsd: number | null;
  valorArs: number | null;
  costoUsd: number;
  costoArs: number;
  /** Variación del día en USD (solo lo que tiene precio de mercado). */
  variacionDiaUsd: number | null;
  metodo: MetodoValuacion;
  /** De dónde sale el valor, en simple: "Estimado desde AAPL en Nueva York". */
  fuente: string;
  /** Cuándo es el dato (ISO o AAAA-MM-DD). null si es un cálculo al día de hoy. */
  actualizado: string | null;
}

export interface Valuacion {
  tenencias: TenenciaValuada[];
  /** Totales solo con lo que tiene valor. `incompleta` avisa si falta algo. */
  totalUsd: number;
  totalArs: number;
  costoUsd: number;
  costoArs: number;
  variacionDiaUsd: number;
  incompleta: boolean;
  /** Peso de cada categoría sobre el total valuado, en % (suma 100 si hay algo). */
  pesos: Record<Categoria, number>;
}

/** Diferencia con el plan sugerido, por categoría. Solo describe: nunca dice qué hacer. */
export interface DiferenciaPlan {
  categoria: Categoria;
  planPct: number;
  tuyoPct: number;
  /** tuyo − plan, en puntos. */
  diferencia: number;
}
