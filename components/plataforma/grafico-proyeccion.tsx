"use client";

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usd } from "@/lib/plataforma/formato";
import type { PuntoProyeccion } from "@/lib/plataforma/tipos";

const config = {
  aportado: { label: "Lo que aportás", color: "var(--chart-4)" },
  bajo: { label: "Si va mal", color: "var(--chart-1)" },
  alto: { label: "Si va bien", color: "var(--chart-2)" },
} satisfies ChartConfig;

// 18000 -> "18 mil" (cabe en una línea; la unidad, USD, se aclara en el texto de la tarjeta)
const abreviar = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} mil` : String(n);

export function GraficoProyeccion({ datos }: { datos: PuntoProyeccion[] }) {
  // "piso" repite el escenario bajo para la zona tramada: una serie aparte evita claves repetidas en leyenda y tooltip.
  const conPiso = datos.map((d) => ({ ...d, piso: d.bajo }));
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <ComposedChart data={conPiso} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        {/* Trama de "lo que puede salir mal": la zona hasta el escenario malo */}
        <defs>
          <pattern id="trama-mal" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="var(--atencion)" fillOpacity="0.04" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--atencion)" strokeOpacity="0.22" strokeWidth="3" />
          </pattern>
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.15} />
        <XAxis dataKey="anio" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tickFormatter={(v) => `Año ${v}`} />
        <YAxis tickLine={false} axisLine={false} width={58} domain={[0, "auto"]} tickFormatter={(v) => abreviar(Number(v))} />
        <ChartTooltip
          content={({ active, payload, label }) => (
            <ChartTooltipContent
              active={active}
              label={label}
              payload={payload?.filter((p) => p.dataKey !== "piso")}
              labelFormatter={(_, items) => `Año ${items?.[0]?.payload?.anio ?? ""}`}
              formatter={(valor, nombre) => (
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{config[nombre as keyof typeof config]?.label ?? nombre}</span>
                  <span className="font-mono font-medium">{usd(Number(valor))}</span>
                </span>
              )}
            />
          )}
        />
        {/* Leyenda visible: en celular el tooltip requiere tocar, así que las líneas no pueden depender solo de él */}
        <ChartLegend verticalAlign="bottom" content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />} />
        <Area dataKey="piso" type="monotone" stroke="none" fill="url(#trama-mal)" fillOpacity={1} legendType="none" tooltipType="none" isAnimationActive={false} />
        <Line dataKey="aportado" type="monotone" stroke="var(--color-aportado)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        <Line dataKey="bajo" type="monotone" stroke="var(--color-bajo)" strokeWidth={2.5} dot={false} />
        <Line dataKey="alto" type="monotone" stroke="var(--color-alto)" strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ChartContainer>
  );
}
