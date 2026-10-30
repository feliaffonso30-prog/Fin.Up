import type { Metadata } from "next";
import { DisclaimerInstrumentos } from "@/components/plataforma/instrumentos/disclaimer";
import { ListadoInstrumentos } from "@/components/plataforma/instrumentos/listado";
import { EncabezadoPagina } from "@/components/plataforma/primitivas";
import { CATALOGO_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/catalogo";

export const metadata: Metadata = {
  title: "Biblioteca de instrumentos | FinUp",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-8">
      <EncabezadoPagina sobretitulo="Biblioteca de instrumentos" titulo="Instrumentos reales, explicados">
        Fichas de CEDEARs, acciones y bonos que se negocian en Argentina, para entender qué hay detrás de cada parte de una cartera: qué son, por
        qué están en esta lista y qué puede salir mal.
      </EncabezadoPagina>
      <DisclaimerInstrumentos />
      <ListadoInstrumentos instrumentos={CATALOGO_INSTRUMENTOS} />
    </div>
  );
}
