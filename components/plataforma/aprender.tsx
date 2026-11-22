"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookA, Bot, ChevronDown, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abrirFinBot } from "@/lib/finbot/abrir";
import { LECCIONES } from "@/lib/plataforma/lecciones";
import { EncabezadoPagina, Punto } from "@/components/plataforma/primitivas";

export function Aprender() {
  // Si llega con /aprender#<lección> (por ejemplo, desde el recorrido), abre esa lección y la muestra.
  useEffect(() => {
    const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!(el instanceof HTMLDetailsElement)) return;
    el.open = true;
    el.scrollIntoView({ block: "start" });
    el.querySelector("summary")?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="space-y-10">
      <EncabezadoPagina titulo="Aprendé a tu ritmo">
        Lo esencial, en {LECCIONES.length} pasos cortos y en orden. Si algo no queda claro, preguntale a FinBot.
      </EncabezadoPagina>

      <section aria-labelledby="lecciones" className="space-y-4">
        <h2 id="lecciones" className="text-xl font-bold">
          Tu ruta
        </h2>
        {/* Una ruta en orden, no una grilla: cada paso se apoya en el anterior. La primera arranca abierta. */}
        <ol className="relative space-y-3 before:absolute before:inset-y-4 before:left-8 before:w-px before:bg-border">
          {LECCIONES.map((l, n) => (
            <li key={l.id} className="relative">
              <details id={l.id} open={n === 0} className="group scroll-mt-20 rounded-xl border border-border bg-card open:border-enlace/40">
                <summary className="flex min-h-14 cursor-pointer list-none items-start gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-sm font-medium text-enlace group-open:border-enlace/60">
                    {n + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold leading-snug">{l.titulo}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{l.resumen}</span>
                  </span>
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="space-y-4 px-4 pb-4 pl-16">
                  <ul className="space-y-2 text-sm leading-relaxed text-foreground/85">
                    {l.puntos.map((p) => (
                      <li key={p} className="flex gap-3">
                        <Punto className="mt-1.5 bg-enlace" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Button type="button" variant="outline" size="sm" onClick={() => abrirFinBot(`Explicame con un ejemplo: ${l.titulo}`)}>
                    <Bot className="h-4 w-4" aria-hidden />
                    Preguntale a FinBot
                  </Button>
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {/* Ejemplos y el glosario viven en sus propias pantallas: acá solo se ofrece la entrada. */}
      <div>
      <Link href="/instrumentos" className="group flex min-h-16 items-center gap-4 border-t border-border py-4 transition-colors hover:bg-white/5">
        <Library className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold leading-snug">Ejemplos reales</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">Casos concretos para entender cada parte de un plan.</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </Link>
      <Link
        href="/aprender/glosario"
        className="group flex min-h-16 items-center gap-4 border-y border-border py-4 transition-colors hover:bg-white/5"
      >
        <BookA className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold leading-snug">Glosario</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">¿Una palabra que no entendiste? Buscala acá.</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </Link>
      </div>
    </div>
  );
}
