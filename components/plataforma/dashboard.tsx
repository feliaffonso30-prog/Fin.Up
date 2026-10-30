"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowRight, Bot, ChevronDown, RefreshCw, Scale, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraficoProyeccion } from "@/components/plataforma/grafico-proyeccion";
import {
  Aviso,
  COLOR_CATEGORIA,
  Dato,
  EncabezadoPagina,
  Filo,
  QuePuedeSalirMal,
  Rombo,
  Sobretitulo,
  TextoLegal,
} from "@/components/plataforma/primitivas";
import { VerEjemplos } from "@/components/plataforma/instrumentos/ver-ejemplos";
import { abrirFinBot } from "@/lib/finbot/abrir";
import { CATEGORIAS_CON_EJEMPLOS } from "@/lib/plataforma/instrumentos/catalogo";
import { DESCRIPCION_PERFIL } from "@/lib/plataforma/perfil";
import { DESCARGO } from "@/lib/plataforma/cartera";
import { fecha, pct, usd } from "@/lib/plataforma/formato";
import type { IdPaso, PasoRecorrido } from "@/lib/plataforma/recorrido";
import { useRecorrido } from "@/hooks/use-recorrido";
import { usePlan } from "@/lib/plataforma/store";
import { hrefComparador } from "@/lib/plataforma/comparador/desde-cartera";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import type { Plan, Posicion } from "@/lib/plataforma/tipos";

export function Dashboard() {
  const { plan, cargando, error, recargar } = usePlan();

  if (cargando) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando tu plan">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-3 h-8 w-8 text-atencion" aria-hidden />
        <h1 className="text-xl font-bold">No pudimos cargar tu plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button onClick={recargar} variant="outline" className="mt-5">
          Reintentar
        </Button>
      </div>
    );
  }
  if (!plan) return <SinPlan />;
  return <Cartera plan={plan} />;
}

function SinPlan() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-enlace">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold">Todavía no armaste tu perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Respondé unas pocas preguntas y te mostramos un plan simple, explicando el porqué de cada parte y qué puede salir mal.
      </p>
      <Button asChild className="mt-6 font-semibold">
        <Link href="/onboarding">Armar mi perfil</Link>
      </Button>
    </div>
  );
}

// Cuánto sube y baja cada parte, en palabras y no con "volatilidad".
const CUANTO_SE_MUEVE: Record<Posicion["volatilidad"], string> = {
  "Muy baja": "casi nada",
  Baja: "poco",
  Media: "bastante",
  Alta: "mucho",
  "Muy alta": "muchísimo",
};

