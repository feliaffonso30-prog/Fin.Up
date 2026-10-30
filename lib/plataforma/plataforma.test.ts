import { describe, expect, it } from "vitest";
import { aContextoEstrategia, actualizarPlan, generarPlan } from "./plan";
import { siguientePaso } from "./siguiente-paso";
import { calcularPuntaje, clasificarPorPuntaje, definirPerfil, validarRespuestas } from "./perfil";
import { proyectar, serieProyeccion } from "./proyeccion";
import type {
  Conocimiento,
  FondoEmergencia,
  Horizonte,
  Objetivo,
  Prioridad,
  ReaccionCaida,
  Respuestas,
} from "./tipos";

const FECHA = "2026-10-06T00:00:00.000Z";

// Un usuario "tipo" con todo a favor del riesgo; cada test pisa lo que le interesa.
const audaz: Respuestas = {
  edad: 22,
  objetivo: "Crecimiento",
  horizonte: "mas-10",
  capitalInicial: 1000,
  aporteMensual: 100,
  fondoEmergencia: "si",
  deudasCaras: false,
  reaccionCaida: "compro-mas",
  prioridad: "crecimiento",
  conocimiento: "intermedio",
};

const cauto: Respuestas = {
  ...audaz,
  edad: 58,
  horizonte: "2-5",
  reaccionCaida: "vendo-parte",
  prioridad: "seguridad",
  conocimiento: "basico",
};

const OBJETIVOS: Objetivo[] = ["Preservar capital", "Crecimiento", "Generar ingresos"];
const HORIZONTES: Horizonte[] = ["menos-2", "2-5", "5-10", "mas-10"];
const FONDOS: FondoEmergencia[] = ["si", "parcial", "no"];
const REACCIONES: ReaccionCaida[] = ["vendo-todo", "vendo-parte", "espero", "compro-mas"];
const PRIORIDADES: Prioridad[] = ["seguridad", "equilibrio", "crecimiento"];
const CONOCIMIENTOS: Conocimiento[] = ["ninguno", "basico", "intermedio"];

function todasLasCombinaciones(): Respuestas[] {
  const out: Respuestas[] = [];
  for (const objetivo of OBJETIVOS)
    for (const horizonte of HORIZONTES)
      for (const fondoEmergencia of FONDOS)
        for (const reaccionCaida of REACCIONES)
          for (const prioridad of PRIORIDADES)
            for (const conocimiento of CONOCIMIENTOS)
              for (const deudasCaras of [false, true])
                for (const edad of [19, 35, 65])
                  out.push({ ...audaz, edad, objetivo, horizonte, fondoEmergencia, reaccionCaida, prioridad, conocimiento, deudasCaras });
  return out;
}

