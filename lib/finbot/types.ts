// Tipos compartidos entre el cliente (chat) y la API route.

export interface ContextoEstrategia {
  edad: string;
  perfil: string;
  objetivo: string;
  distribucion: { activo: string; porcentaje: number; tipo: string }[];
  retornoMin: number;
  retornoMax: number;
  caida: number;
  nivelRiesgo: string;
}

export interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

// Eventos que la API manda al cliente, uno por línea (NDJSON).
export type EventoChat =
  | { type: "text"; text: string }
  | { type: "status"; label: string }
  | { type: "done" }
  | { type: "error"; message: string };
