"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { EVENTO_ABRIR_FINBOT, type DetalleAbrirFinBot } from "@/lib/finbot/abrir";
import type { ContextoEstrategia, EventoChat, MensajeChat } from "@/lib/finbot/types";

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

// Markdown mínimo: **negrita**, listas con "- " y párrafos.
function Formato({ texto }: { texto: string }) {
  const negrita = (linea: string) =>
    linea.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p,
    );
  return (
    <>
      {texto.split(/\n{2,}/).map((bloque, i) => {
        const lineas = bloque.split("\n").filter(Boolean);
        if (lineas.length && lineas.every((l) => /^\s*[-•*]\s/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-4 space-y-1 my-1.5">
              {lineas.map((l, j) => <li key={j}>{negrita(l.replace(/^\s*[-•*]\s/, ""))}</li>)}
            </ul>
          );
        }
        return (
          <p key={i} className="my-1.5 first:mt-0 last:mb-0">
            {lineas.map((l, j) => (
              <React.Fragment key={j}>{j > 0 && <br />}{negrita(l)}</React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function FinBotChat({ contexto }: { contexto: ContextoEstrategia | null }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  // Solo devolvemos el foco al botón flotante cuando el usuario cerró el panel (no en el primer render).
  const devolverFocoRef = useRef(false);
  // Texto completo de la última respuesta, para lectores de pantalla (no se anuncia token por token).
  const [anuncio, setAnuncio] = useState("");

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

  useEffect(() => () => abortRef.current?.abort(), []);

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

  async function enviar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || cargando) return;

    const historial: MensajeChat[] = [...mensajes, { role: "user", content: pregunta }];
    setMensajes([...historial, { role: "assistant", content: "" }]);
    setInput("");
    setCargando(true);
    setEstado("Pensando…");
    setAnuncio("");

    let respuesta = "";
    let abortado = false;
    const agregar = (t: string) => {
      respuesta += t;
      setMensajes((prev) => {
        const copia = [...prev];
        const ultimo = copia[copia.length - 1];
        copia[copia.length - 1] = { ...ultimo, content: ultimo.content + t };
        return copia;
      });
    };

    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historial, contexto }),
        signal: abortRef.current.signal,
      });
      if (res.status === 429) {
        const { error } = await res.json().catch(() => ({ error: null }));
        agregar(error ?? "Llegaste al máximo de preguntas de la demo por ahora. Probá más tarde.");
        return;
      }
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n");
        buffer = lineas.pop() ?? "";
        for (const linea of lineas) {
          if (!linea) continue;
          const ev = JSON.parse(linea) as EventoChat;
          if (ev.type === "text") {
            setEstado(null);
            agregar(ev.text);
          } else if (ev.type === "status") setEstado(ev.label);
          else if (ev.type === "error") agregar(ev.message);
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") abortado = true;
      else agregar("No pude conectarme. Revisá tu conexión y probá de nuevo.");
    } finally {
      setCargando(false);
      setEstado(null);
      // Un solo anuncio con la respuesta completa (o el mensaje de error) cuando termina el stream.
      if (!abortado && respuesta) setAnuncio(respuesta);
      // Si el asistente no llegó a responder, sacamos la burbuja vacía.
      setMensajes((prev) => (prev.at(-1)?.content ? prev : prev.slice(0, -1)));
    }
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {anuncio}
      </div>

      {!abierto && (
        <button
          ref={botonRef}
          onClick={abrir}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-xl shadow-primary/20 transition-transform hover:scale-105 cursor-pointer"
        >
          <Bot className="h-5 w-5" />
          Preguntale a FinBot
        </button>
      )}

      {abierto && (
        <div
          role="dialog"
          aria-labelledby="finbot-titulo"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-md sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p id="finbot-titulo" className="text-sm font-semibold leading-tight">FinBot</p>
                <p className="text-legal text-muted-foreground leading-tight truncate">
                  {contexto ? `Conoce tu perfil ${contexto.perfil.toLowerCase()}` : "Mercado en vivo y conceptos simples"}
                </p>
              </div>
            </div>
            <button onClick={cerrar} aria-label="Cerrar chat" className="rounded-md p-1 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-4 w-4" />
            </button>
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
                      className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left text-xs text-foreground/90 transition-colors hover:border-enlace cursor-pointer"
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
                <div key={i} className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-primary-foreground break-words">
                  {m.content}
                </div>
              ) : m.content ? (
                <div key={i} className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-secondary/40 px-3.5 py-2.5 leading-relaxed text-foreground/90 break-words">
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
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={cargando || !input.trim()}
                aria-label="Enviar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
