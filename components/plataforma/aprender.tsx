"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GLOSARIO } from "@/lib/finbot/knowledge";
import { LECCIONES } from "@/lib/plataforma/lecciones";

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
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Aprender</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Finanzas sin humo</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Lo esencial, explicado simple. Si algo no queda claro, preguntale a FinBot con el botón de abajo a la derecha.
        </p>
      </header>

      <section aria-labelledby="lecciones" className="space-y-4">
        <h2 id="lecciones" className="text-xl font-semibold">Empezá por acá</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {LECCIONES.map((l) => (
            <Card key={l.id} className="border-border bg-card/70">
              <CardHeader>
                <CardTitle className="text-base leading-snug">{l.titulo}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{l.resumen}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                  {l.puntos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
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
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Riesgo: {c.riesgo.toLowerCase()}</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">{c.simple}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-blue-400">Ejemplo: </span>
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
