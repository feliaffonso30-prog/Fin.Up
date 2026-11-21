"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GrupoOpciones, Opcion } from "@/components/plataforma/opcion";
import { Aviso, TextoLegal } from "@/components/plataforma/primitivas";
import { buscarActivos, NOMBRE_CORTO_CATEGORIA, simboloMercado, type OpcionActivo } from "@/lib/plataforma/cartera-real/activos";
import { tenenciaSchema, type MonedaTenencia, type PrecioMercado, type Tenencia } from "@/lib/plataforma/cartera-real/tipos";
import { costoDe, estimarCantidad, precioUnitarioUsd } from "@/lib/plataforma/cartera-real/valuar";
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

// Lee "0,5" o "1.250,75". Reutiliza la validación de montos del comparador.
const leerNumero = (texto: string) => validarMonto(texto);

async function precioDe(simbolo: string): Promise<PrecioMercado | null> {
  try {
    const r = await fetch(`/api/precios?simbolos=${encodeURIComponent(simbolo)}`);
    if (!r.ok) return null;
    const d = (await r.json()) as { precios: PrecioMercado[] };
    return d.precios.find((p) => p.simbolo === simbolo) ?? null;
  } catch {
    return null;
  }
}

export function AnotarTenencia({ mep, onListo, onCancelar }: Props) {
  const [paso, setPaso] = useState<Paso>(1);
  const [busqueda, setBusqueda] = useState("");
  const [opcion, setOpcion] = useState<OpcionActivo | null>(null);

  const [moneda, setMoneda] = useState<MonedaTenencia>("ARS");
  const [montoTexto, setMontoTexto] = useState("");
  const [cantidadTexto, setCantidadTexto] = useState("");
  const [tnaTexto, setTnaTexto] = useState("");
  const [valorHoyTexto, setValorHoyTexto] = useState("");
  const [nombreOtro, setNombreOtro] = useState("");
  const [categoriaOtro, setCategoriaOtro] = useState<Categoria>("variable");

  const hoy = hoyArgentina();
  const [fecha, setFecha] = useState(hoy);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const resultados = useMemo(() => buscarActivos(busqueda), [busqueda]);
  const esOtro = opcion?.pideCategoria === true;
  const tieneUnidades = opcion?.tipo === "cedear" || opcion?.tipo === "cripto";
  const pideTasa = opcion?.tipo === "plazo-fijo" || opcion?.tipo === "rinde-diario";
  const pideValorHoy = opcion?.tipo === "manual";
  const signo = moneda === "ARS" ? "$" : "US$";

  function elegir(o: OpcionActivo) {
    setOpcion(o);
    setMoneda(o.tipo === "dolares" || o.tipo === "cripto" ? "USD" : "ARS");
    setError(null);
    setPaso(2);
  }

  /** Revisa el paso 2. Devuelve el error a mostrar, o null si está todo bien. */
  function errorPaso2(): string | null {
    const m = leerNumero(montoTexto);
    if (!m.ok) return m.error;
    if (esOtro && nombreOtro.trim().length < 2) return "Escribí un nombre para reconocerlo.";
    if (pideTasa) {
      const t = leerNumero(tnaTexto);
      if (!t.ok) return "Escribí la tasa que te da (por ejemplo, 30).";
      if (t.monto > 500) return "Esa tasa parece demasiado alta: escribila en %, por ejemplo 30.";
    }
    if (pideValorHoy && !leerNumero(valorHoyTexto).ok) return "Escribí cuánto vale hoy, como lo ves en tu app.";
    if (tieneUnidades && cantidadTexto.trim() && !leerNumero(cantidadTexto).ok) return "La cantidad tiene que ser un número mayor a cero.";
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
      cantidad: null,
      cantidadEstimada: false,
      tna: null,
      valorManual: null,
      fecha,
      mepAlAnotar: mep,
    };

    if (pideTasa) {
      const t = leerNumero(tnaTexto);
      borrador.tna = t.ok ? t.monto / 100 : null;
    }
    if (pideValorHoy) {
      const v = leerNumero(valorHoyTexto);
      borrador.valorManual = v.ok ? { monto: v.monto, moneda, fecha: hoy } : null;
    }
    if (tieneUnidades) {
      const c = cantidadTexto.trim() ? leerNumero(cantidadTexto) : null;
      if (c?.ok) {
        borrador.cantidad = c.monto;
      } else {
        // No sabe cuántas tiene: la estimamos con el precio de hoy.
        const sym = simboloMercado(borrador);
        const p = sym ? await precioDe(sym) : null;
        const unitario = p ? precioUnitarioUsd(borrador, { [p.simbolo]: p }) : null;
        if (!unitario) {
          setGuardando(false);
          setError("No pudimos traer el precio de hoy para calcular cuántas tenés. Escribí la cantidad o probá en un rato.");
          setPaso(2);
          return;
        }
        borrador.cantidad = estimarCantidad(costoDe(borrador).usd, unitario);
        borrador.cantidadEstimada = true;
      }
    }

    const r = tenenciaSchema.safeParse(borrador);
    setGuardando(false);
    if (!r.success) {
      setError("Algo de lo que escribiste no cierra. Revisalo y probá de nuevo.");
      return;
    }
    onListo(r.data);
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
              placeholder="Buscá por nombre: Apple, plazo fijo, Bitcoin…"
              aria-label="Buscar en qué invertiste"
              autoComplete="off"
              className="h-12 rounded-md pl-9 text-base"
            />
          </div>
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
              {opcion.tipo === "dolares" ? "¿Cuántos dólares tenés?" : "¿Cuánto pusiste?"}
            </h1>
            {QUE_ES[opcion.tipo] && <p className="text-base text-muted-foreground">{QUE_ES[opcion.tipo]}</p>}
          </div>

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

          <CampoMonto id="monto" etiqueta="Lo que pusiste" signo={signo} valor={montoTexto} onCambiar={setMontoTexto} moneda={moneda} onMoneda={setMoneda} />

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

          {pideValorHoy && (
            <div className="space-y-1.5">
              <CampoMonto id="valor-hoy" etiqueta="¿Cuánto vale hoy?" signo={signo} valor={valorHoyTexto} onCambiar={setValorHoyTexto} />
              <p className="text-sm text-muted-foreground">
                Copialo de la app donde invertiste. Para esto no tenemos precio en vivo: lo podés actualizar cuando quieras.
              </p>
            </div>
          )}

          {tieneUnidades && (
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-bold [&::-webkit-details-marker]:hidden">
                ¿Sabés cuántas tenés? (opcional)
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
              </summary>
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="cantidad" className="sr-only">
                  Cantidad
                </Label>
                <Input id="cantidad" inputMode="decimal" autoComplete="off" value={cantidadTexto} onChange={(e) => setCantidadTexto(e.target.value)} placeholder={opcion.tipo === "cripto" ? "0,005" : "10"} className="h-12 rounded-md text-lg font-bold" />
                <p className="text-sm text-muted-foreground">
                  Si la sabés, el cálculo es más exacto. Si no, la estimamos con el precio de hoy y desde ahí ves cuánto se mueve.
                </p>
              </div>
            </details>
          )}

          {error && (
            <Aviso nivel="error" role="alert" compacto>
              {error}
            </Aviso>
          )}
          <Button type="button" size="cta" onClick={seguirDesde2}>
            Seguir
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
              {opcion.tipo === "plazo-fijo" ? "El día que lo hiciste" : "Más o menos cuándo invertiste"}
            </Label>
            <Input id="fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-12 rounded-md text-base" />
            <p className="text-sm text-muted-foreground">
              {pideTasa ? "Con esta fecha calculamos cuánto rindió hasta hoy." : "Aproximado está bien: es para que lo recuerdes."}
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
