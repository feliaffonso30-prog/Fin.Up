// Términos que aparecen en las fichas, con una definición de una o dos líneas
// para los tooltips. Las definiciones largas viven en /aprender y en FinBot.

export const TERMINOS = {
  cedear: {
    termino: "CEDEAR",
    definicion:
      "Certificado que se compra en pesos en la bolsa argentina y representa acciones o fondos que cotizan afuera (por ejemplo, en EE.UU.).",
  },
  etf: {
    termino: "ETF",
    definicion: "Fondo que cotiza en bolsa y reúne muchas acciones o bonos en un solo instrumento, por ejemplo todo un índice.",
  },
  ratio: {
    termino: "Ratio de conversión",
    definicion:
      "Cuántos CEDEARs equivalen a una acción original. Con un ratio 20:1, 20 CEDEARs representan 1 acción. Cambia si la empresa hace un split.",
  },
  liquidez: {
    termino: "Liquidez",
    definicion: "Qué tan fácil es comprar o vender sin mover el precio. Un instrumento líquido se negocia mucho todos los días.",
  },
  volatilidad: {
    termino: "Volatilidad",
    definicion: "Cuánto sube y baja un precio. Más volatilidad significa movimientos más grandes, para arriba y para abajo.",
  },
  on: {
    termino: "Obligación negociable (ON)",
    definicion: "Un bono emitido por una empresa: le prestás plata y te devuelve capital más intereses en fechas pactadas.",
  },
  ticker: {
    termino: "Ticker",
    definicion: "El código corto con el que se identifica un instrumento en la bolsa, como SPY o GGAL.",
  },
  default: {
    termino: "Default",
    definicion: "Cuando quien emitió un bono no paga lo que prometió. Quien tiene el bono puede perder parte de su plata.",
  },
} as const;

export type ClaveTermino = keyof typeof TERMINOS;
