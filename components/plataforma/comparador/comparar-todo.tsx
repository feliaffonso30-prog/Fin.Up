"use client";

import { Suspense, use, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inflacionDelPeriodo } from "@/lib/plataforma/finanzas";
import { ars } from "@/lib/plataforma/formato";
import { compararTodo, ORDEN_TIPOS as ORDEN, type FilaComparacion as Fila } from "@/lib/plataforma/comparador/cotizar";
import { EDUCATIVO } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Consulta, Cotizacion, Inflacion, TipoAlternativa } from "@/lib/plataforma/comparador/tipos";
import { BadgeLiquidez, BadgeRiesgo, BadgeTasaReal, BotonEntidad, tasa } from "./insignias";
import type { Fuente } from "./pestanas";

const NOMBRE_CORTO: Record<TipoAlternativa, string> = {
  "plazo-fijo": "Plazo fijo",
  uva: "Plazo fijo UVA",
  billetera: "Billetera",
  "fci-mm": "FCI money market",
  "fci-rf": "FCI renta fija",
};

interface Props {
  consulta: Consulta | null;
  inflacion: Inflacion | null;
  plazoFijo: Fuente;
  uva: Fuente;
  billeteras: Fuente;
  fci: Promise<Fuente>;
}

export function TabCompararTodo({ fci, ...resto }: Props) {
  if (!resto.consulta) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Ingresá un monto mayor a cero para comparar todas las opciones.
      </p>
    );
  }
  // Mientras llegan los fondos, se muestra todo lo demás.
  return (
    <Suspense fallback={<Vista {...resto} fondos={null} />}>
      <ConFondos fci={fci} {...resto} />
    </Suspense>
  );
}

function ConFondos({ fci, ...resto }: Props) {
  const resultado = use(fci);
  return <Vista {...resto} fondos={resultado.datos} />;
}

