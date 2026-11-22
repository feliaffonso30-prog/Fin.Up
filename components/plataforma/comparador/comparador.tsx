"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ListFilter } from "lucide-react";
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
import { RespuestaPorTipo } from "./respuesta";
import { EncabezadoPagina } from "@/components/plataforma/primitivas";

export const PLAZOS = [30, 60, 90, 180] as const;
const MONTO_EJEMPLO = 1_000_000;

export const TABS = ["todo", "plazo-fijo", "uva", "billeteras", "fci"] as const;
export type Tab = (typeof TABS)[number];
const ETIQUETA_TAB: Record<Tab, string> = {
  todo: "Todo junto",
  "plazo-fijo": "Plazo fijo",
  uva: "Plazo fijo UVA",
  billeteras: "Billeteras",
  fci: "Fondos",
};

// El plazo dicho como lo piensa la persona: cuándo va a necesitar la plata.
const ETIQUETA_PLAZO: Record<(typeof PLAZOS)[number], string> = {
  30: "En 1 mes",
  60: "En 2 meses",
  90: "En 3 meses",
  180: "En 6 meses",
};

const montoFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const formatearMonto = (n: number) => montoFmt.format(n);

// De dónde salió el monto precargado (para explicarlo debajo del campo).
type Origen = "url" | "cartera" | "sin-mep" | "plan" | "ejemplo" | "usuario";

interface Props {
  datos: Omit<DatosComparador, "fci">;
  /** Los FCI llegan después (descarga pesada): se muestran con Suspense. */
  fci: Promise<Fuente>;
  /** ?monto= en ARS. */
  montoUrl?: string;
  /** ?usd= monto de una parte de la cartera ("Ver dónde conviene"); se pasa a pesos al MEP. */
  usdUrl?: string;
  tabUrl?: string;
  /** ?dias= el plazo elegido, para no perderlo al ir y volver del detalle. */
  diasUrl?: string;
  /** "resumen": la respuesta corta. "detalle": tasas y todas las entidades, en su propia pantalla. */
  vista?: "resumen" | "detalle";
}

function montoInicial(montoUrl: string | undefined, usdUrl: string | undefined, mep: DolarMep | null): { monto: number; origen: Origen } {
  const ars = validarMonto(montoUrl ?? "");
  if (ars.ok) return { monto: ars.monto, origen: "url" };
  const usd = validarMonto(usdUrl ?? "");
  if (usd.ok) return mep ? { monto: usdAArs(usd.monto, mep), origen: "cartera" } : { monto: MONTO_EJEMPLO, origen: "sin-mep" };
  return { monto: MONTO_EJEMPLO, origen: "ejemplo" };
}