describe("perfil de riesgo", () => {
  it("clasifica por puntaje en los umbrales esperados", () => {
    expect(clasificarPorPuntaje(0)).toBe("Conservador");
    expect(clasificarPorPuntaje(39)).toBe("Conservador");
    expect(clasificarPorPuntaje(40)).toBe("Moderado");
    expect(clasificarPorPuntaje(69)).toBe("Moderado");
    expect(clasificarPorPuntaje(70)).toBe("Agresivo");
    expect(clasificarPorPuntaje(100)).toBe("Agresivo");
  });

  it("el puntaje siempre está entre 0 y 100", () => {
    for (const r of todasLasCombinaciones()) {
      const p = calcularPuntaje(r);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it("un perfil con todo a favor del riesgo da Agresivo, sin topes", () => {
    const r = definirPerfil(audaz);
    expect(r.perfil).toBe("Agresivo");
    expect(r.ajustes).toHaveLength(0);
  });

  it("un perfil cauto no da Agresivo", () => {
    expect(definirPerfil(cauto).perfil).not.toBe("Agresivo");
  });

  it("si necesita la plata en menos de 2 años, nunca pasa de Conservador", () => {
    const r = definirPerfil({ ...audaz, horizonte: "menos-2" });
    expect(r.perfil).toBe("Conservador");
    expect(r.perfilPorPuntaje).not.toBe("Conservador"); // el tope fue lo que lo bajó
    expect(r.ajustes.length).toBeGreaterThan(0);
  });

  it("si vendería todo ante una caída, nunca pasa de Conservador", () => {
    expect(definirPerfil({ ...audaz, reaccionCaida: "vendo-todo" }).perfil).toBe("Conservador");
  });

  it("si no tiene conocimientos, nunca es Agresivo", () => {
    expect(definirPerfil({ ...audaz, conocimiento: "ninguno" }).perfil).not.toBe("Agresivo");
  });

  it("con deudas caras, es Conservador", () => {
    expect(definirPerfil({ ...audaz, deudasCaras: true }).perfil).toBe("Conservador");
  });

  it("los topes se respetan en todas las combinaciones", () => {
    for (const r of todasLasCombinaciones()) {
      const { perfil } = definirPerfil(r);
      if (r.horizonte === "menos-2" || r.reaccionCaida === "vendo-todo" || r.deudasCaras) {
        expect(perfil).toBe("Conservador");
      }
      if (r.horizonte === "2-5" || r.reaccionCaida === "vendo-parte" || r.conocimiento === "ninguno") {
        expect(perfil).not.toBe("Agresivo");
      }
    }
  });

  it("no informa topes que no cambiaron el resultado", () => {
    // Ya es Conservador por puntaje: ningún tope debería explicarse
    const r = definirPerfil({ ...cauto, horizonte: "menos-2", reaccionCaida: "vendo-todo", conocimiento: "ninguno" });
    expect(r.perfilPorPuntaje).toBe("Conservador");
    expect(r.ajustes).toHaveLength(0);
  });
});

describe("generación de cartera", () => {
  it("siempre suma 100% y nunca tiene porcentajes negativos ni categorías repetidas", () => {
    for (const r of todasLasCombinaciones()) {
      const plan = generarPlan(r, FECHA);
      const suma = plan.posiciones.reduce((a, p) => a + p.porcentaje, 0);
      expect(suma).toBe(100);
      for (const p of plan.posiciones) {
        expect(p.porcentaje).toBeGreaterThan(0);
        expect(Number.isInteger(p.porcentaje)).toBe(true);
      }
      const cats = plan.posiciones.map((p) => p.categoria);
      expect(new Set(cats).size).toBe(cats.length);
    }
  });

  it("las posiciones vienen ordenadas de mayor a menor", () => {
    const { posiciones } = generarPlan(audaz, FECHA);
    for (let i = 1; i < posiciones.length; i++) {
      expect(posiciones[i - 1].porcentaje).toBeGreaterThanOrEqual(posiciones[i].porcentaje);
    }
  });

  it("es determinística: mismas respuestas, mismo plan", () => {
    expect(generarPlan(cauto, FECHA)).toEqual(generarPlan(cauto, FECHA));
  });

  it("el perfil Agresivo tiene más renta variable que el Conservador", () => {
    const peso = (r: Respuestas) =>
      generarPlan(r, FECHA)
        .posiciones.filter((p) => p.categoria === "variable")
        .reduce((a, p) => a + p.porcentaje, 0);
    expect(peso(audaz)).toBeGreaterThan(peso({ ...audaz, deudasCaras: true }));
  });

  it("'Preservar capital' tiene más renta fija que 'Crecimiento' para el mismo perfil", () => {
    const fija = (objetivo: Objetivo) =>
      generarPlan({ ...audaz, objetivo }, FECHA).posiciones.find((p) => p.categoria === "fija")?.porcentaje ?? 0;
    expect(fija("Preservar capital")).toBeGreaterThan(fija("Crecimiento"));
  });

  it("'Generar ingresos' tiene más dividendos que 'Crecimiento'", () => {
    const div = (objetivo: Objetivo) =>
      generarPlan({ ...audaz, objetivo }, FECHA).posiciones.find((p) => p.categoria === "dividendos")?.porcentaje ?? 0;
    expect(div("Generar ingresos")).toBeGreaterThan(div("Crecimiento"));
  });

  it("sin fondo de emergencia, la liquidez es al menos 25%; con fondo parcial, al menos 15%", () => {
    const liq = (f: FondoEmergencia) =>
      generarPlan({ ...audaz, fondoEmergencia: f }, FECHA).posiciones.find((p) => p.categoria === "liquidez")?.porcentaje ?? 0;
    expect(liq("no")).toBeGreaterThanOrEqual(25);
    expect(liq("parcial")).toBeGreaterThanOrEqual(15);
    expect(liq("si")).toBeLessThan(liq("no"));
  });

  it("con menos de 2 años no hay acciones, dividendos ni cripto: solo renta fija y liquidez", () => {
    const casos = todasLasCombinaciones().filter((x) => x.horizonte === "menos-2");
    expect(casos.length).toBeGreaterThan(0);
    for (const r of casos) {
      const cats = generarPlan(r, FECHA).posiciones.map((p) => p.categoria);
      for (const c of cats) expect(["fija", "liquidez"]).toContain(c);
    }
  });

  it("un plazo menor a 2 años siempre trae el aviso de plazo corto", () => {
    expect(generarPlan({ ...audaz, horizonte: "menos-2" }, FECHA).avisos.map((a) => a.titulo)).toContain("Plazo muy corto");
  });

  it("cada posición explica qué puede salir mal y trae ejemplos para investigar", () => {
    for (const p of generarPlan(audaz, FECHA).posiciones) {
      expect(p.queSalePuedeMal.length).toBeGreaterThan(20);
      expect(p.porQueEnTuCartera.length).toBeGreaterThan(20);
      expect(p.ejemplos.length).toBeGreaterThan(0);
    }
  });

  it("los montos iniciales salen del capital y el porcentaje", () => {
    const plan = generarPlan({ ...audaz, capitalInicial: 2000 }, FECHA);
    for (const p of plan.posiciones) expect(p.montoInicial).toBe(Math.round((2000 * p.porcentaje) / 100));
  });
});

describe("avisos (anti-humo)", () => {
  const titulos = (r: Respuestas) => generarPlan(r, FECHA).avisos.map((a) => a.titulo);

  it("avisa sobre el fondo de emergencia si no está completo", () => {
    expect(titulos({ ...audaz, fondoEmergencia: "no" })).toContain("Armá tu fondo de emergencia");
    expect(titulos({ ...audaz, fondoEmergencia: "si" })).not.toContain("Armá tu fondo de emergencia");
  });

  it("avisa sobre deudas caras", () => {
    expect(titulos({ ...audaz, deudasCaras: true })).toContain("Primero, tus deudas");
  });

  it("avisa sobre el riesgo de los alternativos cuando los incluye", () => {
    const plan = generarPlan(audaz, FECHA);
    expect(plan.posiciones.some((p) => p.categoria === "alternativo")).toBe(true);
    expect(plan.avisos.map((a) => a.titulo)).toContain("Sobre los alternativos");
  });
});

describe("análisis y proyección", () => {
  it("el retorno mínimo no supera al máximo y la caída no es positiva", () => {
    for (const r of todasLasCombinaciones()) {
      const { analisis } = generarPlan(r, FECHA);
      expect(analisis.retornoMin).toBeLessThanOrEqual(analisis.retornoMax);
      expect(analisis.caida).toBeLessThanOrEqual(0);
    }
  });

  it("un perfil Agresivo cae más en un mal año que uno Conservador", () => {
    const agresivo = generarPlan(audaz, FECHA).analisis.caida;
    const conservador = generarPlan({ ...audaz, deudasCaras: true }, FECHA).analisis.caida;
    expect(agresivo).toBeLessThan(conservador);
  });

  it("con tasa 0% el resultado es solo lo aportado", () => {
    expect(proyectar(1000, 100, 2, 0)).toBe(1000 + 100 * 24);
  });

  it("en 12 meses sin aportes, la tasa anual se aplica exacta", () => {
    expect(proyectar(1000, 0, 1, 12)).toBeCloseTo(1120, 6);
  });

  it("la serie tiene un punto por año y el rango alto nunca es menor al bajo", () => {
    const serie = serieProyeccion(1000, 100, 5, 3, 8);
    expect(serie).toHaveLength(5);
    expect(serie.map((s) => s.anio)).toEqual([1, 2, 3, 4, 5]);
    for (const s of serie) expect(s.alto).toBeGreaterThanOrEqual(s.bajo);
    expect(serie[4].aportado).toBe(1000 + 100 * 60);
  });

  it("el plan trae la proyección con los años del horizonte elegido", () => {
    expect(generarPlan({ ...audaz, horizonte: "5-10" }, FECHA).proyeccion).toHaveLength(7);
    expect(generarPlan({ ...audaz, horizonte: "menos-2" }, FECHA).proyeccion).toHaveLength(1);
  });
});

describe("planes guardados", () => {
  it("al actualizar un plan guardado se obtiene la misma cartera, en todas las combinaciones", () => {
    for (const r of todasLasCombinaciones()) {
      const guardado = generarPlan(r, FECHA);
      expect(actualizarPlan(guardado)).toEqual(guardado);
    }
  });

  it("reemplaza los textos viejos por los actuales y conserva la fecha", () => {
    const actual = generarPlan(audaz, FECHA);
    const viejo = {
      ...actual,
      posiciones: actual.posiciones.map((p) => ({ ...p, nombre: "Texto viejo", queSalePuedeMal: "Texto viejo", color: "bg-blue-600" })),
    };
    const actualizado = actualizarPlan(viejo);
    expect(actualizado).toEqual(actual);
    expect(actualizado.generadoEn).toBe(FECHA);
  });

  it("si las respuestas guardadas no son válidas, deja el plan como estaba", () => {
    const actual = generarPlan(audaz, FECHA);
    const roto = { ...actual, respuestas: { ...actual.respuestas, edad: 5 } };
    expect(actualizarPlan(roto)).toBe(roto);
  });
});

describe("tu siguiente paso", () => {
  it("con deudas caras, lo primero son las deudas, aunque falte el fondo", () => {
    const paso = siguientePaso(generarPlan({ ...audaz, deudasCaras: true, fondoEmergencia: "no" }, FECHA));
    expect(paso.titulo).toMatch(/deudas/);
    expect(paso.accion.tipo).toBe("finbot");
  });

  it("sin fondo de emergencia, lleva a comparar dónde dejar los pesos de la liquidez", () => {
    const plan = generarPlan({ ...audaz, fondoEmergencia: "parcial" }, FECHA);
    const paso = siguientePaso(plan);
    expect(paso.accion.tipo).toBe("enlace");
    if (paso.accion.tipo === "enlace") expect(paso.accion.href).toContain("tab=billeteras");
    expect(plan.avisos.map((a) => a.titulo)).toContain(paso.aviso);
  });

  it("con la base cubierta, apunta a la parte más grande del plan", () => {
    const plan = generarPlan(audaz, FECHA);
    const paso = siguientePaso(plan);
    const mayor = Math.max(...plan.posiciones.map((p) => p.porcentaje));
    expect(paso.accion.tipo).toBe("parte");
    const { accion } = paso;
    if (accion.tipo === "parte") expect(plan.posiciones.find((p) => p.categoria === accion.categoria)?.porcentaje).toBe(mayor);
  });

  it("nunca dice qué comprar, en ninguna combinación", () => {
    for (const r of todasLasCombinaciones()) {
      const p = siguientePaso(generarPlan(r, FECHA));
      expect(`${p.titulo} ${p.texto} ${p.accion.etiqueta}`).not.toMatch(/compr[aá]|te recomendamos/i);
    }
  });
});

describe("contexto para FinBot", () => {
  it("traduce el plan al formato que usa el chat", () => {
    const plan = generarPlan(audaz, FECHA);
    const ctx = aContextoEstrategia(plan);
    expect(ctx.perfil).toBe(plan.perfil.perfil);
    expect(ctx.objetivo).toBe("Crecimiento");
    expect(ctx.edad).toBe("22");
    expect(ctx.distribucion).toHaveLength(plan.posiciones.length);
    expect(ctx.distribucion.reduce((a, d) => a + d.porcentaje, 0)).toBe(100);
    expect(ctx.distribucion[0]).toEqual({
      activo: plan.posiciones[0].nombre,
      porcentaje: plan.posiciones[0].porcentaje,
      tipo: plan.posiciones[0].categoria,
    });
  });
});

describe("validación de respuestas", () => {
  it("acepta respuestas completas y válidas", () => {
    expect(validarRespuestas(audaz)).toEqual({});
  });

  it("rechaza edades fuera de rango o no enteras", () => {
    expect(validarRespuestas({ ...audaz, edad: 17 }).edad).toBeDefined();
    expect(validarRespuestas({ ...audaz, edad: 101 }).edad).toBeDefined();
    expect(validarRespuestas({ ...audaz, edad: 24.5 }).edad).toBeDefined();
    expect(validarRespuestas({ ...audaz, edad: Number.NaN }).edad).toBeDefined();
  });

  it("rechaza montos negativos o inválidos, pero acepta 0", () => {
    expect(validarRespuestas({ ...audaz, capitalInicial: -1 }).capitalInicial).toBeDefined();
    expect(validarRespuestas({ ...audaz, aporteMensual: Number.NaN }).aporteMensual).toBeDefined();
    expect(validarRespuestas({ ...audaz, capitalInicial: 0, aporteMensual: 0 })).toEqual({});
  });

  it("pide las respuestas que faltan", () => {
    const errores = validarRespuestas({ edad: 30 });
    expect(Object.keys(errores)).toEqual(
      expect.arrayContaining(["objetivo", "horizonte", "fondoEmergencia", "reaccionCaida", "prioridad", "conocimiento", "deudasCaras"]),
    );
  });
});

describe("ejemplos de la biblioteca en la cartera", () => {
  it("toda parte con 'Ver ejemplos' tiene entre 3 y 5, y el conservador nunca ve riesgo alto", async () => {
    const { CATEGORIAS_CON_EJEMPLOS, ejemplosPara } = await import("./instrumentos/catalogo");
    for (const r of todasLasCombinaciones()) {
      const plan = generarPlan(r, FECHA);
      for (const p of plan.posiciones) {
        if (!CATEGORIAS_CON_EJEMPLOS.includes(p.categoria)) continue;
        const ej = ejemplosPara(p.categoria, plan.perfil.perfil);
        expect(ej.length).toBeGreaterThanOrEqual(3);
        expect(ej.length).toBeLessThanOrEqual(5);
        if (plan.perfil.perfil === "Conservador") expect(ej.some((i) => i.riesgo === "alto")).toBe(false);
      }
    }
  });
});
