"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DatosComparador } from "@/lib/comparador/fuentes";
import { validarMonto } from "@/lib/plataforma/finanzas";
import { ars, mesAnio, pct, usd } from "@/lib/plataforma/formato";
import { usdAArs, type DolarMep } from "@/lib/plataforma/comparador/normalizar";
import type { Consulta } from "@/lib/plataforma/comparador/tipos";
import { usePlan } from "@/lib/plataforma/store";
import { Disclaimer } from "./avisos";
import { TabCompararTodo } from "./comparar-todo";
import { TabBilleteras, TabFci, TabPlazoFijo, TabUva, type Fuente } from "./pestanas";

export const PLAZOS = [30, 60, 90, 180] as const;
const MONTO_EJEMPLO = 1_000_000;

export const TABS = ["todo", "plazo-fijo", "uva", "billeteras", "fci"] as const;
export type Tab = (typeof TABS)[number];
const ETIQUETA_TAB: Record<Tab, string> = {
  todo: "Comparar todo",
  "plazo-fijo": "Plazo fijo",
  uva: "UVA",
  billeteras: "Billeteras",
  fci: "Fondos",
};

const montoFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const formatearMonto = (n: number) => montoFmt.format(n);

// De dónde salió el monto precargado (para explicarlo debajo del campo).
type Origen = "url" | "cartera" | "sin-mep" | "plan" | "ejemplo" | "usuario";

interface Props {
  datos: Omit<DatosComparador, "fci">;
  /** Los FCI llegan después (descarga pesada): se muestran con Suspense en sus pestañas. */
  fci: Promise<Fuente>;
  /** ?monto= en ARS. */
  montoUrl?: string;
  /** ?usd= monto de una parte de la cartera ("Ver dónde conviene"); se pasa a pesos al MEP. */
  usdUrl?: string;
  tabUrl?: string;
}

function montoInicial(montoUrl: string | undefined, usdUrl: string | undefined, mep: DolarMep | null): { monto: number; origen: Origen } {
  const ars = validarMonto(montoUrl ?? "");
  if (ars.ok) return { monto: ars.monto, origen: "url" };
  const usd = validarMonto(usdUrl ?? "");
  if (usd.ok) return mep ? { monto: usdAArs(usd.monto, mep), origen: "cartera" } : { monto: MONTO_EJEMPLO, origen: "sin-mep" };
  return { monto: MONTO_EJEMPLO, origen: "ejemplo" };
}

