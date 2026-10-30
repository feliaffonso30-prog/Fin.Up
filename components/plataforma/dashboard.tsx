"use client";

import Link from "next/link";
import { AlertTriangle, Scale, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraficoProyeccion } from "@/components/plataforma/grafico-proyeccion";
import { Aviso, COLOR_CATEGORIA, Dato, QuePuedeSalirMal, Sobretitulo, TextoLegal } from "@/components/plataforma/primitivas";
import { VerEjemplos } from "@/components/plataforma/instrumentos/ver-ejemplos";
import { CATEGORIAS_CON_EJEMPLOS } from "@/lib/plataforma/instrumentos/catalogo";
import { DESCRIPCION_PERFIL } from "@/lib/plataforma/perfil";
import { DESCARGO } from "@/lib/plataforma/cartera";
import { pct, usd } from "@/lib/plataforma/formato";
import { usePlan } from "@/lib/plataforma/store";
import { hrefComparador } from "@/lib/plataforma/comparador/desde-cartera";
import type { Plan, Posicion } from "@/lib/plataforma/tipos";

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
        <AlertTriangle className="mb-3 h-8 w-8 text-atencion" aria-hidden />
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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-enlace">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold">Todavía no armaste tu perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Respondé unas pocas preguntas y te mostramos una cartera simple, explicando el porqué de cada parte y qué puede salir mal.
      </p>
      <Button asChild className="mt-6 font-semibold">
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
        <Sobretitulo>Tu cartera sugerida</Sobretitulo>
        <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">
          Perfil {perfil.perfil.toLowerCase()}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{DESCRIPCION_PERFIL[perfil.perfil]}</p>
      </header>

      {avisos.length > 0 && (
        <section aria-label="Avisos importantes" className="space-y-3">
          {avisos.map((a) => (
            <Aviso key={a.titulo} nivel={a.nivel} titulo={a.titulo}>
              {a.texto}
            </Aviso>
          ))}
        </section>
      )}

      <section aria-label="Resumen de riesgo y retorno" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Dato titulo="Retorno anual estimado" valor={`${pct(analisis.retornoMin)} a ${pct(analisis.retornoMax)}`} nota="Supuesto ilustrativo, no es una promesa." />
        <Dato
          titulo="En un mal año"
          valor={pct(analisis.caida, 0)}
          valorClase="text-atencion"
          nota={capital > 0 ? `Con ${usd(capital)} invertidos, quedarías cerca de ${usd(capital * (1 + analisis.caida / 100))}.` : "Así de fuerte podría caer tu cartera."}
        />
        <Dato titulo="Nivel de riesgo" valor={analisis.nivelRiesgo} nota="Según cuánto podría caer la cartera en un mal año." />
      </section>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl">
            <h2>Cómo se reparte tu plata</h2>
          </CardTitle>
          <CardDescription>Tocá cada parte para ver qué es, por qué está en tu cartera y qué puede salir mal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-border/50 bg-background" role="img" aria-label={posiciones.map((p) => `${p.nombre} ${p.porcentaje}%`).join(", ")}>
            {posiciones.map((p) => (
              <div key={p.categoria} style={{ width: `${p.porcentaje}%` }} className={`${COLOR_CATEGORIA[p.categoria]} h-full`} title={`${p.nombre}: ${p.porcentaje}%`} />
            ))}
          </div>

          <Accordion type="multiple" className="space-y-2">
            {posiciones.map((p) => (
              <AccordionItem key={p.categoria} value={p.categoria} className="rounded-xl border border-border bg-secondary/30 px-4 last:border-b">
                <AccordionTrigger className="cursor-pointer py-3 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${COLOR_CATEGORIA[p.categoria]}`} aria-hidden />
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
                  <QuePuedeSalirMal pie={`Volatilidad: ${p.volatilidad.toLowerCase()}`}>{p.queSalePuedeMal}</QuePuedeSalirMal>
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

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl">
            <h2>
              Proyección a {plan.anios} {plan.anios === 1 ? "año" : "años"}
            </h2>
          </CardTitle>
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
          <CardTitle className="text-xl">
            <h2>Por qué te salió este perfil</h2>
          </CardTitle>
          <CardDescription>Puntaje de {perfil.puntaje} sobre 100 según tus respuestas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {perfil.motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {perfil.ajustes.length > 0 && (
            <TextoLegal tono="atencion">
              Ajustamos el perfil de {perfil.perfilPorPuntaje.toLowerCase()} a {perfil.perfil.toLowerCase()} por seguridad: {perfil.ajustes.join(" ")}
            </TextoLegal>
          )}
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link href="/onboarding">Rehacer mi perfil</Link>
          </Button>
        </CardContent>
      </Card>

      <TextoLegal className="text-center">{DESCARGO}</TextoLegal>
    </div>
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
