"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { GrupoOpciones, Opcion } from "@/components/plataforma/opcion";
import { DESCRIPCION_PERFIL, validarRespuestas } from "@/lib/plataforma/perfil";
import { generarPlan } from "@/lib/plataforma/plan";
import { URL_LANDING } from "@/lib/config";
import { usePlan } from "@/lib/plataforma/store";
import type { Plan, Respuestas } from "@/lib/plataforma/tipos";

type Clave = keyof Respuestas;

const PASOS: { titulo: string; ayuda: string; campos: Clave[] }[] = [
  { titulo: "Contanos un poco de vos", ayuda: "Tu edad nos ayuda a estimar cuánto tiempo tenés por delante.", campos: ["edad"] },
  { titulo: "¿Para qué querés invertir?", ayuda: "Elegí el objetivo que más se parezca al tuyo.", campos: ["objetivo"] },
  { titulo: "¿Cuándo vas a necesitar esta plata?", ayuda: "Es lo más importante: cuanto más tiempo, más caídas podés esperar a que se recuperen.", campos: ["horizonte"] },
  { titulo: "¿Con cuánto arrancás?", ayuda: "Son montos en dólares. Si pensás en pesos, usá un valor aproximado (por ejemplo, al dólar MEP).", campos: ["capitalInicial", "aporteMensual"] },
  { titulo: "Tu base financiera", ayuda: "Antes de invertir conviene tener las bases cubiertas. No juzgamos: solo ajustamos la cartera.", campos: ["fondoEmergencia", "deudasCaras"] },
  { titulo: "¿Cómo reaccionás ante el riesgo?", ayuda: "No hay respuestas buenas o malas. Conocerte bien evita decisiones por pánico.", campos: ["reaccionCaida", "prioridad"] },
  { titulo: "¿Cuánto sabés de inversiones?", ayuda: "Sirve para explicarte las cosas al nivel justo.", campos: ["conocimiento"] },
];

const numero = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));

