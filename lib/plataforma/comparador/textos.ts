// Textos del comparador: aviso legal y explicaciones para principiantes.
// Lenguaje neutro y cotidiano: "lo que paga", "sacar la plata", "opciones". Nunca "te recomendamos".
// Las siglas (UVA, FCI, TNA...) no van en la primera vista: aparecen en el detalle o como
// "lo vas a encontrar como «...»", para que la persona las reconozca en su banco.

import type { Liquidez, NivelRiesgo, TipoAlternativa } from "./tipos";

export const DISCLAIMER_COMPARADOR =
  "La información es educativa y comparativa, basada en datos públicos. No constituye asesoramiento financiero personalizado. Verificá las tasas en la entidad antes de invertir.";

/** Cuándo se puede sacar la plata. Las mismas palabras en el resumen y en el detalle. */
export const ETIQUETA_LIQUIDEZ: Record<Liquidez, string> = {
  inmediata: "Cuando quieras",
  "24-48h": "En 1 o 2 días",
  "al-vencimiento": "Al terminar el plazo",
};

export const ETIQUETA_RIESGO: Record<NivelRiesgo, string> = {
  Bajo: "Riesgo bajo",
  Medio: "Riesgo medio",
  Alto: "Riesgo alto",
};

export interface Educativo {
  /** Nombre en palabras cotidianas, sin siglas: el de la primera vista. */
  titulo: string;
  /** Cómo lo llaman los bancos y las apps (con la sigla). Va en los plegables y en el detalle. */
  enElBanco: string;
  queEs: string;
  ventajas: string;
  riesgos: string;
  /** Cuándo tiende a pagar más. Descriptivo, nunca "te conviene". */
  cuandoPagaMas?: string;
}

export const EDUCATIVO: Record<TipoAlternativa, Educativo> = {
  "plazo-fijo": {
    titulo: "Plazo fijo",
    enElBanco: "plazo fijo tradicional",
    queEs:
      "Le prestás tu plata al banco por un tiempo (mínimo 30 días) y al final te devuelve lo mismo más un interés que sabés desde el primer día.",
    ventajas:
      "Sabés exactamente cuánto vas a cobrar. Si el banco quiebra, hay un seguro que te devuelve la plata hasta un tope por persona (se llama garantía de depósitos).",
    riesgos:
      "No podés sacar la plata antes de que termine el plazo. Si los precios suben más que lo que te pagan, al final te alcanza para comprar menos, aunque hayas cobrado intereses.",
  },
  uva: {
    titulo: "Plazo fijo que sigue a la inflación",
    enElBanco: "plazo fijo UVA precancelable",
    queEs:
      "Tu plata sube al mismo ritmo que los precios y además te pagan un poco extra. Acá mostramos solo los que te dejan sacar la plata antes de tiempo.",
    ventajas: "Protege tu plata de la inflación: si los precios suben más de lo esperado, tu plazo fijo sube con ellos.",
    riesgos:
      "Tenés que dejar la plata más tiempo (de 3 a 6 meses). El ajuste usa la inflación de semanas atrás: si los precios dejan de subir de golpe, puede pagar menos que un plazo fijo común. Si la sacás antes, cobrás menos.",
    cuandoPagaMas:
      "Tiende a pagar más que el plazo fijo común si la inflación de los próximos meses termina siendo más alta que lo que paga ese plazo fijo. Requiere no necesitar la plata por varios meses.",
  },
  billetera: {
    titulo: "Billetera o cuenta que rinde",
    enElBanco: "cuenta remunerada",
    queEs: "Cuentas donde la plata rinde todos los días y la podés usar o sacar cuando quieras.",
    ventajas: "La podés usar al instante: sirve para el fondo de emergencia o para plata que vas a necesitar pronto.",
    riesgos:
      "Lo que paga puede cambiar cualquier día, sin aviso. Si la billetera no es un banco, tu plata no tiene el seguro de depósitos: muchas la ponen en un fondo de corto plazo.",
  },
  "fci-mm": {
    titulo: "Fondo para plata de corto plazo",
    enElBanco: "fondo común de inversión (FCI) money market",
    queEs:
      "Junta la plata de muchas personas y la presta por pocos días (en plazos fijos y cuentas de bancos, entre otros). Es lo que suele haber detrás de la plata que rinde en muchas billeteras.",
    ventajas: "Lo que vale casi no sube ni baja de un día al otro, y podés sacar la plata en el día o al siguiente.",
    riesgos:
      "Nadie te asegura cuánto va a pagar: cambia todos los días. No tiene el seguro de depósitos. El número que ves es lo que pagó el último mes; puede no repetirse.",
  },
  "fci-rf": {
    titulo: "Fondo que le presta al Estado y a empresas",
    enElBanco: "fondo común de inversión (FCI) de renta fija en pesos",
    queEs: "Junta la plata de muchas personas y se la presta en pesos al Estado y a empresas, que después la devuelven con intereses.",
    ventajas: "Puede pagar más que un plazo fijo o un fondo de corto plazo, y podés sacar la plata en 1 o 2 días.",
    riesgos:
      "Lo que vale el fondo sube y baja todos los días: podés terminar ganando menos de lo que ves acá, o incluso perder plata. Que haya pagado bien antes no asegura que siga así.",
  },
};

/** Plazo en días dicho en meses cuando se puede ("90 días" → "3 meses"). */
export function plazoEnPalabras(dias: number): string {
  if (dias >= 30 && dias % 30 === 0) {
    const meses = dias / 30;
    return meses === 1 ? "1 mes" : `${meses} meses`;
  }
  return dias === 1 ? "1 día" : `${dias} días`;
}
