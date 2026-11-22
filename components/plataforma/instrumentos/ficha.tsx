import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronDown, TriangleAlert } from "lucide-react";
import { DisclaimerInstrumentos } from "@/components/plataforma/instrumentos/disclaimer";
import { BadgeRiesgo } from "@/components/plataforma/instrumentos/insignias";
import { PreguntarFinBot } from "@/components/plataforma/instrumentos/preguntar-finbot";
import { Termino } from "@/components/plataforma/instrumentos/termino";
import { QuePuedeSalirMal } from "@/components/plataforma/primitivas";
import { fecha } from "@/lib/plataforma/formato";
import { TERMINOS, type ClaveTermino } from "@/lib/plataforma/instrumentos/glosario";
import { PRECIO_NO_DISPONIBLE, preguntaFinBot } from "@/lib/plataforma/instrumentos/textos";
import { NOMBRE_CRITERIO, NOMBRE_HORIZONTE, type Instrumento } from "@/lib/plataforma/instrumentos/tipos";

const NOMBRE_MONEDA = { ARS: "Pesos", USD: "Dólares" } as const;

const PARTE_CARTERA: Record<Instrumento["categoriasCartera"][number], string> = {
  fija: "Préstamos a gobiernos y empresas (renta fija)",
  variable: "Partes de empresas (acciones)",
  dividendos: "Empresas que reparten ganancias (dividendos)",
  liquidez: "Plata disponible al instante (liquidez)",
  alternativo: "Cripto y oro (alternativos)",
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
    <article className="space-y-8">
      <Link href="/instrumentos" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a los ejemplos
      </Link>

      {/* Primero el nombre; el tipo, la sigla y el riesgo acompañan debajo, sin rótulos arriba del título. */}
      <header className="space-y-3">
        <h1 className="text-4xl font-black leading-none text-foreground md:text-5xl">{i.nombre}</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
          <span>
            {esCedear ? <Termino clave="cedear">{i.tipo}</Termino> : i.tipo} · {i.ticker} · {i.sector}
          </span>
          <BadgeRiesgo riesgo={i.riesgo} />
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{i.descripcion}</p>
      </header>

      {/* Lo que puede salir mal va en la primera vista, no escondido en una pestaña. */}
      <div>
        <QuePuedeSalirMal
          className="p-4"
          titulo={
            <>
              <TriangleAlert className="h-4 w-4" aria-hidden />
              Qué puede salir mal
            </>
          }
          pie={
            <>
              Nivel de riesgo: {i.riesgo}. {QUE_SIGNIFICA_RIESGO[i.riesgo]}
            </>
          }
        >
          <ul className="list-disc space-y-1.5 pl-5">
            {i.riesgos.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </QuePuedeSalirMal>
        <p className="mt-2 text-legal text-muted-foreground">
          El riesgo se mide según su <Termino clave="volatilidad">volatilidad</Termino>. No es una calificación oficial.
        </p>
      </div>

      <Seccion titulo="Por qué está en esta lista">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{i.porQueEnLaLista}</p>
        <ul className="mt-3 space-y-1.5">
          {i.criterios.map((c) => (
            <li key={c} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              {c === "liquidez" ? <Termino clave="liquidez">{NOMBRE_CRITERIO[c]}</Termino> : NOMBRE_CRITERIO[c]}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="Dónde aparece en FinUp">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Se usa como ejemplo en la parte de <strong className="text-foreground">{i.categoriasCartera.map((c) => PARTE_CARTERA[c]).join(" y ")}</strong> de los
          planes de perfil {i.perfilesEjemplo.map((p) => p.toLowerCase()).join(", ")}. Es un ejemplo para entender esa parte, no una indicación de lo que
          tenés que tener.
        </p>
      </Seccion>

      {/* Datos sueltos: filas con una línea, sin una caja por dato. */}
      <dl className="grid grid-cols-1 border-t border-border sm:grid-cols-3 sm:gap-x-8">
        <Dato titulo="Plazo típico">{NOMBRE_HORIZONTE[i.horizonte]}</Dato>
        <Dato titulo="Se opera en">{i.monedas.map((m) => NOMBRE_MONEDA[m]).join(" y ")}</Dato>
        <Dato titulo="Precio">
          No disponible
          <span className="mt-0.5 block text-legal font-normal text-muted-foreground">{PRECIO_NO_DISPONIBLE}</span>
        </Dato>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base leading-snug">¿Te quedó alguna duda? FinBot te lo explica con tus palabras.</p>
        <PreguntarFinBot pregunta={preguntaFinBot(i)} />
      </div>

      <div>
        <Plegable titulo="Datos técnicos">
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <Fila etiqueta={<Termino clave="ticker" />}>{i.ticker}</Fila>
            <Fila etiqueta="Tipo">{i.tipo}</Fila>
            <Fila etiqueta="Sector">{i.sector}</Fila>
            {esCedear && (
              <Fila etiqueta={<Termino clave="ratio" />}>
                {i.ratio}:1
                <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                  {i.ratio} CEDEARs equivalen a 1 {i.categoria === "cedear-etf" ? "cuota del ETF" : "acción"} original.
                </span>
              </Fila>
            )}
            <Fila etiqueta="Ficha revisada el">{fecha(i.fechaRevision)}</Fila>
          </dl>
        </Plegable>

        <Plegable titulo="Palabras de esta ficha">
          <dl className="space-y-4">
            {terminosDe(i).map((k) => (
              <div key={k}>
                <dt className="text-sm font-bold">{TERMINOS[k].termino}</dt>
                <dd className="mt-0.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{TERMINOS[k].definicion}</dd>
              </div>
            ))}
          </dl>
        </Plegable>
      </div>

      <DisclaimerInstrumentos />
    </article>
  );
}

/** Bloque secundario plegado, con una línea divisoria y sin caja. */
function Plegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border first:border-t">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 font-display text-lg font-extrabold [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-3.5">
      <dt className="text-sm text-muted-foreground">{titulo}</dt>
      <dd className="mt-0.5 text-base font-bold">{children}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-lg font-extrabold">{titulo}</h2>
      {children}
    </section>
  );
}

function Fila({ etiqueta, children }: { etiqueta: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-bold">{children}</dd>
    </div>
  );
}
