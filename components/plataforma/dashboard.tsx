"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, RefreshCw, Scale } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BrujulaCargando } from "@/components/plataforma/brujula-cargando";
import { GraficoProyeccion } from "@/components/plataforma/grafico-proyeccion";
import { EscenariosCompactos } from "@/components/plataforma/escenarios";
import { Aviso, COLOR_CATEGORIA, EncabezadoPagina, Punto, QuePuedeSalirMal, TextoLegal } from "@/components/plataforma/primitivas";
import { SelectorUnidad, type Unidad } from "@/components/plataforma/selector-unidad";
import { PestanasMiPlan } from "@/components/plataforma/pestanas-mi-plan";
import { VerEjemplos } from "@/components/plataforma/instrumentos/ver-ejemplos";
import { CATEGORIAS_CON_EJEMPLOS } from "@/lib/plataforma/instrumentos/catalogo";
import { DESCRIPCION_PERFIL } from "@/lib/plataforma/perfil";
import { DESCARGO } from "@/lib/plataforma/cartera";
import { ars, fecha, usd } from "@/lib/plataforma/formato";
import { useDolarMep } from "@/hooks/use-dolar-mep";
import { useRecorrido } from "@/hooks/use-recorrido";
import { usePlan } from "@/lib/plataforma/store";
import { hrefComparador } from "@/lib/plataforma/comparador/desde-cartera";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import type { Plan, Posicion } from "@/lib/plataforma/tipos";

export function Dashboard() {
  const { plan, cargando, error, sinCuenta, recargar } = usePlan();

  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <BrujulaCargando etiqueta="Cargando tu plan">Cargando tu plan…</BrujulaCargando>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-3 h-8 w-8 text-atencion" aria-hidden />
        <h1 className="text-xl font-bold">No pudimos cargar tu plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button onClick={recargar} variant="outline" className="mt-5">
          Reintentar
        </Button>
      </div>
    );
  }
  if (!plan)
    return (
      <>
        <PestanasMiPlan activa="plan" />
        <SinPlan />
      </>
    );
  return <Cartera plan={plan} sinCuenta={sinCuenta} />;
}

export function SinPlan() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center">
      <h1 className="text-[2.75rem] font-black leading-none tracking-[-0.035em]">Todavía no armaste tu plan</h1>
      <p className="mt-4 text-lg leading-snug text-muted-foreground">En 3 minutos te mostramos un plan simple, con el porqué de cada parte y qué puede salir mal.</p>
      <Button asChild size="cta" className="mt-8">
        <Link href="/onboarding">Armar mi plan</Link>
      </Button>
    </div>
  );
}

// Cuánto sube y baja cada parte, en palabras y no con "volatilidad".
const CUANTO_SE_MUEVE: Record<Posicion["volatilidad"], string> = {
  "Muy baja": "casi nada",
  Baja: "poco",
  Media: "bastante",
  Alta: "mucho",
  "Muy alta": "muchísimo",
};

