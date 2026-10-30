"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ars } from "@/lib/plataforma/formato";
import type { Cotizacion } from "@/lib/plataforma/comparador/tipos";
import { cn } from "@/lib/utils";
import { BadgeLiquidez, BadgeRiesgo, BadgeTasaReal, BotonEntidad, tasa } from "./insignias";

interface Props {
  cotizaciones: Cotizacion[]; // ya ordenadas
  dias: number;
  /** Cuántas mostrar antes de "Ver todas". */
  inicial?: number;
  /** Mostrar el nombre del producto (FCI) además de la entidad. */
  conProducto?: boolean;
  sinDatos?: string;
}

export function TablaAlternativas({ cotizaciones, dias, inicial = 10, conProducto = false, sinDatos }: Props) {
  const [verTodas, setVerTodas] = useState(false);
  const [verNoDisponibles, setVerNoDisponibles] = useState(false);

  const disponibles = cotizaciones.filter((c) => c.disponible);
  const noDisponibles = cotizaciones.filter((c) => !c.disponible);
  const visibles = verTodas ? disponibles : disponibles.slice(0, inicial);

  if (cotizaciones.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {sinDatos ?? "No hay datos para mostrar en este momento."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {disponibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Ninguna opción acepta este monto y plazo. Probá con otro plazo o revisá las que no están disponibles.
        </p>
      ) : (
        <>
          <Escritorio cotizaciones={visibles} dias={dias} conProducto={conProducto} />
          <Celular cotizaciones={visibles} dias={dias} conProducto={conProducto} />
        </>
      )}

      {disponibles.length > inicial && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setVerTodas((v) => !v)}>
          {verTodas ? "Ver menos" : `Ver todas (${disponibles.length})`}
          <ChevronDown className={cn("h-4 w-4 transition-transform", verTodas && "rotate-180")} aria-hidden />
        </Button>
      )}

      {noDisponibles.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-secondary/20">
          <button
            type="button"
            onClick={() => setVerNoDisponibles((v) => !v)}
            aria-expanded={verNoDisponibles}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            <span>No disponibles para tu monto, plazo o condición ({noDisponibles.length})</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", verNoDisponibles && "rotate-180")} aria-hidden />
          </button>
          {verNoDisponibles && (
            <ul className="space-y-1 border-t border-border/60 px-4 py-3">
              {noDisponibles.map((c) => (
                <li key={c.alternativa.id} className="flex flex-wrap justify-between gap-x-3 text-xs">
                  <span className="text-foreground/80">{conProducto ? c.alternativa.producto : c.alternativa.entidad}</span>
                  <span className="text-muted-foreground">{c.motivoNoDisponible}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Nombre({ c, conProducto }: { c: Cotizacion; conProducto: boolean }) {
  const a = c.alternativa;
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="font-semibold leading-snug">{conProducto ? a.producto : a.entidad}</p>
      {conProducto && <p className="text-xs text-muted-foreground">{a.entidad}</p>}
      {c.nota && !conProducto && <p className="line-clamp-2 text-legal leading-snug text-muted-foreground" title={c.nota}>{c.nota}</p>}
      {c.notas.map((n) => (
        <p key={n} className="text-legal leading-snug text-atencion-texto/80">
          {n}
        </p>
      ))}
    </div>
  );
}

function Escritorio({ cotizaciones, dias, conProducto }: { cotizaciones: Cotizacion[]; dias: number; conProducto: boolean }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border xl:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead>{conProducto ? "Fondo" : "Entidad"}</TableHead>
            <TableHead className="text-right">Tasa anual (TNA)</TableHead>
            <TableHead className="text-right">{conProducto ? `Si rinde igual, en ${dias} días` : `Ganancia en ${dias} días`}</TableHead>
            <TableHead className="text-center">¿Le gana a la inflación?</TableHead>
            <TableHead className="w-32">
              <span className="sr-only">Link</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotizaciones.map((c, i) => (
            <TableRow key={c.alternativa.id} className="align-top">
              <TableCell className="text-center font-mono text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="min-w-[13rem] whitespace-normal">
                <Nombre c={c} conProducto={conProducto} />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <BadgeLiquidez liquidez={c.alternativa.liquidez} />
                  <BadgeRiesgo riesgo={c.alternativa.riesgo} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <p className="font-mono text-base font-semibold">{tasaTexto(c, c.tna)}</p>
                <p className="text-legal text-muted-foreground">TEA {tasaTexto(c, c.tea)}</p>
                <p className="text-legal text-muted-foreground">TEM {tasaTexto(c, c.tem)}</p>
              </TableCell>
              <TableCell className="text-right font-mono font-semibold text-cifra">{ars(c.ganancia)}</TableCell>
              <TableCell className="text-center">
                <BadgeTasaReal real={c.tasaRealMensual} />
              </TableCell>
              <TableCell>
                <BotonEntidad alternativa={c.alternativa} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Celular({ cotizaciones, dias, conProducto }: { cotizaciones: Cotizacion[]; dias: number; conProducto: boolean }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2 xl:hidden">
      {cotizaciones.map((c, i) => (
        <li key={c.alternativa.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <span className="font-mono text-sm text-muted-foreground">{i + 1}</span>
            <Nombre c={c} conProducto={conProducto} />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-legal text-muted-foreground">Tasa anual (TNA)</dt>
              <dd className="font-mono text-base font-semibold">{tasaTexto(c, c.tna)}</dd>
              <dd className="text-legal text-muted-foreground">
                TEA {tasaTexto(c, c.tea)} · TEM {tasaTexto(c, c.tem)}
              </dd>
            </div>
            <div>
              <dt className="text-legal text-muted-foreground">{conProducto ? `Si rinde igual, en ${dias} días` : `Ganancia en ${dias} días`}</dt>
              <dd className="font-mono text-base font-semibold text-cifra">{ars(c.ganancia)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-1.5">
            <BadgeTasaReal real={c.tasaRealMensual} />
            <BadgeLiquidez liquidez={c.alternativa.liquidez} />
            <BadgeRiesgo riesgo={c.alternativa.riesgo} />
          </div>
          <BotonEntidad alternativa={c.alternativa} />
        </li>
      ))}
    </ol>
  );
}

/** En un plazo fijo UVA la tasa se suma al ajuste por inflación: "UVA + 1,00%". */
function tasaTexto(c: Cotizacion, valor: number) {
  return c.alternativa.capitalizacion === "uva" ? `UVA + ${tasa(valor)}` : tasa(valor);
}
