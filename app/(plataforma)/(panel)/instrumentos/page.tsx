import type { Metadata } from "next";
import { DisclaimerInstrumentos } from "@/components/plataforma/instrumentos/disclaimer";
import { ListadoInstrumentos } from "@/components/plataforma/instrumentos/listado";
import { CATALOGO_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/catalogo";

export const metadata: Metadata = {
  title: "Biblioteca de instrumentos | FinUp",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Biblioteca de instrumentos</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Instrumentos reales, explicados</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Fichas de CEDEARs, acciones y bonos que se negocian en Argentina, para entender qué hay detrás de cada parte de una cartera: qué son, por
          qué están en esta lista y qué puede salir mal.
        </p>
      </header>
      <DisclaimerInstrumentos />
      <ListadoInstrumentos instrumentos={CATALOGO_INSTRUMENTOS} />
    </div>
  );
}
