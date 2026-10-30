import { ExternalLink } from "lucide-react";
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
      className={gana ? "border-exito/40 bg-exito/10 text-exito" : "border-error/40 bg-error/10 text-error"}
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
      {alternativa.esReferido && <span className="text-legal text-muted-foreground">Link de referido</span>}
    </div>
  );
}
