"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EscenariosGrandes } from "@/components/plataforma/escenarios";
import { GrupoOpciones, Opcion } from "@/components/plataforma/opcion";
import { Aviso, Marca, Punto, TextoLegal } from "@/components/plataforma/primitivas";
import { PASOS, useCuestionario } from "@/hooks/use-cuestionario";
import { URL_LANDING } from "@/lib/config";
import { ars, usd } from "@/lib/plataforma/formato";
import { DESCRIPCION_PERFIL } from "@/lib/plataforma/perfil";
import type { Plan } from "@/lib/plataforma/tipos";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

// Pasos cuyo input recibe el foco con autoFocus: ahí no se mueve el foco al título.
const PASOS_CON_AUTOFOCUS = [0, 3, 4];

const orden = (n: number) => ({ "--orden": n }) as React.CSSProperties;

export function Onboarding() {
  const c = useCuestionario();
  const { paso, def, enResultado, enBienvenida, resp, set, err, plan } = c;

  // Al cambiar de paso, el foco va al título para que el lector de pantalla anuncie la pregunta nueva.
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const pasoPrevio = useRef(paso);
  useEffect(() => {
    if (pasoPrevio.current === paso) return;
    pasoPrevio.current = paso;
    if (paso >= PASOS.length || PASOS_CON_AUTOFOCUS.includes(paso)) return;
    tituloRef.current?.focus();
  }, [paso]);

  const enPreguntas = !enBienvenida && !enResultado;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 md:max-w-xl">
      <header className="flex items-center justify-between gap-3 py-5">
        <Link href="/" aria-label="FinUp, volver a la portada">
          <Marca />
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {enPreguntas && (
            <span className="tabular-nums">
              Pregunta {paso + 1} de {PASOS.length}
            </span>
          )}
          {enResultado && <span>Tu resultado</span>}
          <a href={URL_LANDING} className="flex min-h-10 items-center px-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Salir
          </a>
        </div>
      </header>

      {/* Hasta leer el avance guardado, no se dibuja una pregunta que podría no ser la que sigue */}
      {!c.listo ? (
        <div className="flex-1" aria-busy="true" aria-label="Preparando tus preguntas" />
      ) : enBienvenida ? (
        <Bienvenida onEmpezar={c.empezar} />
      ) : enResultado ? (
        plan && <Resultado plan={plan} onVolver={c.volver} onContinuar={c.verPlan} guardando={c.guardando} errorGuardado={c.errorGuardado} />
      ) : (
        <main className="flex flex-1 flex-col">
          <div
            role="progressbar"
            aria-label="Avance del cuestionario"
            aria-valuemin={1}
            aria-valuemax={PASOS.length}
            aria-valuenow={paso + 1}
            className="flex gap-1"
          >
            {PASOS.map((p, i) => (
              <span key={p.titulo} className={cn("h-1.5 flex-1 rounded-full", i <= paso ? "bg-white" : "bg-white/25")} />
            ))}
          </div>

          <h1 id="titulo-paso" ref={tituloRef} tabIndex={-1} className="mt-7 text-[2.0625rem] font-black leading-[1.04] tracking-[-0.03em] outline-none md:text-4xl">
            {def.titulo}
          </h1>
          <p id="ayuda-paso" className="mt-3 text-base leading-snug text-muted-foreground">
            {def.ayuda}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              c.siguiente();
            }}
            className="mt-6 flex flex-1 flex-col"
          >
            {paso === 0 && (
              <CampoNumero id="edad" prefijo="" sufijo="años" valor={c.edad} onCambio={c.setEdad} error={err("edad")} placeholder="24" />
            )}

            {paso === 1 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.objetivo === "Preservar capital"} onClick={() => set("objetivo", "Preservar capital")} titulo="Cuidar lo que tengo" detalle="Que mi plata no pierda valor. No busco crecer rápido." />
                <Opcion seleccionada={resp.objetivo === "Crecimiento"} onClick={() => set("objetivo", "Crecimiento")} titulo="Hacerla crecer" detalle="Que mi plata crezca a largo plazo, aunque haya altibajos." />
                <Opcion seleccionada={resp.objetivo === "Generar ingresos"} onClick={() => set("objetivo", "Generar ingresos")} titulo="Generar ingresos" detalle="Cobrar una renta de forma periódica." />
                <MensajeError texto={err("objetivo")} />
              </GrupoOpciones>
            )}

            {paso === 2 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.horizonte === "menos-2"} onClick={() => set("horizonte", "menos-2")} titulo="En menos de 2 años" detalle="Un viaje, una mudanza, un estudio" />
                <Opcion seleccionada={resp.horizonte === "2-5"} onClick={() => set("horizonte", "2-5")} titulo="Entre 2 y 5 años" />
                <Opcion seleccionada={resp.horizonte === "5-10"} onClick={() => set("horizonte", "5-10")} titulo="Entre 5 y 10 años" />
                <Opcion seleccionada={resp.horizonte === "mas-10"} onClick={() => set("horizonte", "mas-10")} titulo="En más de 10 años" detalle="Largo plazo, retiro" />
                <MensajeError texto={err("horizonte")} />
              </GrupoOpciones>
            )}

            {(paso === 3 || paso === 4) && (
              <CampoMonto
                key={paso}
                valor={paso === 3 ? c.capital : c.aporte}
                onCambio={paso === 3 ? c.setCapital : c.setAporte}
                error={err(paso === 3 ? "capitalInicial" : "aporteMensual")}
                placeholder={c.enPesos ? (paso === 3 ? "500000" : "50000") : paso === 3 ? "500" : "50"}
                enPesos={c.enPesos}
                mep={c.mep}
                enDolares={c.aDolares(paso === 3 ? c.capital : c.aporte)}
                puedeCambiar={c.cotizacionDisponible}
                onCambiarMoneda={c.cambiarMoneda}
              />
            )}

            {paso === 5 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.fondoEmergencia === "si"} onClick={() => set("fondoEmergencia", "si")} titulo="Sí, ya lo tengo" />
                <Opcion seleccionada={resp.fondoEmergencia === "parcial"} onClick={() => set("fondoEmergencia", "parcial")} titulo="Tengo una parte" />
                <Opcion seleccionada={resp.fondoEmergencia === "no"} onClick={() => set("fondoEmergencia", "no")} titulo="Todavía no" />
                <MensajeError texto={err("fondoEmergencia")} />
              </GrupoOpciones>
            )}

            {paso === 6 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.deudasCaras === false} onClick={() => set("deudasCaras", false)} titulo="No" />
                <Opcion seleccionada={resp.deudasCaras === true} onClick={() => set("deudasCaras", true)} titulo="Sí" />
                <MensajeError texto={err("deudasCaras")} />
              </GrupoOpciones>
            )}

            {paso === 7 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.reaccionCaida === "vendo-todo"} onClick={() => set("reaccionCaida", "vendo-todo")} titulo="Vendería todo para no perder más" />
                <Opcion seleccionada={resp.reaccionCaida === "vendo-parte"} onClick={() => set("reaccionCaida", "vendo-parte")} titulo="Vendería una parte para quedarme tranquilo" />
                <Opcion seleccionada={resp.reaccionCaida === "espero"} onClick={() => set("reaccionCaida", "espero")} titulo="Esperaría sin hacer nada" />
                <Opcion seleccionada={resp.reaccionCaida === "compro-mas"} onClick={() => set("reaccionCaida", "compro-mas")} titulo="Aprovecharía para invertir más" />
                <MensajeError texto={err("reaccionCaida")} />
              </GrupoOpciones>
            )}

            {paso === 8 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.prioridad === "seguridad"} onClick={() => set("prioridad", "seguridad")} titulo="No perder lo que ya tengo" />
                <Opcion seleccionada={resp.prioridad === "equilibrio"} onClick={() => set("prioridad", "equilibrio")} titulo="Un equilibrio entre cuidar mi plata y hacerla crecer" />
                <Opcion seleccionada={resp.prioridad === "crecimiento"} onClick={() => set("prioridad", "crecimiento")} titulo="Que crezca lo máximo posible, aunque haya subas y bajas" />
                <MensajeError texto={err("prioridad")} />
              </GrupoOpciones>
            )}

            {paso === 9 && (
              <GrupoOpciones labelledBy="titulo-paso" describedBy="ayuda-paso">
                <Opcion seleccionada={resp.conocimiento === "ninguno"} onClick={() => set("conocimiento", "ninguno")} titulo="Recién empiezo" detalle="Casi no sé cómo funcionan las inversiones." />
                <Opcion seleccionada={resp.conocimiento === "basico"} onClick={() => set("conocimiento", "basico")} titulo="Tengo nociones básicas" detalle="Sé qué es un plazo fijo, una acción o un bono." />
                <Opcion seleccionada={resp.conocimiento === "intermedio"} onClick={() => set("conocimiento", "intermedio")} titulo="Ya invierto o conozco bastante" detalle="Sé cómo repartir el riesgo entre distintas inversiones." />
                <MensajeError texto={err("conocimiento")} />
              </GrupoOpciones>
            )}

            <div className="mt-auto pb-5 pt-7">
              <div className="flex gap-2.5">
                <Button type="button" variant="ghost" onClick={c.volver} aria-label="Atrás" className="vidrio h-14 w-14 shrink-0 rounded-lg">
                  <ArrowLeft className="size-5" aria-hidden />
                </Button>
                <Button type="submit" size="cta" className="min-w-0 flex-1">
                  {paso === PASOS.length - 1 ? "Ver mi perfil" : "Seguir"}
                </Button>
              </div>
              <TextoLegal className="mt-3 text-center">
                Contenido educativo, no es asesoramiento financiero.
                {(!AUTH_CONFIGURADA || c.sinCuenta) && " Tus respuestas quedan en este dispositivo."}
              </TextoLegal>
            </div>
          </form>
        </main>
      )}
    </div>
  );
}

