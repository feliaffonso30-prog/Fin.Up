"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GLOSARIO } from "@/lib/finbot/knowledge";
import { EncabezadoPagina } from "@/components/plataforma/primitivas";

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// El glosario vive aparte de las lecciones: se entra cuando hace falta buscar una palabra,
// no se lee de corrido. Filas sin caja, para que una lista larga no pese.
export function Glosario() {
  const [busqueda, setBusqueda] = useState("");

  const conceptos = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return GLOSARIO;
    return GLOSARIO.filter((c) => [c.termino, ...c.sinonimos, c.simple].some((t) => normalizar(t).includes(q)));
  }, [busqueda]);

  return (
    <div className="space-y-8">
      <Link href="/aprender" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a Aprender
      </Link>

      <EncabezadoPagina titulo="Glosario">Cada palabra, explicada en simple y con un ejemplo. Buscá la que no entendiste.</EncabezadoPagina>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar una palabra…" aria-label="Buscar en el glosario" className="pl-9" />
      </div>

      {conceptos.length === 0 ? (
        <p className="text-base text-muted-foreground" role="status">
          No encontramos "{busqueda}". Probá con otra palabra o preguntale a FinBot.
        </p>
      ) : (
        <dl className="border-t border-border">
          {conceptos.map((c) => (
            <div key={c.termino} className="border-b border-border py-5">
              <dt className="font-display text-lg font-extrabold leading-snug">{c.termino}</dt>
              <dd className="mt-1.5 max-w-2xl space-y-1.5 text-sm leading-relaxed">
                <p className="text-foreground/90">{c.simple}</p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Ejemplo: </span>
                  {c.ejemplo}
                </p>
                {c.riesgo !== "—" && <p className="text-muted-foreground">Riesgo: {c.riesgo.toLowerCase()}</p>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
