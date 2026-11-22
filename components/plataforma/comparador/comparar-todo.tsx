"use client";

import { Suspense, use, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inflacionDelPeriodo } from "@/lib/plataforma/finanzas";
import { ars } from "@/lib/plataforma/formato";
import { compararTodo, type FilaComparacion as Fila } from "@/lib/plataforma/comparador/cotizar";
import type { Alternativa, Consulta, Cotizacion, Inflacion, TipoAlternativa } from "@/lib/plataforma/comparador/tipos";
import { EDUCATIVO, plazoEnPalabras } from "@/lib/plataforma/comparador/textos";
import { BadgeLiquidez, BadgeRiesgo, BadgeTasaReal, BotonEntidad, LeyendaTasas, tasa } from "./insignias";
import type { Fuente } from "./pestanas";

/**
 * Solo para el eje del gráfico, que no parte el texto en renglones: versión corta y sin siglas de
 * `EDUCATIVO[tipo].titulo`. En la tabla y en el tooltip va el título completo.
 */
const NOMBRE_EJE: Record<TipoAlternativa, string> = {
  "plazo-fijo": "Plazo fijo",
  uva: "Sigue a la inflación",
  billetera: "Billetera",
  "fci-mm": "Fondo corto plazo",
  "fci-rf": "Fondo Estado y empresas",
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
        La opción con más ganancia estimada de cada tipo, para {ars(consulta.monto)} a {plazoEnPalabras(consulta.dias)}. Cada tipo tiene un
        riesgo distinto y un momento distinto para sacar la plata: mirá las tres cosas, no solo la ganancia.
      </p>

      <Grafico filas={filas} perdidaPorInflacion={perdidaPorInflacion} dias={consulta.dias} />

      <Resumen filas={filas} dias={consulta.dias} />

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
      tipo: NOMBRE_EJE[f.tipo],
      titulo: EDUCATIVO[f.tipo].titulo,
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
        <p className="text-sm font-semibold">Ganancia estimada en {plazoEnPalabras(dias)}</p>
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
                  <p className="font-semibold">{d.titulo}</p>
                  <p className="text-muted-foreground">{d.opcion}</p>
                  <p className="mt-1">
                    {ars(d.ganancia)} · Tasa anual: {d.esUva ? "Inflación + " : ""}
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
  if (!f.mejor) return <span className="text-xs text-muted-foreground">{f.motivoSimple ?? `No disponible: ${f.motivo}`}</span>;
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

const tnaTexto = (c: Cotizacion) => (c.alternativa.capitalizacion === "uva" ? `Inflación + ${tasa(c.tna)}` : tasa(c.tna));

function Resumen({ filas, dias }: { filas: Fila[]; dias: number }) {
  return (
    <>
      <LeyendaTasas conMensual={false} conUva={filas.some((f) => f.mejor?.alternativa.capitalizacion === "uva")} />
      <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tipo</TableHead>
              <TableHead>La que más paga</TableHead>
              <TableHead className="text-right">Tasa anual (TNA)</TableHead>
              <TableHead className="text-right">Ganancia en {plazoEnPalabras(dias)}</TableHead>
              <TableHead className="text-center">¿Le gana a la inflación?</TableHead>
              <TableHead className="w-32">
                <span className="sr-only">Link</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.tipo} className="align-top">
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{EDUCATIVO[f.tipo].titulo}</p>
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
                    <TableCell className="text-right font-semibold">{tnaTexto(f.mejor)}</TableCell>
                    <TableCell className="text-right font-semibold text-cifra">{ars(f.mejor.ganancia)}</TableCell>
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
            <p className="text-base font-extrabold">{EDUCATIVO[f.tipo].titulo}</p>
            <Opcion f={f} />
            {f.mejor && (
              <>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-legal text-muted-foreground">Tasa anual (TNA)</dt>
                    <dd className="font-semibold">{tnaTexto(f.mejor)}</dd>
                  </div>
                  <div>
                    <dt className="text-legal text-muted-foreground">Ganancia en {plazoEnPalabras(dias)}</dt>
                    <dd className="font-semibold text-cifra">{ars(f.mejor.ganancia)}</dd>
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
        Plazo fijo que sigue a la inflación: calculado con la inflación del último mes. Fondos: lo que pagaron el último mes, que puede no
        repetirse. «Le gana a la inflación»: comparamos lo que paga en un mes con cuánto subieron los precios el último mes.
      </p>
    </>
  );
}

