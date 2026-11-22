import { calcularEscenarios } from "@/lib/plataforma/escenarios";
import { montoConSigno, pctConSigno, rangoConSigno, usd } from "@/lib/plataforma/formato";
import type { Analisis } from "@/lib/plataforma/tipos";
import type { Unidad } from "@/components/plataforma/selector-unidad";
import { cn } from "@/lib/utils";

// Lo bueno y lo malo de un año, siempre juntos y del mismo tamaño: es la firma de FinUp.
// El mal año va en lavanda; lo distinguen la etiqueta y el signo menos, no un color de alarma.

type Props = { analisis: Analisis; capital: number };

const rangoPct = (a: Analisis) => `${pctConSigno(a.retornoMin)} a ${pctConSigno(a.retornoMax).replace("+", "")}`;

// Hasta acá el rango entra en media tarjeta o en una tarjeta grande, en una sola línea.
const LARGO_TARJETA_CHICA = 8;
const LARGO_TARJETA_GRANDE = 13;

type PropsCompactos = Props & {
  /** En qué se muestran: porcentaje, pesos o dólares. Si no se indica, dólares cuando hay monto. */
  unidad?: Unidad;
  /** Cotización para pasar a pesos. */
  mep?: number | null;
  /** El año normal va en el bloque azul (el protagonista de la pantalla). El mal año mide y pesa lo mismo. */
  destacado?: boolean;
  className?: string;
};

/** Versión chica, para la portada y Mi plan: el título de arriba aclara el monto y la moneda. */
export function EscenariosCompactos({ analisis, capital, unidad, mep, destacado, className }: PropsCompactos) {
  const e = calcularEscenarios(capital, analisis);
  const enPesos = unidad === "ars" && capital > 0 && !!mep;
  const conMonto = capital > 0 && unidad !== "pct" && (unidad !== "ars" || enPesos);
  const factor = enPesos && mep ? mep : 1;
  const normal = conMonto ? rangoConSigno(e.ganaMin * factor, e.ganaMax * factor, false) : rangoPct(analisis);
  const malo = conMonto ? montoConSigno(e.pierde * factor, false) : pctConSigno(analisis.caida, 0);
  // Si el rango no entra, se apilan: las dos cifras siguen midiendo y pesando lo mismo.
  const apiladas = normal.length > LARGO_TARJETA_CHICA;
  const cifra = "mt-0.5 text-[clamp(1.5rem,8vw,1.875rem)] font-black leading-[1.1] tracking-[-0.03em]";
  return (
    <dl className={cn("grid gap-2.5", apiladas ? "grid-cols-1" : "grid-cols-2", className)}>
      <div className={destacado ? "bloque-azul rounded-2xl p-5" : "vidrio rounded-lg p-3.5"}>
        <dt className="text-sm font-semibold">Año normal</dt>
        <dd className={cifra}>{normal}</dd>
      </div>
      <div className={cn("vidrio-mal", destacado ? "rounded-2xl p-5" : "rounded-lg p-3.5")}>
        <dt className="text-sm font-semibold">Mal año</dt>
        <dd className={cn(cifra, "text-atencion")}>{malo}</dd>
      </div>
    </dl>
  );
}

/** Versión grande, para el resultado. `revelar` les da su lugar en la entrada escalonada. */
export function EscenariosGrandes({ analisis, capital }: Props) {
  const e = calcularEscenarios(capital, analisis);
  const conMonto = capital > 0;
  const normal = conMonto ? rangoConSigno(e.ganaMin, e.ganaMax) : rangoPct(analisis);
  const malo = conMonto ? montoConSigno(e.pierde) : pctConSigno(analisis.caida, 0);
  const cifra = cn("font-black leading-[1.05] tracking-[-0.04em]", normal.length > LARGO_TARJETA_GRANDE ? "text-[clamp(1.5rem,7.6vw,1.875rem)]" : "text-[clamp(2rem,10vw,2.375rem)]");
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      <div className="bloque-azul revelar rounded-2xl p-5" style={{ "--orden": 3 } as React.CSSProperties}>
        <dt className="text-sm font-semibold">En un año normal</dt>
        <dd className={cifra}>{normal}</dd>
        <dd className="mt-1 text-sm">Estimado, según cómo venga el año</dd>
      </div>
      <div className="vidrio-mal revelar rounded-2xl p-5" style={{ "--orden": 4 } as React.CSSProperties}>
        <dt className="text-sm font-semibold">En un mal año</dt>
        <dd className={cn(cifra, "text-atencion")}>{malo}</dd>
        <dd className="mt-1 text-sm">{conMonto ? `Te quedarían unos ${usd(e.queda)}` : "Así de fuerte podría caer tu plan"}</dd>
      </div>
    </dl>
  );
}
