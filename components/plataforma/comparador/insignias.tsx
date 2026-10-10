import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pct } from "@/lib/plataforma/formato";
import { ETIQUETA_LIQUIDEZ, ETIQUETA_RIESGO } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Liquidez, NivelRiesgo } from "@/lib/plataforma/comparador/tipos";
import { cn } from "@/lib/utils";

/** Tasa en decimal → "22,50%". */
export const tasa = (x: number, decimales = 2) => pct(x * 100, decimales);

const COLOR_RIESGO: Record<NivelRiesgo, string> = {
  Bajo: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  Medio: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  Alto: "border-orange-500/40 bg-orange-500/15 text-orange-200",
};

export function BadgeRiesgo({ riesgo }: { riesgo: NivelRiesgo }) {
  return (
    <Badge variant="outline" className={COLOR_RIESGO[riesgo]}>
      {ETIQUETA_RIESGO[riesgo]}
    </Badge>
  );
}

export function BadgeLiquidez({ liquidez }: { liquidez: Liquidez }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        liquidez === "inmediata" ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200" : "border-border bg-secondary/50 text-foreground/80",
      )}
    >
      {ETIQUETA_LIQUIDEZ[liquidez]}
    </Badge>
  );
}

/** Verde si le gana a la inflación, rojo si no, gris si no hay dato. */
export function BadgeTasaReal({ real }: { real: number | null }) {
  if (real === null) {
    return (
      <Badge variant="outline" className="border-border text-muted-foreground">
        Sin dato
      </Badge>
    );
  }
  const gana = real > 0;
  const texto = `${real >= 0 ? "+" : "−"}${tasa(Math.abs(real))} real/mes`;
  return (
    <Badge
      variant="outline"
      className={gana ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"}
      aria-label={`${texto}: ${gana ? "le gana" : "no le gana"} a la inflación`}
      title={gana ? "Le gana a la última inflación mensual" : "No le gana a la última inflación mensual"}
    >
      {texto}
    </Badge>
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
          Ir a la entidad
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </Button>
      {alternativa.esReferido && <span className="text-[10px] text-muted-foreground">Link de referido</span>}
    </div>
  );
}
