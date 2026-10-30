import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Categoria } from "@/lib/plataforma/tipos";
import { cn } from "@/lib/utils";

// Piezas visuales que se repiten en toda la plataforma. Usan solo tokens de app/globals.css,
// así el tema se cambia en un lugar.

/** Etiqueta chica en mayúsculas arriba de un título o de un bloque. */
export function Sobretitulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold uppercase tracking-widest text-enlace", className)}>{children}</p>;
}

// ---------- Avisos ----------

type NivelAviso = "info" | "atencion" | "error";

const ESTILO_AVISO: Record<NivelAviso, { caja: string; icono: string; titulo: string }> = {
  info: { caja: "border-info/20 bg-info/10", icono: "text-info", titulo: "text-info" },
  atencion: { caja: "border-atencion/25 bg-atencion/10", icono: "text-atencion", titulo: "text-atencion" },
  error: { caja: "border-error/40 bg-error/10", icono: "text-error", titulo: "text-error" },
};

const ICONO_AVISO = { info: Info, atencion: AlertTriangle, error: CircleAlert } satisfies Record<NivelAviso, unknown>;

type PropsAviso = {
  nivel: NivelAviso;
  titulo?: string;
  children: React.ReactNode;
  /** "note" para avisos fijos, "status" para estados, "alert" para errores que hay que anunciar. */
  role?: "note" | "status" | "alert";
  compacto?: boolean;
  className?: string;
};

export function Aviso({ nivel, titulo, children, role, compacto, className }: PropsAviso) {
  const estilo = ESTILO_AVISO[nivel];
  const Icono = ICONO_AVISO[nivel];
  return (
    <div role={role} className={cn("flex gap-3 rounded-xl border", compacto ? "p-3" : "p-4", estilo.caja, className)}>
      <Icono className={cn("mt-0.5 h-4 w-4 shrink-0", estilo.icono)} aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {titulo && <p className={cn("text-sm font-semibold", estilo.titulo)}>{titulo}</p>}
        <div className={cn("text-xs leading-relaxed", nivel === "error" ? "text-error" : "text-foreground/85")}>{children}</div>
      </div>
    </div>
  );
}

/** El bloque de "qué puede salir mal": el corazón del anti-humo, siempre con el mismo aspecto. */
export function QuePuedeSalirMal({
  titulo = "Qué puede salir mal",
  children,
  pie,
  className,
}: {
  titulo?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-atencion/20 bg-atencion/10 p-3", className)}>
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-atencion">{titulo}</p>
      <div className="text-sm leading-relaxed text-atencion-texto/90">{children}</div>
      {pie && <p className="mt-2 text-xs text-atencion-texto/75">{pie}</p>}
    </div>
  );
}

// ---------- Riesgo ----------

export type NivelRiesgoVisual = "bajo" | "medio" | "alto";

const ESTILO_RIESGO: Record<NivelRiesgoVisual, { insignia: string; barra: string; llenas: number }> = {
  bajo: { insignia: "border-riesgo-bajo/30 bg-riesgo-bajo/10 text-riesgo-bajo", barra: "bg-riesgo-bajo", llenas: 1 },
  medio: { insignia: "border-riesgo-medio/30 bg-riesgo-medio/10 text-riesgo-medio", barra: "bg-riesgo-medio", llenas: 2 },
  alto: { insignia: "border-riesgo-alto/40 bg-riesgo-alto/10 text-riesgo-alto", barra: "bg-riesgo-alto", llenas: 3 },
};

/** Insignia de riesgo con barras 1/2/3: el nivel no depende solo del color. */
export function InsigniaRiesgo({ nivel, etiqueta, className }: { nivel: NivelRiesgoVisual; etiqueta: string; className?: string }) {
  const estilo = ESTILO_RIESGO[nivel];
  return (
    <Badge variant="outline" className={cn("gap-1.5", estilo.insignia, className)}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn("w-1 rounded-[1px]", n <= estilo.llenas ? estilo.barra : "bg-current opacity-25")}
            style={{ height: 4 + n * 2 }}
          />
        ))}
      </span>
      {etiqueta}
    </Badge>
  );
}

// ---------- Cifras y textos ----------

/** Una cifra con su título y una nota corta debajo. */
export function Dato({ titulo, valor, nota, valorClase }: { titulo: string; valor: string; nota: string; valorClase?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className={cn("mt-1 font-display text-xl font-semibold", valorClase)}>{valor}</p>
      <p className="mt-1 text-legal text-muted-foreground/80">{nota}</p>
    </div>
  );
}

/** Avisos legales y notas al pie: tamaño mínimo de 12px, nunca escondidos. */
export function TextoLegal({
  children,
  tono = "neutro",
  className,
}: {
  children: React.ReactNode;
  tono?: "neutro" | "atencion";
  className?: string;
}) {
  return (
    <p className={cn("text-legal", tono === "atencion" ? "text-atencion-texto/80" : "text-muted-foreground/80", className)}>{children}</p>
  );
}

// ---------- Partes de la cartera ----------

/** Color de cada parte de la cartera. Vive en la UI, no en el plan guardado. */
export const COLOR_CATEGORIA: Record<Categoria, string> = {
  fija: "bg-cat-fija",
  variable: "bg-cat-variable",
  dividendos: "bg-cat-dividendos",
  liquidez: "bg-cat-liquidez",
  alternativo: "bg-cat-alternativo",
};
