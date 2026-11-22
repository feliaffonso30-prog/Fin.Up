"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pesosADolares } from "@/lib/plataforma/escenarios";
import { validarRespuestas } from "@/lib/plataforma/perfil";
import { generarPlan } from "@/lib/plataforma/plan";
import { usePlan } from "@/lib/plataforma/store";
import type { Plan, Respuestas } from "@/lib/plataforma/tipos";

// Estado del cuestionario: respuestas, paso actual, validación, generación del plan
// y guardado. La vista (components/plataforma/onboarding.tsx) solo dibuja los pasos.
// Una pregunta por pantalla. Si se interrumpe, el avance se recupera al volver.

export type Clave = keyof Respuestas;

export const PASOS: { titulo: string; ayuda: string; campos: Clave[] }[] = [
  { titulo: "¿Cuántos años tenés?", ayuda: "Nos ayuda a estimar cuánto tiempo tenés por delante.", campos: ["edad"] },
  { titulo: "¿Para qué querés invertir?", ayuda: "Elegí lo que más se parezca a lo que buscás.", campos: ["objetivo"] },
  { titulo: "¿Cuándo vas a necesitar esta plata?", ayuda: "Cuanto más tiempo tengas, más caídas podés esperar a que se recuperen.", campos: ["horizonte"] },
  { titulo: "¿Con cuánto arrancás?", ayuda: "Un aproximado alcanza. Si todavía no tenés nada, poné 0.", campos: ["capitalInicial"] },
  { titulo: "¿Cuánto podés sumar por mes?", ayuda: "Lo que podrías aportar sin ajustar tus gastos básicos.", campos: ["aporteMensual"] },
  { titulo: "¿Tenés un fondo de emergencia?", ayuda: "Plata guardada para imprevistos, equivalente a 3 meses de gastos o más.", campos: ["fondoEmergencia"] },
  { titulo: "¿Tenés deudas con tasas altas?", ayuda: "Por ejemplo, saldo de tarjeta financiado o préstamos personales caros. No juzgamos: solo ajustamos tu plan.", campos: ["deudasCaras"] },
  { titulo: "Tu inversión cae 20% en unos meses. ¿Qué harías?", ayuda: "No hay respuestas buenas o malas. Conocerte evita decisiones por pánico.", campos: ["reaccionCaida"] },
  { titulo: "¿Qué te importa más?", ayuda: "Elegí lo primero que te salga.", campos: ["prioridad"] },
  { titulo: "¿Cuánto sabés de inversiones?", ayuda: "Si recién empezás, evitamos un perfil agresivo.", campos: ["conocimiento"] },
];

const numero = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));

// ---- Avance guardado: una comodidad de este navegador, se borra al terminar ----

const CLAVE_AVANCE = "finup:cuestionario:v1";

interface Avance {
  paso: number;
  edad: string;
  capital: string;
  aporte: string;
  enDolares: boolean;
  resp: Partial<Respuestas>;
}

function leerAvance(): Avance | null {
  try {
    const x = JSON.parse(window.localStorage.getItem(CLAVE_AVANCE) ?? "null");
    return x && typeof x.paso === "number" ? (x as Avance) : null;
  } catch {
    return null;
  }
}

function escribirAvance(a: Avance | null) {
  try {
    if (a) window.localStorage.setItem(CLAVE_AVANCE, JSON.stringify(a));
    else window.localStorage.removeItem(CLAVE_AVANCE);
  } catch {
    /* sin storage: el avance vive solo mientras la pestaña esté abierta */
  }
}

