import type {
  Conocimiento,
  Horizonte,
  PerfilRiesgo,
  Prioridad,
  ReaccionCaida,
  Respuestas,
  ResultadoPerfil,
} from "./tipos";

// ---------- Puntaje ----------
// Cada respuesta vale de 0 (muy cauto) a 100 (mucha capacidad/tolerancia al riesgo).
// El puntaje final es un promedio ponderado: lo que más pesa es cuánto tiempo
// podés dejar la plata invertida y cómo reaccionarías ante una caída.

const PUNTOS_HORIZONTE: Record<Horizonte, number> = { "menos-2": 0, "2-5": 35, "5-10": 70, "mas-10": 100 };
const PUNTOS_REACCION: Record<ReaccionCaida, number> = { "vendo-todo": 0, "vendo-parte": 35, espero: 70, "compro-mas": 100 };
const PUNTOS_PRIORIDAD: Record<Prioridad, number> = { seguridad: 0, equilibrio: 50, crecimiento: 100 };
const PUNTOS_CONOCIMIENTO: Record<Conocimiento, number> = { ninguno: 20, basico: 60, intermedio: 100 };

const PESOS = { horizonte: 0.3, reaccion: 0.3, prioridad: 0.2, edad: 0.1, conocimiento: 0.1 } as const;

function puntosEdad(edad: number): number {
  if (edad <= 30) return 100;
  if (edad <= 40) return 80;
  if (edad <= 50) return 60;
  if (edad <= 60) return 40;
  return 20;
}

export function calcularPuntaje(r: Respuestas): number {
  const total =
    PUNTOS_HORIZONTE[r.horizonte] * PESOS.horizonte +
    PUNTOS_REACCION[r.reaccionCaida] * PESOS.reaccion +
    PUNTOS_PRIORIDAD[r.prioridad] * PESOS.prioridad +
    puntosEdad(r.edad) * PESOS.edad +
    PUNTOS_CONOCIMIENTO[r.conocimiento] * PESOS.conocimiento;
  return Math.round(total);
}

export function clasificarPorPuntaje(puntaje: number): PerfilRiesgo {
  if (puntaje < 40) return "Conservador";
  if (puntaje < 70) return "Moderado";
  return "Agresivo";
}

// ---------- Topes de seguridad ----------
// Aunque el puntaje dé alto, hay situaciones donde un perfil agresivo no es
// sensato. Estos topes bajan el perfil y le explican al usuario por qué.

const ORDEN: PerfilRiesgo[] = ["Conservador", "Moderado", "Agresivo"];

interface Tope {
  aplica: (r: Respuestas) => boolean;
  maximo: PerfilRiesgo;
  texto: string;
}

const TOPES: Tope[] = [
  {
    aplica: (r) => r.horizonte === "menos-2",
    maximo: "Conservador",
    texto:
      "Vas a necesitar la plata en menos de 2 años. En plazos tan cortos el mercado puede estar abajo justo cuando la necesites, así que priorizamos protegerla.",
  },
  {
    aplica: (r) => r.horizonte === "2-5",
    maximo: "Moderado",
    texto:
      "Tu horizonte es de 2 a 5 años: alcanza para asumir algo de riesgo, pero no para una cartera agresiva, que puede tardar más en recuperarse de una caída.",
  },
  {
    aplica: (r) => r.reaccionCaida === "vendo-todo",
    maximo: "Conservador",
    texto:
      "Si una caída del 20% te haría vender todo, una cartera con acciones te llevaría a perder plata de verdad. Mejor empezar con algo que puedas sostener.",
  },
  {
    aplica: (r) => r.reaccionCaida === "vendo-parte",
    maximo: "Moderado",
    texto: "Una caída fuerte te haría vender parte de lo invertido, así que evitamos una cartera agresiva.",
  },
  {
    aplica: (r) => r.conocimiento === "ninguno",
    maximo: "Moderado",
    texto:
      "Recién estás empezando: preferimos que arranques con algo que puedas entender bien antes de pasar a estrategias más agresivas.",
  },
  {
    aplica: (r) => r.deudasCaras,
    maximo: "Conservador",
    texto:
      "Tenés deudas con tasas altas. Casi siempre conviene cancelarlas antes de invertir en activos con riesgo, porque ninguna inversión rinde de forma segura más que esos intereses.",
  },
];

// ---------- Motivos ----------

const MOTIVO_HORIZONTE: Record<Horizonte, string> = {
  "menos-2": "Necesitás la plata en menos de 2 años.",
  "2-5": "Podés dejar tu plata invertida entre 2 y 5 años.",
  "5-10": "Podés dejar tu plata invertida entre 5 y 10 años, tiempo suficiente para atravesar algunas caídas.",
  "mas-10": "Podés dejar tu plata invertida más de 10 años, lo que le da tiempo a recuperarse de las caídas.",
};

