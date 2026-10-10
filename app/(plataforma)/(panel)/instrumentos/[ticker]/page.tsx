import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FichaInstrumento } from "@/components/plataforma/instrumentos/ficha";
import { CATALOGO_INSTRUMENTOS, porTicker } from "@/lib/plataforma/instrumentos/catalogo";

type Props = { params: Promise<{ ticker: string }> };

// Una ficha estática por instrumento. Otros tickers (por ejemplo en minúsculas)
// se resuelven al vuelo: si existen redirigen a la URL canónica, si no, 404.
export function generateStaticParams() {
  return CATALOGO_INSTRUMENTOS.map((i) => ({ ticker: i.ticker }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = porTicker((await params).ticker);
  return {
    title: i ? `${i.ticker} · ${i.nombre} | FinUp` : "Instrumento no encontrado | FinUp",
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ticker } = await params;
  const instrumento = porTicker(ticker);
  if (!instrumento) notFound();
  if (instrumento.ticker !== ticker) permanentRedirect(`/instrumentos/${instrumento.ticker}`);
  return <FichaInstrumento instrumento={instrumento} />;
}
