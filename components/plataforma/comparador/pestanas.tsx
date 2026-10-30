"use client";

import { Suspense, use, useMemo, useState, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ResultadoFuente } from "@/lib/comparador/respaldo";
import { inflacionDeEquilibrioUva } from "@/lib/plataforma/finanzas";
import { pct } from "@/lib/plataforma/formato";
import { cotizarTodas, mejorPorTipo, type Orden } from "@/lib/plataforma/comparador/cotizar";
import { FUENTES } from "@/lib/plataforma/comparador/normalizar";
import { EDUCATIVO } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Consulta, Cotizacion, Inflacion, TipoAlternativa } from "@/lib/plataforma/comparador/tipos";
import { FuenteDato } from "./avisos";
import { tasa } from "./insignias";
import { TablaAlternativas } from "./tabla-alternativas";

export type Fuente = ResultadoFuente<Alternativa[]>;

interface Comun {
  consulta: Consulta | null;
  inflacion: Inflacion | null;
}

const fechaMasNueva = (alts: Alternativa[]) => alts.reduce<string | null>((max, a) => (!max || a.fecha > max ? a.fecha : max), null);

// ---------- Piezas compartidas ----------

export function Explicacion({ tipo, abierta = false }: { tipo: TipoAlternativa; abierta?: boolean }) {
  const e = EDUCATIVO[tipo];
  return (
    <details open={abierta} className="group rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm">
        <span className="font-semibold">{e.titulo}:</span> <span className="text-muted-foreground">{e.queEs}</span>{" "}
        <span className="whitespace-nowrap text-xs text-enlace group-open:hidden">Ver ventajas y riesgos</span>
      </summary>
      <div className="mt-3 space-y-2 text-xs leading-relaxed">
        <p>
          <span className="font-semibold text-info">Ventajas: </span>
          <span className="text-foreground/85">{e.ventajas}</span>
        </p>
        <p className="rounded-lg border border-atencion/20 bg-atencion/10 p-2.5">
          <span className="font-semibold text-atencion">Qué puede salir mal: </span>
          <span className="text-atencion-texto/90">{e.riesgos}</span>
        </p>
        {e.cuandoConviene && (
          <p>
            <span className="font-semibold text-info">Cuándo suele convenir: </span>
            <span className="text-foreground/85">{e.cuandoConviene}</span>
          </p>
        )}
      </div>
    </details>
  );
}

function PanelRanking({
  consulta,
  cotizaciones,
  orden,
  conProducto,
  sinDatos,
}: {
  consulta: Consulta | null;
  cotizaciones: Cotizacion[];
  orden: string;
  conProducto?: boolean;
  sinDatos?: string;
}) {
  if (!consulta) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Ingresá un monto mayor a cero para ver el ranking y la ganancia estimada.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{orden}</p>
      <TablaAlternativas cotizaciones={cotizaciones} dias={consulta.dias} conProducto={conProducto} sinDatos={sinDatos} />
    </div>
  );
}

function CargandoFondos() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando fondos">
      <p className="text-xs text-muted-foreground">Cargando los datos de los fondos…</p>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function useCotizaciones(alts: Alternativa[], { consulta, inflacion }: Comun, orden?: Orden) {
  return useMemo(() => (consulta ? cotizarTodas(alts, consulta, inflacion, orden) : []), [alts, consulta, inflacion, orden]);
}

// ---------- Plazo fijo tradicional ----------

export function TabPlazoFijo({ plazoFijo, ...comun }: Comun & { plazoFijo: Fuente }) {
  const cotizaciones = useCotizaciones(plazoFijo.datos, comun);
  return (
    <div className="space-y-4">
      <Explicacion tipo="plazo-fijo" />
      <PanelRanking
        consulta={comun.consulta}
        cotizaciones={cotizaciones}
        orden="Ordenado de mayor a menor ganancia estimada. TNA para tu plazo, según lo que informa cada banco."
      />
      <FuenteDato fuente={FUENTES.plazoFijo} resultado={plazoFijo} fechaDato={fechaMasNueva(plazoFijo.datos)} />
    </div>
  );
}

// ---------- Plazo fijo UVA ----------

export function TabUva({ uva, plazoFijo, ...comun }: Comun & { uva: Fuente; plazoFijo: Fuente }) {
  const cotizaciones = useCotizaciones(uva.datos, comun);
  const tradicionales = useCotizaciones(plazoFijo.datos, comun);
  const { consulta, inflacion } = comun;

  const mejorUva = mejorPorTipo(cotizaciones).uva;
  const mejorTradicional = mejorPorTipo(tradicionales)["plazo-fijo"];
  const plazosMinimos = uva.datos.map((a) => a.plazoMinDias).filter((d): d is number => d !== null);
  const minimo = plazosMinimos.length ? Math.min(...plazosMinimos) : null;

  let comparacion: ReactNode = null;
  if (consulta && minimo !== null && consulta.dias < minimo) {
    comparacion = (
      <>
        Para {consulta.dias} días no hay plazo fijo UVA precancelable: el plazo mínimo es de {minimo} días. Elegí un plazo de{" "}
        {minimo} días o más arriba para compararlo.
      </>
    );
  } else if (consulta && mejorUva && mejorTradicional) {
    const equilibrio = inflacionDeEquilibrioUva(mejorTradicional.tna, mejorUva.tna, consulta.dias);
    comparacion = (
      <>
        A {consulta.dias} días, el UVA de mayor rendimiento ({mejorUva.alternativa.entidad}) rinde más que el plazo fijo tradicional de mayor
        tasa ({mejorTradicional.alternativa.entidad}, TNA {tasa(mejorTradicional.tna)}) si la inflación mensual promedio de esos meses
        supera <strong className="text-foreground">{pct(equilibrio * 100, 2)}</strong>
        {inflacion ? `. La última inflación informada fue ${pct(inflacion.mensual * 100)}` : ""}. Nadie sabe cuál será la inflación futura:
        es la apuesta que hacés al elegir uno u otro.
      </>
    );
  }

  return (
    <div className="space-y-4">
      <Explicacion tipo="uva" abierta />
      {comparacion && (
        <p className="rounded-xl border border-info/20 bg-info/10 p-4 text-xs leading-relaxed text-foreground/85">{comparacion}</p>
      )}
      <PanelRanking
        consulta={consulta}
        cotizaciones={cotizaciones}
        orden="Ganancia estimada suponiendo que la inflación se mantiene igual a la del último mes. La TNA se suma al ajuste por UVA."
      />
      <FuenteDato fuente={FUENTES.uva} resultado={uva} fechaDato={fechaMasNueva(uva.datos)} />
    </div>
  );
}

