// Tipos del comparador de alternativas en pesos. Todo lo que llega de las APIs
// externas se normaliza a `Alternativa` (ver normalizar.ts) y se cotiza para el
// monto y plazo del usuario con `cotizar` (ver cotizar.ts).

export type TipoAlternativa = "plazo-fijo" | "uva" | "billetera" | "fci-mm" | "fci-rf";

export type Liquidez = "inmediata" | "24-48h" | "al-vencimiento";

export type NivelRiesgo = "Bajo" | "Medio" | "Alto";

/**
 * Cómo se calcula la ganancia:
 * - "simple": interés al vencimiento sobre la TNA (plazo fijo).
 * - "compuesta": rinde todos los días sobre la TEA (billeteras y FCI).
 * - "uva": capital ajustado por inflación + TNA (plazo fijo UVA).
 */
export type Capitalizacion = "simple" | "compuesta" | "uva";

export interface Fuente {
  nombre: string; // ej. "BCRA vía ArgentinaDatos"
  url: string;
}

/** Tasa de un plazo fijo para un rango de días y montos (null = sin límite). */
export interface Tramo {
  plazoMinDias: number | null;
  plazoMaxDias: number | null;
  montoMinimo: number | null;
  montoMaximo: number | null;
  tna: number;
}

export interface Alternativa {
  id: string; // estable entre actualizaciones (tipo + entidad/fondo)
  tipo: TipoAlternativa;
  entidad: string; // banco, billetera o administradora del fondo
  producto: string; // ej. "Plazo fijo tradicional" o el nombre del FCI
  tna: number; // tasa de referencia (plazo fijo: a 30 días para clientes)
  tea: number;
  tem: number;
  capitalizacion: Capitalizacion;
  liquidez: Liquidez;
  riesgo: NivelRiesgo;
  plazoMinDias: number | null;
  montoMinimo: number | null;
  montoMaximo: number | null;
  /** Solo plazo fijo: tasas por plazo/monto y la tasa para no clientes (null = no ofrece). */
  tramos?: Tramo[];
  tnaNoClientes?: number | null;
  /** Solo FCI: tamaño del fondo en ARS, para ordenar. */
  patrimonio?: number;
  fecha: string; // AAAA-MM-DD del dato (o de la consulta, si la fuente no informa fecha)
  fuente: Fuente;
  url: string | null; // "Ir a la entidad"
  /** true si `url` es un link de referido (hay que mostrarlo así). */
  esReferido: boolean;
  nota?: string; // condición importante, en lenguaje simple
}

export interface Consulta {
  monto: number; // ARS
  dias: number;
  esCliente: boolean;
}

export interface Inflacion {
  mensual: number; // decimal: 0.017 = 1,7%
  fecha: string; // AAAA-MM-DD del mes informado
}

/** Una alternativa con los números calculados para la consulta del usuario. */
export interface Cotizacion {
  alternativa: Alternativa;
  disponible: boolean;
  motivoNoDisponible?: string;
  tna: number; // la que aplica a este monto/plazo/cliente
  tea: number;
  tem: number;
  ganancia: number; // ARS estimados al final del plazo
  rendimientoPeriodo: number; // ganancia / monto
  /** Real mensual vs. la última inflación (null si no hay dato de inflación). */
  tasaRealMensual: number | null;
  leGanaALaInflacion: boolean | null;
  notas: string[]; // aclaraciones del cálculo (tasa aproximada, supuestos)
  nota?: string; // la nota de la alternativa, solo si aplica a esta consulta
}
