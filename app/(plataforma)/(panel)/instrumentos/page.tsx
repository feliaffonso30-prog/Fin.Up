import type { Metadata } from "next";
import { DisclaimerInstrumentos } from "@/components/plataforma/instrumentos/disclaimer";
import { ListadoInstrumentos } from "@/components/plataforma/instrumentos/listado";
import { EncabezadoPagina } from "@/components/plataforma/primitivas";
import { CATALOGO_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/catalogo";

export const metadata: Metadata = {
  title: "Ejemplos | FinUp",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-8">
      <EncabezadoPagina titulo="Ejemplos reales, explicados">Para entender qué hay en cada parte de tu plan. Son ejemplos, no recomendaciones.</EncabezadoPagina>
      <ListadoInstrumentos instrumentos={CATALOGO_INSTRUMENTOS} />
      <DisclaimerInstrumentos />
    </div>
  );
}
