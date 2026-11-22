import { cn } from "@/lib/utils";

// El símbolo de FinUp: una rosa de los vientos de ocho puntas con el aro cortado donde pasan
// las puntas largas y el eje en el centro. Se dibuja en una grilla de 64 x 64.
// Hay dos dibujos: el fino (32 px o más) y el grueso, para tamaños chicos.

const C = 32;

function puntosEstrella(largo: number, cintura: number) {
  const p = C - cintura, q = C + cintura, a = C - largo, z = C + largo;
  return `${C},${a} ${q},${p} ${z},${C} ${q},${q} ${C},${z} ${p},${q} ${a},${C} ${p},${p}`;
}

function puntosDiagonales(alcance: number, base: number) {
  const a = C - alcance, z = C + alcance;
  return `${z},${a} ${C + base},${C} ${z},${z} ${C},${C + base} ${a},${z} ${C - base},${C} ${a},${a} ${C},${C - base}`;
}

/** Un arco del aro (el del cuadrante noreste); los otros tres son este mismo girado. */
function arco(radio: number, corte: number) {
  const pt = (grados: number) => {
    const r = (grados * Math.PI) / 180;
    return `${(C + radio * Math.sin(r)).toFixed(2)} ${(C - radio * Math.cos(r)).toFixed(2)}`;
  };
  return `M${pt(corte)}A${radio} ${radio} 0 0 1 ${pt(90 - corte)}`;
}

const FINO = { arco: arco(22.5, 13), grosor: 2.4, diagonales: puntosDiagonales(10, 5.8), estrella: puntosEstrella(31, 3.6), eje: 5.2, punto: 2.1 };
const GRUESO = { arco: arco(22, 24), grosor: 5, diagonales: puntosDiagonales(11, 8.5), estrella: puntosEstrella(31, 6), eje: 8, punto: 3.4 };

/** Para que las piezas giren alrededor del centro del dibujo. */
export const GIRO_AL_CENTRO: React.CSSProperties = { transformBox: "view-box", transformOrigin: "32px 32px" };

type PropsPiezas = {
  grueso?: boolean;
  /** Para mover las piezas desde afuera (el indicador de carga). */
  refAro?: React.Ref<SVGGElement>;
  refEstrella?: React.Ref<SVGGElement>;
  claseAro?: string;
};

/** Las piezas del símbolo, para ponerlas dentro de un <svg viewBox="0 0 64 64">. */
export function PiezasBrujula({ grueso, refAro, refEstrella, claseAro }: PropsPiezas) {
  const m = grueso ? GRUESO : FINO;
  return (
    <>
      <g ref={refAro} className={claseAro} style={GIRO_AL_CENTRO} fill="none" stroke="var(--accent)" strokeWidth={m.grosor} strokeLinecap="round">
        {[0, 90, 180, 270].map((giro) => (
          <path key={giro} d={m.arco} transform={`rotate(${giro} ${C} ${C})`} />
        ))}
      </g>
      <g ref={refEstrella} style={GIRO_AL_CENTRO}>
        <polygon points={m.diagonales} fill="var(--accent)" />
        <polygon points={m.estrella} fill="var(--foreground)" />
      </g>
      <circle cx={C} cy={C} r={m.eje} fill="var(--foreground)" />
      <circle cx={C} cy={C} r={m.punto} fill="var(--background)" />
    </>
  );
}

type Props = {
  /** Lado en píxeles, o cualquier medida de CSS ("1.12em" para acompañar un texto). */
  size?: number | string;
  /** Dibujo grueso, para tamaños chicos. Si no se indica, se usa por debajo de 32 px. */
  grueso?: boolean;
  className?: string;
};

/** El símbolo quieto. Es decorativo: el nombre accesible lo pone quien lo usa. */
export function Brujula({ size = 32, grueso, className }: Props) {
  const esGrueso = grueso ?? (typeof size === "number" && size < 32);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={cn("shrink-0 overflow-visible", className)}>
      <PiezasBrujula grueso={esGrueso} />
    </svg>
  );
}
