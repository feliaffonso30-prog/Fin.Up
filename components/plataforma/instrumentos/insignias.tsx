import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NOMBRE_CATEGORIA, NOMBRE_RIESGO, type CategoriaInstrumento, type NivelRiesgo } from "@/lib/plataforma/instrumentos/tipos";

const COLOR_RIESGO: Record<NivelRiesgo, string> = {
  bajo: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medio: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  alto: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export function BadgeRiesgo({ riesgo, className }: { riesgo: NivelRiesgo; className?: string }) {
  return (
    <Badge variant="outline" className={cn(COLOR_RIESGO[riesgo], className)}>
      {NOMBRE_RIESGO[riesgo]}
    </Badge>
  );
}

export function BadgeCategoria({ categoria, className }: { categoria: CategoriaInstrumento; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-blue-500/30 bg-blue-500/10 text-blue-300", className)}>
      {NOMBRE_CATEGORIA[categoria]}
    </Badge>
  );
}
