"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeRiesgo } from "@/components/plataforma/instrumentos/insignias";
import { filtrar, type Filtros } from "@/lib/plataforma/instrumentos/catalogo";
import { NOTA_RIESGO } from "@/lib/plataforma/instrumentos/textos";
import {
  CATEGORIAS_INSTRUMENTO,
  MONEDAS,
  NIVELES_RIESGO,
  NOMBRE_CATEGORIA,
  NOMBRE_RIESGO,
  type Instrumento,
} from "@/lib/plataforma/instrumentos/tipos";

const SIN_FILTROS: Required<Filtros> = { texto: "", categoria: "todas", riesgo: "todos", moneda: "todas" };

const NOMBRE_MONEDA = { ARS: "Pesos (ARS)", USD: "Dólares (USD)" } as const;

export function ListadoInstrumentos({ instrumentos }: { instrumentos: readonly Instrumento[] }) {
  const [f, setF] = useState(SIN_FILTROS);
  const resultados = useMemo(() => filtrar(instrumentos, f), [instrumentos, f]);
  const hayFiltros = f.texto !== "" || f.categoria !== "todas" || f.riesgo !== "todos" || f.moneda !== "todas";

  // Agrupado por categoría, en el orden fijo de las categorías.
  const grupos = CATEGORIAS_INSTRUMENTO.map((c) => ({ categoria: c, items: resultados.filter((i) => i.categoria === c) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="space-y-6">
      <section aria-label="Filtros" className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={f.texto}
            onChange={(e) => setF({ ...f, texto: e.target.value })}
            placeholder="Buscá por ticker o nombre…"
            aria-label="Buscar instrumento por ticker o nombre"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v as typeof f.categoria })}>
            <SelectTrigger className="w-full" aria-label="Filtrar por categoría">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {CATEGORIAS_INSTRUMENTO.map((c) => (
                <SelectItem key={c} value={c}>
                  {NOMBRE_CATEGORIA[c]}
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
            <SelectTrigger className="w-full" aria-label="Filtrar por moneda de cotización">
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
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p aria-live="polite">
            {resultados.length} {resultados.length === 1 ? "instrumento" : "instrumentos"}
          </p>
          {hayFiltros && (
            <button type="button" onClick={() => setF(SIN_FILTROS)} className="cursor-pointer underline underline-offset-2 hover:text-foreground">
              Limpiar filtros
            </button>
          )}
        </div>
        <p className="text-legal leading-snug text-muted-foreground/80">{NOTA_RIESGO}</p>
      </section>

      {grupos.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border p-8 text-center">
          <SearchX className="mb-3 h-7 w-7 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">No hay instrumentos con esos filtros</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Probá con otra búsqueda o sacá algún filtro. La lista es chica a propósito: solo incluye instrumentos muy negociados.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setF(SIN_FILTROS)}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        grupos.map((g) => (
          <section key={g.categoria} aria-labelledby={`cat-${g.categoria}`} className="space-y-3">
            <h2 id={`cat-${g.categoria}`} className="text-lg font-semibold">
              {NOMBRE_CATEGORIA[g.categoria]}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.items.map((i) => (
                <li key={i.ticker}>
                  <TarjetaInstrumento instrumento={i} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function TarjetaInstrumento({ instrumento: i }: { instrumento: Instrumento }) {
  return (
    <Link
      href={`/instrumentos/${i.ticker}`}
      className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card/70 p-4 transition-colors hover:border-enlace/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-info">{i.ticker}</p>
          <p className="line-clamp-2 text-sm font-medium">{i.nombre}</p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{i.descripcion}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        <BadgeRiesgo riesgo={i.riesgo} />
        <span className="text-legal leading-5 text-muted-foreground">{i.sector}</span>
      </div>
    </Link>
  );
}
