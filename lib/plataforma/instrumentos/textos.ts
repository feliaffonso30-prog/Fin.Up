// Textos legales y fijos de la Biblioteca de instrumentos. Centralizados para
// que la revisión legal (pendiente) los cambie en un solo lugar.

export const DISCLAIMER_INSTRUMENTOS =
  "Material educativo con criterios transparentes, no asesoramiento financiero personalizado. Estos instrumentos sirven para entender cada categoría de una cartera: no son una recomendación de compra ni de venta. Toda inversión puede perder valor.";

export const AVISO_BORRADOR =
  "Lista en revisión: algunos datos (como los ratios de conversión) todavía se están verificando. Confirmalos en tu broker o en BYMA antes de tomar cualquier decisión.";

export const NOTA_RIESGO =
  "El nivel de riesgo es relativo dentro de esta lista: una acción individual se mueve más que un ETF amplio, y este más que un bono corto. No es una calificación oficial.";

export const TEXTO_EJEMPLOS_CARTERA =
  "Ejemplos educativos de instrumentos de esta categoría. No es una recomendación de compra.";

export const PRECIO_NO_DISPONIBLE =
  "Todavía no mostramos cotizaciones. Podés ver el precio actual en tu broker o en la web de BYMA.";

/** Pregunta que queda precargada en FinBot desde la ficha: pide explicación, nunca una recomendación. */
export function preguntaFinBot(i: { ticker: string; nombre: string; tipo: string }): string {
  return `Explicame de forma simple qué es ${i.ticker} (${i.nombre}, ${i.tipo}), cómo funciona y qué riesgos tiene.`;
}
