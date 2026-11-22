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
import { GraficoEvolucion, GraficoGanancias, GraficoReparto, type UnidadMonto } from "@/components/plataforma/cartera-real/graficos";
import { ResumenMovimiento } from "@/components/plataforma/cartera-real/resumen-movimiento";
import { useEvolucionHistorica, useFotosDiarias } from "@/hooks/use-evolucion";
import { NOMBRE_CORTO_CATEGORIA, simbolosPrecio } from "@/lib/plataforma/cartera-real/activos";
import { conPuntoDeHoy } from "@/lib/plataforma/cartera-real/evolucion";
import { resumirMovimiento } from "@/lib/plataforma/cartera-real/resumen";
import type { DiferenciaPlan, MetodoValuacion, Tenencia, TenenciaValuada, Valuacion } from "@/lib/plataforma/cartera-real/tipos";
import { compararConPlan, describirDiferencia, resultado, UMBRAL_PARECIDO, valuar } from "@/lib/plataforma/cartera-real/valuar";
import { validarMonto } from "@/lib/plataforma/finanzas";
import { ars, fecha, hora, hoyArgentina, pct, usd } from "@/lib/plataforma/formato";
import { usePlan } from "@/lib/plataforma/store";
import type { Categoria, PerfilRiesgo, Plan } from "@/lib/plataforma/tipos";
import { cn } from "@/lib/utils";

/** Debajo de cada inversión: qué tan exacto es el valor, en simple. */
const ETIQUETA_METODO: Record<MetodoValuacion, string> = {
  mercado: "Precio de hoy",
  "estimado-subyacente": "Precio aproximado",
  calculado: "Con la tasa que cargaste",
  manual: "Valor que cargaste",
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
  const simbolos = useMemo(() => tenencias.flatMap((t) => simbolosPrecio(t)), [tenencias]);
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
          {tenencias.length > 0 && <p className="max-w-2xl text-base text-muted-foreground">Lo que ya invertiste, en un solo lugar.</p>}
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
  const moneda = unidad === "ars" ? "ARS" : "USD";
  const total = unidad === "ars" ? v.totalArs : v.totalUsd;
  const costo = unidad === "ars" ? v.costoArs : v.costoUsd;
  const res = resultado(v, moneda);
  const monto = (n: number) => (unidad === "ars" ? ars(n) : usd(n));
  const resumen = useMemo(() => resumirMovimiento(v, moneda, mep, hoy), [v, moneda, mep, hoy]);
  const historica = useEvolucionHistorica(tenencias, hoy);
  const fotos = useFotosDiarias(v, hoy);
  const puntosHistoricos = useMemo(() => ({ ...historica, puntos: conPuntoDeHoy(historica.puntos, v, hoy) }), [historica, v, hoy]);
  const reparto = repartoContraPlan(v, plan);

  return (
    <>
      <section aria-labelledby="tu-plata" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id="tu-plata" className="text-lg font-extrabold">
            Tu plata hoy
          </h2>
          <SelectorUnidad valor={unidad} opciones={["ars", "usd"]} onCambiar={(u) => u !== "pct" && setUnidad(u)} />
        </div>
        <p className="font-display text-5xl font-black leading-none tracking-tight md:text-6xl" aria-live="polite">
          {monto(total)}
        </p>
        <div className="space-y-1 text-base">
          <p className="font-bold">{fraseResultado(res, costo, monto)}</p>
          {reparto && (
            <p>
              <a href="#comparado" className="font-medium text-enlace underline-offset-4 hover:underline">
                {reparto.parecido ? "Se parece a tu plan" : `No se parece del todo a tu plan ${reparto.perfil.toLowerCase()}`}
              </a>
            </p>
          )}
        </div>
        <EstadoActualizacion precios={precios} incompleta={v.incompleta} />
        <MensajeCalma totalAbajo={res.monto < 0} diaAbajo={resumen.movimientoDia < 0} />
      </section>

      <ResumenMovimiento resumen={resumen} />

      <GraficoEvolucion historica={puntosHistoricos} fotos={fotos} unidad={unidad} />

      <section aria-labelledby="que-tenes" className="space-y-5">
        <GraficoGanancias tenencias={v.tenencias} unidad={unidad} />
        <div className="space-y-3">
          <h2 id="que-tenes" className="text-lg font-extrabold">
            Qué tenés
          </h2>
          <ul className="border-t border-border">
            {v.tenencias.map((tv) => (
              <FilaTenencia key={tv.tenencia.id} tv={tv} unidad={unidad} onActualizar={onActualizar} onQuitar={onQuitar} />
            ))}
          </ul>
          <Button size="cta" onClick={onAnotar}>
            <Plus className="h-4 w-4" aria-hidden />
            Anotar otra inversión
          </Button>
        </div>
      </section>

      <ComparadoConPlan reparto={reparto} hayPlan={plan !== null} />

      <div className="space-y-3">
        <TextoLegal>
          Es una foto aproximada, no tu saldo oficial (ese lo ves en la app donde invertiste). Contenido educativo, no es asesoramiento financiero. Lo que anotás se
          guarda solo en este navegador: si lo borrás o cambiás de dispositivo, se pierde.
        </TextoLegal>
        <details className="group text-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 font-medium text-enlace [&::-webkit-details-marker]:hidden">
            Cómo calculamos esto
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Las acciones, los bonos y los CEDEARs usan el precio de BYMA (la bolsa de Buenos Aires), que puede tener unos minutos de demora. Si no lo tenemos, un CEDEAR se calcula con el precio de la empresa en EE.UU. y el dólar MEP de hoy.</li>
            <li>La cripto usa su precio en dólares. El plazo fijo y las cuentas que rinden se calculan con la tasa que cargaste.</li>
            <li>Si no cargaste a qué precio compraste, usamos el precio de cierre del día que pusiste.</li>
            <li>Para pasar de pesos a dólares usamos el dólar MEP (el que se compra de forma legal a través de la bolsa): el del día que invertiste para lo que pusiste, y el de hoy para lo que vale.</li>
            <li>No incluye comisiones, impuestos ni dividendos.</li>
          </ul>
        </details>
      </div>
    </>
  );
}

