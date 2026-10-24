"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BadgeRiesgo } from "@/components/plataforma/instrumentos/insignias";
import { ejemplosPara } from "@/lib/plataforma/instrumentos/catalogo";
import { TEXTO_EJEMPLOS_CARTERA } from "@/lib/plataforma/instrumentos/textos";
import type { Categoria, PerfilRiesgo } from "@/lib/plataforma/tipos";

/**
 * "Ver ejemplos" dentro de una parte de la cartera: instrumentos de la Biblioteca
 * de esa categoría que sirven de ejemplo para el perfil. null si la categoría no
 * tiene ejemplos (liquidez va al comparador; alternativos todavía no).
 */
export function VerEjemplos({ categoria, perfil }: { categoria: Categoria; perfil: PerfilRiesgo }) {
  const [abierto, setAbierto] = useState(false);
  const ejemplos = ejemplosPara(categoria, perfil);
  if (ejemplos.length === 0) return null;

  return (
    <Collapsible open={abierto} onOpenChange={setAbierto} className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-foreground/85">Mirá instrumentos reales de esta categoría, explicados en una ficha.</p>
        <CollapsibleTrigger asChild>
          <Button size="sm" variant="outline" className="shrink-0">
            <Library className="h-4 w-4" aria-hidden />
            {abierto ? "Ocultar ejemplos" : "Ver ejemplos"}
            <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3 space-y-2">
        <p className="text-[11px] leading-snug text-amber-200/80">{TEXTO_EJEMPLOS_CARTERA}</p>
        <ul className="divide-y divide-border/60 rounded-md border border-border/60">
          {ejemplos.map((i) => (
            <li key={i.ticker}>
              <Link href={`/instrumentos/${i.ticker}`} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/50">
                <span className="w-14 shrink-0 font-mono text-xs font-bold text-blue-300">{i.ticker}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-xs font-medium leading-snug">{i.nombre}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{i.tipo}</span>
                  {/* En celular el riesgo va debajo del tipo para no apretar el nombre; en sm+ queda a la derecha. */}
                  <BadgeRiesgo riesgo={i.riesgo} className="mt-1 sm:hidden" />
                </span>
                <BadgeRiesgo riesgo={i.riesgo} className="hidden sm:inline-flex" />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/instrumentos" className="inline-block text-xs text-blue-300 underline-offset-2 hover:underline">
          Ver toda la biblioteca de instrumentos
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}
