"use client";

import { Suspense, use, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { QuePuedeSalirMal } from "@/components/plataforma/primitivas";
import { compararTodo, type FilaComparacion as Fila } from "@/lib/plataforma/comparador/cotizar";
import { EDUCATIVO } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Consulta, Inflacion, Liquidez, TipoAlternativa } from "@/lib/plataforma/comparador/tipos";
import { ars } from "@/lib/plataforma/formato";
import { BadgeRiesgo, BotonEntidad } from "./insignias";
import type { Fuente } from "./pestanas";

// La respuesta corta de Tus pesos: por cada tipo, cuánto ganarías, si le gana a la inflación
// y cuándo podés sacar la plata. Sin tasas: esas quedan en "Ver el detalle".
// El orden es fijo por tipo, no un ranking: el comparador no recomienda ninguno.

const NOMBRE: Record<TipoAlternativa, string> = {
  "plazo-fijo": "Plazo fijo",
  uva: "Plazo fijo que ajusta por inflación (UVA)",
  billetera: "Billetera o cuenta que rinde",
  "fci-mm": "Fondo de corto plazo (money market)",
  "fci-rf": "Fondo de bonos en pesos",
};

const CUANDO_SACARLA: Record<Liquidez, string> = {
  inmediata: "Cuando quieras",
  "24-48h": "En 1 o 2 días",
  "al-vencimiento": "Al terminar el plazo",
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
        Con {ars(consulta.monto)}, en {consulta.dias} días
      </h2>
      <p className="mt-1 text-base leading-snug text-muted-foreground">La opción que más rinde de cada tipo. Mirá también cuándo podés sacar la plata y el riesgo, no solo la ganancia.</p>
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
  const { tipo, mejor, cargando, motivo } = fila;
  const e = EDUCATIVO[tipo];
  const nombre = mejor?.alternativa.tipo.startsWith("fci") ? mejor.alternativa.producto : mejor?.alternativa.entidad;

  return (
    <article className="vidrio flex h-full flex-col rounded-xl p-4">
      <h3 className="text-lg font-extrabold leading-snug">{NOMBRE[tipo]}</h3>

      {cargando ? (
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          Buscando los fondos…
        </p>
      ) : !mejor ? (
        <p className="mt-2 text-sm text-muted-foreground">No disponible: {motivo}</p>
      ) : (
        <>
          <p className="mt-2 text-sm font-semibold">Ganarías unos</p>
          <p className="text-[1.875rem] font-black leading-[1.1] tracking-[-0.03em]">{ars(mejor.ganancia)}</p>

          <dl className="mt-3 space-y-2 text-sm">
            <Dato titulo="¿Le gana a la inflación?">
              {mejor.leGanaALaInflacion === null ? <span className="text-muted-foreground">Sin dato</span> : mejor.leGanaALaInflacion ? "Sí" : <span className="text-atencion">No</span>}
            </Dato>
            <Dato titulo="¿Cuándo podés sacarla?">{CUANDO_SACARLA[mejor.alternativa.liquidez]}</Dato>
            <Dato titulo="Riesgo">
              <BadgeRiesgo riesgo={mejor.alternativa.riesgo} />
            </Dato>
          </dl>

          <div className="mt-3 border-t border-border pt-3">
            <p className="text-sm leading-snug">
              <span className="text-muted-foreground">La que más rinde hoy: </span>
              <span className="font-semibold">{nombre}</span>
            </p>
            {tipo.startsWith("fci") && <p className="text-sm text-muted-foreground">{mejor.alternativa.entidad}</p>}
            {mejor.notas.map((n) => (
              <p key={n} className="mt-1 text-legal leading-snug text-muted-foreground">
                {n}
              </p>
            ))}
            <BotonEntidad alternativa={mejor.alternativa} className="mt-2" />
          </div>
        </>
      )}

      <details className="group mt-auto pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Qué es y qué puede salir mal
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <div className="space-y-3 pb-1 text-sm leading-relaxed">
          <p className="text-muted-foreground">{e.queEs}</p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Ventajas: </span>
            {e.ventajas}
          </p>
          <QuePuedeSalirMal>{e.riesgos}</QuePuedeSalirMal>
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