/** "Vale $ 12.000 más (+5%) que lo que pusiste" o "Vale $ 8.000 menos (−4%)…": todavía no es plata cobrada. */
function fraseResultado(res: { monto: number; pct: number | null }, costo: number, monto: (n: number) => string): string {
  const p = res.pct !== null ? ` (${pctSigno(res.pct)})` : "";
  if (res.pct !== null && Math.abs(res.pct) < 0.5) return `Está más o menos igual a lo que pusiste (${monto(costo)}).`;
  if (res.monto >= 0) return `Vale ${monto(res.monto)} más${p} que lo que pusiste.`;
  return `Vale ${monto(Math.abs(res.monto))} menos${p} que lo que pusiste.`;
}

/** Con calma y sin decir qué hacer: distinto si bajó solo el día o si el total está abajo. */
function MensajeCalma({ totalAbajo, diaAbajo }: { totalAbajo: boolean; diaAbajo: boolean }) {
  if (!totalAbajo && !diaAbajo) return null;
  return (
    <Aviso nivel="atencion" compacto className="max-w-2xl">
      {totalAbajo
        ? "Por ahora vale menos de lo que pusiste. Es una diferencia que todavía se puede mover para cualquier lado."
        : "Bajó en el día. Que los precios suban y bajen de un día para otro es normal, sobre todo en acciones y cripto."}
    </Aviso>
  );
}

