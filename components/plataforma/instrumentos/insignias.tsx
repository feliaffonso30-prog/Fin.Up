import { Badge } from "@/components/ui/badge";
import { InsigniaRiesgo } from "@/components/plataforma/primitivas";
import { cn } from "@/lib/utils";
import { NOMBRE_CATEGORIA, NOMBRE_RIESGO, type CategoriaInstrumento, type NivelRiesgo } from "@/lib/plataforma/instrumentos/tipos";

export function BadgeRiesgo({ riesgo, className }: { riesgo: NivelRiesgo; className?: string }) {
  return <InsigniaRiesgo nivel={riesgo} etiqueta={NOMBRE_RIESGO[riesgo]} className={className} />;
}

export function BadgeCategoria({ categoria, className }: { categoria: CategoriaInstrumento; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-info/30 bg-info/10 text-info", className)}>
      {NOMBRE_CATEGORIA[categoria]}
    </Badge>
  );
}
