"use client";

import { useMemo, useState } from "react";
import { Bot, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { abrirFinBot } from "@/lib/finbot/abrir";
import { GLOSARIO } from "@/lib/finbot/knowledge";
import { LECCIONES } from "@/lib/plataforma/lecciones";
import { EncabezadoPagina, Rombo } from "@/components/plataforma/primitivas";

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function Aprender() {
  const [busqueda, setBusqueda] = useState("");

  const conceptos = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return GLOSARIO;
    return GLOSARIO.filter((c) => [c.termino, ...c.sinonimos, c.simple].some((t) => normalizar(t).includes(q)));
  }, [busqueda]);

  return (
    <div className="space-y-10">
      <EncabezadoPagina sobretitulo="Aprender" titulo="Finanzas sin humo">
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
              <details open={n === 0} className="group rounded-xl border border-border bg-card open:border-enlace/40">
                <summary className="flex min-h-14 cursor-pointer list-none items-start gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-secondary font-mono text-sm font-medium text-enlace group-open:border-enlace/60">
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
                        <Rombo className="mt-1.5 bg-enlace" />
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

      <section aria-labelledby="glosario" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="glosario" className="text-xl font-semibold">Glosario</h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un término…" aria-label="Buscar en el glosario" className="pl-9" />
          </div>
        </div>

        {conceptos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No encontramos "{busqueda}". Probá con otra palabra o preguntale a FinBot.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {conceptos.map((c) => (
              <div key={c.termino} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{c.termino}</h3>
                  {c.riesgo !== "—" && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-legal text-muted-foreground">Riesgo: {c.riesgo.toLowerCase()}</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">{c.simple}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-enlace">Ejemplo: </span>
                  {c.ejemplo}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