/** Solo para quien vuelve a hacer el cuestionario: quien arranca ya pasó por la portada. */
function Bienvenida({ onEmpezar }: { onEmpezar: () => void }) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);
  return (
    <main className="flex flex-1 flex-col">
      <h1 ref={tituloRef} tabIndex={-1} className="mt-8 text-[2.75rem] font-black leading-none tracking-[-0.035em] outline-none">
        Revisemos tus respuestas
      </h1>
      <p className="mt-4 text-lg leading-snug text-muted-foreground">Ya están cargadas: cambiá solo lo que haya cambiado en tu vida.</p>
      <div className="mt-auto pb-5 pt-8">
        <Button type="button" size="cta" onClick={onEmpezar}>
          Revisar mis respuestas
        </Button>
        <Button asChild variant="ghost" className="mt-2 h-12 w-full">
          <Link href="/dashboard">Volver a mi plan</Link>
        </Button>
      </div>
    </main>
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
  const { perfil, analisis, respuestas } = plan;
  const capital = respuestas.capitalInicial;
  // Al llegar al resultado, el foco va a su título.
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);
  return (
    <main className="flex flex-1 flex-col">
      <h1 ref={tituloRef} tabIndex={-1} className="mt-3 outline-none">
        <span className="revelar block text-lg font-semibold tracking-normal" style={orden(0)}>
          Te salió un perfil
        </span>
        <span className="revelar block text-[3.125rem] font-black leading-none tracking-[-0.04em]" style={orden(1)}>
          {perfil.perfil}
        </span>
      </h1>
      <p className="revelar mt-4 text-base leading-snug text-muted-foreground" style={orden(2)}>
        {DESCRIPCION_PERFIL[perfil.perfil]}
        {capital > 0 ? ` Con ${usd(capital)}, en un año podría pasar esto:` : " En un año podría pasar esto:"}
      </p>

      <div className="mt-6">
        <EscenariosGrandes analisis={analisis} capital={capital} />
      </div>

      <div className="revelar mt-6 space-y-3" style={orden(5)}>
        {perfil.ajustes.length > 0 && (
          <p className="text-base font-semibold leading-snug">
            Por tus respuestas te habría salido {perfil.perfilPorPuntaje.toLowerCase()}; por seguridad lo dejamos en {perfil.perfil.toLowerCase()}.
          </p>
        )}
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-bold [&::-webkit-details-marker]:hidden">
            Por qué te salió este perfil
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <ul className="mt-1 space-y-2 pb-2">
            {[...perfil.ajustes, ...perfil.motivos].map((m) => (
              <li key={m} className="flex gap-2.5 text-sm leading-snug text-muted-foreground">
                <Punto className="mt-1 bg-enlace" />
                {m}
              </li>
            ))}
          </ul>
        </details>
        {errorGuardado && (
          <Aviso nivel="error" role="alert" compacto>
            No pudimos guardar tu plan. Revisá tu conexión y probá de nuevo.
          </Aviso>
        )}
      </div>

      <div className="revelar mt-auto pb-5 pt-7" style={orden(6)}>
        <Button type="button" size="cta" onClick={onContinuar} disabled={guardando}>
          {guardando ? "Guardando…" : "Ver mi plan"}
        </Button>
        <p className="mt-2.5 text-center text-sm text-muted-foreground">Estimaciones, no promesas.</p>
        <Button type="button" variant="ghost" onClick={onVolver} className="mt-1 h-11 w-full">
          Cambiar respuestas
        </Button>
      </div>
    </main>
  );
}

