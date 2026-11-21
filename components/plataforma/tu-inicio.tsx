"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpen, Library, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrujulaCargando } from "@/components/plataforma/brujula-cargando";
import { SinPlan } from "@/components/plataforma/dashboard";
import { EscenariosCompactos } from "@/components/plataforma/escenarios";
import { TextoLegal } from "@/components/plataforma/primitivas";
import { TuRecorrido } from "@/components/plataforma/tu-recorrido";
import { useRecorrido } from "@/hooks/use-recorrido";
import { usePlan } from "@/lib/plataforma/store";
import type { Plan } from "@/lib/plataforma/tipos";

// El Inicio del panel: lo primero que ve quien ya tiene su plan. Tres bloques y una sola acción:
// el paso que sigue (único bloque azul), lo bueno y lo malo de un año, y los accesos al resto.
// El reparto, el gráfico y los montos viven en Mi plan.

const ACCESOS = [
  { href: "/comparador", titulo: "Tus pesos", texto: "Dónde dejar la plata que usás todos los días", Icono: Wallet },
  { href: "/instrumentos", titulo: "Ejemplos", texto: "Casos reales para entender cada parte del plan", Icono: Library },
  { href: "/aprender", titulo: "Aprender", texto: "Lo esencial, en pasos cortos", Icono: BookOpen },
];

export function TuInicio() {
  const { plan, cargando, error, recargar } = usePlan();

  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <BrujulaCargando etiqueta="Cargando tu plan">Cargando tu plan…</BrujulaCargando>
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
  return <ConPlan plan={plan} />;
}

function ConPlan({ plan }: { plan: Plan }) {
  const recorrido = useRecorrido(plan);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-black leading-none text-foreground md:text-5xl">Seguimos donde quedaste</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Tu plan: <span className="font-bold text-foreground">perfil {plan.perfil.perfil.toLowerCase()}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
        <TuRecorrido recorrido={recorrido} />

        <section aria-labelledby="en-un-anio" className="min-w-0">
          <h2 id="en-un-anio" className="text-lg font-extrabold">
            Tu plan en un año
          </h2>
          <EscenariosCompactos analisis={plan.analisis} capital={plan.respuestas.capitalInicial} unidad="pct" className="mt-3" />
          <p className="mt-2.5 text-sm text-muted-foreground">Es una estimación, no una promesa.</p>
          <Link href="/dashboard" className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-base font-bold underline underline-offset-4">
            Ver mi plan completo
          </Link>
        </section>
      </div>

      <nav aria-label="Otras secciones" className="border-t border-border lg:grid lg:grid-cols-3 lg:gap-x-8 lg:border-t-0">
        {ACCESOS.map(({ href, titulo, texto, Icono }) => (
          <Link key={href} href={href} className="group flex min-h-[4.25rem] items-center gap-3.5 border-b border-border py-3 transition-colors hover:bg-white/5 lg:border-t">
            <Icono className="h-5 w-5 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold leading-snug">{titulo}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{texto}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
          </Link>
        ))}
      </nav>

      <TextoLegal>Contenido educativo, no es asesoramiento financiero.</TextoLegal>
    </div>
  );
}
