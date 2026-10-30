"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validarRespuestas } from "@/lib/plataforma/perfil";
import { generarPlan } from "@/lib/plataforma/plan";
import { usePlan } from "@/lib/plataforma/store";
import type { Plan, Respuestas } from "@/lib/plataforma/tipos";

// Estado del cuestionario del onboarding: respuestas, paso actual, validación,
// generación del plan y guardado. La vista (components/plataforma/onboarding.tsx)
// solo dibuja los pasos.

export type Clave = keyof Respuestas;

export const PASOS: { titulo: string; ayuda: string; campos: Clave[] }[] = [
  { titulo: "Contanos un poco de vos", ayuda: "Tu edad nos ayuda a estimar cuánto tiempo tenés por delante.", campos: ["edad"] },
  { titulo: "¿Para qué querés invertir?", ayuda: "Elegí el objetivo que más se parezca al tuyo.", campos: ["objetivo"] },
  { titulo: "¿Cuándo vas a necesitar esta plata?", ayuda: "Es lo más importante: cuanto más tiempo, más caídas podés esperar a que se recuperen.", campos: ["horizonte"] },
  { titulo: "¿Con cuánto arrancás?", ayuda: "Escribilo en dólares. Si lo tenés en pesos, dividilo por el valor del dólar de hoy: no hace falta que sea exacto.", campos: ["capitalInicial", "aporteMensual"] },
  { titulo: "Tu base financiera", ayuda: "Antes de invertir conviene tener las bases cubiertas. No juzgamos: solo ajustamos la cartera.", campos: ["fondoEmergencia", "deudasCaras"] },
  { titulo: "¿Cómo reaccionás ante el riesgo?", ayuda: "No hay respuestas buenas o malas. Conocerte bien evita decisiones por pánico.", campos: ["reaccionCaida", "prioridad"] },
  { titulo: "¿Cuánto sabés de inversiones?", ayuda: "Sirve para explicarte las cosas al nivel justo.", campos: ["conocimiento"] },
];

const numero = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));

export function useCuestionario() {
  const router = useRouter();
  const { plan: planGuardado, cargando, guardar } = usePlan();

  // Antes de la primera pregunta hay una bienvenida: qué vas a recibir y cuánto tarda.
  const [enBienvenida, setEnBienvenida] = useState(true);
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

  // Si ya hizo el cuestionario, arranca con sus respuestas anteriores.
  const precargado = useRef(false);
  useEffect(() => {
    if (cargando || precargado.current || !planGuardado) return;
    precargado.current = true;
    const r = planGuardado.respuestas;
    setEdad(String(r.edad));
    setCapital(String(r.capitalInicial));
    setAporte(String(r.aporteMensual));
    setResp(r);
  }, [cargando, planGuardado]);

  const set = <K extends Clave>(k: K, v: Respuestas[K]) => setResp((prev) => ({ ...prev, [k]: v }));

  const actuales = (): Partial<Respuestas> => ({
    ...resp,
    edad: numero(edad),
    capitalInicial: numero(capital),
    aporteMensual: numero(aporte),
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
    if (paso === 0) setEnBienvenida(true);
    else setPaso((p) => p - 1);
  }

  const empezar = () => setEnBienvenida(false);

  async function verCartera() {
    if (!plan || guardando) return;
    setGuardando(true);
    setErrorGuardado(false);
    const ok = await guardar(plan);
    if (!ok) {
      setGuardando(false);
      setErrorGuardado(true);
      return;
    }
    router.push("/dashboard");
  }

  return {
    enBienvenida,
    empezar,
    /** Ya tenía un plan: sus respuestas anteriores están precargadas. */
    respuestasPrevias: !!planGuardado,
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
    siguiente,
    volver,
    plan,
    verCartera,
    guardando,
    errorGuardado,
  };
}
