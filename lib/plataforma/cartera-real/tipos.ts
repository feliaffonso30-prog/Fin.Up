// "Lo que tenés": la cartera REAL que la persona anota a mano (no operamos ni
// conectamos brokers). Dominio puro: sin React, sin red, sin window.
//
// Cómo se valúa cada cosa (y por qué):
// - CEDEAR: precio en BYMA si lo tenemos; si no, estimado desde el activo original en
//   Nueva York ÷ ratio.
// - "byma": acciones argentinas, bonos y CEDEARs sin activo en EE.UU., con el precio en
//   pesos de BYMA (los bonos cotizan cada 100 nominales).
//   OJO: mostrar precios de BYMA en un producto comercial requiere licencia de Market
//   Data. Se apaga con PRECIOS_BYMA_ACTIVOS (activos.ts) hasta tenerla.
// - Cripto: precio de mercado en USD.
// - Dólares: valen lo que dicen (1 USD = 1 USD).
// - Plazo fijo / billetera o FCI que rinde: calculado con la tasa que cargó la persona.
// - ONs, "otro" y lo que no tiene precio: el valor que la persona copia de la app donde
//   invirtió, con la fecha en que lo actualizó.

import { z } from "zod";
import type { Categoria } from "@/lib/plataforma/tipos";

export const TIPOS_ACTIVO = ["cedear", "byma", "cripto", "dolares", "plazo-fijo", "rinde-diario", "manual"] as const;
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
    simbolo: z.string().regex(/^[A-Z0-9.-]{1,12}$/).nullable(),
    /** Nombre en simple, como lo eligió o lo escribió la persona. */
    nombre: z.string().trim().min(1).max(80),
    categoria: z.enum(CATEGORIAS),
    /** Lo que puso. */
    invertido: montoConMoneda,
    /**
     * true si lo que puso no lo sabemos: anotó solo la cantidad y tomamos como punto de
     * partida el precio del día en que lo anotó. (Default false para lo guardado antes.)
     */
    costoEstimado: z.boolean().default(false),
    /**
     * true si lo que puso lo calculamos nosotros: cantidad × precio de cierre del día en
     * que compró (no cargó el precio). Es aproximado: pudo comprar a otro precio ese día.
     */
    costoDesdeCierre: z.boolean().default(false),
    /** Unidades (CEDEARs, cripto, acciones). null si no aplica o no la sabe. */
    cantidad: z.number().finite().positive().nullable(),
    /** true si la cantidad la estimamos nosotros con el precio del día en que lo anotó. */
    cantidadEstimada: z.boolean(),
    /** Tasa nominal anual en decimal (0.3 = 30%) para plazo fijo y "rinde a diario". */
    tna: z.number().finite().min(0).max(10).nullable(),
    /** Para "manual": cuánto vale hoy según la app donde invirtió, y cuándo lo actualizó. */
    valorManual: montoConMoneda.extend({ fecha: fechaIso }).nullable(),
    /** Cuándo invirtió (aproximado está bien). */
    fecha: fechaIso,
    /**
     * Dólar MEP del día en que invirtió (o, si no lo conseguimos, del día en que lo anotó):
     * para pasar lo invertido de una moneda a la otra.
     */
    mepAlAnotar: z.number().finite().positive(),
  })
  .refine((t) => (t.tipo === "cedear" || t.tipo === "byma" || t.tipo === "cripto" ? t.cantidad !== null && t.simbolo !== null : true), {
    message: "CEDEARs, activos de BYMA y cripto llevan símbolo y cantidad",
  })
  .refine((t) => (t.tipo === "plazo-fijo" || t.tipo === "rinde-diario" ? t.tna !== null : true), {
    message: "Plazo fijo y cuentas que rinden llevan tasa",
  })
  .refine((t) => (t.tipo === "manual" ? t.valorManual !== null : true), {
    message: "Lo manual lleva el valor de hoy",
  });

export type Tenencia = z.infer<typeof tenenciaSchema>;

/** Cómo se anota: por lo que puso o por cuántas unidades tiene. */
export type ModoCarga = "monto" | "cantidad";

/**
 * Precio de mercado de un símbolo, tal como llega de /api/precios. Los de EE.UU. y cripto
 * vienen en USD con su símbolo ("AAPL", "BTC-USD"); los de BYMA en ARS como "BYMA:GGAL".
 */
export interface PrecioMercado {
  simbolo: string;
  precio: number;
  moneda: MonedaTenencia;
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
