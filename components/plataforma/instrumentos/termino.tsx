"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TERMINOS, type ClaveTermino } from "@/lib/plataforma/instrumentos/glosario";

/**
 * Palabra con definición en tooltip. Es controlado para que también se abra al
 * tocarlo en el celular (el Tooltip de Radix solo reacciona a hover y foco).
 */
export function Termino({ clave, children }: { clave: ClaveTermino; children?: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const t = TERMINOS[clave];
  return (
    <Tooltip open={abierto} onOpenChange={setAbierto}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); // evita que Radix lo cierre en el mismo clic
            setAbierto((a) => !a);
          }}
          className="inline-flex cursor-help items-center gap-1 underline decoration-dotted decoration-muted-foreground/60 underline-offset-4"
        >
          {children ?? t.termino}
          <Info className="h-3 w-3 text-muted-foreground" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[min(18rem,calc(100vw-2rem))] text-left leading-relaxed">
        <span className="font-semibold">{t.termino}: </span>
        {t.definicion}
      </TooltipContent>
    </Tooltip>
  );
}
