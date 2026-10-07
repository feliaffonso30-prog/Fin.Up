"use client";

// Guardado del plan en Supabase (tabla `planes_inversion`).
// Cada vez que el usuario rehace el cuestionario, el plan vigente se archiva
// (vigente = false) y se inserta uno nuevo: queda historial. La seguridad no
// depende de este código sino de las políticas RLS del esquema SQL.

import { crearClienteNavegador } from "@/lib/supabase/client";
import { esPlan } from "./validar-plan";
import type { Plan } from "./tipos";

export const MOTOR_VERSION = 1;

export async function leerPlanVigente(): Promise<Plan | null> {
  const sb = crearClienteNavegador();
  const { data, error } = await sb
    .from("planes_inversion")
    .select("plan")
    .eq("vigente", true)
    .order("creado_en", { ascending: false })
    .limit(1);
  if (error) throw error;
  const crudo = data?.[0]?.plan;
  return esPlan(crudo) ? crudo : null;
}

/** Archiva el plan vigente e inserta el nuevo. Si la inserción falla, restaura el anterior. */
export async function guardarPlanRemoto(plan: Plan): Promise<boolean> {
  const sb = crearClienteNavegador();
  const { data: sesion } = await sb.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return false;

  const { data: archivados, error: errArchivar } = await sb
    .from("planes_inversion")
    .update({ vigente: false })
    .eq("vigente", true)
    .select("id");
  if (errArchivar) return false;

  const { error: errInsertar } = await sb.from("planes_inversion").insert({
    usuario_id: uid,
    respuestas: plan.respuestas,
    plan,
    perfil_riesgo: plan.perfil.perfil,
    motor_version: MOTOR_VERSION,
  });

  if (errInsertar) {
    const ids = (archivados ?? []).map((f) => f.id);
    if (ids.length > 0) await sb.from("planes_inversion").update({ vigente: true }).in("id", ids);
    return false;
  }
  return true;
}

/** "Borrar" = archivar el plan vigente (no se pierde el historial). */
export async function archivarPlanRemoto(): Promise<boolean> {
  const sb = crearClienteNavegador();
  const { error } = await sb.from("planes_inversion").update({ vigente: false }).eq("vigente", true);
  return !error;
}
