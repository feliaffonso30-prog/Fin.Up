"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GrupoOpciones, Opcion } from "@/components/plataforma/opcion";
import { Aviso, TextoLegal } from "@/components/plataforma/primitivas";
import { buscarActivos, claseByma, divisorPrecio, MAX_RESULTADOS, NOMBRE_CORTO_CATEGORIA, simbolosPrecio, type OpcionActivo } from "@/lib/plataforma/cartera-real/activos";
import { CEDEARS } from "@/lib/plataforma/cartera-real/cedears";
import { tenenciaSchema, type ModoCarga, type MonedaTenencia, type PrecioMercado, type Precios, type Tenencia } from "@/lib/plataforma/cartera-real/tipos";
import { costoDe, costoDesdeCantidad, estimarCantidad, precioUnitarioUsd } from "@/lib/plataforma/cartera-real/valuar";
import { validarMonto } from "@/lib/plataforma/finanzas";
import { hoyArgentina } from "@/lib/plataforma/formato";
import type { Categoria } from "@/lib/plataforma/tipos";
import { cn } from "@/lib/utils";

type Props = {
  /** Dólar MEP de hoy: se guarda con la tenencia para pasar de pesos a dólares. */
  mep: number;
  onListo: (t: Tenencia) => void;
  onCancelar: () => void;
};

type Paso = 1 | 2 | 3;

type Historico = { unitarioUsd: number | null; mep: number | null };

const CATEGORIAS_OTRO: { categoria: Categoria; titulo: string; detalle: string }[] = [
  { categoria: "variable", titulo: "Acciones o fondos de acciones", detalle: "Sube y baja bastante" },
  { categoria: "fija", titulo: "Bonos, ONs o fondos de renta fija", detalle: "Le prestás a un gobierno o empresa" },
  { categoria: "liquidez", titulo: "Plata disponible", detalle: "La podés sacar casi al instante" },
  { categoria: "dividendos", titulo: "Empresas que pagan dividendos", detalle: "Te pagan una parte de sus ganancias" },
  { categoria: "alternativo", titulo: "Cripto, oro u otra cosa", detalle: "Lo que más sube y baja" },
];

/** Una línea para entender lo que eligió, en el momento en que lo elige. */
const QUE_ES: Partial<Record<OpcionActivo["tipo"], string>> = {
  cedear: "Un CEDEAR es una forma de tener una parte de una empresa o fondo de afuera, pagando en pesos.",
  cripto: "Su precio puede subir o bajar mucho en un solo día. Es la parte más riesgosa de cualquier cartera.",
  "plazo-fijo": "Le prestás tu plata al banco por un tiempo y te devuelve más. La tasa la ves como TNA.",
  "rinde-diario": "Tu plata rinde todos los días y la podés sacar cuando quieras. La tasa puede cambiar.",
  dolares: "En pesos, su valor se mueve con el dólar.",
};

/** Para lo de BYMA depende de qué es. */
const QUE_ES_BYMA = {
  accion: "Una acción es una parte de una empresa argentina. Su precio sube y baja todos los días.",
  bono: "Un bono es un préstamo a un gobierno o a una empresa. Su precio también se mueve, aunque suele moverse menos que una acción.",
  cedear: QUE_ES.cedear,
} as const;

function queEs(o: OpcionActivo): string | undefined {
  if (o.tipo === "byma" && o.simbolo) {
    const c = claseByma(o.simbolo);
    return c ? QUE_ES_BYMA[c] : undefined;
  }
  return QUE_ES[o.tipo];
}

/** Si no hay precio de BYMA para algo, se anota como antes: con el valor de su app. */
function aManual(o: OpcionActivo): OpcionActivo {
  const esBono = o.unidad === "nominales";
  return { ...o, tipo: "manual", detalle: `${o.detalle} · lo anotás con el valor de tu app`, unidad: esBono ? undefined : o.unidad };
}

// Lee "0,5" o "1.250,75". Reutiliza la validación de montos del comparador.
const leerNumero = (texto: string) => validarMonto(texto);