export function useCuestionario() {
  const router = useRouter();
  const { plan: planGuardado, cargando, sinCuenta, guardar } = usePlan();

  // Quien ya tiene un plan ve primero "Revisemos tus respuestas". Quien arranca entra directo a las preguntas.
  const [enBienvenida, setEnBienvenida] = useState(false);
  const [listo, setListo] = useState(false);
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);
  // Los números se guardan como texto mientras se escriben, para no pelear con el input.
  const [edad, setEdad] = useState("");
  const [capital, setCapital] = useState("");
  const [aporte, setAporte] = useState("");
  const [resp, setResp] = useState<Partial<Respuestas>>({});
  const [intento, setIntento] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  // La persona piensa en pesos: el monto se pide en pesos y el motor lo recibe en dólares.
  // Sin cotización disponible, o si prefiere, se escribe directo en dólares.
  const [mep, setMep] = useState<number | null>(null);
  const [enDolares, setEnDolares] = useState(false);
  const enPesos = !enDolares && mep !== null;

  useEffect(() => {
    let vigente = true;
    fetch("/api/dolar-mep")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vigente && typeof d?.venta === "number" && d.venta > 0) setMep(d.venta);
      })
      .catch(() => {
        /* sin cotización: se escribe en dólares */
      });
    return () => {
      vigente = false;
    };
  }, []);

  // Arranca con el avance guardado o, si ya hizo el cuestionario, con sus respuestas anteriores.
  const precargado = useRef(false);
  useEffect(() => {
    if (cargando || precargado.current) return;
    precargado.current = true;
    const avance = leerAvance();
    if (avance) {
      setPaso(Math.min(avance.paso, PASOS.length - 1));
      setEdad(avance.edad);
      setCapital(avance.capital);
      setAporte(avance.aporte);
      setEnDolares(avance.enDolares);
      setResp(avance.resp);
    } else if (planGuardado) {
      const r = planGuardado.respuestas;
      setEdad(String(r.edad));
      setCapital(String(r.capitalInicial));
      setAporte(String(r.aporteMensual));
      setEnDolares(true); // lo guardado ya está en dólares
      setResp(r);
      setEnBienvenida(true);
    }
    setListo(true);
  }, [cargando, planGuardado]);

  useEffect(() => {
    if (!listo || enBienvenida || paso >= PASOS.length) return;
    escribirAvance({ paso, edad, capital, aporte, enDolares, resp });
  }, [listo, enBienvenida, paso, edad, capital, aporte, enDolares, resp]);

  const set = <K extends Clave>(k: K, v: Respuestas[K]) => setResp((prev) => ({ ...prev, [k]: v }));

  const aDolares = (texto: string) => {
    const n = numero(texto);
    return enPesos && Number.isFinite(n) ? pesosADolares(n, mep) : n;
  };

  const actuales = (): Partial<Respuestas> => ({
    ...resp,
    edad: numero(edad),
    capitalInicial: aDolares(capital),
    aporteMensual: aDolares(aporte),
  });

  const errores = validarRespuestas(actuales());
  const enResultado = paso === PASOS.length;
  const def = PASOS[Math.min(paso, PASOS.length - 1)];
  // Los errores se muestran recién después de intentar avanzar.
  const err = (c: Clave) => (intento ? errores[c] : undefined);

  function siguiente() {
    if (def.campos.some((c) => errores[c])) {
      setIntento(true);
      return;
    }
    setIntento(false);
    if (paso === PASOS.length - 1) setPlan(generarPlan(actuales() as Respuestas));
    setPaso((p) => p + 1);
  }

  function volver() {
    setIntento(false);
    if (paso === 0) {
      if (planGuardado) setEnBienvenida(true);
      else router.push("/");
    } else setPaso((p) => p - 1);
  }

  const empezar = () => setEnBienvenida(false);

  /** Cambia entre pesos y dólares. Lo escrito se limpia para no mezclar monedas sin que se note. */
  function cambiarMoneda() {
    setEnDolares((v) => !v);
    setCapital("");
    setAporte("");
    setIntento(false);
  }

  async function verPlan() {
    if (!plan || guardando) return;
    setGuardando(true);
    setErrorGuardado(false);
    const ok = await guardar(plan);
    if (!ok) {
      setGuardando(false);
      setErrorGuardado(true);
      return;
    }
    escribirAvance(null);
    router.push("/dashboard");
  }

  return {
    sinCuenta,
    listo,
    enBienvenida,
    empezar,
    paso,
    def,
    enResultado,
    resp,
    set,
    err,
    edad,
    setEdad,
    capital,
    setCapital,
    aporte,
    setAporte,
    enPesos,
    mep,
    cotizacionDisponible: mep !== null,
    cambiarMoneda,
    aDolares,
    siguiente,
    volver,
    plan,
    verPlan,
    guardando,
    errorGuardado,
  };
}
