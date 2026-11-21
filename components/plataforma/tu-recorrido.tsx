"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Punto } from "@/components/plataforma/primitivas";
import { abrirFinBot } from "@/lib/finbot/abrir";
import type { IdPaso, PasoRecorrido } from "@/lib/plataforma/recorrido";
import type { useRecorrido } from "@/hooks/use-recorrido";

type Recorrido = ReturnType<typeof useRecorrido>;

/** El recorrido guiado: el paso que sigue, cuánto falta y la lista completa. Nada se bloquea. Vive en Inicio. */
export function TuRecorrido({ recorrido }: { recorrido: Recorrido }) {
  const { pasos, hechos, actual, cantidad, oculto, listo, marcar, setOculto } = recorrido;
  const [anuncio, setAnuncio] = useState("");

  // Hasta leer el avance guardado, un lugar vacío del mismo tamaño (sin saltos ni pasos equivocados).
  if (!listo) return <div aria-hidden className="vidrio h-64 rounded-2xl" />;

  if (oculto) {
    return (
      <div className="flex justify-start">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOculto(false)} className="text-muted-foreground">
          Mostrar tu recorrido
        </Button>
      </div>
    );
  }

  function hacer(paso: PasoRecorrido) {
    marcar(paso.id);
    const sigue = pasos.find((p) => p.id !== "perfil" && p.id !== paso.id && !hechos.includes(p.id));
    setAnuncio(sigue ? `Sigue: ${sigue.corto}.` : "Terminaste el recorrido.");
    if (paso.accion?.tipo === "finbot") abrirFinBot(paso.accion.pregunta);
  }

  const accion = actual?.accion;
  const estadoDe = (id: IdPaso) => (id === "perfil" || hechos.includes(id) ? "hecho" : actual?.id === id ? "ahora" : "falta");
  // Tocar un paso no significa haberlo cumplido: solo el perfil está hecho de verdad.
  const rotulo = (id: IdPaso) => (id === "perfil" ? "Hecho" : estadoDe(id) === "hecho" ? "Lo viste" : estadoDe(id) === "ahora" ? "Ahora" : "");

  return (
    <section aria-labelledby="recorrido" className="bloque-azul min-w-0 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold tabular-nums">{actual ? `Paso ${pasos.indexOf(actual) + 1} de ${pasos.length}` : "Recorrido completo"}</p>
        <button type="button" onClick={() => setOculto(true)} className="min-h-10 text-right text-sm underline underline-offset-2">
          Ocultar
        </button>
      </div>

      {/* Avance: un segmento por paso */}
      <div className="mt-1 flex gap-1" aria-hidden>
        {pasos.map((p) => (
          <span key={p.id} className={`h-1.5 flex-1 rounded-full ${estadoDe(p.id) === "hecho" ? "bg-white" : estadoDe(p.id) === "ahora" ? "bg-white/60" : "bg-white/25"}`} />
        ))}
      </div>

      {actual ? (
        <>
          <h2 id="recorrido" className="mt-4 text-[1.625rem] font-black leading-[1.05] tracking-[-0.025em]">
            {actual.titulo}
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-snug">{actual.texto}</p>
          <div className="mt-4">
            {accion?.tipo === "enlace" ? (
              <Button asChild className="h-auto min-h-12 w-full whitespace-normal rounded-md py-2 text-base font-extrabold">
                <Link href={accion.href} onClick={() => hacer(actual)}>
                  {accion.etiqueta} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            ) : accion?.tipo === "finbot" ? (
              <Button type="button" onClick={() => hacer(actual)} className="h-auto min-h-12 w-full whitespace-normal rounded-md py-2 text-base font-extrabold">
                <Bot className="h-4 w-4" aria-hidden />
                {accion.etiqueta}
              </Button>
            ) : accion?.tipo === "parte" ? (
              // La parte se explica en Mi plan: el enlace la abre y la lleva a la vista.
              <Button asChild className="h-auto min-h-12 w-full whitespace-normal rounded-md py-2 text-base font-extrabold">
                <Link href={`/dashboard#parte-${accion.categoria}`} onClick={() => hacer(actual)}>
                  {accion.etiqueta} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <h2 id="recorrido" className="mt-4 text-[1.625rem] font-black leading-[1.05] tracking-[-0.025em]">
            Ya recorriste lo básico para decidir
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-snug">
            No hace falta que inviertas hoy: decidir con calma también es decidir bien. Si cambia algo en tu vida, rehacé tu perfil.
          </p>
        </>
      )}

      <details className="group mt-3">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Ver todos los pasos
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <ol className="mt-2 space-y-2">
          {pasos.map((p) => {
            const e = estadoDe(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <Punto className={e === "falta" ? "border border-white/60 bg-transparent" : "bg-white"} />
                <span className={e === "ahora" ? "font-bold" : ""}>{p.corto}</span>
                <span className="ml-auto shrink-0 text-sm">{rotulo(p.id)}</span>
              </li>
            );
          })}
        </ol>
      </details>

      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>
    </section>
  );
}
