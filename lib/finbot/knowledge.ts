// Base de conocimiento curada de FinBot: glosario para principiantes y
// catálogo de activos de ejemplo por categoría. Al ser datos nuestros, las
// definiciones son consistentes y revisables por el equipo (no dependen de lo
// que "recuerde" el modelo).

export interface Concepto {
  termino: string;
  sinonimos: string[];
  simple: string; // explicación en una o dos frases, sin jerga
  ejemplo: string; // analogía o caso concreto
  riesgo: "Muy bajo" | "Bajo" | "Medio" | "Alto" | "Muy alto" | "—";
}

export const GLOSARIO: Concepto[] = [
  {
    termino: "Acción",
    sinonimos: ["acciones", "equity", "renta variable"],
    simple: "Es una pequeña parte de una empresa. Si la empresa crece y gana más, tu parte suele valer más.",
    ejemplo: "Comprar una acción de Mercado Libre es como ser dueño de un pedacito muy chico de la empresa.",
    riesgo: "Alto",
  },
  {
    termino: "Bono",
    sinonimos: ["bonos", "renta fija", "título de deuda", "bonos soberanos"],
    simple: "Es un préstamo que le hacés a un gobierno o empresa. A cambio te devuelven el dinero más intereses en fechas pactadas.",
    ejemplo: "Un bono soberano como el AL30 o el GD30 es plata que le prestás al Estado argentino en dólares.",
    riesgo: "Medio",
  },
  {
    termino: "Obligación Negociable",
    sinonimos: ["ON", "ONs", "obligaciones negociables", "bono corporativo"],
    simple: "Es un bono pero emitido por una empresa en vez de un gobierno. La empresa te paga intereses por prestarle.",
    ejemplo: "Si YPF emite una ON en dólares, le prestás plata y te paga, por ejemplo, un interés cada seis meses.",
    riesgo: "Medio",
  },
  {
    termino: "CEDEAR",
    sinonimos: ["cedears", "certificado de depósito argentino"],
    simple: "Es un certificado que cotiza en Argentina, en pesos, y representa acciones o ETFs de empresas del exterior.",
    ejemplo: "Con el CEDEAR de Apple (AAPL) invertís en Apple desde tu broker argentino, y su precio sigue al dólar CCL.",
    riesgo: "Alto",
  },
  {
    termino: "ETF",
    sinonimos: ["etfs", "fondo cotizado", "exchange traded fund"],
    simple: "Es una canasta de muchos activos que se compra como si fuera una sola acción. Diversificás con una sola compra.",
    ejemplo: "El ETF SPY tiene las 500 empresas más grandes de EE.UU.; se puede comprar como CEDEAR.",
    riesgo: "Medio",
  },
  {
    termino: "Fondo Común de Inversión",
    sinonimos: ["FCI", "fondos comunes", "money market"],
    simple: "Juntás tu plata con la de otras personas y un equipo profesional la invierte. Hay fondos para cada perfil.",
    ejemplo: "Un FCI money market funciona parecido a una cuenta remunerada: rinde algo todos los días y lo podés rescatar rápido.",
    riesgo: "Bajo",
  },
  {
    termino: "Plazo fijo",
    sinonimos: ["plazo fijo tradicional", "depósito a plazo"],
    simple: "Dejás plata en el banco por un tiempo fijo y al final te devuelven el capital más un interés conocido de antemano.",
    ejemplo: "Depositás $100.000 a 30 días y sabés desde el primer día cuánto vas a cobrar.",
    riesgo: "Muy bajo",
  },
  {
    termino: "Caución",
    sinonimos: ["cauciones", "caución bursátil"],
    simple: "Es prestar pesos a muy corto plazo (de 1 a pocos días) dentro de la bolsa, con garantía. Rinde una tasa fija.",
    ejemplo: "Tenés pesos sin usar el fin de semana: los colocás en caución a 3 días y cobrás un interés.",
    riesgo: "Muy bajo",
  },
  {
    termino: "Lecap",
    sinonimos: ["lecaps", "letras del tesoro", "letras capitalizables"],
    simple: "Son letras del Tesoro en pesos, de corto plazo, que pagan una tasa fija al vencimiento.",
    ejemplo: "Comprás una Lecap a 3 meses y al vencer cobrás lo invertido más la tasa pactada.",
    riesgo: "Bajo",
  },
  {
    termino: "Dólar MEP",
    sinonimos: ["mep", "dólar bolsa", "dolar mep", "ccl", "contado con liquidación"],
    simple: "Es una forma legal de comprar dólares a través de la bolsa: comprás un bono en pesos y lo vendés en dólares.",
    ejemplo: "Comprás AL30 en pesos, esperás el plazo que pida tu broker, y lo vendés como AL30D para tener dólares.",
    riesgo: "—",
  },
  {
    termino: "Riesgo país",
    sinonimos: ["riesgo pais", "embi"],
    simple: "Mide cuánto más interés le exige el mercado a Argentina que a EE.UU. para prestarle. Más alto = más desconfianza.",
    ejemplo: "Un riesgo país de 600 puntos significa que Argentina paga unos 6 puntos porcentuales más que EE.UU.",
    riesgo: "—",
  },
  {
    termino: "Inflación",
    sinonimos: ["ipc", "inflacion"],
    simple: "Es la suba general de precios. Si tu inversión rinde menos que la inflación, en realidad perdés poder de compra.",
    ejemplo: "Si los precios suben 3% en un mes y tu plata rindió 2%, podés comprar menos cosas que antes.",
    riesgo: "—",
  },
  {
    termino: "Diversificación",
    sinonimos: ["diversificar", "no poner todos los huevos en la misma canasta"],
    simple: "Repartir tu dinero entre distintos activos para que si a uno le va mal, no afecte a toda tu cartera.",
    ejemplo: "En vez de poner todo en una acción, combinás un ETF global, bonos y algo de liquidez.",
    riesgo: "—",
  },
  {
    termino: "Volatilidad",
    sinonimos: ["volatil", "volátil"],
    simple: "Cuánto sube y baja el precio de un activo. Mucha volatilidad = movimientos grandes, para arriba y para abajo.",
    ejemplo: "Bitcoin puede moverse 10% en un día; un plazo fijo no se mueve.",
    riesgo: "—",
  },
  {
    termino: "Interés compuesto",
    sinonimos: ["interes compuesto", "reinvertir"],
    simple: "Ganar intereses sobre los intereses que ya ganaste. Con el tiempo hace que tu dinero crezca cada vez más rápido.",
    ejemplo: "USD 100 al 8% anual se convierten en ~USD 216 en 10 años si reinvertís todo.",
    riesgo: "—",
  },
  {
    termino: "Dividendo",
    sinonimos: ["dividendos"],
    simple: "Es la parte de las ganancias que una empresa reparte entre sus accionistas, en efectivo.",
    ejemplo: "Coca-Cola (KO) paga dividendos todos los trimestres a quienes tienen sus acciones.",
    riesgo: "—",
  },
  {
    termino: "Merval",
    sinonimos: ["s&p merval", "indice merval"],
    simple: "Es el índice que resume cómo les va a las principales acciones argentinas.",
    ejemplo: "Si escuchás 'el Merval subió 2%', en promedio las acciones líderes locales subieron.",
    riesgo: "—",
  },
  {
    termino: "Criptomoneda",
    sinonimos: ["cripto", "bitcoin", "btc", "ethereum", "stablecoin", "usdt"],
    simple: "Dinero digital que no depende de un banco central. Puede subir o bajar muchísimo en poco tiempo.",
    ejemplo: "Bitcoin es la más conocida; las stablecoins como USDT intentan valer siempre 1 dólar.",
    riesgo: "Muy alto",
  },
  {
    termino: "Perfil de riesgo",
    sinonimos: ["perfil inversor", "conservador", "moderado", "agresivo"],
    simple: "Describe cuánta subida y bajada de precios podés tolerar sin ponerte nervioso ni necesitar vender.",
    ejemplo: "Un perfil conservador prefiere ganar menos pero dormir tranquilo; uno agresivo acepta caídas para buscar más.",
    riesgo: "—",
  },
  {
    termino: "Broker",
    sinonimos: ["alyc", "agente de bolsa", "sociedad de bolsa"],
    simple: "Es la empresa habilitada que te abre una cuenta para comprar y vender activos en la bolsa.",
    ejemplo: "En Argentina los brokers son ALyCs registradas en la CNV; ahí abrís tu cuenta comitente.",
    riesgo: "—",
  },
];

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function buscarConcepto(consulta: string): Concepto[] {
  const q = normalizar(consulta);
  return GLOSARIO.filter((c) =>
    [c.termino, ...c.sinonimos].some((t) => {
      const n = normalizar(t);
      return n === q || n.includes(q) || q.includes(n);
    }),
  );
}

