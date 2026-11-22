import { Aviso } from "@/components/plataforma/primitivas";
import { fecha } from "@/lib/plataforma/formato";
import { LISTA_EN_BORRADOR, LISTA_REVISADA_EL } from "@/lib/plataforma/instrumentos/datos";
import { AVISO_BORRADOR, DISCLAIMER_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/textos";

/** Aviso fijo de la sección: va en el listado y en cada ficha. Una sola caja, con los textos enteros y del mismo tamaño. */
export function DisclaimerInstrumentos() {
  return (
    <Aviso nivel="info" role="note">
      <p>{DISCLAIMER_INSTRUMENTOS}</p>
      {LISTA_EN_BORRADOR && <p className="mt-2">{AVISO_BORRADOR}</p>}
      <p className="mt-2 text-muted-foreground">Última revisión de la lista: {fecha(LISTA_REVISADA_EL)}</p>
    </Aviso>
  );
}
