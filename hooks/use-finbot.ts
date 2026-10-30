"use client";

import { useEffect, useRef, useState } from "react";
import type { ContextoEstrategia, EventoChat, MensajeChat } from "@/lib/finbot/types";

// Conversación con FinBot: historial, envío a /api/chat y lectura del stream
// (una línea JSON por evento). La vista (components/finbot/finbot-chat.tsx)
// se ocupa del panel, el foco y los atajos de teclado.

export function useFinBot(contexto: ContextoEstrategia | null) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  // Texto completo de la última respuesta, para lectores de pantalla (no se anuncia token por token).
  const [anuncio, setAnuncio] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

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

  return { mensajes, input, setInput, cargando, estado, anuncio, enviar };
}