function EstadoActualizacion({ precios, incompleta }: { precios: ReturnType<typeof usePrecios>; incompleta: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TextoLegal>
          {precios.consultado ? `Actualizado ${hora(precios.consultado)}` : "Sin actualizar todavía"}
        </TextoLegal>
        <button type="button" onClick={precios.recargar} className="flex min-h-11 items-center gap-1.5 text-legal font-medium text-enlace hover:underline">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
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
            <dt className="text-muted-foreground">{t.costoEstimado ? "Punto de partida" : "Pusiste"}</dt>
            <dd>
              {t.invertido.moneda === "ARS" ? ars(t.invertido.monto) : usd(t.invertido.monto)}
              {t.costoEstimado && <span className="block text-muted-foreground">No sabíamos el precio de compra: contamos desde el día que lo anotaste.</span>}
              {t.costoDesdeCierre && <span className="block text-muted-foreground">Con el precio de cierre del día que compraste.</span>}
            </dd>
            {t.cantidad !== null && (
              <>
                <dt className="text-muted-foreground">Cantidad</dt>
                <dd>
                  {t.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 6 })}
                  {t.cantidadEstimada ? " (aproximada, con el precio del día que invertiste)" : ""}
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
          {tv.metodo === "estimado-subyacente" && (
            <p className="text-muted-foreground">Precio aproximado: lo sacamos del precio de la empresa en EE.UU. y del dólar de hoy. En tu app puede verse un poco distinto.</p>
          )}
          {tv.metodo === "calculado" && <p className="text-muted-foreground">Si la tasa cambió, el valor real puede ser otro.</p>}
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
            <button type="button" onClick={() => setConfirmar(true)} className="min-h-11 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
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
  // Si la anotó por cantidad, pide el precio de UNA y calcula el total.
  const porUnidad = tenencia.cantidad !== null;

  function guardar() {
    const v = validarMonto(texto);
    if (!v.ok) return setError(v.error);
    setError(null);
    setTexto("");
    const total = porUnidad && tenencia.cantidad !== null ? v.monto * tenencia.cantidad : v.monto;
    onActualizar({ ...tenencia, valorManual: { monto: total, moneda, fecha: hoyArgentina() } });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground">
        {porUnidad ? "Para esto no hay precio en vivo: actualizá el precio de cada unidad con lo que ves en tu app." : CUANDO_ACTUALIZAR}
      </p>
      <label htmlFor={id} className="sr-only">
        {porUnidad ? "Precio de hoy de cada unidad" : "Valor de hoy"} en {moneda === "ARS" ? "pesos" : "dólares"}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold">{moneda === "ARS" ? "$" : "US$"}</span>
          <Input id={id} inputMode="decimal" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={porUnidad ? "Precio de hoy por unidad" : "Valor de hoy"} className={cn("h-10 rounded-md", moneda === "ARS" ? "pl-7" : "pl-11")} />
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

type Reparto = { delPlan: Record<Categoria, number>; tuyo: Record<Categoria, number>; perfil: PerfilRiesgo; parecido: boolean; importantes: DiferenciaPlan[] };

/** Lo que tenés contra el plan, ya calculado (se usa arriba, en una línea, y abajo, en detalle). */
function repartoContraPlan(v: Valuacion, plan: Plan | null): Reparto | null {
  if (!plan || v.totalUsd <= 0) return null;
  const delPlan = Object.fromEntries(ORDEN.map((c) => [c, plan.posiciones.find((p) => p.categoria === c)?.porcentaje ?? 0])) as Record<Categoria, number>;
  const importantes = compararConPlan(v.pesos, delPlan)
    .filter((d) => Math.abs(d.diferencia) >= UMBRAL_PARECIDO)
    .slice(0, 3);
  return { delPlan, tuyo: v.pesos, perfil: plan.perfil.perfil, parecido: importantes.length === 0, importantes };
}

function ComparadoConPlan({ reparto, hayPlan }: { reparto: Reparto | null; hayPlan: boolean }) {
  if (!hayPlan) {
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
  if (!reparto) return null;
  const { delPlan, tuyo, perfil, parecido, importantes } = reparto;
  const pregunta = parecido
    ? `Comparé lo que tengo con mi plan sugerido (perfil ${perfil.toLowerCase()}) y se parecen. ¿Qué significa eso y qué puede salir mal igual?`
    : `Comparé lo que tengo con mi plan sugerido (perfil ${perfil.toLowerCase()}) y no se parecen del todo: ${importantes
        .map((d) => `${NOMBRE_CORTO_CATEGORIA[d.categoria]} ${d.planPct}% en el plan y ${d.tuyoPct}% lo mío`)
        .join("; ")}. ¿Por qué importa esa diferencia y qué puede salir mal? No me digas qué hacer.`;

  return (
    <section aria-labelledby="comparado" className="space-y-4">
      <h2 id="comparado" className="scroll-mt-6 text-lg font-extrabold">
        Comparado con tu plan
      </h2>
      <GraficoReparto plan={delPlan} tuyo={tuyo} perfil={perfil} />
      {parecido ? (
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
      <Button variant="outline" onClick={() => abrirFinBot(pregunta)}>
        <MessageCircle className="h-4 w-4" aria-hidden />
        Preguntale a FinBot por qué importa
      </Button>
      <TextoLegal>Es una comparación para entender tu riesgo, no una indicación de qué hacer.</TextoLegal>
    </section>
  );
}
