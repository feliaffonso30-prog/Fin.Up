// Abre FinBot desde cualquier parte de la plataforma (por ejemplo, la ficha de un
// instrumento) sin pasar estado por props: el chat vive en el Shell y escucha este evento.
// La pregunta queda escrita en el input, no se envía sola: así el usuario la puede
// editar y no se gasta una consulta sin querer.

export const EVENTO_ABRIR_FINBOT = "finup:finbot-abrir";

export interface DetalleAbrirFinBot {
  pregunta?: string;
}

export function abrirFinBot(pregunta?: string): void {
  window.dispatchEvent(new CustomEvent<DetalleAbrirFinBot>(EVENTO_ABRIR_FINBOT, { detail: { pregunta } }));
}