export function Comparador({ datos, fci, montoUrl, usdUrl, tabUrl }: Props) {
  const { plan } = usePlan();
  const mep = datos.dolarMep.datos;

  const [inicial] = useState(() => montoInicial(montoUrl, usdUrl, mep));
  const [texto, setTexto] = useState(() => formatearMonto(inicial.monto));
  const [origen, setOrigen] = useState<Origen>(inicial.origen);
  const [dias, setDias] = useState<number>(30);
  const [esCliente, setEsCliente] = useState(false);
  const [tab, setTab] = useState<Tab>(() => (TABS as readonly string[]).includes(tabUrl ?? "") ? (tabUrl as Tab) : "todo");
  const usdDeCartera = validarMonto(usdUrl ?? "");

  // Si no vino un monto en la URL, precargamos el capital de la cartera (USD → ARS al MEP).
  const capitalUsd = plan?.respuestas.capitalInicial ?? 0;
  useEffect(() => {
    if (origen !== "ejemplo" || !mep || capitalUsd <= 0) return;
    setTexto(formatearMonto(usdAArs(capitalUsd, mep)));
    setOrigen("plan");
  }, [origen, mep, capitalUsd]);

  const validado = validarMonto(texto);
  const monto = validado.ok ? validado.monto : null;
  const consulta = useMemo<Consulta | null>(() => (monto !== null ? { monto, dias, esCliente } : null), [monto, dias, esCliente]);
  const inflacion = datos.inflacion.datos;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Comparador</p>
        <h1 className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
          Alternativas en pesos
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ranking de plazos fijos, billeteras y fondos según cuánto ganarías con tu monto y plazo, comparado contra la inflación.
        </p>
      </header>

      <Disclaimer />

      <Card className="border-border bg-card/70">
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto a invertir</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="monto"
                  inputMode="decimal"
                  autoComplete="off"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    setOrigen("usuario");
                  }}
                  onBlur={() => validado.ok && setTexto(formatearMonto(validado.monto))}
                  aria-invalid={!validado.ok}
                  aria-describedby="monto-ayuda"
                  className="pl-7 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plazo">Plazo</Label>
              <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
                <SelectTrigger id="plazo" className="w-full">
                  <SelectValue>{dias} días</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLAZOS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} días
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cliente">¿Ya sos cliente del banco?</Label>
              <div className="flex h-9 items-center gap-3">
                <Switch id="cliente" checked={esCliente} onCheckedChange={setEsCliente} />
                <span className="text-sm text-muted-foreground">{esCliente ? "Soy cliente" : "No soy cliente"}</span>
              </div>
            </div>
          </div>

          <div id="monto-ayuda" className="space-y-1 text-xs leading-relaxed">
            {!validado.ok ? (
              <p className="text-red-300" role="alert">
                {validado.error}
              </p>
            ) : origen === "plan" && mep ? (
              <p className="text-muted-foreground">
                Precargamos el capital de tu cartera ({usd(capitalUsd)}) al dólar MEP de compra ({ars(mep.compra)}). Podés cambiarlo.
              </p>
            ) : origen === "cartera" && mep && usdDeCartera.ok ? (
              <p className="text-muted-foreground">
                Precargamos esa parte de tu cartera ({usd(usdDeCartera.monto)}) al dólar MEP de compra ({ars(mep.compra)}). Podés cambiarlo.
              </p>
            ) : origen === "sin-mep" ? (
              <p className="text-amber-200/90">
                No pudimos obtener el dólar MEP para pasar a pesos el monto de tu cartera. Escribí el monto en pesos.
              </p>
            ) : origen === "url" ? (
              <p className="text-muted-foreground">Precargamos el monto que venía en el link. Podés cambiarlo.</p>
            ) : origen === "ejemplo" ? (
              <p className="text-muted-foreground">Es un monto de ejemplo: escribí el tuyo.</p>
            ) : null}
            <p className="text-muted-foreground">
              {inflacion
                ? `Inflación de referencia: ${pct(inflacion.mensual * 100)} mensual (${mesAnio(inflacion.fecha)}, INDEC). La tasa real compara lo que rinde un mes contra ese dato.`
                : "Sin dato de inflación por ahora: no podemos calcular la tasa real."}
            </p>
            {plan && (
              <p className="text-muted-foreground">
                Tu perfil es <span className="font-medium text-foreground">{plan.perfil.perfil.toLowerCase()}</span>: compará el nivel de
                riesgo de cada opción con lo que estás dispuesto a tolerar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="flex-none">
              {ETIQUETA_TAB[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todo">
          <TabCompararTodo
            plazoFijo={datos.plazoFijo}
            uva={datos.uva}
            billeteras={datos.billeteras}
            fci={fci}
            consulta={consulta}
            inflacion={inflacion}
          />
        </TabsContent>
        <TabsContent value="plazo-fijo">
          <TabPlazoFijo plazoFijo={datos.plazoFijo} consulta={consulta} inflacion={inflacion} />
        </TabsContent>
        <TabsContent value="uva">
          <TabUva uva={datos.uva} plazoFijo={datos.plazoFijo} consulta={consulta} inflacion={inflacion} />
        </TabsContent>
        <TabsContent value="billeteras">
          <TabBilleteras billeteras={datos.billeteras} fci={fci} consulta={consulta} inflacion={inflacion} />
        </TabsContent>
        <TabsContent value="fci">
          <TabFci fci={fci} consulta={consulta} inflacion={inflacion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