const MOTIVO_REACCION: Record<ReaccionCaida, string> = {
  "vendo-todo": "Ante una caída del 20% venderías todo para frenar la pérdida.",
  "vendo-parte": "Ante una caída del 20% venderías una parte para sentirte más tranquilo.",
  espero: "Ante una caída del 20% esperarías a que se recupere sin tocar nada.",
  "compro-mas": "Ante una caída del 20% lo verías como oportunidad para sumar más.",
};

const MOTIVO_PRIORIDAD: Record<Prioridad, string> = {
  seguridad: "Para vos lo más importante es no perder lo que ya tenés.",
  equilibrio: "Buscás un equilibrio entre cuidar tu plata y hacerla crecer.",
  crecimiento: "Priorizás que tu plata crezca aunque eso implique más subas y bajas.",
};

const MOTIVO_CONOCIMIENTO: Record<Conocimiento, string> = {
  ninguno: "Todavía no tenés conocimientos de inversiones.",
  basico: "Tenés nociones básicas de inversiones.",
  intermedio: "Ya manejás conceptos de inversión con soltura.",
};

export const DESCRIPCION_PERFIL: Record<PerfilRiesgo, string> = {
  Conservador:
    "Priorizás cuidar tu plata antes que hacerla crecer rápido. Tu cartera apunta a tener pocos sobresaltos: aceptás ganar menos a cambio de dormir tranquilo.",
  Moderado:
    "Buscás un equilibrio: estás dispuesto a tolerar subas y bajas para que tu plata crezca, pero con una parte protegida que amortigua los golpes.",
  Agresivo:
    "Priorizás el crecimiento a largo plazo y aceptás caídas fuertes en el camino. Tu cartera tiene mucho peso en activos que suben y bajan bastante.",
};

export function definirPerfil(r: Respuestas): ResultadoPerfil {
  const puntaje = calcularPuntaje(r);
  const perfilPorPuntaje = clasificarPorPuntaje(puntaje);

  let tope = ORDEN.length - 1;
  const ajustes: string[] = [];
  for (const t of TOPES) {
    if (!t.aplica(r)) continue;
    const idx = ORDEN.indexOf(t.maximo);
    // Solo informamos los topes que realmente bajan el perfil
    if (idx < ORDEN.indexOf(perfilPorPuntaje)) ajustes.push(t.texto);
    tope = Math.min(tope, idx);
  }

  const perfil = ORDEN[Math.min(ORDEN.indexOf(perfilPorPuntaje), tope)];

  return {
    perfil,
    puntaje,
    perfilPorPuntaje,
    ajustes,
    motivos: [
      MOTIVO_HORIZONTE[r.horizonte],
      MOTIVO_REACCION[r.reaccionCaida],
      MOTIVO_PRIORIDAD[r.prioridad],
      MOTIVO_CONOCIMIENTO[r.conocimiento],
    ],
  };
}

// ---------- Validación ----------

export type ErroresRespuestas = Partial<Record<keyof Respuestas, string>>;

export function validarRespuestas(r: Partial<Respuestas>): ErroresRespuestas {
  const errores: ErroresRespuestas = {};
  if (!Number.isInteger(r.edad) || (r.edad as number) < 18 || (r.edad as number) > 100) {
    errores.edad = "Ingresá una edad entre 18 y 100 años.";
  }
  if (!r.objetivo) errores.objetivo = "Elegí un objetivo.";
  if (!r.horizonte) errores.horizonte = "Elegí un plazo.";
  if (typeof r.capitalInicial !== "number" || !(r.capitalInicial >= 0) || r.capitalInicial > 1_000_000_000) {
    errores.capitalInicial = "Ingresá un monto válido (puede ser 0).";
  }
  if (typeof r.aporteMensual !== "number" || !(r.aporteMensual >= 0) || r.aporteMensual > 1_000_000_000) {
    errores.aporteMensual = "Ingresá un monto válido (puede ser 0).";
  }
  if (!r.fondoEmergencia) errores.fondoEmergencia = "Elegí una opción.";
  if (typeof r.deudasCaras !== "boolean") errores.deudasCaras = "Elegí una opción.";
  if (!r.reaccionCaida) errores.reaccionCaida = "Elegí una opción.";
  if (!r.prioridad) errores.prioridad = "Elegí una opción.";
  if (!r.conocimiento) errores.conocimiento = "Elegí una opción.";
  return errores;
}