export function Onboarding() {
  const router = useRouter();
  const { plan: planGuardado, cargando, guardar } = usePlan();

  const [paso, setPaso] = useState(0);
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
    setPaso((p) => Math.max(0, p - 1));
  }

  function verCartera() {
    if (!plan) return;
    guardar(plan);
    router.push("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_65%)] blur-3xl" />

      <main className="mx-auto flex max-w-xl flex-col px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <img src="/finup.logo.1.png" alt="FinUp" className="h-14 w-auto" />
          </Link>
          <a href={URL_LANDING} className="text-xs text-muted-foreground hover:text-foreground">
            Salir
          </a>
        </div>

        {!enResultado ? (
          <Card className="border-border bg-card shadow-2xl shadow-black/40">
            <CardHeader className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Paso {paso + 1} de {PASOS.length}</span>
                  <span>{Math.round((paso / PASOS.length) * 100)}%</span>
                </div>
                <Progress value={(paso / PASOS.length) * 100} aria-label="Avance del cuestionario" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{def.titulo}</CardTitle>
                <CardDescription className="mt-1.5 text-muted-foreground">{def.ayuda}</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  siguiente();
                }}
                className="space-y-6"
              >
                {paso === 0 && (
                  <Campo etiqueta="Edad" error={err("edad")} htmlFor="edad">
                    <Input
                      id="edad"
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={100}
                      placeholder="Ej. 24"
                      value={edad}
                      onChange={(e) => setEdad(e.target.value)}
                      aria-invalid={!!err("edad")}
                      autoFocus
                    />
                  </Campo>
                )}

                {paso === 1 && (
                  <GrupoOpciones etiqueta="Objetivo">
                    <Opcion seleccionada={resp.objetivo === "Preservar capital"} onClick={() => set("objetivo", "Preservar capital")} titulo="Preservar mi capital" detalle="Que mi plata no pierda valor. No busco crecer rápido." />
                    <Opcion seleccionada={resp.objetivo === "Crecimiento"} onClick={() => set("objetivo", "Crecimiento")} titulo="Hacerla crecer" detalle="Que mi plata crezca a largo plazo, aunque haya altibajos." />
                    <Opcion seleccionada={resp.objetivo === "Generar ingresos"} onClick={() => set("objetivo", "Generar ingresos")} titulo="Generar ingresos" detalle="Cobrar rentas o dividendos de forma periódica." />
                    <MensajeError texto={err("objetivo")} />
                  </GrupoOpciones>
                )}

                {paso === 2 && (
                  <GrupoOpciones etiqueta="Plazo">
                    <Opcion seleccionada={resp.horizonte === "menos-2"} onClick={() => set("horizonte", "menos-2")} titulo="En menos de 2 años" detalle="Para algo cercano: un viaje, una mudanza, un estudio." />
                    <Opcion seleccionada={resp.horizonte === "2-5"} onClick={() => set("horizonte", "2-5")} titulo="Entre 2 y 5 años" />
                    <Opcion seleccionada={resp.horizonte === "5-10"} onClick={() => set("horizonte", "5-10")} titulo="Entre 5 y 10 años" />
                    <Opcion seleccionada={resp.horizonte === "mas-10"} onClick={() => set("horizonte", "mas-10")} titulo="Más de 10 años" detalle="Largo plazo: independencia financiera, retiro." />
                    <MensajeError texto={err("horizonte")} />
                  </GrupoOpciones>
                )}

                {paso === 3 && (
                  <div className="space-y-5">
                    <Campo etiqueta="Capital con el que arrancás (USD)" error={err("capitalInicial")} htmlFor="capital" ayuda="Si todavía no tenés nada para arrancar, poné 0.">
                      <Input id="capital" type="number" inputMode="decimal" min={0} placeholder="Ej. 500" value={capital} onChange={(e) => setCapital(e.target.value)} aria-invalid={!!err("capitalInicial")} autoFocus />
                    </Campo>
                    <Campo etiqueta="Cuánto podés sumar por mes (USD)" error={err("aporteMensual")} htmlFor="aporte" ayuda="Lo que podrías aportar sin ajustar tus gastos básicos.">
                      <Input id="aporte" type="number" inputMode="decimal" min={0} placeholder="Ej. 50" value={aporte} onChange={(e) => setAporte(e.target.value)} aria-invalid={!!err("aporteMensual")} />
                    </Campo>
                  </div>
                )}

                {paso === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>¿Tenés un fondo de emergencia?</Label>
                      <p className="text-xs text-muted-foreground">Plata guardada para imprevistos, equivalente a 3 meses de gastos o más.</p>
                      <GrupoOpciones etiqueta="Fondo de emergencia">
                        <Opcion seleccionada={resp.fondoEmergencia === "si"} onClick={() => set("fondoEmergencia", "si")} titulo="Sí, ya lo tengo" />
                        <Opcion seleccionada={resp.fondoEmergencia === "parcial"} onClick={() => set("fondoEmergencia", "parcial")} titulo="Tengo una parte" />
                        <Opcion seleccionada={resp.fondoEmergencia === "no"} onClick={() => set("fondoEmergencia", "no")} titulo="Todavía no" />
                        <MensajeError texto={err("fondoEmergencia")} />
                      </GrupoOpciones>
                    </div>
                    <div className="space-y-2">
                      <Label>¿Tenés deudas con tasas altas?</Label>
                      <p className="text-xs text-muted-foreground">Por ejemplo, saldo de tarjeta financiado o préstamos personales caros.</p>
                      <GrupoOpciones etiqueta="Deudas">
                        <Opcion seleccionada={resp.deudasCaras === false} onClick={() => set("deudasCaras", false)} titulo="No" />
                        <Opcion seleccionada={resp.deudasCaras === true} onClick={() => set("deudasCaras", true)} titulo="Sí" />
                        <MensajeError texto={err("deudasCaras")} />
                      </GrupoOpciones>
                    </div>
                  </div>
                )}

                {paso === 5 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Invertiste y, en unos meses, tu inversión cae 20%. ¿Qué harías?</Label>
                      <GrupoOpciones etiqueta="Reacción ante una caída">
                        <Opcion seleccionada={resp.reaccionCaida === "vendo-todo"} onClick={() => set("reaccionCaida", "vendo-todo")} titulo="Vendería todo para no perder más" />
                        <Opcion seleccionada={resp.reaccionCaida === "vendo-parte"} onClick={() => set("reaccionCaida", "vendo-parte")} titulo="Vendería una parte para sentirme más tranquilo" />
                        <Opcion seleccionada={resp.reaccionCaida === "espero"} onClick={() => set("reaccionCaida", "espero")} titulo="Esperaría sin hacer nada" />
                        <Opcion seleccionada={resp.reaccionCaida === "compro-mas"} onClick={() => set("reaccionCaida", "compro-mas")} titulo="Aprovecharía para invertir más" />
                        <MensajeError texto={err("reaccionCaida")} />
                      </GrupoOpciones>
                    </div>
                    <div className="space-y-2">
                      <Label>¿Qué te importa más?</Label>
                      <GrupoOpciones etiqueta="Prioridad">
                        <Opcion seleccionada={resp.prioridad === "seguridad"} onClick={() => set("prioridad", "seguridad")} titulo="No perder lo que ya tengo" />
                        <Opcion seleccionada={resp.prioridad === "equilibrio"} onClick={() => set("prioridad", "equilibrio")} titulo="Un equilibrio entre cuidar mi plata y hacerla crecer" />
                        <Opcion seleccionada={resp.prioridad === "crecimiento"} onClick={() => set("prioridad", "crecimiento")} titulo="Que crezca lo máximo posible, aunque haya subas y bajas" />
                        <MensajeError texto={err("prioridad")} />
                      </GrupoOpciones>
                    </div>
                  </div>
                )}

                {paso === 6 && (
                  <GrupoOpciones etiqueta="Conocimiento">
                    <Opcion seleccionada={resp.conocimiento === "ninguno"} onClick={() => set("conocimiento", "ninguno")} titulo="Recién empiezo" detalle="Casi no sé cómo funcionan las inversiones." />
                    <Opcion seleccionada={resp.conocimiento === "basico"} onClick={() => set("conocimiento", "basico")} titulo="Tengo nociones básicas" detalle="Sé qué es un plazo fijo, una acción o un bono." />
                    <Opcion seleccionada={resp.conocimiento === "intermedio"} onClick={() => set("conocimiento", "intermedio")} titulo="Ya invierto o conozco bastante" detalle="Entiendo conceptos como diversificación o volatilidad." />
                    <MensajeError texto={err("conocimiento")} />
                  </GrupoOpciones>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={volver} disabled={paso === 0} className="cursor-pointer text-muted-foreground">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                  </Button>
                  <Button type="submit" className="cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 font-semibold text-white hover:opacity-95">
                    {paso === PASOS.length - 1 ? "Ver mi perfil" : "Siguiente"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          plan && <Resultado plan={plan} onVolver={volver} onContinuar={verCartera} />
        )}

        <p className="mt-6 text-center text-[11px] leading-snug text-muted-foreground/70">
          Contenido educativo, no es asesoramiento financiero. Tus respuestas se guardan solo en este dispositivo.
        </p>
      </main>
    </div>
  );
}

