"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Opción seleccionable tipo "radio" para el cuestionario.
export function Opcion({
  seleccionada,
  onClick,
  titulo,
  detalle,
  children,
}: {
  seleccionada: boolean;
  onClick: () => void;
  titulo: string;
  detalle?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
        seleccionada
          ? "border-ring bg-primary text-primary-foreground shadow-lg shadow-blue-500/10"
          : "border-input bg-transparent text-slate-200 hover:border-ring",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{titulo}</span>
        {detalle && (
          <span className={cn("mt-0.5 block text-xs leading-snug", seleccionada ? "text-primary-foreground" : "text-muted-foreground")}>
            {detalle}
          </span>
        )}
        {children}
      </span>
      {seleccionada && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}

// `labelledBy` apunta a la pregunta visible; `etiqueta` queda como nombre de respaldo.
export function GrupoOpciones({
  etiqueta,
  labelledBy,
  describedBy,
  children,
}: {
  etiqueta?: string;
  labelledBy?: string;
  describedBy?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : etiqueta}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="space-y-2"
    >
      {children}
    </div>
  );
}
