import { AlertTriangle, Info } from "lucide-react";
import { fecha } from "@/lib/plataforma/formato";
import { LISTA_EN_BORRADOR, LISTA_REVISADA_EL } from "@/lib/plataforma/instrumentos/datos";
import { AVISO_BORRADOR, DISCLAIMER_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/textos";

/** Aviso fijo de la sección: va en el listado y en cada ficha. */
export function DisclaimerInstrumentos() {
  return (
    <div className="space-y-2">
      <div role="note" className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" aria-hidden />
        <div className="space-y-1">
          <p className="text-xs leading-relaxed text-foreground/85">{DISCLAIMER_INSTRUMENTOS}</p>
          <p className="text-[11px] text-muted-foreground">Última revisión de la lista: {fecha(LISTA_REVISADA_EL)}</p>
        </div>
      </div>
      {LISTA_EN_BORRADOR && (
        <div role="status" className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <p className="text-xs leading-relaxed text-amber-100/90">{AVISO_BORRADOR}</p>
        </div>
      )}
    </div>
  );
}
