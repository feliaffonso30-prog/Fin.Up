import type { ResultadoFuente } from "@/lib/comparador/respaldo";
import { fecha } from "@/lib/plataforma/formato";
import { DISCLAIMER_COMPARADOR } from "@/lib/plataforma/comparador/textos";
import type { Fuente } from "@/lib/plataforma/comparador/tipos";
import { Aviso } from "@/components/plataforma/primitivas";

export function Disclaimer() {
  return (
    <Aviso nivel="info" role="note">
      {DISCLAIMER_COMPARADOR}
    </Aviso>
  );
}

/** Fuente, fecha del dato y aviso si la fuente falló. */
export function FuenteDato({
  fuente,
  resultado,
  fechaDato,
}: {
  fuente: Fuente;
  resultado: ResultadoFuente<unknown>;
  fechaDato?: string | null;
}) {
  return (
    <div className="space-y-2">
      {resultado.aviso && (
        <Aviso nivel="atencion" role="status" compacto>
          {resultado.aviso}
        </Aviso>
      )}
      <p className="text-legal leading-snug text-muted-foreground/80">
        Fuente:{" "}
        <a href={fuente.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {fuente.nombre}
        </a>
        {fechaDato && <> · Datos al {fecha(fechaDato)}</>}
        {resultado.actualizadoEn && <> · Consultado el {fecha(resultado.actualizadoEn)}</>}
      </p>
    </div>
  );
}
