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
- `proxy.ts` + `lib/supabase/` + `lib/auth/` → sesión y rutas protegidas. `/api/chat` queda fuera del proxy a propósito (valida su propio acceso, ver hoja de ruta 3).
- `lib/finbot/` + `app/api/chat/route.ts` → FinBot (Gemini con herramientas: cotizaciones Yahoo, DolarAPI, ArgentinaDatos, glosario y catálogo propios). La plataforma lo conecta vía `aContextoEstrategia(plan)`.
- `supabase/migrations/` → esquema SQL. Aplicar a mano en el SQL Editor.
- **Comparador** (`/comparador`): plazo fijo, UVA, billeteras y FCI en pesos por entidad.
  - `lib/plataforma/finanzas.ts` → cálculos puros (TNA/TEA/TEM, interés, tasa real).
  - `lib/plataforma/comparador/` → dominio puro: normalizar (JSON de ArgentinaDatos → `Alternativa`), cotizar (ranking por monto/plazo/cliente), textos legales y educativos, `enlaces.ts` (mapa entidad → link, con `esReferido`).
  - `lib/comparador/fuentes.ts` → descarga + `unstable_cache` + respaldo (`respaldo.ts`). Al cambiar la normalización, subir `VERSION_CACHE`. Los FCI (`/fci/fondos`, ~30 MB) no se esperan en la página: llegan por streaming.
  - Desde la cartera, `liquidez` y `fija` llevan al comparador con `?usd=` (se pasa a ARS con el dólar MEP).
- **Biblioteca de instrumentos** (`/instrumentos` y `/instrumentos/[ticker]`, fichas estáticas): CEDEARs, acciones del panel líder, bonos y ONs, como ejemplos EDUCATIVOS por categoría de la cartera.
  - `lib/plataforma/instrumentos/` → `datos.ts` (lista curada, versionada en el repo; `LISTA_EN_BORRADOR` muestra un aviso), `tipos.ts` (schema zod), `catalogo.ts` (carga validada por ítem, filtros, `ejemplosPara(categoria, perfil)`), `textos.ts` (textos legales), `glosario.ts`.
  - "Ver ejemplos" en la cartera para `variable`, `dividendos` y `fija`; ordena por el riesgo propio del perfil. Los tests exigen 3-5 ejemplos en todas las combinaciones, nada de riesgo alto para Conservador y ningún texto del tipo "comprá" / "te recomendamos".
  - El botón de la ficha abre FinBot con una pregunta precargada vía `lib/finbot/abrir.ts` (evento de `window`; no la envía).
  - Precio: "No disponible" a propósito. Mostrar precios de BYMA en un producto comercial requiere licencia de Market Data de BYMA (marketdata@byma.com.ar), venga de donde venga el dato.

## Decisiones de producto que el código respeta

- El motor es **determinístico y por reglas** (mismas respuestas, mismo plan). La IA explica y conversa (FinBot); no decide la cartera.
- **Topes de seguridad** en `perfil.ts`: plazo < 2 años, "vendería todo", deudas caras → máximo Conservador; plazo 2-5 años, "vendería una parte", sin conocimientos → máximo Moderado. Con plazo < 2 años no hay acciones ni cripto. Los tests (`lib/plataforma/plataforma.test.ts`) lo exigen en todas las combinaciones.
- Cada posición explica ventaja, **qué puede salir mal** y volatilidad. Los ejemplos de activos son educativos, nunca "comprá X".
- Retornos y caídas son supuestos ilustrativos (`SUPUESTOS` en `cartera.ts`), no datos de mercado. Montos en USD.
- Modelo de negocio (entregable 2): plan **Free** (cartera + FinBot limitado) y **Plus** (ARS 9.999/mes: FinBot ampliado + notificaciones); luego **Pro** y **Campus** para instituciones.

## Hoja de ruta (en orden)

1. ✅ **Login con Supabase Auth** (email + contraseña, confirmación por email). Hecho: `proxy.ts` (refresca sesión y protege las rutas de `RUTAS_PROTEGIDAS`: `/dashboard`, `/comparador`, `/instrumentos`, `/aprender`, `/onboarding`), `lib/supabase/*`, `lib/auth/rutas.ts` (reglas puras + tests), páginas `/login` y `/registro`, `/auth/callback` y `/auth/salir` (POST). **Sin las variables `NEXT_PUBLIC_SUPABASE_*` la app corre en "modo sin cuenta"** (no protege nada, plan en `localStorage`). Falta: probarlo contra un proyecto Supabase real.
2. ✅ **Plan guardado en Supabase** (`planes_inversion`) cuando hay login: `usePlan()` (en `store.ts`) elige Supabase (`remoto.ts`) o `localStorage` según `AUTH_CONFIGURADA`. Rehacer el cuestionario archiva el plan anterior (historial). Un plan local previo se pasa a la cuenta la primera vez. Falta: probarlo contra el proyecto Supabase real.
3. **Límites Free/Plus en `/api/chat`** con `uso_finbot` (escribe solo el servidor con service role) y reemplazar `rate-limit.ts` (en memoria, por IP).
4. Pantalla de planes y cuenta.
5. Mostrar montos en ARS con dólar MEP (DolarAPI) y comparar contra inflación.
6. Notificaciones de mercado (Plus).

## Pendientes conocidos

- `app/api/chat/route.ts` crea `GoogleGenAI` al importar el módulo: sin `GEMINI_API_KEY` el build imprime "API key should be set". Pasarlo a inicialización perezosa.
- Los mensajes de límite de FinBot dicen "de la demo" (texto heredado). Se reemplazan al implementar los límites por plan.
- `npm run lint` apunta a `eslint .` pero eslint no está instalado como dependencia.
- Comparador: completar `ENLACES` en `lib/plataforma/comparador/enlaces.ts` (hoy muchas entidades dicen "Sin link disponible").
- Biblioteca: verificar los datos marcados `TODO-VERIFICAR` en `lib/plataforma/instrumentos/datos.ts` (ratios de CEDEARs, series reales de las ONs `YPF-ON`/`PAMP-ON`, panel líder) y después pasar `LISTA_EN_BORRADOR` a `false`.
- Aún no hay revisión legal (términos, privacidad, límites de lo que puede decir FinBot); el entregable 2 la contempla.
