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
import { EDUCATIVO, plazoEnPalabras } from "@/lib/plataforma/comparador/textos";
import type { Alternativa, Consulta, Cotizacion, Inflacion, TipoAlternativa } from "@/lib/plataforma/comparador/tipos";
import { FuenteDato } from "./avisos";
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
        <span className="mt-1 block text-legal text-muted-foreground">En el banco: {e.enElBanco}</span>
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
        {e.cuandoPagaMas && (
          <p>
            <span className="font-semibold text-info">Cuándo tiende a pagar más: </span>
            <span className="text-foreground/85">{e.cuandoPagaMas}</span>
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
  conLeyenda,
}: {
  consulta: Consulta | null;
  cotizaciones: Cotizacion[];
  orden: string;
  conProducto?: boolean;
  sinDatos?: string;
  conLeyenda?: boolean;
}) {
  if (!consulta) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Ingresá un monto mayor a cero para ver las opciones ordenadas y cuánto ganarías.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{orden}</p>
      <TablaAlternativas
        cotizaciones={cotizaciones}
        dias={consulta.dias}
        conProducto={conProducto}
        sinDatos={sinDatos}
        conLeyenda={conLeyenda}
      />
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
        orden="Ordenado de mayor a menor ganancia estimada. La tasa es la que informa cada banco para tu plazo."
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
        Para {plazoEnPalabras(consulta.dias)} no hay plazo fijo que sigue a la inflación y te deje sacar la plata antes: el plazo mínimo
        es de {plazoEnPalabras(minimo)}. Elegí un plazo de {minimo} días o más arriba para compararlo.
      </>
    );
  } else if (consulta && mejorUva && mejorTradicional) {
    const equilibrio = inflacionDeEquilibrioUva(mejorTradicional.tna, mejorUva.tna, consulta.dias);
    comparacion = (
      <>
        Si los precios suben más de <strong className="text-foreground">{pct(equilibrio * 100, 2)}</strong> por mes en promedio, el plazo
        fijo que sigue a la inflación termina pagando más que el común. Si suben menos, paga más el común. Nadie sabe cuánto van a subir.
        <span className="mt-1.5 block text-muted-foreground">
          Comparamos el que más paga de cada uno a {plazoEnPalabras(consulta.dias)}: {mejorUva.alternativa.entidad} y{" "}
          {mejorTradicional.alternativa.entidad}.{inflacion ? ` El último mes los precios subieron ${pct(inflacion.mensual * 100)}.` : ""}
        </span>
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
        orden="Ganancia estimada suponiendo que los precios siguen subiendo como el último mes. La tasa se suma a lo que suben los precios."
      />
      <FuenteDato fuente={FUENTES.uva} resultado={uva} fechaDato={fechaMasNueva(uva.datos)} />
    </div>
  );
}

// ---------- Billeteras (+ FCI money market que se pueden sacar en el día) ----------

export function TabBilleteras({ billeteras, fci, ...comun }: Comun & { billeteras: Fuente; fci: Promise<Fuente> }) {
  const cotizaciones = useCotizaciones(billeteras.datos, comun);
  return (
    <div className="space-y-4">
      <Explicacion tipo="billetera" />
      <PanelRanking
        consulta={comun.consulta}
        cotizaciones={cotizaciones}
        orden="Billeteras y cuentas que rinden en pesos, de mayor a menor ganancia estimada. Podés usar la plata en el momento."
        sinDatos="No hay billeteras con rendimiento en pesos informado en este momento."
      />
      <FuenteDato fuente={FUENTES.billeteras} resultado={billeteras} fechaDato={fechaMasNueva(billeteras.datos)} />

      <section className="space-y-3 border-t border-border pt-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Fondos para plata de corto plazo que podés sacar en el día</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pocas billeteras dicen en público cuánto pagan. Muchas ponen tu plata en fondos como estos, de los que también podés sacar la
            plata en el día: sirven para comparar.
          </p>
          <p className="text-legal text-muted-foreground">En el banco: {EDUCATIVO["fci-mm"].enElBanco}</p>
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
        conLeyenda={false}
        orden="Lo que pagó el último mes, llevado a un año. Es lo que pagó, no lo que va a pagar: no está garantizado."
        sinDatos="No hay datos de estos fondos en este momento."
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
          className="w-full sm:w-auto"
        >
          {(["fci-mm", "fci-rf"] as const).map((t) => (
            <ToggleGroupItem key={t} value={t} className="h-auto min-h-11 whitespace-normal px-3 py-2 text-center leading-snug">
              {EDUCATIVO[t].titulo}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="space-y-1.5">
          <Label htmlFor="orden-fci" className="text-xs text-muted-foreground">
            Ordenar por
          </Label>
          <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
            <SelectTrigger id="orden-fci" className="w-full sm:w-56">
              <SelectValue>{orden === "patrimonio" ? "Fondo más grande" : "Lo que más pagó"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ganancia">Lo que más pagó</SelectItem>
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
      ? "Ordenado por tamaño del fondo (cuánta plata tiene invertida). Un fondo grande no paga más, pero suele ser más estable para poner y sacar la plata."
      : "Ordenado por lo que pagó el último mes, llevado a un año. Es lo que pagó, no lo que va a pagar.";
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
        Mostramos solo fondos en pesos, fondos grandes (con más de $1.000 millones invertidos), de los que podés sacar la plata en hasta 2
        días.
      </p>
      <FuenteDato fuente={FUENTES.fci} resultado={resultado} fechaDato={fechaMasNueva(resultado.datos)} />
    </div>
  );
}