function Cartera({ plan }: { plan: Plan }) {
  const { analisis, perfil, respuestas, posiciones, avisos } = plan;
  const ultimo = plan.proyeccion.at(-1);
  const capital = respuestas.capitalInicial;
  const sinMontos = capital === 0 && respuestas.aporteMensual === 0;
  const recorrido = useRecorrido(plan);
  // Los avisos que el recorrido ya convierte en pasos no se repiten en "Antes de empezar"
  // (salvo que lo haya ocultado).
  const cubiertos = recorrido.oculto ? [] : recorrido.pasos.map((p) => p.aviso);
  const antesDeEmpezar = avisos.filter((a) => !cubiertos.includes(a.titulo));
  const [abiertas, setAbiertas] = useState<string[]>([]);
  const parteMayor = recorrido.pasos.find((p) => p.id === "cartera")?.accion;

  // Abrir a mano la parte más grande también cuenta como hecho ese paso.
  function cambiarAbiertas(valores: string[]) {
    setAbiertas(valores);
    if (parteMayor?.tipo === "parte" && valores.includes(parteMayor.categoria)) recorrido.marcar("cartera");
  }

  // "Ver esa parte": la abre, la lleva a la vista y le pasa el foco.
  function abrirParte(categoria: string) {
    setAbiertas((prev) => (prev.includes(categoria) ? prev : [...prev, categoria]));
    requestAnimationFrame(() => {
      const el = document.getElementById(`parte-${categoria}`);
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
      el?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="space-y-8">
      <EncabezadoPagina sobretitulo="Mi plan" titulo={`Perfil ${perfil.perfil.toLowerCase()}`}>
        <p>{DESCRIPCION_PERFIL[perfil.perfil]}</p>
        <p className="mt-2 text-legal text-muted-foreground/80">
          Plan armado el {fecha(plan.generadoEn)}
          {AUTH_CONFIGURADA ? "" : " · Guardado solo en este navegador"}
        </p>
      </EncabezadoPagina>

      <TuRecorrido recorrido={recorrido} onVerParte={abrirParte} />

      {(antesDeEmpezar.length > 0 || perfil.ajustes.length > 0) && (
        <section aria-labelledby="antes-de-empezar" className="space-y-3">
          <h2 id="antes-de-empezar" className="text-lg font-bold">
            Antes de empezar
          </h2>
          {perfil.ajustes.length > 0 && (
            <Aviso nivel="atencion" titulo="Ajustamos tu perfil por seguridad">
              Por tus respuestas te habría salido {perfil.perfilPorPuntaje.toLowerCase()}, pero lo dejamos en {perfil.perfil.toLowerCase()}:{" "}
              {perfil.ajustes.join(" ")}
            </Aviso>
          )}
          {antesDeEmpezar.map((a) => (
            <Aviso key={a.titulo} nivel={a.nivel} titulo={a.titulo}>
              {a.texto}
            </Aviso>
          ))}
        </section>
      )}

      <section aria-label="Resumen de riesgo y retorno" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Dato
          titulo="En un año normal"
          valor={`${pct(analisis.retornoMin)} a ${pct(analisis.retornoMax)}`}
          nota="Supuesto ilustrativo, no es una promesa."
        />
        <Dato
          titulo="En un mal año"
          valor={pct(analisis.caida, 0)}
          valorClase="text-atencion"
          malEscenario
          nota={capital > 0 ? `Con ${usd(capital)} invertidos, quedarías cerca de ${usd(capital * (1 + analisis.caida / 100))}.` : "Así de fuerte podría caer tu plan."}
        />
        <Dato titulo="Nivel de riesgo" valor={analisis.nivelRiesgo} nota="Según cuánto podría caer el plan en un mal año." />
      </section>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl">
            <h2>Cómo se reparte tu plata</h2>
          </CardTitle>
          <CardDescription>Tocá cada parte para ver qué es, por qué está en tu plan y qué puede salir mal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-border/50 bg-background" role="img" aria-label={posiciones.map((p) => `${p.nombre} ${p.porcentaje}%`).join(", ")}>
            {posiciones.map((p) => (
              <div key={p.categoria} style={{ width: `${p.porcentaje}%` }} className={`${COLOR_CATEGORIA[p.categoria]} h-full`} title={`${p.nombre}: ${p.porcentaje}%`} />
            ))}
          </div>

          <Accordion type="multiple" value={abiertas} onValueChange={cambiarAbiertas} className="space-y-2">
            {posiciones.map((p) => (
              <AccordionItem key={p.categoria} id={`parte-${p.categoria}`} value={p.categoria} className="scroll-mt-20 rounded-lg border-0 bg-secondary/60 px-4">
                <AccordionTrigger className="cursor-pointer py-3 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                    <Rombo className={`h-2.5 w-2.5 ${COLOR_CATEGORIA[p.categoria]}`} />
                    <span className="min-w-0 text-left text-sm font-medium leading-snug">{p.nombre}</span>
                  </span>
                  <span className="mr-2 flex shrink-0 items-center gap-2">
                    {capital > 0 && <span className="hidden text-xs text-muted-foreground sm:inline">{usd(p.montoInicial)}</span>}
                    <span className="font-display text-base font-extrabold tabular-nums">{p.porcentaje}%</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4 text-sm">
                  <Bloque titulo="Qué es">{p.queEs}</Bloque>
                  <Bloque titulo="Por qué está en tu plan">{p.porQueEnTuCartera}</Bloque>
                  <Bloque titulo="Su ventaja">{p.ventaja}</Bloque>
                  <QuePuedeSalirMal pie={`Cuánto sube y baja: ${CUANTO_SE_MUEVE[p.volatilidad]}`}>{p.queSalePuedeMal}</QuePuedeSalirMal>
                  <VerDondeConviene posicion={p} />
                  {CATEGORIAS_CON_EJEMPLOS.includes(p.categoria) ? (
                    <VerEjemplos categoria={p.categoria} perfil={perfil.perfil} />
                  ) : (
                    // Liquidez y alternativos: siguen los ejemplos genéricos del catálogo de FinBot.
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejemplos para investigar</p>
                      <ul className="space-y-1.5">
                        {p.ejemplos.map((e) => (
                          <li key={e.nombre} className="text-xs leading-relaxed text-muted-foreground">
                            <span className="font-medium text-foreground/90">{e.nombre}</span> · {e.tipoInstrumento}. {e.porQue}
                          </li>
                        ))}
                      </ul>
                      <TextoLegal className="mt-2">Son ejemplos educativos, no recomendaciones de compra. Preguntale a FinBot para entenderlos mejor.</TextoLegal>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Plegable titulo={`Cómo podría crecer en ${plan.anios} ${plan.anios === 1 ? "año" : "años"}`}>
        {sinMontos || !ultimo ? (
          <p className="text-sm text-muted-foreground">Cargá un capital inicial o un aporte mensual al rehacer tu perfil para ver la proyección.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aportarías {usd(ultimo.aportado)} y podrías tener entre {usd(ultimo.bajo)} y {usd(ultimo.alto)}.
            </p>
            <GraficoProyeccion datos={plan.proyeccion} />
            <TextoLegal>
              Montos en dólares (USD), con supuestos ilustrativos. No descuentan inflación en dólares, impuestos ni comisiones del broker, y en un mal año
              el resultado puede quedar por debajo de la zona rayada.
            </TextoLegal>
          </div>
        )}
      </Plegable>

      <Plegable titulo="Por qué te salió este perfil">
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {perfil.motivos.map((m) => (
              <li key={m} className="flex gap-3">
                <Rombo className="mt-1.5 bg-enlace" />
                {m}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">¿Cambió algo en tu vida? Rehacé tus respuestas y armamos el plan de nuevo.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Rehacer mi perfil
            </Link>
          </Button>
        </div>
      </Plegable>

      <TextoLegal className="text-center">{DESCARGO}</TextoLegal>
    </div>
  );
}

type Recorrido = ReturnType<typeof useRecorrido>;

/** El recorrido guiado: el paso que sigue, cuánto falta y la lista completa. Nada se bloquea. */
function TuRecorrido({ recorrido, onVerParte }: { recorrido: Recorrido; onVerParte: (categoria: string) => void }) {
  const { pasos, hechos, actual, cantidad, oculto, listo, marcar, setOculto } = recorrido;
  const [anuncio, setAnuncio] = useState("");

  // Hasta leer el avance guardado, un lugar vacío del mismo tamaño (sin saltos ni pasos equivocados).
  if (!listo) return <div aria-hidden className="h-56 rounded-xl border border-border bg-card" />;

  if (oculto) {
    return (
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOculto(false)} className="text-muted-foreground">
          Mostrar tu recorrido
        </Button>
      </div>
    );
  }

  function hacer(paso: PasoRecorrido) {
    marcar(paso.id);
    const sigue = pasos.find((p) => p.id !== "perfil" && p.id !== paso.id && !hechos.includes(p.id));
    setAnuncio(sigue ? `Listo: ${paso.corto}. Sigue: ${sigue.corto}.` : "Listo. Terminaste el recorrido.");
    if (paso.accion?.tipo === "finbot") abrirFinBot(paso.accion.pregunta);
    if (paso.accion?.tipo === "parte") onVerParte(paso.accion.categoria);
  }

  const accion = actual?.accion;
  const estadoDe = (id: IdPaso) => (id === "perfil" || hechos.includes(id) ? "hecho" : actual?.id === id ? "ahora" : "falta");

  return (
    <section aria-labelledby="recorrido" className="relative overflow-hidden rounded-xl border border-enlace/40 bg-card p-5 md:p-6">
      <Filo className="absolute inset-x-0 top-0" />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Sobretitulo>
          {actual ? "Tu siguiente paso" : "Tu recorrido"} · {cantidad} de {pasos.length}
        </Sobretitulo>
        <button
          type="button"
          onClick={() => setOculto(true)}
          className="min-h-10 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          No necesito el recorrido
        </button>
      </div>

      {/* Avance: un segmento por paso */}
      <div className="mt-3 flex gap-1" aria-hidden>
        {pasos.map((p) => (
          <span
            key={p.id}
            className={`h-1.5 flex-1 rounded-full ${estadoDe(p.id) === "hecho" ? "bg-enlace" : estadoDe(p.id) === "ahora" ? "bg-enlace/40" : "bg-secondary"}`}
          />
        ))}
      </div>

      {actual ? (
        <>
          <h2 id="recorrido" className="mt-4 text-xl font-bold md:text-2xl">
            {actual.titulo}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/85">{actual.texto}</p>
          <div className="mt-4">
            {accion?.tipo === "enlace" ? (
              <Button asChild>
                <Link href={accion.href} onClick={() => hacer(actual)}>
                  {accion.etiqueta} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            ) : accion?.tipo === "finbot" ? (
              <Button type="button" onClick={() => hacer(actual)}>
                <Bot className="h-4 w-4" aria-hidden />
                {accion.etiqueta}
              </Button>
            ) : accion?.tipo === "parte" ? (
              <Button type="button" onClick={() => hacer(actual)}>
                {accion.etiqueta} <ArrowDown className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <h2 id="recorrido" className="mt-4 text-xl font-bold md:text-2xl">
            Ya sabés lo básico para decidir
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/85">
            No hace falta que inviertas hoy: decidir con calma también es decidir bien. Si cambia algo en tu vida, rehacé tu perfil.
          </p>
        </>
      )}

      <details className="group mt-4">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-sm text-enlace [&::-webkit-details-marker]:hidden">
          Ver todos los pasos
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ol className="mt-2 space-y-1.5">
          {pasos.map((p) => {
            const e = estadoDe(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <Rombo className={e === "hecho" ? "bg-enlace" : e === "ahora" ? "bg-enlace/50" : "border border-border bg-transparent"} />
                <span className={e === "falta" ? "text-muted-foreground" : "text-foreground"}>{p.corto}</span>
                <span className="ml-auto font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  {e === "hecho" ? "Hecho" : e === "ahora" ? "Ahora" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </details>

      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>
    </section>
  );
}

/** Bloque secundario plegado: lo importante queda arriba, lo demás a un toque. */
function Plegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-display text-base font-bold [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

// Para liquidez y renta fija: lleva al comparador con el monto de esa parte precargado.
function VerDondeConviene({ posicion }: { posicion: Posicion }) {
  const href = hrefComparador(posicion);
  if (!href) return null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-info/20 bg-info/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-foreground/85">
        Compará tasas de plazo fijo, billeteras y fondos en pesos
        {posicion.montoInicial > 0 ? ` para los ${usd(posicion.montoInicial)} de esta parte` : ""}.
      </p>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href={href}>
          <Scale className="h-4 w-4" aria-hidden />
          Ver dónde conviene
        </Link>
      </Button>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-enlace">{titulo}</p>
      <p className="text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  );
}
