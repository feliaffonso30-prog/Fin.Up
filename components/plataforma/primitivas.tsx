import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Brujula } from "@/components/plataforma/brujula";
import type { Categoria } from "@/lib/plataforma/tipos";
import { cn } from "@/lib/utils";

// Piezas visuales que se repiten en toda la plataforma. Usan solo tokens de app/globals.css,
// así el tema se cambia en un lugar.

/** Marcador chico para listas, leyendas y muestras de color. */
export function Punto({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]", className)} />;
}

/** El logo: la brújula y el nombre. El símbolo acompaña el tamaño del texto. */
export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.22em] font-display text-2xl font-black leading-none tracking-[-0.04em] text-foreground", className)}>
      <Brujula size="1.12em" grueso />
      finup
    </span>
  );
}

/** Encabezado de cada pantalla: título y bajada. */
export function EncabezadoPagina({ titulo, children }: { titulo: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="space-y-3">
      <h1 className="text-4xl font-black leading-none text-foreground md:text-5xl">{titulo}</h1>
      {children && <div className="max-w-2xl text-base leading-relaxed text-muted-foreground">{children}</div>}
    </header>
  );
}

// ---------- Avisos ----------

type NivelAviso = "info" | "atencion" | "error";

const ESTILO_AVISO: Record<NivelAviso, { caja: string; icono: string; titulo: string }> = {
  info: { caja: "vidrio", icono: "text-info", titulo: "text-foreground" },
  atencion: { caja: "vidrio-mal", icono: "text-atencion", titulo: "text-foreground" },
  error: { caja: "border border-error/40 bg-error/10", icono: "text-error", titulo: "text-error" },
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
    <div role={role} className={cn("flex gap-3 rounded-xl", compacto ? "p-3" : "p-4", estilo.caja, className)}>
      <Icono className={cn("mt-0.5 h-4 w-4 shrink-0", estilo.icono)} aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {titulo && <p className={cn("text-sm font-semibold", estilo.titulo)}>{titulo}</p>}
        <div className={cn("text-sm leading-relaxed", nivel === "error" ? "text-error" : "text-foreground/90")}>{children}</div>
      </div>
    </div>
  );
}

/** El bloque de "qué puede salir mal": el corazón del producto, siempre con el mismo aspecto. */
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
    <div className={cn("vidrio-mal rounded-lg p-4", className)}>
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-atencion">{titulo}</p>
      <div className="text-sm leading-relaxed text-atencion-texto/90">{children}</div>
      {pie && <p className="mt-2 text-sm text-atencion-texto/80">{pie}</p>}
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
export function Dato({
  titulo,
  valor,
  nota,
  valorClase,
  malEscenario,
}: {
  titulo: string;
  valor: string;
  nota: string;
  valorClase?: string;
  /** Marca la cifra del escenario malo con el vidrio lavanda. */
  malEscenario?: boolean;
}) {
  return (
    <div className={cn("rounded-lg p-4", malEscenario ? "vidrio-mal" : "vidrio")}>
      <p className="text-sm font-semibold text-muted-foreground">{titulo}</p>
      <p className={cn("mt-1.5 font-display text-2xl font-extrabold tabular-nums tracking-tight", valorClase)}>{valor}</p>
      <p className="mt-1 text-legal text-muted-foreground">{nota}</p>
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
