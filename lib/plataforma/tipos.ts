// Tipos del dominio de la plataforma FinUp (perfil, cartera, plan).
// Las categorías de activos son las mismas que usa FinBot (lib/finbot/knowledge.ts)
// para que el chat y la cartera hablen el mismo idioma.

import type { ActivoEjemplo, Categoria } from "@/lib/finbot/knowledge";

export type { ActivoEjemplo, Categoria };

export type PerfilRiesgo = "Conservador" | "Moderado" | "Agresivo";
export type Objetivo = "Preservar capital" | "Crecimiento" | "Generar ingresos";
export type Horizonte = "menos-2" | "2-5" | "5-10" | "mas-10";
export type FondoEmergencia = "si" | "parcial" | "no";
export type ReaccionCaida = "vendo-todo" | "vendo-parte" | "espero" | "compro-mas";
export type Prioridad = "seguridad" | "equilibrio" | "crecimiento";
export type Conocimiento = "ninguno" | "basico" | "intermedio";

// Lo que el usuario responde en el onboarding. Los montos son en USD.
export interface Respuestas {
  edad: number;
  objetivo: Objetivo;
  horizonte: Horizonte;
  capitalInicial: number;
  aporteMensual: number;
  fondoEmergencia: FondoEmergencia;
  deudasCaras: boolean;
  reaccionCaida: ReaccionCaida;
  prioridad: Prioridad;
  conocimiento: Conocimiento;
}

export interface ResultadoPerfil {
  perfil: PerfilRiesgo;
  puntaje: number; // 0 a 100, antes de aplicar topes
  perfilPorPuntaje: PerfilRiesgo; // el perfil que daba el puntaje solo
  ajustes: string[]; // topes de seguridad que bajaron el perfil, explicados
  motivos: string[]; // por qué salió este perfil, en lenguaje simple
}

export type Volatilidad = "Muy baja" | "Baja" | "Media" | "Alta" | "Muy alta";

export interface Posicion {
  categoria: Categoria;
  nombre: string;
  porcentaje: number;
  montoInicial: number; // USD, según el capital inicial
  color: string; // clase de Tailwind para barras y puntos
  queEs: string;
  ventaja: string;
  porQueEnTuCartera: string;
  queSalePuedeMal: string;
  volatilidad: Volatilidad;
  ejemplos: ActivoEjemplo[];
}

export interface Aviso {
  nivel: "info" | "atencion";
  titulo: string;
  texto: string;
}

export interface Analisis {
  retornoMin: number; // % anual, supuesto ilustrativo
  retornoMax: number;
  caida: number; // % en un mal año (negativo)
  nivelRiesgo: "Bajo" | "Medio" | "Alto";
}

export interface PuntoProyeccion {
  anio: number;
  aportado: number;
  bajo: number;
  alto: number;
}

export interface Plan {
  version: 1;
  generadoEn: string; // ISO
  respuestas: Respuestas;
  perfil: ResultadoPerfil;
  posiciones: Posicion[];
  analisis: Analisis;
  avisos: Aviso[];
  anios: number; // años de la proyección
  proyeccion: PuntoProyeccion[];
}
