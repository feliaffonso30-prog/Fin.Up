"use client";

// Gráficos de "Lo que tenés". Simples a propósito: un solo eje, pocas series, la cifra
// escrita al lado (no solo el color) y las bajas en lavanda, nunca en rojo (DESIGN.md).

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { COLOR_CATEGORIA, Punto } from "@/components/plataforma/primitivas";
import { useIsMobile } from "@/hooks/use-mobile";
import { NOMBRE_CORTO_CATEGORIA } from "@/lib/plataforma/cartera-real/activos";
import type { PuntoEvolucion } from "@/lib/plataforma/cartera-real/evolucion";
import type { TenenciaValuada } from "@/lib/plataforma/cartera-real/tipos";
import { ars, fecha, usd } from "@/lib/plataforma/formato";
import type { Categoria } from "@/lib/plataforma/tipos";
import { cn } from "@/lib/utils";

export type UnidadMonto = "ars" | "usd";

const ESPACIO_FIJO = String.fromCharCode(160);
const plata = (n: number, u: UnidadMonto) => (u === "ars" ? ars(n) : usd(n)).replace(" ", ESPACIO_FIJO);

/** 1.250.000 → "1,3 M"; 308.000 → "308 mil". Para los ejes. */
export function abreviar(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`;
  if (a >= 1000) return `${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 0 })} mil`;
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

const diaMes = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;

// ---------- Cómo vino tu plata ----------

const configEvolucion = {
  valor: { label: "Lo que vale", color: "var(--chart-2)" },
  costo: { label: "Lo que pusiste", color: "var(--chart-4)" },
} satisfies ChartConfig;

type Vista = "compra" | "finup";

export function GraficoEvolucion({
  historica,
  fotos,
  unidad,
}: {
  historica: { puntos: PuntoEvolucion[]; cargando: boolean; error: boolean };
  fotos: PuntoEvolucion[];
  unidad: UnidadMonto;
}) {
  const [vista, setVista] = useState<Vista>("compra");
  const puntos = vista === "compra" ? historica.puntos : fotos;
  const datos = puntos.map((p) => ({
    fecha: p.fecha,
    valor: Math.round(unidad === "ars" ? p.valorArs : p.valorUsd),
    costo: Math.round(unidad === "ars" ? p.costoArs : p.costoUsd),
  }));

  let vacio: string | null = null;
  if (vista === "compra" && historica.cargando) vacio = "Buscando los precios de cada día…";
  else if (vista === "compra" && historica.error) vacio = "No pudimos traer los precios de días anteriores. Probá en un rato.";
  else if (datos.length < 2)
    vacio =
      vista === "compra"
        ? "Todavía no hay días para mostrar: lo anotaste hoy."
        : "Desde hoy guardamos una foto por día de lo que tenés. En unos días vas a ver cómo viene.";

  return (
    <figure className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption className="text-lg font-extrabold">Cómo fue cambiando lo que tenés</figcaption>
        <div role="group" aria-label="Desde cuándo" className="vidrio inline-flex rounded-full p-1">
          {(
            [
              ["compra", "Desde que compraste"],
              ["finup", "Desde que usás FinUp"],
            ] as const
          ).map(([v, etiqueta]) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => setVista(v)}
              className={cn("min-h-11 rounded-full px-3.5 text-sm", vista === v ? "bg-white/20 font-extrabold" : "font-medium text-muted-foreground hover:text-foreground")}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>
      {vacio ? (
        <p className="vidrio flex h-40 items-center justify-center rounded-lg px-6 text-center text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <>
          <ChartContainer config={configEvolucion} className="h-56 w-full md:h-72">
            <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="fecha" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={diaMes} />
              <YAxis tickLine={false} axisLine={false} width={60} domain={["auto", "auto"]} tickFormatter={(v) => abreviar(Number(v))} />
              <ChartTooltip
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    payload={payload}
                    label={label}
                    labelFormatter={(_, items) => fecha(String(items?.[0]?.payload?.fecha ?? ""))}
                    formatter={(valor, nombre) => (
                      <span className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{configEvolucion[nombre as keyof typeof configEvolucion]?.label ?? nombre}</span>
                        <span className="font-medium">{plata(Number(valor), unidad)}</span>
                      </span>
                    )}
                  />
                )}
              />
              <ChartLegend verticalAlign="bottom" content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />} />
              <Line dataKey="costo" type="stepAfter" stroke="var(--color-costo)" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              <Line dataKey="valor" type="monotone" stroke="var(--color-valor)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
          <p className="text-sm text-muted-foreground">
            {vista === "compra"
              ? "Con el precio de cierre de cada día. Lo que cargaste a mano queda igual hasta que lo actualizás."
              : "Lo que viste en FinUp cada día que entraste."}
          </p>
        </>
      )}
    </figure>
  );
}

// ---------- Qué subió y qué bajó ----------

const MAX_FILAS = 8;
const configGanancias = { resultado: { label: "Ganancia o pérdida", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Cuánto ganó o perdió cada inversión desde que la compró, de la que más subió a la que más bajó. */
export function GraficoGanancias({ tenencias, unidad }: { tenencias: TenenciaValuada[]; unidad: UnidadMonto }) {
  const angosto = useIsMobile();
  const filas = tenencias
    .filter((t) => t.valorUsd !== null)
    .map((t) => {
      const valor = (unidad === "ars" ? t.valorArs : t.valorUsd) ?? 0;
      const costo = unidad === "ars" ? t.costoArs : t.costoUsd;
      return { nombre: t.tenencia.nombre, resultado: Math.round(valor - costo) };
    })
    .sort((a, b) => b.resultado - a.resultado);
  if (filas.length < 2) return null; // con una sola, la cifra de arriba ya lo dice

  let datos = filas;
  if (filas.length > MAX_FILAS) {
    const resto = filas.slice(MAX_FILAS - 1);
    datos = [...filas.slice(0, MAX_FILAS - 1), { nombre: `Otras ${resto.length}`, resultado: resto.reduce((s, f) => s + f.resultado, 0) }];
  }
  const maximo = Math.max(1, ...datos.map((d) => Math.abs(d.resultado)));
  const corto = (s: string) => (s.length > (angosto ? 14 : 22) ? `${s.slice(0, angosto ? 13 : 21)}…` : s);
  const signo = (n: number) => (Math.round(n) === 0 ? plata(0, unidad) : `${n > 0 ? "+" : "−"}${plata(Math.abs(n), unidad)}`);

  return (
    <figure className="space-y-2">
      <figcaption className="space-y-0.5">
        <p className="text-lg font-extrabold">Qué subió y qué bajó</p>
        <p className="text-sm text-muted-foreground">Cuánto ganó o perdió cada una desde que la compraste. A la derecha lo que subió, a la izquierda lo que bajó.</p>
      </figcaption>
      <ChartContainer config={configGanancias} className="w-full" style={{ height: datos.length * 40 + 24 }}>
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: angosto ? 76 : 96, left: angosto ? 76 : 96, bottom: 4 }} barCategoryGap={10}>
          <XAxis type="number" hide domain={[-maximo * 1.05, maximo * 1.05]} />
          <YAxis type="category" dataKey="nombre" hide />
          <ReferenceLine x={0} stroke="var(--chart-4)" strokeOpacity={0.6} />
          <ChartTooltip
            cursor={{ fillOpacity: 0.08 }}
            content={({ active, payload }) => {
              const d = active ? payload?.[0]?.payload : null;
              if (!d) return null;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold">{d.nombre}</p>
                  <p>{d.resultado >= 0 ? "Subió" : "Bajó"} {signo(d.resultado)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="resultado" radius={4} maxBarSize={22} isAnimationActive={false}>
            {datos.map((d) => (
              // Subas en el azul de la marca, bajas en lavanda (nunca rojo). La dirección y el signo lo dicen igual.
              <Cell key={d.nombre} fill={d.resultado >= 0 ? "var(--chart-1)" : "var(--atencion)"} fillOpacity={d.resultado >= 0 ? 1 : 0.7} />
            ))}
            <LabelList dataKey="nombre" content={(p) => <EtiquetaNombre {...(p as EtiquetaProps)} texto={corto(String((p as EtiquetaProps).value ?? ""))} />} />
            <LabelList dataKey="resultado" content={(p) => <EtiquetaMonto {...(p as EtiquetaProps)} texto={signo(Number((p as EtiquetaProps).value ?? 0))} fontSize={angosto ? 11 : 12} />} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

type EtiquetaProps = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: number | string };

/** El nombre va siempre del lado contrario a la barra, pegado al cero. */
function EtiquetaNombre({ x = 0, y = 0, width = 0, height = 0, texto }: EtiquetaProps & { texto: string }) {
  const [nx, ny, nw, nh] = [Number(x), Number(y), Number(width), Number(height)];
  const positiva = nw >= 0;
  // Recharts dibuja cada barra desde el cero: `x` es siempre el cero y `width` es negativo si bajó.
  const cero = nx;
  return (
    <text x={positiva ? cero - 8 : cero + 8} y={ny + nh / 2} dominantBaseline="central" textAnchor={positiva ? "end" : "start"} className="fill-muted-foreground" fontSize={12}>
      {texto}
    </text>
  );
}

/** La cifra con signo, en la punta de la barra. */
function EtiquetaMonto({ x = 0, y = 0, width = 0, height = 0, texto, fontSize }: EtiquetaProps & { texto: string; fontSize: number }) {
  const [nx, ny, nw, nh] = [Number(x), Number(y), Number(width), Number(height)];
  const positiva = nw >= 0;
  const punta = nx + nw;
  return (
    <text x={positiva ? punta + 6 : punta - 6} y={ny + nh / 2} dominantBaseline="central" textAnchor={positiva ? "start" : "end"} className="fill-foreground" fontSize={fontSize} fontWeight={700}>
      {texto}
    </text>
  );
}

// ---------- Tu reparto contra tu plan ----------

const ORDEN: Categoria[] = ["fija", "variable", "dividendos", "liquidez", "alternativo"];

/** Una fila por parte del plan: dos barras finas (tu plan y lo que tenés) con los porcentajes escritos. */
export function GraficoReparto({ plan, tuyo, perfil }: { plan: Record<Categoria, number>; tuyo: Record<Categoria, number>; perfil: string }) {
  const partes = ORDEN.filter((c) => plan[c] > 0 || tuyo[c] > 0);
  const maximo = Math.max(1, ...partes.flatMap((c) => [plan[c], tuyo[c]]));
  return (
    <figure className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Referencias">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-chart-4" aria-hidden />
          Tu plan (perfil {perfil.toLowerCase()})
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-foreground" aria-hidden />
          Lo que tenés (con el color de cada parte)
        </li>
      </ul>
      <ul className="space-y-4">
        {partes.map((c) => (
          <li key={c} className="space-y-1.5" aria-label={`${NOMBRE_CORTO_CATEGORIA[c]}: tu plan ${plan[c]}%, lo que tenés ${tuyo[c]}%`}>
            <p className="flex items-center gap-2 text-sm font-bold">
              <Punto className={COLOR_CATEGORIA[c]} />
              <span className="first-letter:uppercase">{NOMBRE_CORTO_CATEGORIA[c]}</span>
            </p>
            <FilaBarra pct={plan[c]} maximo={maximo} clase="bg-chart-4" etiqueta="Plan" />
            <FilaBarra pct={tuyo[c]} maximo={maximo} clase={COLOR_CATEGORIA[c]} etiqueta="Vos" />
          </li>
        ))}
      </ul>
    </figure>
  );
}

function FilaBarra({ pct, maximo, clase, etiqueta }: { pct: number; maximo: number; clase: string; etiqueta: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="w-9 shrink-0 text-xs text-muted-foreground">{etiqueta}</span>
      <div className="h-2.5 flex-1">
        {pct > 0 && <div className={cn("h-full min-w-1 rounded-[4px]", clase)} style={{ width: `${(pct / maximo) * 100}%` }} />}
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-bold">{pct}%</span>
    </div>
  );
}
