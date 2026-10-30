"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
  bajo: { label: "Escenario bajo", color: "var(--chart-1)" },
  alto: { label: "Escenario alto", color: "var(--chart-2)" },
} satisfies ChartConfig;

// 18000 -> "18 mil" (cabe en una línea; la unidad, USD, se aclara en el texto de la tarjeta)
const abreviar = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} mil` : String(n);

export function GraficoProyeccion({ datos }: { datos: PuntoProyeccion[] }) {
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.15} />
        <XAxis dataKey="anio" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tickFormatter={(v) => `Año ${v}`} />
        <YAxis tickLine={false} axisLine={false} width={58} domain={[0, "auto"]} tickFormatter={(v) => abreviar(Number(v))} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, items) => `Año ${items?.[0]?.payload?.anio ?? ""}`}
              formatter={(valor, nombre) => (
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{config[nombre as keyof typeof config]?.label ?? nombre}</span>
                  <span className="font-mono font-medium">{usd(Number(valor))}</span>
                </span>
              )}
            />
          }
        />
        {/* Leyenda visible: en celular el tooltip requiere tocar, así que las líneas no pueden depender solo de él */}
        <ChartLegend verticalAlign="bottom" content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />} />
        <Line dataKey="aportado" type="monotone" stroke="var(--color-aportado)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        <Line dataKey="bajo" type="monotone" stroke="var(--color-bajo)" strokeWidth={2.5} dot={false} />
        <Line dataKey="alto" type="monotone" stroke="var(--color-alto)" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