/** Precios de hoy de los símbolos pedidos ({} si falla). */
async function preciosDe(simbolos: string[]): Promise<Precios> {
  if (simbolos.length === 0) return {};
  try {
    const r = await fetch(`/api/precios?simbolos=${encodeURIComponent(simbolos.join(","))}`);
    if (!r.ok) return {};
    const d = (await r.json()) as { precios: PrecioMercado[] };
    return Object.fromEntries(d.precios.map((p) => [p.simbolo, p]));
  } catch {
    return {};
  }
}

export function AnotarTenencia({ mep, onListo, onCancelar }: Props) {
  const [paso, setPaso] = useState<Paso>(1);
  const [busqueda, setBusqueda] = useState("");
  const [opcion, setOpcion] = useState<OpcionActivo | null>(null);

  const [modo, setModo] = useState<ModoCarga>("monto");
  const [moneda, setMoneda] = useState<MonedaTenencia>("ARS");
  const [montoTexto, setMontoTexto] = useState("");
  const [cantidadTexto, setCantidadTexto] = useState("");
  const [precioCompraTexto, setPrecioCompraTexto] = useState("");
  /** Por defecto el precio de compra lo calculamos con la fecha; si lo sabe, lo puede escribir. */
  const [conPrecioExacto, setConPrecioExacto] = useState(false);
  const [precioHoyTexto, setPrecioHoyTexto] = useState("");
  const [tnaTexto, setTnaTexto] = useState("");
  const [valorHoyTexto, setValorHoyTexto] = useState("");
  const [nombreOtro, setNombreOtro] = useState("");
  const [categoriaOtro, setCategoriaOtro] = useState<Categoria>("variable");

  const hoy = hoyArgentina();
  const [fecha, setFecha] = useState(hoy);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  /** Mientras buscamos si hay precio de BYMA para lo que eligió. */
  const [buscandoPrecio, setBuscandoPrecio] = useState(false);
  /** No había precio de BYMA: se anota con el valor de su app. */
  const [sinPrecioByma, setSinPrecioByma] = useState(false);

  const resultados = useMemo(() => buscarActivos(busqueda), [busqueda]);
  const esOtro = opcion?.pideCategoria === true;
  const tieneUnidades = opcion?.tipo === "cedear" || opcion?.tipo === "byma" || opcion?.tipo === "cripto";
  const pideTasa = opcion?.tipo === "plazo-fijo" || opcion?.tipo === "rinde-diario";
  const pideValorHoy = opcion?.tipo === "manual";
  const admiteCantidad = Boolean(opcion?.unidad);
  const porCantidad = admiteCantidad && modo === "cantidad";
  const signo = moneda === "ARS" ? "$" : "US$";
  const unidad = opcion?.unidad ?? "";
  // "acciones" es femenino: "¿Cuántas acciones?", "cada una".
  const femenino = unidad === "acciones";
  const unidadSingular = unidad === "acciones" ? "acción" : unidad === "CEDEARs" ? "CEDEAR" : unidad === "nominales" ? "nominal" : unidad;
  // Los bonos cotizan cada 100 nominales: el precio se pide (y se escribe) así.
  const porCien = unidad === "nominales";

  function elegir(o: OpcionActivo) {
    setOpcion(o);
    setMoneda(o.tipo === "dolares" || o.tipo === "cripto" ? "USD" : "ARS");
    setModo("monto");
    setError(null);
    setSinPrecioByma(false);
    setConPrecioExacto(false);
    setPrecioCompraTexto("");
    setPaso(2);
    if (o.tipo === "byma") {
      // Si BYMA no tiene precio para esto (no opera o la fuente falla), pasa a manual.
      setBuscandoPrecio(true);
      void preciosDe(simbolosPrecio(o)).then((p) => {
        if (precioUnitarioUsd(o, p, mep) === null) {
          setOpcion((actual) => (actual?.clave === o.clave ? aManual(o) : actual));
          setSinPrecioByma(true);
        }
        setBuscandoPrecio(false);
      });
    }
  }

  /** Revisa el paso 2. Devuelve el error a mostrar, o null si está todo bien. */
  function errorPaso2(): string | null {
    if (esOtro && nombreOtro.trim().length < 2) return "Escribí un nombre para reconocerlo.";
    if (porCantidad) {
      if (!leerNumero(cantidadTexto).ok) return `Escribí cuánt${femenino ? "as" : "os"} ${unidad} tenés (por ejemplo, 10).`;
      if (precioCompraTexto.trim() && !leerNumero(precioCompraTexto).ok) return "El precio de compra tiene que ser un número mayor a cero.";
      if (pideValorHoy && !leerNumero(precioHoyTexto).ok) return `Escribí cuánto vale cada ${femenino ? "una" : "uno"} hoy, como lo ves en tu app.`;
      return null;
    }
    const m = leerNumero(montoTexto);
    if (!m.ok) return m.error;
    if (pideTasa) {
      const t = leerNumero(tnaTexto);
      if (!t.ok) return "Escribí la tasa que te da (por ejemplo, 30).";
      if (t.monto > 500) return "Esa tasa parece demasiado alta: escribila en %, por ejemplo 30.";
    }
    if (pideValorHoy && !leerNumero(valorHoyTexto).ok) return "Escribí cuánto vale hoy, como lo ves en tu app.";
    return null;
  }

  function seguirDesde2() {
    const e = errorPaso2();
    setError(e);
    if (!e) setPaso(3);
  }

  async function anotar() {
    if (!opcion) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy) {
      setError("Elegí una fecha de hoy o de antes.");
      return;
    }
    setGuardando(true);
    setError(null);
    const m = leerNumero(montoTexto);
    const monto = m.ok ? m.monto : 0;
    const borrador: Tenencia = {
      id: crypto.randomUUID(),
      tipo: opcion.tipo,
      simbolo: opcion.simbolo,
      nombre: esOtro ? nombreOtro.trim() : opcion.nombre,
      categoria: esOtro ? categoriaOtro : opcion.categoria,
      invertido: { monto, moneda },
      costoEstimado: false,
      costoDesdeCierre: false,
      cantidad: null,
      cantidadEstimada: false,
      tna: null,
      valorManual: null,
      fecha,
      mepAlAnotar: mep,
    };

    // El precio y el dólar del día en que invirtió (si fue antes de hoy).
    const hist = await historicoDe(borrador);
    if (hist.mep) borrador.mepAlAnotar = hist.mep;

    if (porCantidad) {
      const r = await armarPorCantidad(borrador, hist);
      setGuardando(false);
      if (typeof r === "string") {
        setError(r);
        setPaso(2);
        return;
      }
      onListo(r);
      return;
    }

    if (pideTasa) {
      const t = leerNumero(tnaTexto);
      borrador.tna = t.ok ? t.monto / 100 : null;
    }
    if (pideValorHoy) {
      const v = leerNumero(valorHoyTexto);
      borrador.valorManual = v.ok ? { monto: v.monto, moneda, fecha: hoy } : null;
    }
    if (tieneUnidades) {
      // Anotado por monto: cuántas tiene = lo que puso ÷ el precio del día en que invirtió
      // (si no lo conseguimos, el de hoy).
      const unitario = hist.unitarioUsd ?? (await unitarioHoyUsd(borrador));
      if (!unitario) {
        setGuardando(false);
        setError(`No pudimos traer el precio de hoy para calcular cuánt${femenino ? "as" : "os"} tenés. Probá anotarlo por cantidad o en un rato.`);
        setPaso(2);
        return;
      }
      borrador.cantidad = estimarCantidad(costoDe(borrador).usd, unitario);
      borrador.cantidadEstimada = true;
    }

    const r = tenenciaSchema.safeParse(borrador);
    setGuardando(false);
    if (!r.success) {
      setError("Algo de lo que escribiste no cierra. Revisalo y probá de nuevo.");
      return;
    }
    onListo(r.data);
  }

  /** Precio de hoy de UNA unidad, en USD (un CEDEAR ya dividido por su ratio, un bono por 100). */
  async function unitarioHoyUsd(t: Tenencia): Promise<number | null> {
    return precioUnitarioUsd(t, await preciosDe(simbolosPrecio(t)), mep);
  }

  /** Precio de UNA unidad el día que invirtió (en USD) y el dólar MEP de ese día. null si es de hoy o no hay datos. */
  async function historicoDe(t: Tenencia): Promise<Historico> {
    if (t.fecha >= hoy) return { unitarioUsd: null, mep: null };
    try {
      const r = await fetch(`/api/precios/historico?fecha=${t.fecha}&simbolos=${encodeURIComponent(simbolosPrecio(t).join(","))}`);
      if (!r.ok) return { unitarioUsd: null, mep: null };
      const d = (await r.json()) as { precios: PrecioMercado[]; mep: { venta: number } | null };
      const mepDia = d.mep?.venta ?? null;
      const precios: Precios = Object.fromEntries(d.precios.map((p) => [p.simbolo, p]));
      return { unitarioUsd: precioUnitarioUsd(t, precios, mepDia ?? mep), mep: mepDia };
    } catch {
      return { unitarioUsd: null, mep: null };
    }
  }

  /** Anotado por cantidad. Devuelve la tenencia lista o el error a mostrar. */
  async function armarPorCantidad(base: Tenencia, hist: Historico): Promise<Tenencia | string> {
    const c = leerNumero(cantidadTexto);
    if (!c.ok) return "Revisá la cantidad.";
    const cantidad = c.monto;
    const compra = precioCompraTexto.trim() ? leerNumero(precioCompraTexto) : null;
    // Un bono se escribe cada 100 nominales: lo pasamos a precio de UN nominal.
    const precioCompra = compra?.ok ? { monto: compra.monto / divisorPrecio(opcion?.simbolo ?? null), moneda } : null;
    const t: Tenencia = { ...base, cantidad, cantidadEstimada: false };

    let precioHoy: { monto: number; moneda: MonedaTenencia } | null = null;
    let desdeCierre = false;
    if (pideValorHoy) {
      // Sin precio en vivo (acciones argentinas, CEDEARs de otros mercados): lo copia de su app.
      const h = leerNumero(precioHoyTexto);
      if (!h.ok) return "Escribí cuánto vale hoy cada unidad.";
      precioHoy = { monto: h.monto, moneda };
      t.valorManual = { monto: cantidad * h.monto, moneda, fecha: hoy };
    } else if (!precioCompra) {
      // Sin precio de compra: cantidad × precio del día en que invirtió. Si fue hoy, el de
      // ahora; si no conseguimos el de ese día, el de hoy como punto de partida.
      const unitario = hist.unitarioUsd ?? (await unitarioHoyUsd(t));
      if (!unitario) return "No pudimos traer el precio. Escribí a qué precio compraste o probá en un rato.";
      desdeCierre = hist.unitarioUsd !== null || t.fecha >= hoy;
      const mepRef = hist.unitarioUsd !== null ? (hist.mep ?? mep) : mep;
      // Se guarda en la moneda que eligió (en pesos, con el dólar de ese día).
      precioHoy = moneda === "ARS" ? { monto: unitario * mepRef, moneda: "ARS" } : { monto: unitario, moneda: "USD" };
    }

    const costo = costoDesdeCantidad(cantidad, precioCompra, precioHoy);
    if (!costo) return "Algo de lo que escribiste no cierra. Revisalo y probá de nuevo.";
    t.invertido = costo.invertido;
    t.costoEstimado = costo.estimado && !desdeCierre;
    t.costoDesdeCierre = costo.estimado && desdeCierre;
    const r = tenenciaSchema.safeParse(t);
    return r.success ? r.data : "Algo de lo que escribiste no cierra. Revisalo y probá de nuevo.";
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (paso === 1 ? onCancelar() : (setError(null), setPaso((p) => (p - 1) as Paso)))}
          className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {paso === 1 ? "Cancelar" : "Volver"}
        </button>
        <div className="flex items-center gap-2" aria-label={`Paso ${paso} de 3`}>
          <span className="text-sm text-muted-foreground">Paso {paso} de 3</span>
          <span className="flex gap-1" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span key={n} className={cn("h-1.5 w-6 rounded-full", n <= paso ? "bg-foreground" : "bg-white/20")} />
            ))}
          </span>
        </div>
      </div>

      {paso === 1 && (
        <section aria-labelledby="titulo-paso" className="space-y-4">
          <h1 id="titulo-paso" className="text-3xl font-black leading-tight md:text-4xl">
            ¿En qué invertiste?
          </h1>
          <p className="text-base text-muted-foreground">No movemos tu plata. Solo anotás lo que ya tenés para verlo en un lugar.</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Apple, Galicia, Bitcoin, AL30…"
              aria-label="Buscar en qué invertiste"
              autoComplete="off"
              className="h-12 rounded-md pl-9 text-base"
            />
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {busqueda.trim()
              ? resultados.length > 1
                ? `${resultados.length - 1 >= MAX_RESULTADOS ? `Los primeros ${MAX_RESULTADOS}` : resultados.length - 1} ${resultados.length - 1 === 1 ? "resultado" : "resultados"}${resultados.length - 1 >= MAX_RESULTADOS ? ": escribí más para afinar" : ""}`
                : "No lo encontramos. Podés anotarlo igual como \"Otro\"."
              : `Están todos los CEDEARs de BYMA (${CEDEARS.length}), acciones argentinas, bonos y cripto. Escribí para buscar.`}
          </p>
          <ul className="space-y-2" aria-label="Resultados">
            {resultados.map((o) => (
              <li key={o.clave}>
                <button
                  type="button"
                  onClick={() => elegir(o)}
                  className="vidrio flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-[transform,background-color] duration-150 hover:bg-white/15 active:scale-[0.98] motion-reduce:active:scale-100"
                >
                  <span className="min-w-0">
                    <span className="block font-bold leading-snug">{o.nombre}</span>
                    <span className="block text-sm text-muted-foreground">{o.detalle}</span>
                  </span>
                  {o.simbolo && <span className="shrink-0 text-sm font-medium text-muted-foreground">{o.simbolo}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {paso === 2 && opcion && (
        <section aria-labelledby="titulo-paso" className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-bold text-muted-foreground">{esOtro ? "Otra inversión" : opcion.nombre}</p>
            <h1 id="titulo-paso" className="text-3xl font-black leading-tight md:text-4xl">
              {opcion.tipo === "dolares" ? "¿Cuántos dólares tenés?" : porCantidad ? `¿Cuánt${femenino ? "as" : "os"} ${unidad} tenés?` : "¿Cuánto pusiste?"}
            </h1>
            {queEs(opcion) && <p className="text-base text-muted-foreground">{queEs(opcion)}</p>}
          </div>

          {sinPrecioByma && (
            <Aviso nivel="info" compacto>
              Ahora no tenemos el precio de {opcion.simbolo} en BYMA. Anotalo con el valor que ves en tu app y lo podés actualizar cuando quieras.
            </Aviso>
          )}

          {esOtro && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre-otro" className="text-base font-bold">
                  ¿Cómo se llama?
                </Label>
                <Input id="nombre-otro" value={nombreOtro} onChange={(e) => setNombreOtro(e.target.value)} maxLength={80} placeholder="Por ejemplo: FCI de acciones de mi banco" className="h-12 rounded-md text-base" />
              </div>
              <div className="space-y-2">
                <p id="categoria-otro" className="text-base font-bold">
                  ¿A qué se parece más?
                </p>
                <GrupoOpciones labelledBy="categoria-otro">
                  {CATEGORIAS_OTRO.map((c) => (
                    <Opcion key={c.categoria} seleccionada={categoriaOtro === c.categoria} onClick={() => setCategoriaOtro(c.categoria)} titulo={c.titulo} detalle={c.detalle} />
                  ))}
                </GrupoOpciones>
              </div>
            </div>
          )}

          {admiteCantidad && (
            <div role="group" aria-label="Cómo lo querés anotar" className="vidrio grid grid-cols-2 rounded-full p-1">
              {(
                [
                  ["monto", "Por lo que pusiste"],
                  ["cantidad", `Por cantidad de ${unidad}`],
                ] as const
              ).map(([m, etiqueta]) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={modo === m}
                  onClick={() => {
                    setModo(m);
                    setError(null);
                  }}
                  className={cn(
                    "min-h-10 rounded-full px-3 text-sm leading-tight",
                    modo === m ? "bg-white/20 font-extrabold text-foreground" : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          )}

          {porCantidad ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="cantidad" className="text-base font-bold">
                  Cantidad de {unidad}
                </Label>
                <Input
                  id="cantidad"
                  inputMode="decimal"
                  autoComplete="off"
                  value={cantidadTexto}
                  onChange={(e) => setCantidadTexto(e.target.value)}
                  placeholder={opcion.tipo === "cripto" ? "0,005" : "10"}
                  className="h-12 rounded-md text-lg font-bold"
                />
                <p className="text-sm text-muted-foreground">
                  {porCien ? "En los bonos la cantidad se llama valor nominal (VN). Copiá el número que te muestra tu app, aunque parezca muy grande." : "La ves en la app donde invertiste, en tu tenencia."}
                </p>
              </div>
              {pideValorHoy || conPrecioExacto ? (
                <div className="space-y-1.5">
                  <CampoMonto
                    id="precio-compra"
                    etiqueta={porCien ? "¿A qué precio compraste? (en tu app aparece cada 100 VN)" : `¿A qué precio compraste cada ${unidadSingular}? (opcional)`}
                    signo={signo}
                    valor={precioCompraTexto}
                    onCambiar={setPrecioCompraTexto}
                    moneda={moneda}
                    onMoneda={setMoneda}
                  />
                  <p className="text-sm text-muted-foreground">
                    {pideValorHoy
                      ? "Si no lo sabés, dejalo vacío: tomamos el valor de hoy como punto de partida y desde ahí ves cuánto se mueve."
                      : "Si lo dejás vacío, lo calculamos con el precio del día en que compraste."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hace falta que sepas a qué precio compraste: en el paso siguiente elegís la fecha y lo calculamos con el precio de ese día.{" "}
                  <button type="button" onClick={() => setConPrecioExacto(true)} className="min-h-11 font-bold text-foreground underline underline-offset-4">
                    Sé el precio exacto
                  </button>
                </p>
              )}
              {pideValorHoy && (
                <div className="space-y-1.5">
                  <CampoMonto id="precio-hoy" etiqueta={`¿Cuánto vale cada ${femenino ? "una" : "uno"} hoy?`} signo={signo} valor={precioHoyTexto} onCambiar={setPrecioHoyTexto} />
                  <p className="text-sm text-muted-foreground">Copialo de tu app. Para esto no tenemos precio en vivo: lo podés actualizar cuando quieras.</p>
                </div>
              )}
            </>
          ) : (
            <CampoMonto id="monto" etiqueta="Lo que pusiste" signo={signo} valor={montoTexto} onCambiar={setMontoTexto} moneda={moneda} onMoneda={setMoneda} />
          )}

          {pideTasa && (
            <div className="space-y-1.5">
              <Label htmlFor="tna" className="text-base font-bold">
                ¿Qué tasa te da?
              </Label>
              <div className="relative">
                <Input id="tna" inputMode="decimal" autoComplete="off" value={tnaTexto} onChange={(e) => setTnaTexto(e.target.value)} placeholder="30" className="h-12 rounded-md pr-16 text-lg font-bold" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">% anual</span>
              </div>
              <p className="text-sm text-muted-foreground">Es la TNA (tasa nominal anual) que te muestra el banco o la billetera.</p>
            </div>
          )}

          {pideValorHoy && !porCantidad && (
            <div className="space-y-1.5">
              <CampoMonto id="valor-hoy" etiqueta="¿Cuánto vale hoy en total?" signo={signo} valor={valorHoyTexto} onCambiar={setValorHoyTexto} />
              <p className="text-sm text-muted-foreground">
                Copialo de la app donde invertiste. Para esto no tenemos precio en vivo: lo podés actualizar cuando quieras.
              </p>
            </div>
          )}

          {tieneUnidades && !porCantidad && (
            <p className="text-sm text-muted-foreground">
              Calculamos cuánt{femenino ? "as" : "os"} {unidad} tenés con el precio del día en que invertiste. Si sabés la cantidad exacta, anotalo por cantidad: el cálculo es más preciso.
            </p>
          )}

          {error && (
            <Aviso nivel="error" role="alert" compacto>
              {error}
            </Aviso>
          )}
          <Button type="button" size="cta" onClick={seguirDesde2} disabled={buscandoPrecio}>
            {buscandoPrecio ? "Buscando el precio de hoy…" : "Seguir"}
          </Button>
        </section>
      )}

      {paso === 3 && opcion && (
        <section aria-labelledby="titulo-paso" className="space-y-5">
          <h1 id="titulo-paso" className="text-3xl font-black leading-tight md:text-4xl">
            ¿Cuándo?
          </h1>
          <div className="space-y-1.5">
            <Label htmlFor="fecha" className="text-base font-bold">
              {opcion.tipo === "plazo-fijo" ? "El día que lo hiciste" : tieneUnidades ? "El día que compraste" : "Más o menos cuándo invertiste"}
            </Label>
            <Input id="fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-12 rounded-md text-base" />
            <p className="text-sm text-muted-foreground">
              {pideTasa
                ? "Con esta fecha calculamos cuánto rindió hasta hoy."
                : tieneUnidades
                  ? "Buscamos el precio de cierre de ese día (si no hubo mercado, el del día hábil anterior). Si no te acordás el día exacto, uno cercano está bien."
                  : "Aproximado está bien: es para que lo recuerdes."}
            </p>
          </div>
          {error && (
            <Aviso nivel="error" role="alert" compacto>
              {error}
            </Aviso>
          )}
          <Button type="button" size="cta" onClick={() => void anotar()} disabled={guardando}>
            {guardando ? "Anotando…" : "Anotar"}
          </Button>
          <TextoLegal>
            Se guarda en este navegador. Va a {NOMBRE_CORTO_CATEGORIA[esOtro ? categoriaOtro : opcion.categoria]} cuando lo compares con tu plan.
          </TextoLegal>
        </section>
      )}
    </div>
  );
}

function CampoMonto({
  id,
  etiqueta,
  signo,
  valor,
  onCambiar,
  moneda,
  onMoneda,
}: {
  id: string;
  etiqueta: string;
  signo: string;
  valor: string;
  onCambiar: (v: string) => void;
  moneda?: MonedaTenencia;
  onMoneda?: (m: MonedaTenencia) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-base font-bold">
          {etiqueta}
        </Label>
        {moneda && onMoneda && (
          <div role="group" aria-label="Moneda" className="vidrio inline-flex rounded-full p-1">
            {(["ARS", "USD"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={moneda === m}
                onClick={() => onMoneda(m)}
                className={cn("min-h-9 rounded-full px-3.5 text-sm", moneda === m ? "bg-white/20 font-extrabold" : "font-medium text-muted-foreground hover:text-foreground")}
              >
                {m === "ARS" ? "Pesos" : "Dólares"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold">{signo}</span>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder="100.000"
          className={cn("h-12 rounded-md text-lg font-bold md:text-lg", signo === "$" ? "pl-7" : "pl-12")}
        />
      </div>
    </div>
  );
}