// ---------- Billeteras (+ FCI money market de rescate inmediato) ----------

export function TabBilleteras({ billeteras, fci, ...comun }: Comun & { billeteras: Fuente; fci: Promise<Fuente> }) {
  const cotizaciones = useCotizaciones(billeteras.datos, comun);
  return (
    <div className="space-y-4">
      <Explicacion tipo="billetera" />
      <PanelRanking
        consulta={comun.consulta}
        cotizaciones={cotizaciones}
        orden="Cuentas remuneradas en pesos, de mayor a menor ganancia estimada. La plata está disponible en el momento."
        sinDatos="No hay billeteras con rendimiento en pesos informado en este momento."
      />
      <FuenteDato fuente={FUENTES.billeteras} resultado={billeteras} fechaDato={fechaMasNueva(billeteras.datos)} />

      <section className="space-y-3 border-t border-border pt-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Fondos money market con rescate inmediato</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pocas billeteras informan su tasa de forma pública. Muchas invierten tu saldo en fondos como estos, que también se pueden
            rescatar en el día: sirven para comparar.
          </p>
        </div>
        <Suspense fallback={<CargandoFondos />}>
          <MoneyMarketInmediato fci={fci} {...comun} />
        </Suspense>
      </section>
    </div>
  );
}

function MoneyMarketInmediato({ fci, ...comun }: Comun & { fci: Promise<Fuente> }) {
  const resultado = use(fci);
  const inmediatos = useMemo(() => resultado.datos.filter((a) => a.tipo === "fci-mm" && a.liquidez === "inmediata"), [resultado.datos]);
  const cotizaciones = useCotizaciones(inmediatos, comun);
  return (
    <div className="space-y-3">
      <PanelRanking
        consulta={comun.consulta}
        cotizaciones={cotizaciones}
        conProducto
        orden="Rendimiento de los últimos 30 días, anualizado. No está garantizado."
        sinDatos="No hay datos de fondos money market en este momento."
      />
      <FuenteDato fuente={FUENTES.fci} resultado={resultado} fechaDato={fechaMasNueva(resultado.datos)} />
    </div>
  );
}

// ---------- FCI money market y renta fija ----------

type TipoFci = "fci-mm" | "fci-rf";

export function TabFci({ fci, ...comun }: Comun & { fci: Promise<Fuente> }) {
  const [tipo, setTipo] = useState<TipoFci>("fci-mm");
  const [orden, setOrden] = useState<Orden>("ganancia");
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ToggleGroup
          type="single"
          value={tipo}
          onValueChange={(v) => v && setTipo(v as TipoFci)}
          variant="outline"
          aria-label="Tipo de fondo"
        >
          <ToggleGroupItem value="fci-mm" className="px-3">
            Money market
          </ToggleGroupItem>
          <ToggleGroupItem value="fci-rf" className="px-3">
            Renta fija
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="space-y-1.5">
          <Label htmlFor="orden-fci" className="text-xs text-muted-foreground">
            Ordenar por
          </Label>
          <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
            <SelectTrigger id="orden-fci" className="w-full sm:w-56">
              <SelectValue>{orden === "patrimonio" ? "Fondo más grande" : "Mayor rendimiento"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ganancia">Mayor rendimiento</SelectItem>
              <SelectItem value="patrimonio">Fondo más grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Explicacion tipo={tipo} />
      <Suspense fallback={<CargandoFondos />}>
        <ListaFci fci={fci} tipo={tipo} orden={orden} {...comun} />
      </Suspense>
    </div>
  );
}

function ListaFci({ fci, tipo, orden, ...comun }: Comun & { fci: Promise<Fuente>; tipo: TipoFci; orden: Orden }) {
  const resultado = use(fci);
  const delTipo = useMemo(() => resultado.datos.filter((a) => a.tipo === tipo), [resultado.datos, tipo]);
  const cotizaciones = useCotizaciones(delTipo, comun, orden);
  const textoOrden =
    orden === "patrimonio"
      ? "Ordenado por tamaño del fondo (patrimonio). Un fondo grande no rinde más, pero suele ser más estable para entrar y salir."
      : "Ordenado por rendimiento de los últimos 30 días, anualizado. Es lo que rindió, no lo que va a rendir.";
  return (
    <div className="space-y-3">
      <PanelRanking
        consulta={comun.consulta}
        cotizaciones={cotizaciones}
        conProducto
        orden={textoOrden}
        sinDatos="No hay datos de estos fondos en este momento."
      />
      <p className="text-legal leading-snug text-muted-foreground/80">
        Mostramos fondos en pesos con al menos $1.000 millones de patrimonio y rescate en hasta 48 h.
      </p>
      <FuenteDato fuente={FUENTES.fci} resultado={resultado} fechaDato={fechaMasNueva(resultado.datos)} />
    </div>
  );
}
