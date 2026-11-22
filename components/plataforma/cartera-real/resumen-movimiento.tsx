"use client";

// "Cómo se movió": tres frases armadas con datos, hasta dos noticias de medios serios
// sobre lo que más se movió y FinBot con la pregunta ya escrita (la persona la manda).

import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abrirFinBot } from "@/lib/finbot/abrir";
import type { Noticia } from "@/lib/plataforma/cartera-real/noticias";
import type { Resumen } from "@/lib/plataforma/cartera-real/resumen";
import { fecha } from "@/lib/plataforma/formato";

function useNoticias(clave: string | null): Noticia[] {
  const [noticias, setNoticias] = useState<{ clave: string; lista: Noticia[] } | null>(null);
  useEffect(() => {
    if (!clave) return;
    const ctrl = new AbortController();
    fetch(`/api/noticias?clave=${encodeURIComponent(clave)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { noticias: [] }))
      .then((d: { noticias: Noticia[] }) => setNoticias({ clave, lista: d.noticias ?? [] }))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [clave]);
  return clave && noticias?.clave === clave ? noticias.lista : [];
}

export function ResumenMovimiento({ resumen }: { resumen: Resumen }) {
  const clave = resumen.protagonista?.tenencia.simbolo ?? null;
  const noticias = useNoticias(clave);
  if (resumen.frases.length === 0) return null;

  return (
    <section aria-labelledby="como-se-movio" className="vidrio space-y-4 rounded-xl p-5">
      <h2 id="como-se-movio" className="text-lg font-extrabold">
        Cómo se movió
      </h2>
      <p className="max-w-2xl text-base leading-relaxed">{resumen.frases.join(" ")}</p>

      {noticias.length > 0 && resumen.protagonista && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Noticias sobre {resumen.protagonista.tenencia.nombre} (pueden tener que ver o no con el movimiento):
          </p>
          <ul className="space-y-1.5">
            {noticias.map((n) => (
              <li key={n.link}>
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 items-start gap-2 text-sm leading-snug">
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span>
                    <span className="font-medium group-hover:underline">{n.titulo}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {n.medio}, {fecha(n.fecha.slice(0, 10))}
                    </span>
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="outline" onClick={() => abrirFinBot(resumen.preguntaFinBot)}>
        <MessageCircle className="h-4 w-4" aria-hidden />
        Preguntale a FinBot qué pasó
      </Button>
    </section>
  );
}