export function Comparador({ datos, fci, montoUrl, usdUrl, tabUrl, diasUrl, vista = "resumen" }: Props) {
  const { plan } = usePlan();
  const mep = datos.dolarMep.datos;

  const [inicial] = useState(() => montoInicial(montoUrl, usdUrl, mep));
  const [texto, setTexto] = useState(() => formatearMonto(inicial.monto));
  const [origen, setOrigen] = useState<Origen>(inicial.origen);
  const [dias, setDias] = useState<number>(() => ((PLAZOS as readonly number[]).includes(Number(diasUrl)) ? Number(diasUrl) : 30));
  const [esCliente, setEsCliente] = useState(false);
  const [tab, setTab] = useState<Tab>(() => ((TABS as readonly string[]).includes(tabUrl ?? "") ? (tabUrl as Tab) : "todo"));
  const usdDeCartera = validarMonto(usdUrl ?? "");

  // Si no vino un monto en la URL, precargamos solo la parte de liquidez del plan (USD → ARS al MEP):
  // es la que tiene sentido dejar en pesos. Precargar todo el capital se leía como "poné todo acá".
  const liquidezUsd = plan?.posiciones.find((p) => p.categoria === "liquidez")?.montoInicial ?? 0;
  useEffect(() => {
    if (origen !== "ejemplo" || !mep || liquidezUsd <= 0) return;
    setTexto(formatearMonto(usdAArs(liquidezUsd, mep)));
    setOrigen("plan");
  }, [origen, mep, liquidezUsd]);

  const validado = validarMonto(texto);
  const monto = validado.ok ? validado.monto : null;
  const consulta = useMemo<Consulta | null>(() => (monto !== null ? { monto, dias, esCliente } : null), [monto, dias, esCliente]);
  const inflacion = datos.inflacion.datos;
  const enDetalle = vista === "detalle";
  // El monto y el plazo viajan en el link, para que el resumen y el detalle muestren lo mismo.
  const parametros = new URLSearchParams({ ...(monto !== null ? { monto: String(monto) } : {}), dias: String(dias) }).toString();
  const fraseDelPerfil = plan && ` Tu perfil es ${plan.perfil.perfil.toLowerCase()}: compará el riesgo de cada opción con el que elegiste en tu cuestionario.`;
  // En el detalle, el dato con su número y su fuente: es la capa de los números.
  const notaInflacionDetalle = (
    <div className="space-y-2">
      <p className="text-sm leading-snug text-muted-foreground">
        {inflacion ? `Comparamos contra la última inflación mensual: ${pct(inflacion.mensual * 100)} (${mesAnio(inflacion.fecha)}, INDEC).` : "Sin dato de inflación por ahora: no podemos decir si le gana."}
        {fraseDelPerfil}
      </p>
      <Disclaimer />
    </div>
  );
  // En el resumen, la idea en palabras; los números, a un toque en "Cómo calculamos esto".
  const vieneDelPlan = (origen === "plan" || (origen === "cartera" && usdDeCartera.ok)) && mep;
  const usdDelPlan = origen === "plan" ? liquidezUsd : usdDeCartera.ok ? usdDeCartera.monto : 0;
  const notaInflacionResumen = (
    <div className="space-y-3">
      <p className="text-sm leading-snug text-muted-foreground">
        {inflacion
          ? "«Le gana a la inflación» quiere decir que, al terminar, tu plata alcanza para comprar más cosas que hoy."
          : "Sin dato de inflación por ahora: no podemos decir si le gana."}
        {fraseDelPerfil}
      </p>
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Cómo calculamos esto
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <ul className="list-disc space-y-2 pb-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {inflacion && (
            <li>
              Inflación: usamos la última que midió el INDEC (el organismo oficial que mide los precios): {pct(inflacion.mensual * 100)} en {mesAnio(inflacion.fecha)}.
            </li>
          )}
          <li>En el plazo fijo, la cifra sale de lo que paga hoy el banco. Lo pactás al empezar y no cambia.</li>
          <li>En el plazo fijo que sigue a la inflación, suponemos que la inflación de los próximos meses es igual a la última.</li>
          <li>En billeteras y fondos, suponemos que siguen pagando lo mismo durante todo el plazo. Puede cambiar cualquier día.</li>
          {vieneDelPlan && mep && (
            <li>
              El monto es {usd(usdDelPlan)} de tu plan, pasados a pesos con el dólar MEP (el que se compra legalmente con pesos desde un banco o una app de inversión) a {ars(mep.compra)}.
            </li>
          )}
          <li>Las tasas de cada banco, billetera y fondo están en «Ver todos los bancos, billeteras y fondos».</li>
        </ul>
      </details>
      <Disclaimer />
    </div>
  );

  return (
    <div className="space-y-8">
      {enDetalle ? (
        <>
          <Link href={`/comparador?${parametros}`} className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver a Tus pesos
          </Link>
          <EncabezadoPagina titulo="Todos los bancos, billeteras y fondos">Cada opción con sus tasas y sus números, para el monto y el plazo que elijas.</EncabezadoPagina>
        </>
      ) : (
        <EncabezadoPagina titulo="¿Dónde dejar tus pesos?">Elegí cuánta plata y para cuándo. Te mostramos cuánto rendiría y si le gana a la inflación.</EncabezadoPagina>
      )}

      <div className="vidrio rounded-xl p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="monto" className="text-base font-bold">
              ¿Cuánta plata?
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold">$</span>
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
                className="h-12 rounded-md pl-7 text-lg font-bold md:text-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plazo" className="text-base font-bold">
              ¿Cuándo la vas a necesitar?
            </Label>
            <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
              <SelectTrigger id="plazo" className="w-full rounded-md text-base data-[size=default]:h-12">
                <SelectValue>{ETIQUETA_PLAZO[dias as (typeof PLAZOS)[number]]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PLAZOS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {ETIQUETA_PLAZO[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div id="monto-ayuda" className="mt-3 text-sm leading-snug">
          {!validado.ok ? (
            <p className="text-error" role="alert">
              {validado.error}
            </p>
          ) : enDetalle ? null : origen === "plan" && mep ? (
            <p className="text-muted-foreground">Es la parte de tu plan para tener a mano, pasada a pesos. Podés cambiarlo.</p>
          ) : origen === "cartera" && mep && usdDeCartera.ok ? (
            <p className="text-muted-foreground">Es esa parte de tu plan, pasada a pesos. Podés cambiarlo.</p>
          ) : origen === "sin-mep" ? (
            <p className="text-atencion-texto">No pudimos saber el precio del dólar para pasar a pesos esa parte de tu plan. Escribí el monto en pesos.</p>
          ) : origen === "url" ? (
            <p className="text-muted-foreground">Es el monto que venía en el link. Podés cambiarlo.</p>
          ) : origen === "ejemplo" ? (
            <p className="text-muted-foreground">Es un monto de ejemplo: escribí el tuyo.</p>
          ) : null}
        </div>
      </div>

      {enDetalle ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Switch id="cliente" checked={esCliente} onCheckedChange={setEsCliente} />
            <Label htmlFor="cliente" className="font-normal">
              Mostrar la tasa para clientes del banco
            </Label>
            <span className="text-sm text-muted-foreground">Algunos bancos pagan más si ya tenés cuenta con ellos.</span>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
              {TABS.map((t) => (
                <TabsTrigger key={t} value={t} className="flex-none">
                  {ETIQUETA_TAB[t]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="todo">
              <TabCompararTodo plazoFijo={datos.plazoFijo} uva={datos.uva} billeteras={datos.billeteras} fci={fci} consulta={consulta} inflacion={inflacion} />
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

          {notaInflacionDetalle}
        </>
      ) : (
        <>
          <RespuestaPorTipo plazoFijo={datos.plazoFijo} uva={datos.uva} billeteras={datos.billeteras} fci={fci} consulta={consulta} inflacion={inflacion} />

          {notaInflacionResumen}

          {/* El detalle vive en su propia pantalla: acá solo se ofrece la entrada. */}
          <Link
            href={`/comparador/detalle?${parametros}${tab !== "todo" ? `&tab=${tab}` : ""}`}
            className="group flex min-h-16 items-center gap-4 border-y border-border py-4 transition-colors hover:bg-white/5"
          >
            <ListFilter className="h-5 w-5 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold leading-snug">Ver todos los bancos, billeteras y fondos</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">Con las tasas y los números de cada uno.</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
          </Link>
        </>
      )}
    </div>
  );
}