function Cartera({ plan, sinCuenta }: { plan: Plan; sinCuenta: boolean }) {
  const { analisis, perfil, respuestas, posiciones, avisos } = plan;
  const ultimo = plan.proyeccion.at(-1);
  const capital = respuestas.capitalInicial;
  const sinMontos = capital === 0 && respuestas.aporteMensual === 0;
  const recorrido = useRecorrido(plan);
  // Los avisos que el recorrido ya convierte en pasos no se repiten en "Antes de empezar"
  // (salvo que lo haya ocultado).
  const cubiertos = recorrido.oculto ? [] : recorrido.pasos.map((p) => p.aviso);
  const antesDeEmpezar = avisos.filter((a) => !cubiertos.includes(a.titulo));
  const [abiertas, setAbiertas] = useState<string[]>([]);
  const parteMayor = recorrido.pasos.find((p) => p.id === "cartera")?.accion;

  // Las cifras arrancan en porcentaje: es lo que no depende de cuánta plata ponga.
  // Con un monto cargado se pueden pasar a dólares, y a pesos si hay cotización.
  const mep = useDolarMep();
  const [unidad, setUnidad] = useState<Unidad>("pct");
  const unidades: Unidad[] = capital > 0 ? (mep ? ["pct", "ars", "usd"] : ["pct", "usd"]) : ["pct"];
  const enPesos = unidad === "ars" && mep !== null;
  const monto = (dolares: number) => (enPesos && mep ? ars(dolares * mep) : usd(dolares));

  // Abrir a mano la parte más grande también cuenta como hecho ese paso.
  function cambiarAbiertas(valores: string[]) {
    setAbiertas(valores);
    if (parteMayor?.tipo === "parte" && valores.includes(parteMayor.categoria)) recorrido.marcar("cartera");
  }

  // "Ver esa parte": la abre, la lleva a la vista y le pasa el foco.
  function abrirParte(categoria: string) {
    setAbiertas((prev) => (prev.includes(categoria) ? prev : [...prev, categoria]));
    requestAnimationFrame(() => {
      const el = document.getElementById(`parte-${categoria}`);
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
      el?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
  }

  // Desde Inicio ("Ver esa parte") se llega con /dashboard#parte-<categoría>: esa parte se abre sola.
  useEffect(() => {
    const m = /^#parte-(.+)$/.exec(window.location.hash);
    if (m && posiciones.some((p) => p.categoria === m[1])) abrirParte(m[1]);
    // Solo al entrar: el link se lee una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <PestanasMiPlan activa="plan" />
        <EncabezadoPagina titulo={`Perfil ${perfil.perfil.toLowerCase()}`} />
      </div>

      <div>
        <section aria-labelledby="en-un-anio" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="en-un-anio" className="text-lg font-extrabold">
              {unidad === "pct" || capital === 0 ? "En un año" : `En un año, con ${monto(capital)}`}
            </h2>
            <SelectorUnidad valor={unidad} opciones={unidades} onCambiar={setUnidad} />
          </div>
          <EscenariosCompactos analisis={analisis} capital={capital} unidad={unidad} mep={mep} destacado className="mt-3 md:grid-cols-2" />
          <p className="mt-2.5 text-sm text-muted-foreground">
            {enPesos && mep ? `Pasado a pesos al dólar de hoy (${ars(mep)}). ` : ""}Es una estimación, no una promesa.
          </p>
        </section>
      </div>

      {AUTH_CONFIGURADA && sinCuenta && (
        <aside className="vidrio flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-snug">Tu plan está guardado solo en este navegador. Creá una cuenta para no perderlo y verlo desde cualquier dispositivo.</p>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/registro">Crear mi cuenta</Link>
          </Button>
        </aside>
      )}

      {(antesDeEmpezar.length > 0 || perfil.ajustes.length > 0) && (
        <section aria-labelledby="antes-de-empezar" className="space-y-3">
          <h2 id="antes-de-empezar" className="text-lg font-extrabold">
            Antes de empezar
          </h2>
          {perfil.ajustes.length > 0 && (
            <Aviso nivel="atencion" titulo="Ajustamos tu perfil por seguridad">
              Por tus respuestas te habría salido {perfil.perfilPorPuntaje.toLowerCase()}, pero lo dejamos en {perfil.perfil.toLowerCase()}:{" "}
              {perfil.ajustes.join(" ")}
            </Aviso>
          )}
          {antesDeEmpezar.map((a) => (
            <Aviso key={a.titulo} nivel={a.nivel} titulo={a.titulo}>
              {a.texto}
            </Aviso>
          ))}
        </section>
      )}

      <section aria-labelledby="reparto">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id="reparto" className="text-lg font-extrabold">
            Cómo se reparte tu plata
          </h2>
          <SelectorUnidad valor={unidad} opciones={unidades} onCambiar={setUnidad} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Tocá cada parte para ver qué es, por qué está en tu plan y qué puede salir mal.</p>
        <div className="mt-4 flex h-3.5 w-full gap-[3px]" role="img" aria-label={posiciones.map((p) => `${p.nombre} ${p.porcentaje}%`).join(", ")}>
          {posiciones.map((p) => (
            <div key={p.categoria} style={{ width: `${p.porcentaje}%` }} className={`${COLOR_CATEGORIA[p.categoria]} h-full min-w-1 rounded-[5px]`} title={`${p.nombre}: ${p.porcentaje}%`} />
          ))}
        </div>

        <Accordion type="multiple" value={abiertas} onValueChange={cambiarAbiertas} className="mt-3">
          {posiciones.map((p) => (
            <AccordionItem key={p.categoria} id={`parte-${p.categoria}`} value={p.categoria} className="scroll-mt-20 border-b border-border">
              <AccordionTrigger className="cursor-pointer py-3.5 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                  <Punto className={COLOR_CATEGORIA[p.categoria]} />
                  <span className="min-w-0 text-left text-base font-medium leading-snug">{p.nombre}</span>
                </span>
                <span className="mr-2 flex shrink-0 items-center gap-2">
                  {capital > 0 && unidad !== "pct" && <span className="text-sm tabular-nums text-muted-foreground">{monto(p.montoInicial)}</span>}
                  <span className="text-lg font-black tabular-nums">{p.porcentaje}%</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5 text-sm">
                <Bloque titulo="Qué es">{p.queEs}</Bloque>
                <Bloque titulo="Por qué está en tu plan">
                  {p.porQueEnTuCartera} {p.ventaja}
                </Bloque>
                <QuePuedeSalirMal pie={`Cuánto sube y baja: ${CUANTO_SE_MUEVE[p.volatilidad]}`}>{p.queSalePuedeMal}</QuePuedeSalirMal>
                <VerDondeConviene posicion={p} />
                {CATEGORIAS_CON_EJEMPLOS.includes(p.categoria) ? (
                  <VerEjemplos categoria={p.categoria} perfil={perfil.perfil} />
                ) : (
                  // Liquidez y alternativos: siguen los ejemplos genéricos del catálogo de FinBot.
                  <details className="group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                      Ejemplos para investigar
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                    </summary>
                    <ul className="space-y-1.5">
                      {p.ejemplos.map((e) => (
                        <li key={e.nombre} className="text-sm leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">{e.nombre}</span> · {e.tipoInstrumento}. {e.porQue}
                        </li>
                      ))}
                    </ul>
                    <TextoLegal className="mt-2">Son ejemplos educativos, no recomendaciones de compra. Preguntale a FinBot para entenderlos mejor.</TextoLegal>
                  </details>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div>
      <Plegable titulo={`Cómo podría crecer en ${plan.anios} ${plan.anios === 1 ? "año" : "años"}`}>
        {sinMontos || !ultimo ? (
          <p className="text-sm text-muted-foreground">Cargá un capital inicial o un aporte mensual al rehacer tu perfil para ver la proyección.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aportarías {usd(ultimo.aportado)} y podrías tener entre {usd(ultimo.bajo)} y {usd(ultimo.alto)}.
            </p>
            <GraficoProyeccion datos={plan.proyeccion} />
            <TextoLegal>
              Montos en dólares (USD), con supuestos de ejemplo. No restan la inflación, los impuestos ni lo que cobra la app donde invertís, y en un mal año
              el resultado puede quedar por debajo de la zona sombreada.
            </TextoLegal>
          </div>
        )}
      </Plegable>

      <Plegable titulo="Por qué te salió este perfil">
        <div className="space-y-4">
          <p className="text-base leading-snug">{DESCRIPCION_PERFIL[perfil.perfil]}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {perfil.motivos.map((m) => (
              <li key={m} className="flex gap-3">
                <Punto className="mt-1 bg-enlace" />
                {m}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">¿Cambió algo en tu vida? Rehacé tus respuestas y armamos el plan de nuevo.</p>
          <TextoLegal>
            Plan armado el {fecha(plan.generadoEn)}
            {!AUTH_CONFIGURADA ? " · Guardado solo en este navegador" : ""}
          </TextoLegal>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Rehacer mi perfil
            </Link>
          </Button>
        </div>
      </Plegable>
      </div>

      <TextoLegal className="text-center">{DESCARGO}</TextoLegal>
    </div>
  );
}

/** Bloque secundario plegado: lo importante queda arriba, lo demás a un toque. */
function Plegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 font-display text-lg font-extrabold [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

// Para liquidez y renta fija: lleva al comparador con el monto de esa parte precargado.
function VerDondeConviene({ posicion }: { posicion: Posicion }) {
  const href = hrefComparador(posicion);
  if (!href) return null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Compará tasas de plazo fijo, billeteras y fondos en pesos
        {posicion.montoInicial > 0 ? ` para los ${usd(posicion.montoInicial)} de esta parte` : ""}.
      </p>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href={href}>
          <Scale className="h-4 w-4" aria-hidden />
          Ver dónde conviene
        </Link>
      </Button>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-sm font-bold">{titulo}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
