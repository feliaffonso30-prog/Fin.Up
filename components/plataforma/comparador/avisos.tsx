import { AlertTriangle, Info } from "lucide-react";
import type { ResultadoFuente } from "@/lib/comparador/respaldo";
import { fecha } from "@/lib/plataforma/formato";
import { DISCLAIMER_COMPARADOR } from "@/lib/plataforma/comparador/textos";
import type { Fuente } from "@/lib/plataforma/comparador/tipos";

export function Disclaimer() {
  return (
    <div role="note" className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" aria-hidden />
      <p className="text-xs leading-relaxed text-foreground/85">{DISCLAIMER_COMPARADOR}</p>
    </div>
  );
}

/** Fuente, fecha del dato y aviso si la fuente falló. */
export function FuenteDato({
  fuente,
  resultado,
  fechaDato,
}: {
  fuente: Fuente;
  resultado: ResultadoFuente<unknown>;
  fechaDato?: string | null;
}) {
  return (
    <div className="space-y-2">
      {resultado.aviso && (
        <div role="status" className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <p className="text-xs leading-relaxed text-amber-100/90">{resultado.aviso}</p>
        </div>
      )}
      <p className="text-[11px] leading-snug text-muted-foreground/80">
        Fuente:{" "}
        <a href={fuente.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {fuente.nombre}
        </a>
        {fechaDato && <> · Datos al {fecha(fechaDato)}</>}
        {resultado.actualizadoEn && <> · Consultado el {fecha(resultado.actualizadoEn)}</>}
      </p>
    </div>
  );
}
