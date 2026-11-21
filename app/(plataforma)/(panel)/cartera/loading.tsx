import { BrujulaCargando } from "@/components/plataforma/brujula-cargando";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <BrujulaCargando etiqueta="Cargando lo que tenés">Buscando los precios de hoy…</BrujulaCargando>
    </div>
  );
}
