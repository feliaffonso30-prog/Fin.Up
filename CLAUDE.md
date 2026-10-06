# FinUp · Plataforma

Plataforma de inteligencia financiera personalizada para jóvenes y principiantes de Argentina. Posicionamiento "anti-humo": ayuda a decidir **antes** de invertir, explica el porqué de cada recomendación y qué puede salir mal. No es asesor financiero, no opera ni integra brokers (límite intencional del MVP).

Fundadores: Felipe Affonso y Lorenzo Colángelo. Idioma de la app y del código de dominio: español rioplatense (voseo).

## Este repo y la landing son cosas separadas

La landing y la demo pública viven en otro repositorio (`FinUp-app-2`). **Este repo es solo la plataforma.** No se comparten archivos: lo que acá se parece a la landing (componentes `ui/`, estilos, FinBot) es una copia independiente. El botón "Salir" del onboarding apunta a `NEXT_PUBLIC_LANDING_URL`.

## Stack y comandos

Next.js 16 (App Router) · React 19 · Tailwind 4 + shadcn/ui · Supabase · Gemini (`@google/genai`) · Vitest.

- `npm run dev` · `npm test` · `npm run typecheck`
- `next.config.mjs` tiene `typescript.ignoreBuildErrors: true`, así que **`next build` no frena por errores de tipos**: correr siempre `npm run typecheck`.
- Si `next build` falla al bajar Inter/Plus Jakarta de Google Fonts, es red del entorno, no el código.
- Variables de entorno: ver `.env.example`.

## Estructura

- `app/page.tsx` → redirige a `/dashboard`.
- `app/(plataforma)/` → `/onboarding` (sin shell) y `/dashboard`, `/aprender` (dentro de `(panel)` con barra lateral).
- `components/plataforma/` → UI de la plataforma. `components/ui/` → shadcn. `components/finbot/` → chat de FinBot.
- `lib/plataforma/` → **dominio, sin React ni red**: `perfil.ts` (puntaje + topes de seguridad), `cartera.ts` (distribución, explicaciones, avisos), `proyeccion.ts`, `plan.ts` (`generarPlan`), `store.ts` (persistencia local, temporal).
- `lib/finbot/` + `app/api/chat/route.ts` → FinBot (Gemini con herramientas: cotizaciones Yahoo, DolarAPI, ArgentinaDatos, glosario y catálogo propios). La plataforma lo conecta vía `aContextoEstrategia(plan)`.
- `supabase/migrations/` → esquema SQL. Aplicar a mano en el SQL Editor.

## Decisiones de producto que el código respeta

- El motor es **determinístico y por reglas** (mismas respuestas, mismo plan). La IA explica y conversa (FinBot); no decide la cartera.
- **Topes de seguridad** en `perfil.ts`: plazo < 2 años, "vendería todo", deudas caras → máximo Conservador; plazo 2-5 años, "vendería una parte", sin conocimientos → máximo Moderado. Con plazo < 2 años no hay acciones ni cripto. Los tests (`lib/plataforma/plataforma.test.ts`) lo exigen en todas las combinaciones.
- Cada posición explica ventaja, **qué puede salir mal** y volatilidad. Los ejemplos de activos son educativos, nunca "comprá X".
- Retornos y caídas son supuestos ilustrativos (`SUPUESTOS` en `cartera.ts`), no datos de mercado. Montos en USD.
- Modelo de negocio (entregable 2): plan **Free** (cartera + FinBot limitado) y **Plus** (ARS 9.999/mes: FinBot ampliado + notificaciones); luego **Pro** y **Campus** para instituciones.

## Hoja de ruta (en orden)

1. **Login con Supabase Auth.** Next 16 deprecó `middleware`: usar `proxy.ts` y `@supabase/ssr`.
2. **Guardar el plan en Supabase** (`planes_inversion`) en vez de `localStorage`; migrar `store.ts` detrás de la misma interfaz `usePlan()`.
3. **Límites Free/Plus en `/api/chat`** con `uso_finbot` (escribe solo el servidor con service role) y reemplazar `rate-limit.ts` (en memoria, por IP).
4. Pantalla de planes y cuenta.
5. Mostrar montos en ARS con dólar MEP (DolarAPI) y comparar contra inflación.
6. Notificaciones de mercado (Plus).

## Pendientes conocidos

- `app/api/chat/route.ts` crea `GoogleGenAI` al importar el módulo: sin `GEMINI_API_KEY` el build imprime "API key should be set". Pasarlo a inicialización perezosa.
- Los mensajes de límite de FinBot dicen "de la demo" (texto heredado). Se reemplazan al implementar los límites por plan.
- `npm run lint` apunta a `eslint .` pero eslint no está instalado como dependencia.
- Aún no hay revisión legal (términos, privacidad, límites de lo que puede decir FinBot); el entregable 2 la contempla.
