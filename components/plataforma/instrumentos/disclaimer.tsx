import { Aviso } from "@/components/plataforma/primitivas";
import { fecha } from "@/lib/plataforma/formato";
import { LISTA_EN_BORRADOR, LISTA_REVISADA_EL } from "@/lib/plataforma/instrumentos/datos";
import { AVISO_BORRADOR, DISCLAIMER_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/textos";

/** Aviso fijo de la sección: va en el listado y en cada ficha. */
export function DisclaimerInstrumentos() {
  return (
    <div className="space-y-2">
      <Aviso nivel="info" role="note">
        <p>{DISCLAIMER_INSTRUMENTOS}</p>
        <p className="mt-1 text-muted-foreground">Última revisión de la lista: {fecha(LISTA_REVISADA_EL)}</p>
      </Aviso>
      {LISTA_EN_BORRADOR && (
        <Aviso nivel="atencion" role="status" compacto>
          {AVISO_BORRADOR}
        </Aviso>
      )}
    </div>
  );
}
