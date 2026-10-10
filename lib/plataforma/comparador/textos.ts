// Textos del comparador: aviso legal y explicaciones para principiantes.
// Lenguaje neutro: "mayor tasa", "ranking", "opciones". Nunca "te recomendamos".

import type { Liquidez, NivelRiesgo, TipoAlternativa } from "./tipos";

export const DISCLAIMER_COMPARADOR =
  "La información es educativa y comparativa, basada en datos públicos. No constituye asesoramiento financiero personalizado. Verificá las tasas en la entidad antes de invertir.";

export const ETIQUETA_LIQUIDEZ: Record<Liquidez, string> = {
  inmediata: "Liquidez inmediata",
  "24-48h": "Rescate en 24-48 h",
  "al-vencimiento": "Al vencimiento",
};

export const ETIQUETA_RIESGO: Record<NivelRiesgo, string> = {
  Bajo: "Riesgo bajo",
  Medio: "Riesgo medio",
  Alto: "Riesgo alto",
};

export interface Educativo {
  titulo: string;
  queEs: string;
  ventajas: string;
  riesgos: string;
  cuandoConviene?: string;
}

export const EDUCATIVO: Record<TipoAlternativa, Educativo> = {
  "plazo-fijo": {
    titulo: "Plazo fijo tradicional",
    queEs:
      "Le prestás tu plata al banco por un plazo (mínimo 30 días) y al final te devuelve lo mismo más un interés que sabés desde el primer día.",
    ventajas:
      "Sabés exactamente cuánto vas a cobrar. Los depósitos en bancos tienen la garantía de depósitos (SEDESA) hasta el tope vigente por persona.",
    riesgos:
      "No podés sacar la plata antes del vencimiento. Si la inflación termina siendo más alta que la tasa, perdés poder de compra aunque cobres intereses.",
  },
  uva: {
    titulo: "Plazo fijo UVA",
    queEs:
      "Tu plata se ajusta por inflación (a través de la UVA) y además paga una tasa chica por encima. Este comparador muestra los UVA precancelables, que se pueden retirar antes.",
    ventajas: "Protege tu plata de la inflación: si los precios suben más de lo esperado, tu plazo fijo sube con ellos.",
    riesgos:
      "El plazo mínimo es más largo (90 a 180 días). La inflación se mide con atraso, así que si baja de golpe puede rendir menos que un plazo fijo tradicional. Si lo retirás antes, cobrás una tasa fija más baja.",
    cuandoConviene:
      "Suele convenir cuando esperás que la inflación de los próximos meses sea más alta que la tasa del plazo fijo tradicional, y no vas a necesitar la plata por varios meses.",
  },
  billetera: {
    titulo: "Billeteras y cuentas remuneradas",
    queEs: "Cuentas donde la plata rinde todos los días y la podés usar o retirar cuando quieras.",
    ventajas: "Liquidez inmediata: es ideal para el fondo de emergencia o para plata que vas a necesitar pronto.",
    riesgos:
      "La tasa puede cambiar cualquier día, sin aviso. Las billeteras que no son bancos no tienen la garantía de depósitos (SEDESA); muchas invierten tu saldo en un fondo money market.",
  },
  "fci-mm": {
    titulo: "FCI money market",
    queEs:
      "Fondos que invierten en plazos fijos, cauciones y cuentas bancarias de muy corto plazo. Es lo que suele haber detrás del saldo remunerado de muchas billeteras.",
    ventajas: "Muy baja volatilidad y la plata se puede rescatar en el día o en 24 h.",
    riesgos:
      "El rendimiento no está garantizado y cambia todos los días. No tiene garantía de depósitos. El dato que mostramos es lo que rindió en los últimos 30 días.",
  },
  "fci-rf": {
    titulo: "FCI de renta fija en pesos",
    queEs: "Fondos que invierten en bonos, letras del Tesoro y obligaciones negociables en pesos.",
    ventajas: "Pueden rendir más que un plazo fijo o un money market, y se rescatan en 24-48 h.",
    riesgos:
      "El valor del fondo sube y baja con el precio de los bonos: podés terminar ganando menos de lo que muestra el ranking, o incluso perder. El rendimiento pasado no garantiza el futuro.",
  },
};