function Vista({
  consulta,
  inflacion,
  plazoFijo,
  uva,
  billeteras,
  fondos,
}: Omit<Props, "fci"> & { fondos: Alternativa[] | null }) {
  const filas = useMemo<Fila[]>(() => {
    if (!consulta) return [];
    const todas = [...plazoFijo.datos, ...uva.datos, ...billeteras.datos, ...(fondos ?? [])];
    return compararTodo(todas, consulta, inflacion, fondos === null);
  }, [consulta, inflacion, plazoFijo.datos, uva.datos, billeteras.datos, fondos]);

  if (!consulta) return null;
  const perdidaPorInflacion = inflacion ? consulta.monto * inflacionDelPeriodo(inflacion.mensual, consulta.dias) : null;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        La opción de mayor ganancia estimada de cada tipo, para {ars(consulta.monto)} a {consulta.dias} días. Cada tipo tiene riesgos y
        liquidez distintos: compará los tres datos, no solo la ganancia.
      </p>

      <Grafico filas={filas} perdidaPorInflacion={perdidaPorInflacion} dias={consulta.dias} />

      <Resumen filas={filas} dias={consulta.dias} />

      <section className="space-y-3" aria-labelledby="que-es-cada-una">
        <h3 id="que-es-cada-una" className="text-base font-semibold">
          Qué es cada opción
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {ORDEN.map((tipo) => {
            const e = EDUCATIVO[tipo];
            return (
              <article key={tipo} className="space-y-2 rounded-xl border border-border bg-secondary/30 p-4 text-xs leading-relaxed">
                <h4 className="text-sm font-semibold">{e.titulo}</h4>
                <p className="text-foreground/85">{e.queEs}</p>
                <p>
                  <span className="font-semibold text-info">Ventajas: </span>
                  <span className="text-foreground/85">{e.ventajas}</span>
                </p>
                <p className="rounded-lg border border-atencion/20 bg-atencion/10 p-2.5">
                  <span className="font-semibold text-atencion">Riesgos: </span>
                  <span className="text-atencion-texto/90">{e.riesgos}</span>
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ---------- Gráfico: ganancia estimada por tipo ----------

const ESPACIO_FIJO = String.fromCharCode(160); // no separable: "$ 19.315" no se parte en dos líneas
const config = { ganancia: { label: "Ganancia estimada", color: "var(--chart-1)" } } satisfies ChartConfig;

function Grafico({ filas, perdidaPorInflacion, dias }: { filas: Fila[]; perdidaPorInflacion: number | null; dias: number }) {
  const angosto = useIsMobile();
  const datos = filas
    .filter((f): f is Fila & { mejor: Cotizacion } => !!f.mejor)
    .map((f) => ({
      tipo: NOMBRE_CORTO[f.tipo],
      ganancia: Math.round(f.mejor.ganancia),
      opcion: f.mejor.alternativa.tipo.startsWith("fci") ? f.mejor.alternativa.producto : f.mejor.alternativa.entidad,
      tna: f.mejor.tna,
      esUva: f.mejor.alternativa.capitalizacion === "uva",
    }));
  if (datos.length < 2) return null; // con una sola barra, la tabla alcanza

  const maximo = Math.max(...datos.map((d) => d.ganancia), perdidaPorInflacion ?? 0);

  return (
    <figure className="space-y-2 rounded-xl border border-border bg-card p-4">
      <figcaption className="space-y-0.5">
        <p className="text-sm font-semibold">Ganancia estimada en {dias} días</p>
        {perdidaPorInflacion !== null && (
          <p className="text-xs text-muted-foreground">
            La línea marca lo que la inflación se come en ese plazo ({ars(perdidaPorInflacion)}): las barras que la pasan le ganan.
          </p>
        )}
      </figcaption>
      <ChartContainer config={config} className="w-full" style={{ height: datos.length * 48 + 56 }}>
        <BarChart data={datos} layout="vertical" margin={{ top: 20, right: angosto ? 72 : 88, left: 0, bottom: 4 }} barCategoryGap={12}>
          <CartesianGrid horizontal={false} strokeOpacity={0.15} />
          <XAxis type="number" hide domain={[0, maximo * 1.05]} />
          <YAxis type="category" dataKey="tipo" tickLine={false} axisLine={false} width={angosto ? 92 : 124} tick={{ fontSize: angosto ? 11 : 12 }} />
          <ChartTooltip
            cursor={{ fillOpacity: 0.08 }}
            content={({ active, payload }) => {
              const d = active ? payload?.[0]?.payload : null;
              if (!d) return null;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold">{d.tipo}</p>
                  <p className="text-muted-foreground">{d.opcion}</p>
                  <p className="mt-1 font-mono">
                    {ars(d.ganancia)} · TNA {d.esUva ? "UVA + " : ""}
                    {tasa(d.tna)}
                  </p>
                </div>
              );
            }}
          />
          {perdidaPorInflacion !== null && (
            <ReferenceLine
              x={perdidaPorInflacion}
              stroke="var(--chart-4)"
              strokeWidth={1.5}
              label={{ value: "Inflación", position: "top", fill: "var(--muted-foreground)", fontSize: 11 }}
            />
          )}
          <Bar dataKey="ganancia" fill="var(--color-ganancia)" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
            <LabelList
              dataKey="ganancia"
              position="right"
              formatter={(v: number) => ars(v).replace(" ", ESPACIO_FIJO)}
              className="fill-foreground"
              fontSize={angosto ? 11 : 12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

// ---------- Tabla resumen ----------

function Opcion({ f }: { f: Fila }) {
  if (f.cargando) return <span className="text-xs text-muted-foreground">Cargando fondos…</span>;
  if (!f.mejor) return <span className="text-xs text-muted-foreground">No disponible: {f.motivo}</span>;
  const a = f.mejor.alternativa;
  return (
    <div className="space-y-0.5">
      <p className="font-semibold leading-snug">{a.tipo.startsWith("fci") ? a.producto : a.entidad}</p>
      {a.tipo.startsWith("fci") && <p className="text-xs text-muted-foreground">{a.entidad}</p>}
      {f.mejor.notas.map((n) => (
        <p key={n} className="text-legal leading-snug text-atencion-texto/80">
          {n}
        </p>
      ))}
    </div>
  );
}

const tnaTexto = (c: Cotizacion) => (c.alternativa.capitalizacion === "uva" ? `UVA + ${tasa(c.tna)}` : tasa(c.tna));

function Resumen({ filas, dias }: { filas: Fila[]; dias: number }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tipo</TableHead>
              <TableHead>Opción de mayor ganancia</TableHead>
              <TableHead className="text-right">TNA</TableHead>
              <TableHead className="text-right">Ganancia en {dias} días</TableHead>
              <TableHead className="text-center">Tasa real</TableHead>
              <TableHead className="w-32">
                <span className="sr-only">Link</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.tipo} className="align-top">
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{NOMBRE_CORTO[f.tipo]}</p>
                  {f.mejor && (
                    <div className="mt-1.5 flex flex-col items-start gap-1">
                      <BadgeLiquidez liquidez={f.mejor.alternativa.liquidez} />
                      <BadgeRiesgo riesgo={f.mejor.alternativa.riesgo} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="min-w-[12rem] max-w-[16rem] whitespace-normal" colSpan={f.mejor ? 1 : 5}>
                  <Opcion f={f} />
                </TableCell>
                {f.mejor && (
                  <>
                    <TableCell className="text-right font-mono font-semibold">{tnaTexto(f.mejor)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-cifra">{ars(f.mejor.ganancia)}</TableCell>
                    <TableCell className="text-center">
                      <BadgeTasaReal real={f.mejor.tasaRealMensual} />
                    </TableCell>
                    <TableCell>
                      <BotonEntidad alternativa={f.mejor.alternativa} />
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {filas.map((f) => (
          <li key={f.tipo} className="space-y-2 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-enlace">{NOMBRE_CORTO[f.tipo]}</p>
            <Opcion f={f} />
            {f.mejor && (
              <>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-legal text-muted-foreground">TNA</dt>
                    <dd className="font-mono font-semibold">{tnaTexto(f.mejor)}</dd>
                  </div>
                  <div>
                    <dt className="text-legal text-muted-foreground">Ganancia en {dias} días</dt>
                    <dd className="font-mono font-semibold text-cifra">{ars(f.mejor.ganancia)}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-1.5">
                  <BadgeTasaReal real={f.mejor.tasaRealMensual} />
                  <BadgeLiquidez liquidez={f.mejor.alternativa.liquidez} />
                  <BadgeRiesgo riesgo={f.mejor.alternativa.riesgo} />
                </div>
                <BotonEntidad alternativa={f.mejor.alternativa} />
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-legal leading-snug text-muted-foreground/80">
        UVA: estimado con la última inflación. Fondos: rendimiento de los últimos 30 días, que puede no repetirse. Tasa real:{" "}
        rendimiento mensual comparado con la última inflación mensual.
      </p>
    </>
  );
}

