import { BrujulaCargando } from "@/components/plataforma/brujula-cargando";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <BrujulaCargando etiqueta="Cargando el comparador">Buscando las tasas de hoy…</BrujulaCargando>
    </div>
  );
}