function Resultado({ plan, onVolver, onContinuar }: { plan: Plan; onVolver: () => void; onContinuar: () => void }) {
  const { perfil } = plan;
  return (
    <Card className="animate-in fade-in border-border bg-card shadow-2xl shadow-black/40 duration-500">
      <CardHeader className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Tu perfil de inversor</p>
        <CardTitle className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-4xl font-extrabold text-transparent">
          {perfil.perfil}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {DESCRIPCION_PERFIL[perfil.perfil]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-semibold">Así llegamos a este perfil</p>
          <ul className="space-y-2">
            {perfil.motivos.map((m) => (
              <li key={m} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </div>

        {perfil.ajustes.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldAlert className="h-4 w-4" aria-hidden /> Ajustamos tu perfil por seguridad
            </p>
            <p className="text-xs text-amber-200/80">
              Por tus respuestas te habría salido un perfil {perfil.perfilPorPuntaje.toLowerCase()}, pero lo bajamos a {perfil.perfil.toLowerCase()} porque:
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-200/90">
              {perfil.ajustes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onVolver} className="cursor-pointer text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Cambiar respuestas
          </Button>
          <Button type="button" onClick={onContinuar} className="cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 font-semibold text-white hover:opacity-95">
            Ver mi cartera <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Campo({ etiqueta, htmlFor, ayuda, error, children }: { etiqueta: string; htmlFor: string; ayuda?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="font-medium">{etiqueta}</Label>
      {children}
      {ayuda && !error && <p className="text-xs text-muted-foreground">{ayuda}</p>}
      <MensajeError texto={error} />
    </div>
  );
}

function MensajeError({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {texto}
    </p>
  );
}
