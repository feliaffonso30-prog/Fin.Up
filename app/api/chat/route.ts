import {
  ApiError,
  FunctionCallingConfigMode,
  GoogleGenAI,
  type Content,
  type FunctionCall,
  type GenerateContentResponse,
  type Part,
} from "@google/genai";
import { z } from "zod";
import { DECLARACIONES, ejecutarHerramienta, etiquetaDe } from "@/lib/finbot/tools";
import { SYSTEM_PROMPT, contextoUsuario } from "@/lib/finbot/prompt";
import type { EventoChat } from "@/lib/finbot/types";
import { consumir, ipDe } from "@/lib/finbot/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Lee GEMINI_API_KEY de .env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Modelos del plan gratuito, en orden de preferencia. Si uno está saturado
// (429/503) se prueba el siguiente.
const MODELOS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];
const MAX_MENSAJES = 20; // historial que se reenvía en cada pregunta
const MAX_VUELTAS = 6; // llamadas a Gemini por pregunta (cada herramienta suma una)

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1),
  contexto: z
    .object({
      edad: z.string().max(3),
      perfil: z.string().max(30),
      objetivo: z.string().max(30),
      distribucion: z
        .array(z.object({ activo: z.string().max(60), porcentaje: z.number(), tipo: z.string().max(20) }))
        .max(10),
      retornoMin: z.number(),
      retornoMax: z.number(),
      caida: z.number(),
      nivelRiesgo: z.string().max(10),
    })
    .nullable(),
});

const saturado = (e: unknown) => e instanceof ApiError && (e.status === 429 || e.status === 503);

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const { contexto } = parsed.data;

  const limite = consumir(ipDe(req));
  if (!limite.permitido) {
    return Response.json(
      {
        error: `Llegaste al máximo de preguntas de la demo por ahora. Podés volver a preguntar en ${limite.minutosParaReintentar} min.`,
      },
      { status: 429 },
    );
  }

  // El historial debe empezar con un mensaje del usuario. Gemini llama "model" al asistente.
  let historial = parsed.data.messages.slice(-MAX_MENSAJES);
  while (historial.length && historial[0].role !== "user") historial = historial.slice(1);
  const contents: Content[] = historial.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const config = {
    systemInstruction: `${SYSTEM_PROMPT}\n\n${contextoUsuario(contexto)}`,
    tools: [{ functionDeclarations: DECLARACIONES }],
    abortSignal: req.signal,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: EventoChat) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      let huboTexto = false;

      try {
        if (!process.env.GEMINI_API_KEY) {
          send({ type: "error", message: "El chat no está configurado: falta la variable GEMINI_API_KEY (en .env.local o en las Environment Variables de Vercel)." });
          return;
        }

        let modelo: string | null = null; // se fija en la primera vuelta que responde
        let forzarTexto = false; // true: Gemini no puede pedir herramientas, tiene que responder
        const usadas: string[] = []; // para el log de diagnóstico

        for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
          // En la última vuelta, o si la anterior vino vacía, obligamos a responder con lo que ya tiene.
          const sinHerramientas = forzarTexto || vuelta === MAX_VUELTAS - 1;
          const cfg = sinHerramientas
            ? { ...config, toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } } }
            : config;

          // Abre el stream; en la primera vuelta prueba modelos hasta que uno responda.
          let respuesta: AsyncGenerator<GenerateContentResponse> | null = null;
          const candidatos: string[] = modelo ? [modelo] : MODELOS;
          for (const m of candidatos) {
            try {
              respuesta = await ai.models.generateContentStream({ model: m, contents, config: cfg });
              modelo = m;
              break;
            } catch (e) {
              if (!saturado(e) || m === MODELOS.at(-1)) throw e;
              console.warn(`[finbot] ${m} saturado, probando el siguiente`);
            }
          }
          if (!respuesta) break;

          // Guardamos las partes tal cual llegan: las llamadas a funciones traen una
          // "thoughtSignature" que Gemini exige recibir de vuelta sin cambios.
          const partes: Part[] = [];
          const llamadas: FunctionCall[] = [];
          let motivoFin: string | undefined;
          // Gemini a veces escribe texto entre los pedidos de herramientas ("el Merval
          // se mueve un…" + pedido del dato). Ese texto es un borrador sin los datos, así
          // que solo se muestra si la vuelta termina sin pedir herramientas. Cuando no
          // puede pedirlas (sinHerramientas) se muestra en vivo.
          let borrador = "";

          for await (const chunk of respuesta) {
            motivoFin = chunk.candidates?.[0]?.finishReason ?? motivoFin;
            for (const p of chunk.candidates?.[0]?.content?.parts ?? []) {
              partes.push(p);
              if (p.functionCall) {
                llamadas.push(p.functionCall);
                send({ type: "status", label: etiquetaDe(p.functionCall.name) });
              } else if (p.text && !p.thought) {
                if (sinHerramientas) {
                  send({ type: "text", text: p.text });
                  huboTexto = true;
                } else borrador += p.text;
              }
            }
          }

          if (!llamadas.length && borrador.trim()) {
            send({ type: "text", text: borrador });
            huboTexto = true;
          }
          const textoVuelta = huboTexto;

          if (!llamadas.length) {
            if (textoVuelta || sinHerramientas) {
              if (!textoVuelta) console.warn("[finbot] respuesta vacía aun sin herramientas", { modelo, motivoFin, usadas });
              break; // respondió (o ya no hay más que intentar): terminamos
            }
            // Vino vacía: lo registramos y en la próxima vuelta lo obligamos a responder.
            console.warn("[finbot] respuesta vacía, se fuerza texto", { modelo, motivoFin, vuelta, usadas });
            forzarTexto = true;
            continue;
          }

          const resultados = await Promise.all(
            llamadas.map(async (fc) => {
              usadas.push(fc.name ?? "?");
              return {
                functionResponse: { id: fc.id, name: fc.name, response: await ejecutarHerramienta(fc.name, fc.args) },
              };
            }),
          );
          contents.push({ role: "model", parts: partes }, { role: "user", parts: resultados });
        }

        if (!huboTexto) {
          console.warn("[finbot] sin texto al final", { modelo, usadas });
          send({ type: "text", text: "No llegué a armar una respuesta. ¿Podés reformular la pregunta?" });
        }
        send({ type: "done" });
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[finbot]", err);
          let message = "Tuve un problema para responder. Probá de nuevo en un momento.";
          if (saturado(err)) message = "Llegamos al límite gratuito de consultas por ahora. Esperá un minuto y volvé a intentar.";
          else if (err instanceof ApiError && (err.status === 400 || err.status === 403) && /API key/i.test(err.message))
            message = "La API key de Gemini no es válida. Revisá GEMINI_API_KEY en .env.local.";
          // Si el stream se cortó a mitad de respuesta, el aviso va en un párrafo aparte.
          if (huboTexto) message = `\n\n(Se cortó la respuesta. ${message})`;
          send({ type: "error", message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
