"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { EVENTO_ABRIR_FINBOT, type DetalleAbrirFinBot } from "@/lib/finbot/abrir";
import type { ContextoEstrategia } from "@/lib/finbot/types";
import { useFinBot } from "@/hooks/use-finbot";
import { Formato } from "./formato";
import { Filo } from "@/components/plataforma/primitivas";

const SUGERENCIAS_BASE = [
  "¿Qué es un CEDEAR?",
  "¿Cuál es la diferencia entre un bono y una acción?",
  "¿A cuánto está el dólar MEP hoy?",
  "¿Cómo se movió hoy el mercado?",
];

function sugerencias(ctx: ContextoEstrategia | null) {
  if (!ctx) return SUGERENCIAS_BASE;
  const principal = ctx.distribucion[0]?.activo;
  return [
    "¿Por qué esta estrategia encaja con mi perfil?",
    principal ? `¿Con qué activos puedo armar "${principal}"?` : "¿En qué activos puedo invertir?",
    "¿Cómo están hoy el Merval y el S&P 500?",
    "¿Qué es un CEDEAR?",
  ];
}

export function FinBotChat({ contexto }: { contexto: ContextoEstrategia | null }) {
  const [abierto, setAbierto] = useState(false);
  const { mensajes, input, setInput, cargando, estado, anuncio, enviar } = useFinBot(contexto);
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  // Solo devolvemos el foco al botón flotante cuando el usuario cerró el panel (no en el primer render).
  const devolverFocoRef = useRef(false);

  useEffect(() => {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    finRef.current?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "end" });
  }, [mensajes, estado]);

  function abrir() {
    setAbierto(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cerrar() {
    devolverFocoRef.current = true;
    setAbierto(false);
  }

  // Al cerrar, el botón flotante se vuelve a montar: le devolvemos el foco después del render.
  useEffect(() => {
    if (!abierto && devolverFocoRef.current) {
      devolverFocoRef.current = false;
      botonRef.current?.focus();
    }
  }, [abierto]);

  // Esc cierra el panel; el listener existe solo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  // Otras pantallas pueden abrir el chat con una pregunta precargada (ver lib/finbot/abrir.ts).
  useEffect(() => {
    const alAbrir = (e: Event) => {
      const { pregunta } = (e as CustomEvent<DetalleAbrirFinBot>).detail ?? {};
      setAbierto(true);
      if (pregunta) setInput(pregunta);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener(EVENTO_ABRIR_FINBOT, alAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR_FINBOT, alAbrir);
  }, []);

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {anuncio}
      </div>

      {!abierto && (
        <button
          ref={botonRef}
          onClick={abrir}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover active:bg-primary-active font-display shadow-[0_24px_48px_-12px_rgba(2,6,23,0.6),inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors cursor-pointer"
        >
          <Bot className="h-5 w-5" />
          Preguntale a FinBot
        </button>
      )}

      {abierto && (
        <div
          role="dialog"
          aria-labelledby="finbot-titulo"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_48px_-12px_rgba(2,6,23,0.6)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <header className="relative flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p id="finbot-titulo" className="font-display text-sm font-bold leading-tight">FinBot</p>
                <p className="text-legal text-muted-foreground leading-tight truncate">
                  {contexto ? `Conoce tu perfil ${contexto.perfil.toLowerCase()}` : "Mercado en vivo y conceptos simples"}
                </p>
              </div>
            </div>
            <button
              onClick={cerrar}
              aria-label="Cerrar chat"
              className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <Filo className="absolute inset-x-0 bottom-0" />
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {mensajes.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  ¡Hola! Soy <span className="text-foreground font-medium">FinBot</span>. Preguntame qué es un bono o un CEDEAR,
                  cómo está el mercado hoy, o con qué activos podrías armar tu estrategia.
                </p>
                <div className="flex flex-col gap-2">
                  {sugerencias(contexto).map((s) => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-foreground/90 transition-colors hover:border-enlace cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] w-fit rounded-lg rounded-br-sm bg-secondary px-3.5 py-2 text-foreground break-words">
                  {m.content}
                </div>
              ) : m.content ? (
                <div key={i} className="max-w-[95%] border-l-2 border-enlace/60 py-0.5 pl-3 leading-relaxed text-foreground/90 break-words">
                  <Formato texto={m.content} />
                </div>
              ) : null,
            )}

            {/* Siempre en el DOM para que el lector de pantalla detecte los cambios. Incluye el ancla
                de scroll y su propio space-y-3 para que el espaciado quede igual que antes. */}
            <div role="status" aria-live="polite" className="space-y-3">
              {estado && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  {estado}
                </div>
              )}
              <div ref={finRef} />
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(input);
            }}
            className="border-t border-border p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                aria-label="Escribí tu pregunta para FinBot"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
                placeholder="Escribí tu pregunta…"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={cargando || !input.trim()}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-legal leading-snug text-muted-foreground/70">
              Contenido educativo, no es asesoramiento financiero. Los precios pueden tener demora.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
