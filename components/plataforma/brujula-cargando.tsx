"use client";

import { useEffect, useRef } from "react";
import { PiezasBrujula } from "@/components/plataforma/brujula";
import { cn } from "@/lib/utils";

// El indicador de carga: la brújula del logo, girando despacio hasta que una de sus cuatro
// puntas apunta al cursor, como si lo buscara. Sin cursor (celular), busca sola.
//
// Movimiento: un resorte lento y algo subamortiguado (llega, se pasa apenas y corrige).
// Solo se toca `transform`, directo sobre cada pieza. El aro sigue a la estrella con un
// pequeño retraso, pero nunca se separa más que la holgura: las puntas no salen de sus cortes.

const RIGIDEZ = 5.5; // 1/s²
const FRENO = 2.9; // 1/s. Con esta rigidez, el período es de unos 2,7 s
const RETRASO_ARO = 4.5; // 1/s
const HOLGURA = 7; // grados. Los cortes del aro dan 13 a cada lado de la punta

/** Última posición conocida del mouse, compartida por todos los indicadores de la página. */
const cursor: { x: number | null; y: number | null } = { x: null, y: null };
let oyentes = 0;
const alMover = (e: PointerEvent) => {
  if (e.pointerType !== "mouse") return;
  cursor.x = e.clientX;
  cursor.y = e.clientY;
};

type Props = {
  /** Lado en píxeles. */
  size?: number;
  /** Lo que anuncia el lector de pantalla, en voseo: "Cargando tu plan". */
  etiqueta: string;
  /** Texto visible debajo de la brújula. Si no se pasa, solo se anuncia la etiqueta. */
  children?: React.ReactNode;
  className?: string;
};

export function BrujulaCargando({ size = 72, etiqueta, children, className }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const aro = useRef<SVGGElement>(null);
  const estrella = useRef<SVGGElement>(null);

  useEffect(() => {
    const nodoSvg = svg.current, nodoAro = aro.current, nodoEstrella = estrella.current;
    if (!nodoSvg || !nodoAro || !nodoEstrella) return;
    // Con movimiento reducido no gira nada: el aro late con suavidad (lo hace la clase de CSS).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (oyentes++ === 0) window.addEventListener("pointermove", alMover, { passive: true });

    let angulo = 0, velocidad = 0, anguloAro = 0, antes = 0, cuadro = 0;
    const fase = Math.random() * 6;

    const destino = (seg: number) => {
      // Vaivén propio: mantiene vivo el indicador aunque el cursor esté quieto.
      const vaiven = 5 * Math.sin(seg * 1.5 + fase) + 2.5 * Math.sin(seg * 3.4 + fase * 2);
      if (cursor.x === null || cursor.y === null) {
        return 22 * Math.sin(seg * 0.75 + fase) + 9 * Math.sin(seg * 1.9 + fase) + vaiven * 0.4;
      }
      const r = nodoSvg.getBoundingClientRect();
      const haciaCursor = (Math.atan2(cursor.x - (r.left + r.width / 2), -(cursor.y - (r.top + r.height / 2))) * 180) / Math.PI;
      // Cualquiera de las cuatro puntas sirve: se elige el cuarto de vuelta más cercano a donde ya está.
      return haciaCursor + Math.round((angulo - haciaCursor) / 90) * 90 + vaiven;
    };

    const paso = (ahora: number) => {
      const dt = Math.min((ahora - (antes || ahora)) / 1000, 0.05);
      antes = ahora;
      velocidad += (RIGIDEZ * (destino(ahora / 1000) - angulo) - FRENO * velocidad) * dt;
      angulo += velocidad * dt;
      anguloAro += (angulo - anguloAro) * (1 - Math.exp(-RETRASO_ARO * dt));
      anguloAro = Math.max(angulo - HOLGURA, Math.min(angulo + HOLGURA, anguloAro));
      nodoEstrella.style.transform = `rotate(${angulo.toFixed(2)}deg)`;
      nodoAro.style.transform = `rotate(${anguloAro.toFixed(2)}deg)`;
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);

    return () => {
      cancelAnimationFrame(cuadro);
      if (--oyentes === 0) window.removeEventListener("pointermove", alMover);
    };
  }, []);

  return (
    <div role="status" aria-label={etiqueta} className={cn("flex flex-col items-center gap-4 text-center", className)}>
      <svg ref={svg} width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0 overflow-visible">
        <PiezasBrujula grueso={size < 32} refAro={aro} refEstrella={estrella} claseAro="motion-reduce:animate-pulse" />
      </svg>
      {children && <p className="text-base font-semibold text-foreground">{children}</p>}
    </div>
  );
}
