"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrujulaCargando } from "@/components/plataforma/brujula-cargando";
import { PestanasMiPlan } from "@/components/plataforma/pestanas-mi-plan";
import { Aviso, COLOR_CATEGORIA, Punto, TextoLegal } from "@/components/plataforma/primitivas";
import { SelectorUnidad } from "@/components/plataforma/selector-unidad";
import { AnotarTenencia } from "@/components/plataforma/cartera-real/anotar-tenencia";
import { useCarteraReal } from "@/hooks/use-cartera-real";
import { usePrecios } from "@/hooks/use-precios";
import { abrirFinBot } from "@/lib/finbot/abrir";
import { NOMBRE_CORTO_CATEGORIA, simboloMercado } from "@/lib/plataforma/cartera-real/activos";
import type { MetodoValuacion, Tenencia, TenenciaValuada, Valuacion } from "@/lib/plataforma/cartera-real/tipos";
import { compararConPlan, describirDiferencia, resultado, UMBRAL_PARECIDO, valuar } from "@/lib/plataforma/cartera-real/valuar";
import { validarMonto } from "@/lib/plataforma/finanzas";
import { ars, fecha, hora, hoyArgentina, pct, usd } from "@/lib/plataforma/formato";
import { usePlan } from "@/lib/plataforma/store";
import type { Categoria, Plan } from "@/lib/plataforma/tipos";
import { cn } from "@/lib/utils";

type UnidadMonto = "ars" | "usd";

const ETIQUETA_METODO: Record<MetodoValuacion, string> = {
  mercado: "Precio de mercado",
  "estimado-subyacente": "Estimado",
  calculado: "Calculado",
  manual: "Lo cargaste vos",
};

/** "+$ 12.000" o "−USD 30", con el signo menos real y el mismo tamaño para subas y bajas. */
function conSigno(n: number, unidad: UnidadMonto) {
  const abs = unidad === "ars" ? ars(Math.abs(n)) : usd(Math.abs(n));
  if (Math.round(n) === 0) return abs;
  return `${n < 0 ? "−" : "+"}${abs}`;
}
const pctSigno = (n: number) => `${n < 0 ? "−" : "+"}${pct(Math.abs(n))}`;

