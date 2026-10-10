// Cálculos financieros del comparador. Funciones puras, sin red ni React.
//
// Convenciones:
// - Todas las tasas van en decimal: 0.2 = 20%. Los porcentajes de las APIs se
//   convierten antes de llegar acá.
// - Año de 365 días y "mes" de 30 días, como usan los bancos argentinos para
//   informar TNA, TEA y TEM.
// - TNA: tasa nominal anual. TEA: tasa efectiva anual (con reinversión).
//   TEM: tasa efectiva a 30 días.

export const DIAS_ANIO = 365;
export const DIAS_MES = 30;

/**
 * TNA → TEA, reinvirtiendo cada `diasCapitalizacion` días.
 * Plazo fijo: 30 (renovar todos los meses). Cuentas que pagan a diario: 1.
 */
export function tnaATea(tna: number, diasCapitalizacion = DIAS_MES): number {
  const periodos = DIAS_ANIO / diasCapitalizacion;
  return Math.pow(1 + (tna * diasCapitalizacion) / DIAS_ANIO, periodos) - 1;
}

/** TEA → TNA (la inversa de `tnaATea`). */
export function teaATna(tea: number, diasCapitalizacion = DIAS_MES): number {
  return ((Math.pow(1 + tea, diasCapitalizacion / DIAS_ANIO) - 1) * DIAS_ANIO) / diasCapitalizacion;
}

/** TNA → TEM (lo que rinde un plazo fijo a 30 días). */
export function tnaATem(tna: number): number {
  return (tna * DIAS_MES) / DIAS_ANIO;
}

/** TEA → TEM equivalente. Para una TEA que sale de `tnaATea(tna, 30)` da lo mismo que `tnaATem(tna)`. */
export function teaATem(tea: number): number {
  return Math.pow(1 + tea, DIAS_MES / DIAS_ANIO) - 1;
}

/** Interés simple por el plazo: así paga un plazo fijo al vencimiento. */
export function interesSimple(monto: number, tna: number, dias: number): number {
  return (monto * tna * dias) / DIAS_ANIO;
}

/** Interés compuesto con una TEA: así rinden una cuenta remunerada o un FCI que capitalizan a diario. */
export function interesCompuesto(monto: number, tea: number, dias: number): number {
  return monto * (Math.pow(1 + tea, dias / DIAS_ANIO) - 1);
}

/** Inflación acumulada en `dias` si se repite la misma inflación mensual. */
export function inflacionDelPeriodo(inflacionMensual: number, dias: number): number {
  return Math.pow(1 + inflacionMensual, dias / DIAS_MES) - 1;
}

/**
 * Rendimiento estimado de un plazo fijo UVA: el capital se ajusta por la
 * inflación (vía UVA) y encima paga la TNA. Suponemos que la inflación de los
 * próximos meses es igual a `inflacionMensual`, que es un supuesto, no un dato.
 */
export function rendimientoUva(tnaSobreUva: number, inflacionMensual: number, dias: number): number {
  return (1 + inflacionDelPeriodo(inflacionMensual, dias)) * (1 + (tnaSobreUva * dias) / DIAS_ANIO) - 1;
}

/**
 * Inflación mensual promedio a partir de la cual un plazo fijo UVA rinde más que
 * uno tradicional al mismo plazo. Por debajo de este número conviene el tradicional.
 */
export function inflacionDeEquilibrioUva(tnaTradicional: number, tnaSobreUva: number, dias: number): number {
  const tradicional = 1 + (tnaTradicional * dias) / DIAS_ANIO;
  const uvaSinInflacion = 1 + (tnaSobreUva * dias) / DIAS_ANIO;
  return Math.pow(tradicional / uvaSinInflacion, DIAS_MES / dias) - 1;
}

/**
 * Tasa real: cuánto rinde por encima (o por debajo) de la inflación del mismo período.
 * Positiva = le gana a la inflación. Ej.: `tasaReal(tem, inflacionMensual)` da la real mensual.
 */
export function tasaReal(tasaNominal: number, inflacion: number): number {
  return (1 + tasaNominal) / (1 + inflacion) - 1;
}

// ---------- Monto ingresado por el usuario ----------

export const MONTO_MAXIMO = 1e12; // más que esto es un error de tipeo

export type MontoValidado = { ok: true; monto: number } | { ok: false; error: string };

/**
 * Lee un monto escrito a la argentina ("1.500.000", "1500000,50", "$ 2.000")
 * o un número. Rechaza vacío, cero, negativos y valores absurdos.
 */
export function validarMonto(entrada: string | number | null | undefined): MontoValidado {
  let monto: number;
  if (typeof entrada === "number") {
    monto = entrada;
  } else {
    const texto = (entrada ?? "").replace(/\$|\s/g, "");
    if (texto === "") return { ok: false, error: "Ingresá un monto." };
    if (texto.startsWith("-")) return { ok: false, error: "El monto tiene que ser mayor a cero." };
    // Punto = separador de miles, coma = decimales.
    if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(texto)) {
      return { ok: false, error: "Escribí el monto solo con números (por ejemplo, 500.000)." };
    }
    monto = Number(texto.replace(/\./g, "").replace(",", "."));
  }
  if (!Number.isFinite(monto)) return { ok: false, error: "Ingresá un monto válido." };
  if (monto <= 0) return { ok: false, error: "El monto tiene que ser mayor a cero." };
  if (monto > MONTO_MAXIMO) return { ok: false, error: "El monto es demasiado grande." };
  return { ok: true, monto };
}
