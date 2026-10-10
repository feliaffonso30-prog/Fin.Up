import type { Metadata } from "next";
import { Comparador } from "@/components/plataforma/comparador/comparador";
import { obtenerBilleteras, obtenerDolarMep, obtenerFci, obtenerInflacion, obtenerPlazoFijo, obtenerUva } from "@/lib/comparador/fuentes";

export const metadata: Metadata = {
  title: "Comparador | FinUp",
  robots: { index: false },
};

const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Los datos se piden en el servidor (con caché, ver lib/comparador/fuentes.ts):
// el navegador nunca llama a las APIs externas. Los FCI no se esperan acá: su
// descarga es pesada y, con la caché vacía, frenaría toda la página. Se pasa la
// promesa y React la transmite cuando está lista (Suspense en sus pestañas).
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const fci = obtenerFci();
  const [plazoFijo, uva, billeteras, inflacion, dolarMep, params] = await Promise.all([
    obtenerPlazoFijo(),
    obtenerUva(),
    obtenerBilleteras(),
    obtenerInflacion(),
    obtenerDolarMep(),
    searchParams,
  ]);
  return (
    <Comparador
      datos={{ plazoFijo, uva, billeteras, inflacion, dolarMep }}
      fci={fci}
      montoUrl={primero(params.monto)}
      usdUrl={primero(params.usd)}
      tabUrl={primero(params.tab)}
    />
  );
}
