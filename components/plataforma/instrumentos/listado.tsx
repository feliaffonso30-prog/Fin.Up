"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeRiesgo } from "@/components/plataforma/instrumentos/insignias";
import { filtrar, type Filtros } from "@/lib/plataforma/instrumentos/catalogo";
import {
  CATEGORIAS_INSTRUMENTO,
  MONEDAS,
  NIVELES_RIESGO,
  NOMBRE_RIESGO,
  TITULO_CATEGORIA,
  type Instrumento,
} from "@/lib/plataforma/instrumentos/tipos";
import { cn } from "@/lib/utils";

const SIN_FILTROS: Required<Filtros> = { texto: "", categoria: "todas", riesgo: "todos", moneda: "todas" };

const NOMBRE_MONEDA = { ARS: "Pesos", USD: "Dólares" } as const;

// La lista de ejemplos: primero los ejemplos. El buscador queda a la vista y los tres
// filtros detrás de "Filtrar", para que nadie tenga que entenderlos antes de ver una ficha.
export function ListadoInstrumentos({ instrumentos }: { instrumentos: readonly Instrumento[] }) {
  const [f, setF] = useState(SIN_FILTROS);
  const [verFiltros, setVerFiltros] = useState(false);
  const resultados = useMemo(() => filtrar(instrumentos, f), [instrumentos, f]);
  const filtrosActivos = [f.categoria !== "todas", f.riesgo !== "todos", f.moneda !== "todas"].filter(Boolean).length;
  const hayFiltros = f.texto !== "" || filtrosActivos > 0;

  // Agrupado por categoría, en el orden fijo de las categorías.
  const grupos = CATEGORIAS_INSTRUMENTO.map((c) => ({ categoria: c, items: resultados.filter((i) => i.categoria === c) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="space-y-8">
      <section aria-label="Buscar y filtrar" className="space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={f.texto}
              onChange={(e) => setF({ ...f, texto: e.target.value })}
              placeholder="Buscá por nombre o sigla"
              aria-label="Buscar por nombre o sigla"
              className="h-11 pl-9"
            />
          </div>
          <Button type="button" variant="outline" aria-expanded={verFiltros} aria-controls="filtros" onClick={() => setVerFiltros((v) => !v)} className="h-11 shrink-0">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filtrar{filtrosActivos > 0 ? ` (${filtrosActivos})` : ""}
            <ChevronDown className={cn("h-4 w-4 transition-transform motion-reduce:transition-none", verFiltros && "rotate-180")} aria-hidden />
          </Button>
        </div>

        {verFiltros && (
          <div id="filtros" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v as typeof f.categoria })}>
              <SelectTrigger className="w-full" aria-label="Filtrar por tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los tipos</SelectItem>
                {CATEGORIAS_INSTRUMENTO.map((c) => (
                  <SelectItem key={c} value={c}>
                    {TITULO_CATEGORIA[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={f.riesgo} onValueChange={(v) => setF({ ...f, riesgo: v as typeof f.riesgo })}>
              <SelectTrigger className="w-full" aria-label="Filtrar por nivel de riesgo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquier riesgo</SelectItem>
                {NIVELES_RIESGO.map((r) => (
                  <SelectItem key={r} value={r}>
                    {NOMBRE_RIESGO[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={f.moneda} onValueChange={(v) => setF({ ...f, moneda: v as typeof f.moneda })}>
              <SelectTrigger className="w-full" aria-label="Filtrar por moneda en la que se opera">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Cualquier moneda</SelectItem>
                {MONEDAS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {NOMBRE_MONEDA[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* El conteo solo aporta cuando se está buscando o filtrando. */}
        {hayFiltros && (
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p aria-live="polite">
              {resultados.length} {resultados.length === 1 ? "ejemplo" : "ejemplos"}
            </p>
            <button type="button" onClick={() => setF(SIN_FILTROS)} className="min-h-10 cursor-pointer underline underline-offset-4 hover:text-foreground">
              Limpiar
            </button>
          </div>
        )}
      </section>

      {grupos.length === 0 ? (
        <div role="status">
          <p className="text-base font-bold">No hay ejemplos con esa búsqueda</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Probá con otra palabra o sacá algún filtro. La lista es corta a propósito: solo trae casos muy conocidos.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setF(SIN_FILTROS)}>
            Limpiar
          </Button>
        </div>
      ) : (
        grupos.map((g) => (
          <section key={g.categoria} aria-labelledby={`cat-${g.categoria}`}>
            <h2 id={`cat-${g.categoria}`} className="text-lg font-extrabold">
              {TITULO_CATEGORIA[g.categoria]}
            </h2>
            {/* Filas con una línea divisoria, no una tarjeta por ejemplo: la lista larga no pesa. */}
            <ul className="mt-2 grid grid-cols-1 border-t border-border sm:grid-cols-2 sm:gap-x-8">
              {g.items.map((i) => (
                <li key={i.ticker} className="border-b border-border">
                  <FilaInstrumento instrumento={i} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FilaInstrumento({ instrumento: i }: { instrumento: Instrumento }) {
  return (
    <Link href={`/instrumentos/${i.ticker}`} className="group flex h-full items-start gap-3 py-4 transition-colors hover:bg-white/5">
      <span className="min-w-0 flex-1">
        {/* Primero el nombre, que es lo que se reconoce; la sigla acompaña. */}
        <span className="block font-display text-base font-bold leading-snug">
          {i.nombre} <span className="font-sans text-sm font-medium text-muted-foreground">· {i.ticker}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">{i.descripcion}</span>
        <BadgeRiesgo riesgo={i.riesgo} className="mt-2" />
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
    </Link>
  );
}
