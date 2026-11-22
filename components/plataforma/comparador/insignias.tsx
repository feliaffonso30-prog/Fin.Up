import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pct } from "@/lib/plataforma/formato";
import { ETIQUETA_LIQUIDEZ, ETIQUETA_RIESGO } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Liquidez, NivelRiesgo } from "@/lib/plataforma/comparador/tipos";
import { InsigniaRiesgo, type NivelRiesgoVisual } from "@/components/plataforma/primitivas";
import { cn } from "@/lib/utils";

/** Tasa en decimal → "22,50%". */
export const tasa = (x: number, decimales = 2) => pct(x * 100, decimales);

const NIVEL: Record<NivelRiesgo, NivelRiesgoVisual> = { Bajo: "bajo", Medio: "medio", Alto: "alto" };

export function BadgeRiesgo({ riesgo }: { riesgo: NivelRiesgo }) {
  return <InsigniaRiesgo nivel={NIVEL[riesgo]} etiqueta={ETIQUETA_RIESGO[riesgo]} />;
}

export function BadgeLiquidez({ liquidez }: { liquidez: Liquidez }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        liquidez === "inmediata" ? "border-accent/30 bg-accent/10 text-cifra" : "border-border bg-secondary/50 text-foreground/80",
      )}
    >
      {ETIQUETA_LIQUIDEZ[liquidez]}
    </Badge>
  );
}

/** Neutro si le gana a la inflación, de atención si pierde, gris si no hay dato. El texto lo dice, no solo el color. */
export function BadgeTasaReal({ real }: { real: number | null }) {
  if (real === null) {
    return (
      <Badge variant="outline" className="border-border text-muted-foreground" aria-label="Sin dato de inflación para comparar">
        Sin dato
      </Badge>
    );
  }
  const gana = real > 0;
  const empata = real === 0;
  const texto = gana
    ? `Le gana por ${tasa(real)} al mes`
    : empata
      ? "Empata con la inflación"
      : `Pierde ${tasa(Math.abs(real))} al mes contra la inflación`;
  const descripcion = gana ? `Le gana a la inflación por ${tasa(real)} al mes` : texto;
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-normal text-left",
        gana || empata ? "border-border bg-card text-foreground" : "vidrio-mal border-transparent text-atencion",
      )}
      aria-label={descripcion}
      title="Comparado con cuánto subieron los precios el último mes"
    >
      {texto}
    </Badge>
  );
}

/**
 * Qué significa cada tasa. Va una sola vez por vista, arriba de la tabla.
 * `conUva`: suma la línea de "Inflación + X%" cuando hay plazos fijos que siguen a la inflación.
 */
export function LeyendaTasas({ conUva = false, conMensual = true }: { conUva?: boolean; conMensual?: boolean }) {
  return (
    <details className="group rounded-xl border border-border bg-secondary/30 px-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        ¿Qué significan estas tasas?
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <ul className="space-y-1.5 pb-3 text-xs leading-relaxed text-muted-foreground">
        <li>
          <span className="font-semibold text-foreground">TNA (tasa nominal anual):</span> lo que te pagaría en un año.
        </li>
        {conMensual && (
          <>
            <li>
              <span className="font-semibold text-foreground">TEA (tasa efectiva anual):</span> lo mismo, si cada mes volvés a dejar lo que
              ganaste.
            </li>
            <li>
              <span className="font-semibold text-foreground">TEM (tasa efectiva mensual):</span> lo que paga en un mes.
            </li>
          </>
        )}
        {conUva && (
          <li>
            <span className="font-semibold text-foreground">Inflación + X% (en el banco, «UVA + X%»):</span> sigue a la inflación y además
            paga X% al año.
          </li>
        )}
      </ul>
    </details>
  );
}

export function BotonEntidad({ alternativa, className }: { alternativa: Alternativa; className?: string }) {
  if (!alternativa.url) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Sin link disponible</span>;
  }
  return (
    <div className={cn("flex flex-col items-start gap-0.5", className)}>
      <Button asChild size="sm" variant="outline" className="w-full">
        <a
          href={alternativa.url}
          target="_blank"
          rel={alternativa.esReferido ? "noopener noreferrer sponsored" : "noopener noreferrer"}
          aria-label={`Ir al sitio de ${alternativa.entidad} (se abre en otra pestaña)`}
        >
          Ir al sitio
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </Button>
      {alternativa.esReferido && <span className="text-legal text-muted-foreground">Link de referido</span>}
    </div>
  );
}