export function LoQueTenes() {
  const { tenencias, cargando, agregar, actualizar, quitar } = useCarteraReal();
  const { plan } = usePlan();
  const simbolos = useMemo(() => tenencias.map((t) => simboloMercado(t)).filter((s): s is string => s !== null), [tenencias]);
  const precios = usePrecios(simbolos);
  const [anotando, setAnotando] = useState(false);

  // Sin dólar de hoy usamos el del último día que anotó algo (la cifra en pesos queda aproximada).
  const mepRespaldo = tenencias.at(-1)?.mepAlAnotar ?? null;
  const mep = precios.mep ?? mepRespaldo;

  if (cargando || (precios.cargando && mep === null)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <BrujulaCargando etiqueta="Cargando lo que tenés">Buscando los precios de hoy…</BrujulaCargando>
      </div>
    );
  }

  if (anotando) {
    if (mep === null) {
      return (
        <div className="mx-auto max-w-md space-y-4">
          <Aviso nivel="error" role="alert">
            No pudimos traer el dólar de hoy, y lo necesitamos para anotar. Revisá tu conexión y probá de nuevo.
          </Aviso>
          <Button variant="outline" onClick={() => setAnotando(false)}>
            Volver
          </Button>
        </div>
      );
    }
    return (
      <AnotarTenencia
        mep={mep}
        onCancelar={() => setAnotando(false)}
        onListo={(t) => {
          agregar(t);
          setAnotando(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <PestanasMiPlan activa="cartera" />
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-black leading-none text-foreground md:text-5xl">Lo que tenés</h1>
            <span className="vidrio rounded-full px-2.5 py-1 text-xs font-extrabold" title="Función Plus, abierta mientras la probamos">
              Plus · vista previa
            </span>
          </div>
          {tenencias.length > 0 && <p className="max-w-2xl text-base text-muted-foreground">Lo que ya invertiste, en un solo lugar. Se actualiza solo cada minuto.</p>}
        </header>
      </div>

      {tenencias.length === 0 || mep === null ? (
        <Vacio onAnotar={() => setAnotando(true)} sinDolar={mep === null} />
      ) : (
        <ConTenencias
          tenencias={tenencias}
          mep={mep}
          precios={precios}
          plan={plan}
          onAnotar={() => setAnotando(true)}
          onActualizar={actualizar}
          onQuitar={quitar}
        />
      )}
    </div>
  );
}

function Vacio({ onAnotar, sinDolar }: { onAnotar: () => void; sinDolar: boolean }) {
  return (
    <section className="max-w-md space-y-4">
      <h2 className="text-2xl font-black leading-tight">Todavía no anotaste nada</h2>
      <p className="text-lg leading-snug text-muted-foreground">
        Si ya invertiste, anotalo y miralo en un solo lugar: cuánto vale hoy y cómo se compara con tu plan. Si todavía no invertiste, no hace falta que lo hagas hoy.
      </p>
      {sinDolar ? (
        <Aviso nivel="error" role="alert">
          No pudimos traer el dólar de hoy. Revisá tu conexión y recargá la página.
        </Aviso>
      ) : (
        <Button size="cta" onClick={onAnotar}>
          Anotar lo que tengo
        </Button>
      )}
      <p>
        <Link href="/dashboard" className="text-sm font-medium text-enlace underline-offset-4 hover:underline">
          Ver mi plan
        </Link>
      </p>
    </section>
  );
}

type PropsCon = {
  tenencias: Tenencia[];
  mep: number;
  precios: ReturnType<typeof usePrecios>;
  plan: Plan | null;
  onAnotar: () => void;
  onActualizar: (t: Tenencia) => void;
  onQuitar: (id: string) => void;
};

function ConTenencias({ tenencias, mep, precios, plan, onAnotar, onActualizar, onQuitar }: PropsCon) {
  const [unidad, setUnidad] = useState<UnidadMonto>("ars");
  const hoy = hoyArgentina();
  const v = useMemo(() => valuar(tenencias, precios.precios, mep, hoy), [tenencias, precios.precios, mep, hoy]);
  const total = unidad === "ars" ? v.totalArs : v.totalUsd;
  const costo = unidad === "ars" ? v.costoArs : v.costoUsd;
  const res = resultado(v, unidad === "ars" ? "ARS" : "USD");
  const monto = (n: number) => (unidad === "ars" ? ars(n) : usd(n));
  const dia = unidad === "ars" ? v.variacionDiaUsd * mep : v.variacionDiaUsd;
  const hayMercado = v.tenencias.some((t) => t.metodo === "mercado" || t.metodo === "estimado-subyacente");
  const estaAbajo = res.monto < 0 || dia < 0;

  return (
    <>
      <section aria-labelledby="hoy-vale" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id="hoy-vale" className="text-lg font-extrabold">
            Hoy vale unos
          </h2>
          <SelectorUnidad valor={unidad} opciones={["ars", "usd"]} onCambiar={(u) => u !== "pct" && setUnidad(u)} />
        </div>
        <p className="font-display text-5xl font-black leading-none tracking-tight md:text-6xl" aria-live="polite">
          {monto(total)}
        </p>
        <div className="space-y-1 text-base">
          <p className="text-muted-foreground">Pusiste {monto(costo)}</p>
          <p>
            <span className="font-bold">{conSigno(res.monto, unidad)}</span>
            {res.pct !== null && <span className="font-bold"> ({pctSigno(res.pct)})</span>}{" "}
            <span className="text-muted-foreground">{res.monto < 0 ? "abajo desde que empezaste" : "desde que empezaste"}</span>
          </p>
          {hayMercado && (
            <p className="text-sm text-muted-foreground">
              Hoy: {conSigno(dia, unidad)} {dia < 0 ? "abajo" : ""}
            </p>
          )}
        </div>
        <EstadoActualizacion precios={precios} incompleta={v.incompleta} />
        {estaAbajo && (
          <p className="vidrio-mal max-w-2xl rounded-lg p-3 text-sm leading-relaxed text-atencion-texto/90">
            Que esté abajo no quiere decir que perdiste: la pérdida se vuelve real si vendés en ese momento. Que suba y baje de un día para otro es normal.
          </p>
        )}
        {unidad === "usd" && <TextoLegal>Lo que pusiste en pesos se pasa a dólares con el dólar MEP del día en que lo anotaste.</TextoLegal>}
      </section>

      <section aria-labelledby="que-tenes" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="que-tenes" className="text-lg font-extrabold">
            Qué tenés
          </h2>
          <Button variant="outline" size="sm" onClick={onAnotar}>
            <Plus className="h-4 w-4" aria-hidden />
            Anotar otra
          </Button>
        </div>
        <ul className="border-t border-border">
          {v.tenencias.map((tv) => (
            <FilaTenencia key={tv.tenencia.id} tv={tv} unidad={unidad} onActualizar={onActualizar} onQuitar={onQuitar} />
          ))}
        </ul>
      </section>

      <ComparadoConPlan valuacion={v} plan={plan} />

      <div className="space-y-2">
        <TextoLegal>
          Es una foto aproximada para que entiendas lo que tenés, no tu saldo oficial: ese lo ves en la app donde invertiste. No incluye comisiones, impuestos ni dividendos.
          Los CEDEARs se estiman con el precio del activo original en Nueva York y el dólar MEP: en BYMA el precio puede ser distinto. Los precios pueden tener demora.
        </TextoLegal>
        <TextoLegal>Guardado solo en este navegador. Contenido educativo, no es asesoramiento financiero.</TextoLegal>
      </div>
    </>
  );
}

function EstadoActualizacion({ precios, incompleta }: { precios: ReturnType<typeof usePrecios>; incompleta: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TextoLegal>
          {precios.consultado ? `Actualizado ${hora(precios.consultado)}` : "Sin actualizar todavía"} · se actualiza solo cada minuto · los precios pueden tener demora
        </TextoLegal>
        <button type="button" onClick={precios.recargar} className="flex min-h-9 items-center gap-1 text-legal font-medium text-enlace hover:underline">
          <RefreshCw className="h-3 w-3" aria-hidden />
          Actualizar ahora
        </button>
      </div>
      {precios.error && (
        <Aviso nivel="info" role="status" compacto>
          No pudimos actualizar los precios. Te mostramos los últimos que tenemos.
        </Aviso>
      )}
      {incompleta && !precios.cargando && (
        <Aviso nivel="info" role="status" compacto>
          Hay cosas sin precio por ahora: no entran en el total hasta que lleguen.
        </Aviso>
      )}
    </div>
  );
}

const CUANDO_ACTUALIZAR = "Para esto no hay precio en vivo: actualizalo con el valor que ves en tu app.";

function FilaTenencia({
  tv,
  unidad,
  onActualizar,
  onQuitar,
}: {
  tv: TenenciaValuada;
  unidad: UnidadMonto;
  onActualizar: (t: Tenencia) => void;
  onQuitar: (id: string) => void;
}) {
  const t = tv.tenencia;
  const valor = unidad === "ars" ? tv.valorArs : tv.valorUsd;
  const costo = unidad === "ars" ? tv.costoArs : tv.costoUsd;
  const monto = (n: number) => (unidad === "ars" ? ars(n) : usd(n));
  const resPct = valor !== null && costo > 0 ? ((valor - costo) / costo) * 100 : null;
  const cuando = tv.actualizado ? fecha(tv.actualizado) : null;
  const [confirmar, setConfirmar] = useState(false);

  return (
    <li className="border-b border-border">
      <details className="group">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
          <Punto className={COLOR_CATEGORIA[t.categoria]} />
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-snug">{t.nombre}</span>
            <span className="block text-legal text-muted-foreground">
              {ETIQUETA_METODO[tv.metodo]}
              {cuando ? ` · ${cuando}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block font-bold">{valor === null ? "Sin precio" : monto(valor)}</span>
            {resPct !== null && <span className="block text-sm text-muted-foreground">{pctSigno(resPct)}</span>}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <div className="space-y-3 pb-5 pl-6 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Pusiste</dt>
            <dd>{t.invertido.moneda === "ARS" ? ars(t.invertido.monto) : usd(t.invertido.monto)}</dd>
            {t.cantidad !== null && (
              <>
                <dt className="text-muted-foreground">Cantidad</dt>
                <dd>
                  {t.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 6 })}
                  {t.cantidadEstimada ? " (estimada con el precio del día en que lo anotaste)" : ""}
                </dd>
              </>
            )}
            {t.tna !== null && (
              <>
                <dt className="text-muted-foreground">Tasa</dt>
                <dd>{pct(t.tna * 100)} anual</dd>
              </>
            )}
            <dt className="text-muted-foreground">Desde</dt>
            <dd>{fecha(t.fecha)}</dd>
            <dt className="text-muted-foreground">Parte del plan</dt>
            <dd>{NOMBRE_CORTO_CATEGORIA[t.categoria]}</dd>
          </dl>
          <p className="text-muted-foreground">
            {tv.fuente}
            {tv.metodo === "estimado-subyacente" && ": en BYMA el precio puede ser distinto, porque también se mueve con el dólar."}
            {tv.metodo === "calculado" && ". Si la tasa cambió, el valor real puede ser otro."}
          </p>
          {t.tipo === "manual" && <ActualizarValor tenencia={t} onActualizar={onActualizar} />}
          {confirmar ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>¿Lo sacamos de tu lista?</span>
              <Button size="sm" variant="outline" onClick={() => onQuitar(t.id)}>
                Sí, sacarlo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmar(false)}>
                No
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} className="min-h-9 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Sacar de la lista
            </button>
          )}
        </div>
      </details>
    </li>
  );
}

function ActualizarValor({ tenencia, onActualizar }: { tenencia: Tenencia; onActualizar: (t: Tenencia) => void }) {
  const moneda = tenencia.valorManual?.moneda ?? tenencia.invertido.moneda;
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = `valor-${tenencia.id}`;

  function guardar() {
    const v = validarMonto(texto);
    if (!v.ok) return setError(v.error);
    setError(null);
    setTexto("");
    onActualizar({ ...tenencia, valorManual: { monto: v.monto, moneda, fecha: hoyArgentina() } });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground">{CUANDO_ACTUALIZAR}</p>
      <label htmlFor={id} className="sr-only">
        Valor de hoy en {moneda === "ARS" ? "pesos" : "dólares"}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold">{moneda === "ARS" ? "$" : "US$"}</span>
          <Input id={id} inputMode="decimal" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Valor de hoy" className={cn("h-10 rounded-md", moneda === "ARS" ? "pl-7" : "pl-11")} />
        </div>
        <Button size="sm" variant="outline" onClick={guardar}>
          Actualizar
        </Button>
      </div>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
    </div>
  );
}

const ORDEN: Categoria[] = ["fija", "variable", "dividendos", "liquidez", "alternativo"];

function Barra({ titulo, pesos }: { titulo: string; pesos: Record<Categoria, number> }) {
  const partes = ORDEN.filter((c) => pesos[c] > 0);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold">{titulo}</p>
      <div className="flex h-3.5 w-full gap-[3px]" role="img" aria-label={`${titulo}: ${partes.map((c) => `${NOMBRE_CORTO_CATEGORIA[c]} ${pesos[c]}%`).join(", ")}`}>
        {partes.map((c) => (
          <div key={c} style={{ width: `${pesos[c]}%` }} className={cn(COLOR_CATEGORIA[c], "h-full min-w-1 rounded-[5px]")} />
        ))}
      </div>
    </div>
  );
}

function ComparadoConPlan({ valuacion, plan }: { valuacion: Valuacion; plan: Plan | null }) {
  if (!plan) {
    return (
      <section aria-labelledby="comparado" className="space-y-2">
        <h2 id="comparado" className="text-lg font-extrabold">
          Comparado con tu plan
        </h2>
        <p className="text-sm text-muted-foreground">
          Armá tu plan para ver si lo que tenés se parece a lo que va con tu perfil.{" "}
          <Link href="/onboarding" className="font-medium text-enlace underline-offset-4 hover:underline">
            Armar mi plan
          </Link>
        </p>
      </section>
    );
  }
  if (valuacion.totalUsd <= 0) return null;

  const delPlan = Object.fromEntries(ORDEN.map((c) => [c, plan.posiciones.find((p) => p.categoria === c)?.porcentaje ?? 0])) as Record<Categoria, number>;
  const diferencias = compararConPlan(valuacion.pesos, delPlan);
  const importantes = diferencias.filter((d) => Math.abs(d.diferencia) >= UMBRAL_PARECIDO).slice(0, 3);
  const perfil = plan.perfil.perfil;

  return (
    <section aria-labelledby="comparado" className="space-y-4">
      <h2 id="comparado" className="text-lg font-extrabold">
        Comparado con tu plan
      </h2>
      <div className="space-y-3">
        <Barra titulo={`Tu plan sugerido (perfil ${perfil.toLowerCase()})`} pesos={delPlan} />
        <Barra titulo="Lo que tenés" pesos={valuacion.pesos} />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground" aria-label="Referencias">
        {ORDEN.filter((c) => delPlan[c] > 0 || valuacion.pesos[c] > 0).map((c) => (
          <li key={c} className="flex items-center gap-1.5">
            <Punto className={COLOR_CATEGORIA[c]} />
            {NOMBRE_CORTO_CATEGORIA[c]}: {delPlan[c]}% → {valuacion.pesos[c]}%
          </li>
        ))}
      </ul>
      {importantes.length === 0 ? (
        <p className="text-base">Lo que tenés se parece bastante a tu plan.</p>
      ) : (
        <ul className="space-y-2">
          {importantes.map((d) => (
            <li key={d.categoria} className="flex gap-3 text-base leading-snug">
              <Punto className={cn("mt-1.5", COLOR_CATEGORIA[d.categoria])} />
              {describirDiferencia(d, perfil)}
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => abrirFinBot("Comparé lo que tengo con mi plan sugerido y no se parecen. ¿Por qué importa esa diferencia y qué puede salir mal?")}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Preguntale a FinBot por qué importa
      </Button>
      <TextoLegal>Es una comparación para entender tu riesgo, no una indicación de qué hacer.</TextoLegal>
    </section>
  );
}
