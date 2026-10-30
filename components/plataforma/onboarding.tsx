"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { GrupoOpciones, Opcion } from "@/components/plataforma/opcion";
import { Rombo, Sobretitulo } from "@/components/plataforma/primitivas";
import { PASOS, useCuestionario } from "@/hooks/use-cuestionario";
import { DESCRIPCION_PERFIL } from "@/lib/plataforma/perfil";
import { URL_LANDING } from "@/lib/config";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import type { Plan } from "@/lib/plataforma/tipos";

// Pasos cuyo input recibe el foco con autoFocus: ahí no se mueve el foco al título.
const PASOS_CON_AUTOFOCUS = [0, 3];
// Clases visuales de components/ui/label.tsx, para preguntas que no son un <label>.
const CLASES_PREGUNTA = "flex items-center gap-2 text-sm leading-none font-medium select-none";

export function Onboarding() {
  const {
    enBienvenida,
    empezar,
    respuestasPrevias,
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
  } = useCuestionario();

  // Al cambiar de paso, el foco va al título para que el lector de pantalla anuncie la pregunta nueva.
  // Se compara con el paso anterior (no con un flag de "primer render") para no disparar en el montaje,
  // tampoco con el doble efecto de StrictMode.
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const pasoPrevio = useRef(paso);
  // Si vuelve desde la primera pregunta a la bienvenida, el foco va al título de la bienvenida.
  const volvioABienvenida = useRef(false);
  const alVolver = () => {
    if (paso === 0) volvioABienvenida.current = true;
    volver();
  };
  useEffect(() => {
    if (pasoPrevio.current === paso) return;
    pasoPrevio.current = paso;
    if (paso >= PASOS.length || PASOS_CON_AUTOFOCUS.includes(paso)) return;
    tituloRef.current?.focus();
  }, [paso]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <main className="mx-auto flex max-w-xl flex-col px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <img src="/finup.logo.1.png" alt="FinUp" className="h-14 w-auto" />
          </Link>
          <a href={URL_LANDING} className="flex min-h-10 items-center px-2 text-sm text-muted-foreground hover:text-foreground">
            Salir
          </a>
        </div>

        {enBienvenida ? (
          <Bienvenida onEmpezar={empezar} respuestasPrevias={respuestasPrevias} enfocar={volvioABienvenida.current} />
        ) : !enResultado ? (
          <Card className="border-border bg-card">
            <CardHeader className="space-y-4">
              <div className="space-y-1.5">
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Pregunta {paso + 1} de {PASOS.length}
                </p>
                <Progress value={((paso + 1) / PASOS.length) * 100} aria-label={`Pregunta ${paso + 1} de ${PASOS.length}`} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  <h1 id="titulo-paso" ref={tituloRef} tabIndex={-1} className="outline-none">
                    {def.titulo}
                  </h1>
                </CardTitle>
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
                  <GrupoOpciones labelledBy="titulo-paso">
                    <Opcion seleccionada={resp.objetivo === "Preservar capital"} onClick={() => set("objetivo", "Preservar capital")} titulo="Preservar mi capital" detalle="Que mi plata no pierda valor. No busco crecer rápido." />
                    <Opcion seleccionada={resp.objetivo === "Crecimiento"} onClick={() => set("objetivo", "Crecimiento")} titulo="Hacerla crecer" detalle="Que mi plata crezca a largo plazo, aunque haya altibajos." />
                    <Opcion seleccionada={resp.objetivo === "Generar ingresos"} onClick={() => set("objetivo", "Generar ingresos")} titulo="Generar ingresos" detalle="Cobrar rentas o dividendos de forma periódica." />
                    <MensajeError texto={err("objetivo")} />
                  </GrupoOpciones>
                )}

                {paso === 2 && (
                  <GrupoOpciones labelledBy="titulo-paso">
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
                      <p id="pregunta-fondo" className={CLASES_PREGUNTA}>¿Tenés un fondo de emergencia?</p>
                      <p id="ayuda-fondo" className="text-xs text-muted-foreground">Plata guardada para imprevistos, equivalente a 3 meses de gastos o más.</p>
                      <GrupoOpciones labelledBy="pregunta-fondo" describedBy="ayuda-fondo">
                        <Opcion seleccionada={resp.fondoEmergencia === "si"} onClick={() => set("fondoEmergencia", "si")} titulo="Sí, ya lo tengo" />
                        <Opcion seleccionada={resp.fondoEmergencia === "parcial"} onClick={() => set("fondoEmergencia", "parcial")} titulo="Tengo una parte" />
                        <Opcion seleccionada={resp.fondoEmergencia === "no"} onClick={() => set("fondoEmergencia", "no")} titulo="Todavía no" />
                        <MensajeError texto={err("fondoEmergencia")} />
                      </GrupoOpciones>
                    </div>
                    <div className="space-y-2">
                      <p id="pregunta-deudas" className={CLASES_PREGUNTA}>¿Tenés deudas con tasas altas?</p>
                      <p id="ayuda-deudas" className="text-xs text-muted-foreground">Por ejemplo, saldo de tarjeta financiado o préstamos personales caros.</p>
                      <GrupoOpciones labelledBy="pregunta-deudas" describedBy="ayuda-deudas">
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
                      <p id="pregunta-caida" className={CLASES_PREGUNTA}>Invertiste y, en unos meses, tu inversión cae 20%. ¿Qué harías?</p>
                      <GrupoOpciones labelledBy="pregunta-caida">
                        <Opcion seleccionada={resp.reaccionCaida === "vendo-todo"} onClick={() => set("reaccionCaida", "vendo-todo")} titulo="Vendería todo para no perder más" />
                        <Opcion seleccionada={resp.reaccionCaida === "vendo-parte"} onClick={() => set("reaccionCaida", "vendo-parte")} titulo="Vendería una parte para sentirme más tranquilo" />
                        <Opcion seleccionada={resp.reaccionCaida === "espero"} onClick={() => set("reaccionCaida", "espero")} titulo="Esperaría sin hacer nada" />
                        <Opcion seleccionada={resp.reaccionCaida === "compro-mas"} onClick={() => set("reaccionCaida", "compro-mas")} titulo="Aprovecharía para invertir más" />
                        <MensajeError texto={err("reaccionCaida")} />
                      </GrupoOpciones>
                    </div>
                    <div className="space-y-2">
                      <p id="pregunta-prioridad" className={CLASES_PREGUNTA}>¿Qué te importa más?</p>
                      <GrupoOpciones labelledBy="pregunta-prioridad">
                        <Opcion seleccionada={resp.prioridad === "seguridad"} onClick={() => set("prioridad", "seguridad")} titulo="No perder lo que ya tengo" />
                        <Opcion seleccionada={resp.prioridad === "equilibrio"} onClick={() => set("prioridad", "equilibrio")} titulo="Un equilibrio entre cuidar mi plata y hacerla crecer" />
                        <Opcion seleccionada={resp.prioridad === "crecimiento"} onClick={() => set("prioridad", "crecimiento")} titulo="Que crezca lo máximo posible, aunque haya subas y bajas" />
                        <MensajeError texto={err("prioridad")} />
                      </GrupoOpciones>
                    </div>
                  </div>
                )}

                {paso === 6 && (
                  <GrupoOpciones labelledBy="titulo-paso">
                    <Opcion seleccionada={resp.conocimiento === "ninguno"} onClick={() => set("conocimiento", "ninguno")} titulo="Recién empiezo" detalle="Casi no sé cómo funcionan las inversiones." />
                    <Opcion seleccionada={resp.conocimiento === "basico"} onClick={() => set("conocimiento", "basico")} titulo="Tengo nociones básicas" detalle="Sé qué es un plazo fijo, una acción o un bono." />
                    <Opcion seleccionada={resp.conocimiento === "intermedio"} onClick={() => set("conocimiento", "intermedio")} titulo="Ya invierto o conozco bastante" detalle="Entiendo conceptos como diversificación o volatilidad." />
                    <MensajeError texto={err("conocimiento")} />
                  </GrupoOpciones>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={alVolver} className="cursor-pointer text-muted-foreground">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                  </Button>
                  <Button type="submit" className="cursor-pointer font-semibold">
                    {paso === PASOS.length - 1 ? "Ver mi perfil" : "Siguiente"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          plan && <Resultado plan={plan} onVolver={volver} onContinuar={verCartera} guardando={guardando} errorGuardado={errorGuardado} />
        )}

        <p className="mt-6 text-center text-legal leading-snug text-muted-foreground/70">
          {AUTH_CONFIGURADA
            ? "Contenido educativo, no es asesoramiento financiero. Tus respuestas se guardan en tu cuenta para que puedas verlas desde cualquier dispositivo."
            : "Contenido educativo, no es asesoramiento financiero. Tus respuestas se guardan solo en este dispositivo."}
        </p>
      </main>
    </div>
  );
}

function Bienvenida({
  onEmpezar,
  respuestasPrevias,
  enfocar,
}: {
  onEmpezar: () => void;
  respuestasPrevias: boolean;
  enfocar: boolean;
}) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (enfocar) tituloRef.current?.focus();
  }, [enfocar]);
  return (
    <Card className="animate-in fade-in border-border bg-card duration-500 motion-reduce:animate-none">
      <CardHeader className="space-y-3">
        <Sobretitulo>Tu perfil de inversor</Sobretitulo>
        <CardTitle className="text-3xl font-extrabold">
          <h1 ref={tituloRef} tabIndex={-1} className="outline-none">
            {respuestasPrevias ? "Revisemos tus respuestas" : "Antes de invertir, conocete"}
          </h1>
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {respuestasPrevias
            ? "Tus respuestas anteriores ya están cargadas: cambiá solo lo que haya cambiado en tu vida."
            : "Con unas preguntas simples armamos un plan pensado para vos, explicado parte por parte."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3 text-sm leading-relaxed text-foreground/90">
          {[
            "7 preguntas cortas, unos 3 minutos.",
            "Te mostramos un plan con el porqué de cada parte y qué puede salir mal.",
            "No movemos tu plata ni te pedimos datos bancarios: FinUp no opera ni vende inversiones.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <Rombo className="mt-1.5 bg-enlace" />
              {t}
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button type="button" onClick={onEmpezar} className="cursor-pointer">
            {respuestasPrevias ? "Revisar mis respuestas" : "Empezar"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Resultado({
  plan,
  onVolver,
  onContinuar,
  guardando,
  errorGuardado,
}: {
  plan: Plan;
  onVolver: () => void;
  onContinuar: () => void;
  guardando: boolean;
  errorGuardado: boolean;
}) {
  const { perfil } = plan;
  // Al llegar al resultado, el foco va a su título.
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);
  return (
    <Card className="animate-in fade-in border-border bg-card duration-500 motion-reduce:animate-none">
      <CardHeader className="space-y-3">
        <Sobretitulo>Tu perfil de inversor</Sobretitulo>
        <CardTitle className="text-4xl font-extrabold text-enlace">
          <h1 ref={tituloRef} tabIndex={-1} className="outline-none">
            {perfil.perfil}
          </h1>
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
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </div>

        {perfil.ajustes.length > 0 && (
          <div className="space-y-2 rounded-xl border border-atencion/25 bg-atencion/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-atencion">
              <ShieldAlert className="h-4 w-4" aria-hidden /> Ajustamos tu perfil por seguridad
            </p>
            <p className="text-xs text-atencion-texto/80">
              Por tus respuestas te habría salido un perfil {perfil.perfilPorPuntaje.toLowerCase()}, pero lo bajamos a {perfil.perfil.toLowerCase()} porque:
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-atencion-texto/90">
              {perfil.ajustes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {errorGuardado && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-error/40 bg-error/10 p-2.5 text-sm text-error">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            No pudimos guardar tu cartera. Revisá tu conexión y probá de nuevo.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onVolver} className="cursor-pointer text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Cambiar respuestas
          </Button>
          <Button type="button" onClick={onContinuar} disabled={guardando} className="cursor-pointer font-semibold">
            {guardando ? "Guardando…" : "Ver mi cartera"} <ArrowRight className="ml-1 h-4 w-4" />
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
