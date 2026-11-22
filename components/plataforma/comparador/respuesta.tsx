"use client";

import { Suspense, use, useMemo } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { QuePuedeSalirMal } from "@/components/plataforma/primitivas";
import { compararTodo, type FilaComparacion as Fila } from "@/lib/plataforma/comparador/cotizar";
import { EDUCATIVO, ETIQUETA_LIQUIDEZ, plazoEnPalabras } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Consulta, Inflacion, TipoAlternativa } from "@/lib/plataforma/comparador/tipos";
import { ars } from "@/lib/plataforma/formato";
import { BadgeRiesgo } from "./insignias";
import type { Fuente } from "./pestanas";

// La respuesta corta de Tus pesos: por cada tipo, cuánto ganarías, si le gana a la inflación,
// cuándo podés sacar la plata y el riesgo. Nada más a primera vista: sin siglas, sin tasas y sin
// nombres largos de entidades. Dónde está, qué es y qué puede salir mal viven en el plegable de
// cada tarjeta; las tasas, en la pantalla de detalle.
// El orden es fijo por tipo, no un ranking: el comparador no recomienda ninguno.

// La cifra se presenta con su supuesto: un plazo fijo paga lo pactado; el resto, si nada cambia.
const ANTES_DE_LA_CIFRA: Record<TipoAlternativa, string> = {
  "plazo-fijo": "Ganarías unos",
  uva: "Si la inflación sigue igual, ganarías unos",
  billetera: "Si sigue pagando igual, ganarías unos",
  "fci-mm": "Si sigue pagando igual, ganarías unos",
  "fci-rf": "Si sigue pagando igual, ganarías unos",
};

interface Props {
  consulta: Consulta | null;
  inflacion: Inflacion | null;
  plazoFijo: Fuente;
  uva: Fuente;
  billeteras: Fuente;
  fci: Promise<Fuente>;
}

export function RespuestaPorTipo({ fci, ...resto }: Props) {
  if (!resto.consulta) {
    return <p className="vidrio rounded-xl p-5 text-center text-base text-muted-foreground">Escribí un monto mayor a cero para ver cuánto rendiría.</p>;
  }
  // Mientras llegan los fondos, se muestra todo lo demás.
  return (
    <Suspense fallback={<Tarjetas {...resto} fondos={null} />}>
      <ConFondos fci={fci} {...resto} />
    </Suspense>
  );
}

function ConFondos({ fci, ...resto }: Props) {
  const { datos } = use(fci);
  return <Tarjetas {...resto} fondos={datos} />;
}

function Tarjetas({ consulta, inflacion, plazoFijo, uva, billeteras, fondos }: Omit<Props, "fci"> & { fondos: Alternativa[] | null }) {
  const filas = useMemo<Fila[]>(() => {
    if (!consulta) return [];
    return compararTodo([...plazoFijo.datos, ...uva.datos, ...billeteras.datos, ...(fondos ?? [])], consulta, inflacion, fondos === null);
  }, [consulta, inflacion, plazoFijo.datos, uva.datos, billeteras.datos, fondos]);

  if (!consulta) return null;
  return (
    <section aria-labelledby="respuesta">
      <h2 id="respuesta" className="text-2xl font-black tracking-[-0.025em]">
        Si la dejás {plazoEnPalabras(consulta.dias)}
      </h2>
      <p className="mt-1 text-base leading-snug text-muted-foreground">De cada tipo, la que más paga hoy. Antes de mirar cuánto ganás, fijate cuándo podés sacar la plata y qué riesgo tiene.</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {filas.map((f) => (
          <li key={f.tipo} className="min-w-0">
            <Tarjeta fila={f} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tarjeta({ fila }: { fila: Fila }) {
  const { tipo, mejor, cargando, motivoSimple } = fila;
  const e = EDUCATIVO[tipo];
  const a = mejor?.alternativa;
  // En un fondo importa el nombre del fondo y quién lo administra.
  const nombre = a?.tipo.startsWith("fci") ? `${a.producto} (${a.entidad})` : a?.entidad;

  return (
    <article className="vidrio flex h-full flex-col rounded-xl p-4">
      <h3 className="text-lg font-extrabold leading-snug">{e.titulo}</h3>

      {cargando ? (
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          Buscando los fondos…
        </p>
      ) : !mejor ? (
        <p className="mt-2 text-sm leading-snug text-muted-foreground">{motivoSimple}</p>
      ) : (
        <>
          <p className="mt-2 text-sm font-semibold">{ANTES_DE_LA_CIFRA[tipo]}</p>
          <p className="text-[1.875rem] font-black leading-[1.1] tracking-[-0.03em]">{ars(mejor.ganancia)}</p>

          <dl className="mt-3 space-y-2 text-sm">
            <Dato titulo="¿Le gana a la inflación?">
              {mejor.leGanaALaInflacion === null ? <span className="text-muted-foreground">Sin dato</span> : mejor.leGanaALaInflacion ? "Sí" : <span className="text-atencion">No</span>}
            </Dato>
            <Dato titulo="¿Cuándo podés sacarla?">{ETIQUETA_LIQUIDEZ[mejor.alternativa.liquidez]}</Dato>
            <Dato titulo="Riesgo">
              <BadgeRiesgo riesgo={mejor.alternativa.riesgo} />
            </Dato>
          </dl>
        </>
      )}

      <details className="group mt-auto pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Dónde está y qué puede salir mal
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <div className="space-y-3 pb-1 text-sm leading-relaxed">
          {/* Solo quién paga más hoy. El link aparece únicamente si tiene uno. */}
          {a && (
            <div>
              <p className="leading-snug">
                <span className="text-muted-foreground">La que más paga hoy: </span>
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel={a.esReferido ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                    aria-label={`${nombre}: ir a su sitio (se abre en otra pestaña)`}
                    className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
                  >
                    {nombre}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <span className="font-semibold">{nombre}</span>
                )}
              </p>
              {a.url && a.esReferido && <p className="mt-1 text-legal text-muted-foreground">Link de referido</p>}
            </div>
          )}
          <p className="text-muted-foreground">{e.queEs}</p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Ventajas: </span>
            {e.ventajas}
          </p>
          <QuePuedeSalirMal>{e.riesgos}</QuePuedeSalirMal>
          <p className="text-muted-foreground">En el banco o la app lo vas a encontrar como «{e.enElBanco}».</p>
        </div>
      </details>
    </article>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{titulo}</dt>
      <dd className="text-right font-bold">{children}</dd>
    </div>
  );
}