// ---------- Catálogo de activos de ejemplo ----------
// Ejemplos ILUSTRATIVOS por categoría para que el usuario tenga por dónde
// empezar a investigar. Las categorías coinciden con los `tipo` de la demo.

export type Categoria = "fija" | "variable" | "dividendos" | "liquidez" | "alternativo";

export interface ActivoEjemplo {
  nombre: string;
  simbolo: string | null; // símbolo Yahoo para cotizar en vivo, si existe
  tipoInstrumento: string;
  porQue: string;
}

export const CATALOGO: Record<Categoria, ActivoEjemplo[]> = {
  fija: [
    { nombre: "Bono Global 2030", simbolo: null, tipoInstrumento: "Bono soberano en USD (GD30)", porQue: "Paga cupones en dólares; uno de los bonos más líquidos del mercado local." },
    { nombre: "Lecaps", simbolo: null, tipoInstrumento: "Letra del Tesoro en pesos", porQue: "Tasa fija en pesos a corto plazo; útil para objetivos de pocos meses." },
    { nombre: "ON de empresas grandes (ej. YPF, Pampa, TGS)", simbolo: null, tipoInstrumento: "Obligación Negociable en USD", porQue: "Deuda de empresas sólidas, en dólares, con pagos periódicos." },
    { nombre: "iShares Core US Aggregate Bond", simbolo: "AGG", tipoInstrumento: "ETF de bonos de EE.UU.", porQue: "Miles de bonos de EE.UU. en un solo instrumento, baja volatilidad." },
  ],
  variable: [
    { nombre: "SPDR S&P 500", simbolo: "SPY.BA", tipoInstrumento: "CEDEAR de ETF", porQue: "Las 500 empresas más grandes de EE.UU.: la forma más simple de diversificar." },
    { nombre: "Invesco QQQ (Nasdaq 100)", simbolo: "QQQ.BA", tipoInstrumento: "CEDEAR de ETF", porQue: "Concentrado en tecnología: más crecimiento potencial y más volatilidad." },
    { nombre: "iShares MSCI Emerging Markets", simbolo: "EEM.BA", tipoInstrumento: "CEDEAR de ETF", porQue: "Empresas de países emergentes como Brasil, India o China." },
    { nombre: "Mercado Libre", simbolo: "MELI.BA", tipoInstrumento: "CEDEAR de acción", porQue: "Empresa latinoamericana de alto crecimiento; una sola acción concentra riesgo." },
    { nombre: "Grupo Financiero Galicia", simbolo: "GGAL.BA", tipoInstrumento: "Acción argentina", porQue: "Una de las acciones más negociadas del Merval; muy sensible a la economía local." },
  ],
  dividendos: [
    { nombre: "Coca-Cola", simbolo: "KO.BA", tipoInstrumento: "CEDEAR de acción", porQue: "Historial de décadas aumentando su dividendo." },
    { nombre: "Vanguard High Dividend Yield", simbolo: "VYM", tipoInstrumento: "ETF de dividendos", porQue: "Canasta de empresas de EE.UU. que reparten dividendos altos." },
    { nombre: "Procter & Gamble", simbolo: "PG.BA", tipoInstrumento: "CEDEAR de acción", porQue: "Empresa de consumo masivo, estable y pagadora de dividendos." },
  ],
  liquidez: [
    { nombre: "FCI Money Market", simbolo: null, tipoInstrumento: "Fondo común de inversión", porQue: "Rinde a diario y se rescata en el momento; ideal para un fondo de emergencia." },
    { nombre: "Caución a 1-7 días", simbolo: null, tipoInstrumento: "Préstamo garantizado en bolsa", porQue: "Tasa fija muy corta para pesos que vas a usar pronto." },
  ],
  alternativo: [
    { nombre: "Bitcoin", simbolo: "BTC-USD", tipoInstrumento: "Criptomoneda", porQue: "La cripto más conocida; puede caer más de 50% en un año malo." },
    { nombre: "Ethereum", simbolo: "ETH-USD", tipoInstrumento: "Criptomoneda", porQue: "Segunda cripto más grande, todavía más volátil que Bitcoin." },
    { nombre: "SPDR Gold Shares", simbolo: "GLD.BA", tipoInstrumento: "CEDEAR de ETF de oro", porQue: "El oro suele usarse como refugio en momentos de crisis." },
  ],
};
