"use client";

import Link from "next/link";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraficoProyeccion } from "@/components/plataforma/grafico-proyeccion";
import { DESCRIPCION_PERFIL } from "@/lib/plataforma/perfil";
import { DESCARGO } from "@/lib/plataforma/cartera";
import { pct, usd } from "@/lib/plataforma/formato";
import { usePlan } from "@/lib/plataforma/store";
import type { Plan } from "@/lib/plataforma/tipos";

export function Dashboard() {
  const { plan, cargando, error, recargar } = usePlan();

  if (cargando) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando tu cartera">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" aria-hidden />
        <h1 className="text-xl font-bold">No pudimos cargar tu cartera</h1>
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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-blue-400">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold">Todavía no armaste tu perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Respondé unas pocas preguntas y te mostramos una cartera simple, explicando el porqué de cada parte y qué puede salir mal.
      </p>
      <Button asChild className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 font-semibold text-white hover:opacity-95">
        <Link href="/onboarding">Armar mi perfil</Link>
      </Button>
    </div>
  );
}

function Cartera({ plan }: { plan: Plan }) {
  const { analisis, perfil, respuestas, posiciones, avisos } = plan;
  const ultimo = plan.proyeccion.at(-1);
  const capital = respuestas.capitalInicial;
  const sinMontos = capital === 0 && respuestas.aporteMensual === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Tu cartera sugerida</p>
        <h1 className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
          Perfil {perfil.perfil.toLowerCase()}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{DESCRIPCION_PERFIL[perfil.perfil]}</p>
      </header>

      {avisos.length > 0 && (
        <section aria-label="Avisos importantes" className="space-y-3">
          {avisos.map((a) => (
            <div
              key={a.titulo}
              className={
                a.nivel === "atencion"
                  ? "flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4"
                  : "flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"
              }
            >
              {a.nivel === "atencion" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" aria-hidden />
              )}
              <div className="space-y-0.5">
                <p className={a.nivel === "atencion" ? "text-sm font-semibold text-amber-200" : "text-sm font-semibold text-blue-200"}>{a.titulo}</p>
                <p className="text-xs leading-relaxed text-foreground/80">{a.texto}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <section aria-label="Resumen de riesgo y retorno" className="grid gap-3 sm:grid-cols-3">
        <Dato titulo="Retorno anual estimado" valor={`${pct(analisis.retornoMin)} a ${pct(analisis.retornoMax)}`} nota="Supuesto ilustrativo, no es una promesa." />
        <Dato
          titulo="En un mal año"
          valor={pct(analisis.caida, 0)}
          valorClase="text-amber-300"
          nota={capital > 0 ? `Con ${usd(capital)} invertidos, quedarías cerca de ${usd(capital * (1 + analisis.caida / 100))}.` : "Así de fuerte podría caer tu cartera."}
        />
        <Dato titulo="Nivel de riesgo" valor={analisis.nivelRiesgo} nota="Según cuánto podría caer la cartera en un mal año." />
      </section>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl">Cómo se reparte tu plata</CardTitle>
          <CardDescription>Tocá cada parte para ver qué es, por qué está en tu cartera y qué puede salir mal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-border/50 bg-background" role="img" aria-label={posiciones.map((p) => `${p.nombre} ${p.porcentaje}%`).join(", ")}>
            {posiciones.map((p) => (
              <div key={p.categoria} style={{ width: `${p.porcentaje}%` }} className={`${p.color} h-full`} title={`${p.nombre}: ${p.porcentaje}%`} />
            ))}
          </div>

          <Accordion type="multiple" className="space-y-2">
            {posiciones.map((p) => (
              <AccordionItem key={p.categoria} value={p.categoria} className="rounded-xl border border-border bg-secondary/30 px-4 last:border-b">
                <AccordionTrigger className="cursor-pointer py-3 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${p.color}`} aria-hidden />
                    <span className="min-w-0 text-left text-sm font-medium leading-snug">{p.nombre}</span>
                  </span>
                  <span className="mr-2 flex shrink-0 items-center gap-2">
                    {capital > 0 && <span className="hidden text-xs text-muted-foreground sm:inline">{usd(p.montoInicial)}</span>}
                    <span className="rounded border border-border bg-background px-2.5 py-0.5 font-mono text-sm font-semibold">{p.porcentaje}%</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4 text-sm">
                  <p className="leading-relaxed text-muted-foreground">{p.queEs}</p>
                  <Bloque titulo="Por qué está en tu cartera">{p.porQueEnTuCartera}</Bloque>
                  <Bloque titulo="Su ventaja">{p.ventaja}</Bloque>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-300">Qué puede salir mal</p>
                    <p className="text-xs leading-relaxed text-amber-100/90">{p.queSalePuedeMal}</p>
                    <p className="mt-2 text-xs text-amber-200/70">Volatilidad: {p.volatilidad.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejemplos para investigar</p>
                    <ul className="space-y-1.5">
                      {p.ejemplos.map((e) => (
                        <li key={e.nombre} className="text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground/90">{e.nombre}</span> · {e.tipoInstrumento}. {e.porQue}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-muted-foreground/70">Son ejemplos educativos, no recomendaciones de compra. Preguntale a FinBot para entenderlos mejor.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl">Proyección a {plan.anios} {plan.anios === 1 ? "año" : "años"}</CardTitle>
          <CardDescription>
            {sinMontos || !ultimo
              ? "Cargá un capital inicial o un aporte mensual al rehacer tu perfil para ver la proyección."
              : `Aportarías ${usd(ultimo.aportado)} y podrías tener entre ${usd(ultimo.bajo)} y ${usd(ultimo.alto)}.`}
          </CardDescription>
        </CardHeader>
        {!sinMontos && (
          <CardContent className="space-y-3">
            <GraficoProyeccion datos={plan.proyeccion} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Montos en dólares (USD), con supuestos ilustrativos. No descuentan inflación en dólares, impuestos ni comisiones del broker, y en un mal año el resultado puede quedar por debajo del escenario bajo.
            </p>
          </CardContent>
        )}
      </Card>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl">Por qué te salió este perfil</CardTitle>
          <CardDescription>Puntaje de {perfil.puntaje} sobre 100 según tus respuestas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {perfil.motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {perfil.ajustes.length > 0 && (
            <p className="text-xs leading-relaxed text-amber-200/80">
              Ajustamos el perfil de {perfil.perfilPorPuntaje.toLowerCase()} a {perfil.perfil.toLowerCase()} por seguridad: {perfil.ajustes.join(" ")}
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link href="/onboarding">Rehacer mi perfil</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] leading-snug text-muted-foreground/70">{DESCARGO}</p>
    </div>
  );
}

function Dato({ titulo, valor, nota, valorClase }: { titulo: string; valor: string; nota: string; valorClase?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className={`mt-1 text-xl font-semibold ${valorClase ?? ""}`}>{valor}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">{nota}</p>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-blue-400">{titulo}</p>
      <p className="text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  );
}
