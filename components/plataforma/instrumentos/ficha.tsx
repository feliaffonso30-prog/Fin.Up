import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDollarSign, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisclaimerInstrumentos } from "@/components/plataforma/instrumentos/disclaimer";
import { BadgeCategoria, BadgeRiesgo } from "@/components/plataforma/instrumentos/insignias";
import { PreguntarFinBot } from "@/components/plataforma/instrumentos/preguntar-finbot";
import { Termino } from "@/components/plataforma/instrumentos/termino";
import { QuePuedeSalirMal } from "@/components/plataforma/primitivas";
import { fecha } from "@/lib/plataforma/formato";
import { TERMINOS, type ClaveTermino } from "@/lib/plataforma/instrumentos/glosario";
import { NOTA_RIESGO, PRECIO_NO_DISPONIBLE, preguntaFinBot } from "@/lib/plataforma/instrumentos/textos";
import { NOMBRE_CRITERIO, NOMBRE_HORIZONTE, type Instrumento } from "@/lib/plataforma/instrumentos/tipos";

const NOMBRE_MONEDA = { ARS: "Pesos (ARS)", USD: "Dólares (USD MEP)" } as const;

const PARTE_CARTERA: Record<Instrumento["categoriasCartera"][number], string> = {
  fija: "Renta fija",
  variable: "Acciones y ETFs",
  dividendos: "Acciones y ETFs de dividendos",
  liquidez: "Liquidez",
  alternativo: "Alternativos",
};

const QUE_SIGNIFICA_RIESGO: Record<Instrumento["riesgo"], string> = {
  bajo: "Dentro de esta lista, es de lo que menos se mueve. Igual puede perder valor.",
  medio: "Puede tener caídas importantes en un mal año, aunque suele moverse menos que una acción individual.",
  alto: "Puede subir o bajar mucho en poco tiempo. Hay años en que pierde una parte grande de su valor.",
};

function terminosDe(i: Instrumento): ClaveTermino[] {
  const base: ClaveTermino[] = ["ticker", "liquidez", "volatilidad"];
  if (i.categoria === "cedear-etf") return ["cedear", "etf", "ratio", ...base];
  if (i.categoria === "cedear-empresa") return ["cedear", "ratio", ...base];
  if (i.categoria === "renta-fija") return i.tipo === "Obligación negociable" ? ["on", "default", ...base] : ["default", ...base];
  return base;
}

export function FichaInstrumento({ instrumento: i }: { instrumento: Instrumento }) {
  const esCedear = i.ratio !== null;

  return (
    <article className="space-y-6">
      <Link href="/instrumentos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a la biblioteca
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeCategoria categoria={i.categoria} />
          <BadgeRiesgo riesgo={i.riesgo} />
        </div>
        <div>
          <p className="font-mono text-sm font-bold text-info">{i.ticker}</p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{i.nombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {esCedear ? (
              <>
                <Termino clave="cedear">{i.tipo}</Termino> · {i.sector}
              </>
            ) : (
              <>
                {i.tipo} · {i.sector}
              </>
            )}
          </p>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">{i.descripcion}</p>
      </header>

      <DisclaimerInstrumentos />

      <div className="grid gap-3 sm:grid-cols-3">
        <Dato titulo="Precio">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CircleDollarSign className="h-4 w-4" aria-hidden />
            No disponible
          </span>
          <span className="mt-1 block text-legal font-normal leading-snug text-muted-foreground/80">{PRECIO_NO_DISPONIBLE}</span>
        </Dato>
        <Dato titulo="Horizonte sugerido">{NOMBRE_HORIZONTE[i.horizonte]}</Dato>
        <Dato titulo="Se opera en">{i.monedas.map((m) => NOMBRE_MONEDA[m]).join(" y ")}</Dato>
      </div>

      <Tabs defaultValue="que-es" className="gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="que-es">Qué es</TabsTrigger>
          <TabsTrigger value="riesgos">Riesgos</TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="que-es" className="space-y-4">
          <Seccion titulo="Por qué está en esta lista">
            <p className="text-sm leading-relaxed text-foreground/85">{i.porQueEnLaLista}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {i.criterios.map((c) => (
                <li key={c} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-exito" aria-hidden />
                  {c === "liquidez" ? <Termino clave="liquidez">{NOMBRE_CRITERIO[c]}</Termino> : NOMBRE_CRITERIO[c]}
                </li>
              ))}
            </ul>
          </Seccion>
          <Seccion titulo="Dónde aparece en FinUp">
            <p className="text-sm leading-relaxed text-foreground/85">
              Se usa como ejemplo en la parte de <strong>{i.categoriasCartera.map((c) => PARTE_CARTERA[c]).join(" y ")}</strong> de las carteras
              de perfil {i.perfilesEjemplo.map((p) => p.toLowerCase()).join(", ")}.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Es un ejemplo para entender la categoría, no una indicación de lo que tenés que tener.
            </p>
          </Seccion>
        </TabsContent>

        <TabsContent value="riesgos" className="space-y-4">
          <QuePuedeSalirMal
            className="p-4"
            titulo={
              <>
                <TriangleAlert className="h-4 w-4" aria-hidden />
                Qué puede salir mal
              </>
            }
          >
            <ul className="list-disc space-y-1.5 pl-5">
              {i.riesgos.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </QuePuedeSalirMal>
          <Seccion titulo="Nivel de riesgo">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeRiesgo riesgo={i.riesgo} />
              <span className="text-xs text-muted-foreground">
                según su <Termino clave="volatilidad">volatilidad</Termino>
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{QUE_SIGNIFICA_RIESGO[i.riesgo]}</p>
            <p className="mt-2 text-legal leading-snug text-muted-foreground/80">{NOTA_RIESGO}</p>
          </Seccion>
        </TabsContent>

        <TabsContent value="datos">
          <Card className="border-border bg-card/70">
            <CardContent className="pt-6">
              <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <Fila etiqueta={<Termino clave="ticker" />}>{i.ticker}</Fila>
                <Fila etiqueta="Tipo">{i.tipo}</Fila>
                <Fila etiqueta="Sector">{i.sector}</Fila>
                <Fila etiqueta="Moneda de cotización">{i.monedas.map((m) => NOMBRE_MONEDA[m]).join(" y ")}</Fila>
                {esCedear && (
                  <Fila etiqueta={<Termino clave="ratio" />}>
                    {i.ratio}:1
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {i.ratio} CEDEARs equivalen a 1 {i.categoria === "cedear-etf" ? "cuota del ETF" : "acción"} original.
                    </span>
                  </Fila>
                )}
                <Fila etiqueta="Horizonte sugerido">{NOMBRE_HORIZONTE[i.horizonte]}</Fila>
                <Fila etiqueta="Ficha revisada el">{fecha(i.fechaRevision)}</Fila>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 rounded-xl border border-info/20 bg-info/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-foreground/85">¿Te quedó alguna duda? FinBot te lo explica con tus palabras.</p>
        <PreguntarFinBot pregunta={preguntaFinBot(i)} />
      </div>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Glosario de esta ficha</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {terminosDe(i).map((k) => (
              <div key={k}>
                <dt className="text-sm font-semibold">{TERMINOS[k].termino}</dt>
                <dd className="text-xs leading-relaxed text-muted-foreground">{TERMINOS[k].definicion}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </article>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <div className="mt-1 text-base font-semibold">{children}</div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-enlace">{titulo}</h2>
      {children}
    </section>
  );
}

function Fila({ etiqueta, children }: { etiqueta: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