const CLASE_CAMPO =
  "vidrio h-16 rounded-lg border-0 pl-4 text-2xl font-black tracking-[-0.02em] tabular-nums placeholder:font-semibold placeholder:text-muted-foreground/70 md:text-2xl dark:bg-transparent aria-invalid:ring-2";

function CampoNumero({
  id,
  prefijo,
  sufijo,
  valor,
  onCambio,
  error,
  placeholder,
}: {
  id: string;
  prefijo: string;
  sufijo?: string;
  valor: string;
  onCambio: (v: string) => void;
  error?: string;
  placeholder: string;
}) {
  return (
    <div>
      <div className="relative">
        {prefijo && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold">{prefijo}</span>}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-labelledby="titulo-paso"
          aria-describedby="ayuda-paso"
          aria-invalid={!!error}
          autoFocus
          className={cn(CLASE_CAMPO, prefijo && (prefijo.length > 1 ? "pl-16" : "pl-9"), sufijo && "pr-16")}
        />
        {sufijo && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground">{sufijo}</span>}
      </div>
      <div className="mt-2">
        <MensajeError texto={error} />
      </div>
    </div>
  );
}

function CampoMonto({
  valor,
  onCambio,
  error,
  placeholder,
  enPesos,
  mep,
  enDolares,
  puedeCambiar,
  onCambiarMoneda,
}: {
  valor: string;
  onCambio: (v: string) => void;
  error?: string;
  placeholder: string;
  enPesos: boolean;
  mep: number | null;
  enDolares: number;
  puedeCambiar: boolean;
  onCambiarMoneda: () => void;
}) {
  return (
    <div>
      <CampoNumero id="monto" prefijo={enPesos ? "$" : "USD"} valor={valor} onCambio={onCambio} error={error} placeholder={placeholder} />
      {enPesos && mep !== null && Number.isFinite(enDolares) && (
        <p aria-live="polite" className="text-sm leading-snug text-muted-foreground">
          Son unos {usd(enDolares)} al dólar MEP de hoy ({ars(mep)}). Tu plan se calcula en dólares.
        </p>
      )}
      {puedeCambiar && (
        <button type="button" onClick={onCambiarMoneda} className="mt-2 min-h-10 text-sm font-medium text-enlace underline underline-offset-4">
          {enPesos ? "Prefiero escribirlo en dólares" : "Prefiero escribirlo en pesos"}
        </button>
      )}
    </div>
  );
}

function MensajeError({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="alert" className="text-sm font-medium text-error">
      {texto}
    </p>
  );
}
