# FinUp · Plataforma

Plataforma de inteligencia financiera personalizada para jóvenes y principiantes de Argentina. Posicionamiento "seguridad y progreso" (ver `PRODUCT.md`; ya no "anti-humo"): ayuda a decidir **antes** de invertir, explica el porqué de cada recomendación y qué puede salir mal. No es asesor financiero, no opera ni integra brokers (límite intencional del MVP).

Fundadores: Felipe Affonso y Lorenzo Colángelo. Idioma de la app y del código de dominio: español rioplatense (voseo).

## Este repo y la landing son cosas separadas

La landing y la demo pública viven en otro repositorio (`FinUp-app-2`). **Este repo es solo la plataforma.** No se comparten archivos: lo que acá se parece a la landing (componentes `ui/`, estilos, FinBot) es una copia independiente. El botón "Salir" del onboarding apunta a `NEXT_PUBLIC_LANDING_URL`.

## Stack y comandos

Next.js 16 (App Router) · React 19 · Tailwind 4 + shadcn/ui · Supabase · Gemini (`@google/genai`) · Vitest.

- `npm run dev` · `npm test` · `npm run typecheck`
- `next.config.mjs` tiene `typescript.ignoreBuildErrors: true`, así que **`next build` no frena por errores de tipos**: correr siempre `npm run typecheck`.
- Si `next build` falla al bajar Schibsted Grotesk de Google Fonts, es red del entorno, no el código.
- Variables de entorno: ver `.env.example`.

## Estructura

- `app/page.tsx` → portada pública (`components/plataforma/inicio.tsx`); quien ya tiene plan sigue a `/dashboard`.
- Identidad visual: `PRODUCT.md` (decisiones del fundador) y `DESIGN.md`. Tus pesos ya está simplificado (`comparador/respuesta.tsx` arriba, el detalle plegado). Ejemplos y Aprender solo heredan la paleta.
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
- **Lo que tenés** (`/cartera`, función Plus en vista previa): la persona anota lo que ya invirtió y ve cuánto vale hoy, cuánto ganó o perdió y cómo se compara con su plan. En el celular es una pestaña de Mi plan (`pestanas-mi-plan.tsx`), no un lugar de la barra inferior.
  - Qué se puede anotar: **todos los CEDEARs de BYMA** (`cedears.ts`, generado desde el PDF oficial "CEDEARs Negociables en BYMA con Ratios de Conversión" del 19/11/2026, con el ticker de EE.UU. verificado; regenerarlo cuando BYMA publique otro), acciones argentinas y bonos (`locales.ts`, lista a mano marcada TODO-VERIFICAR), cripto y opciones genéricas. El buscador muestra hasta `MAX_RESULTADOS`.
  - `lib/plataforma/cartera-real/` → dominio puro: `tipos.ts` (schema zod de `Tenencia`), `activos.ts` (opciones, buscador, `ratioDe`, `simboloMercado` BYMA → EE.UU., `SIMBOLOS_PERMITIDOS`), `valuar.ts` (valuación, pesos por categoría, `compararConPlan`, textos que describen y nunca dicen qué hacer). Tests en `cartera-real.test.ts`.
  - Valuación: acciones argentinas, bonos (cada 100 nominales) y CEDEARs con el precio en pesos de BYMA (tipo `byma`; un CEDEAR sin ese precio se estima desde el activo original en Nueva York ÷ ratio); cripto a precio de mercado; plazo fijo y "rinde a diario" calculados con la TNA cargada; ONs, "otro" y lo que no tiene precio con el valor que carga la persona. Siempre se muestra método, fuente y hora.
  - **TODO-LICENCIA:** los precios de BYMA vienen de data912 (`lib/mercado/byma.ts`, gratis, sin licencia comercial) y se prenden con `PRECIOS_BYMA_ACTIVOS` en `activos.ts`. Antes de lanzar: licencia de Market Data de BYMA y cambiar la fuente en `byma.ts`, o poner el interruptor en false (todo vuelve a valor manual).
  - Precio de compra: la persona pone la fecha y la app calcula con el cierre de ese día (o el día hábil anterior): `/api/precios/historico` (series en `lib/mercado/historico.ts`: data912, Yahoo y MEP de ArgentinaDatos; búsqueda pura en `cartera-real/historico.ts`). Sirve para "por cantidad" sin precio (`costoDesdeCierre`) y para estimar la cantidad "por lo que pusiste". `mepAlAnotar` guarda el MEP de esa fecha. El precio exacto sigue siendo opcional ("Sé el precio exacto").
  - `/api/precios?simbolos=` → EE.UU. y cripto en USD (Yahoo, vía `market.ts`), BYMA en ARS con prefijo `BYMA:` (un pedido por panel), + dólar MEP; solo `SIMBOLOS_PERMITIDOS` (nada de `.BA` ni `^`), caché de 60 s. `hooks/use-precios.ts` consulta cada minuto con la pestaña visible.
  - Pantalla (de arriba a abajo): "Tu plata hoy" (cifra, resultado y si se parece al plan), "Cómo se movió" (`resumen.ts`: 1-2 frases armadas solo con datos, hasta 2 noticias y FinBot con la pregunta escrita), "Cómo fue cambiando lo que tenés" (`evolucion.ts`: reconstruida con cierres vía `/api/precios/serie`, o una foto por día en `finup:cartera-real:fotos:v1`), "Qué subió y qué bajó", la lista, la comparación con el plan (`graficos.tsx`) y un solo texto legal con el plegable "Cómo calculamos esto".
  - Noticias: `/api/noticias?clave=` (solo códigos de nuestras listas), titular + medio + link, solo `MEDIOS_CONFIABLES` (`cartera-real/noticias.ts`). **TODO-LICENCIA:** la fuente es el RSS de Google Noticias (solo uso personal): antes de lanzar, API con licencia comercial o `NOTICIAS_ACTIVAS = false`.
  - Guardado: `hooks/use-cartera-real.ts`, por ahora solo en `localStorage` (`finup:cartera-real:v1`). Falta la tabla en Supabase con RLS.
  - Plus: `lib/plataforma/funciones.ts` (`puedeUsar`, `VISTA_PREVIA_PLUS = true` mientras no haya cobro).
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

1. ✅ **Login con Supabase Auth** (email + contraseña, confirmación por email). Hecho: `proxy.ts` (refresca sesión y protege las rutas de `RUTAS_PROTEGIDAS`, hoy vacía: toda la plataforma es pública, primero el valor y después la cuenta), `lib/supabase/*`, `lib/auth/rutas.ts` (reglas puras + tests), páginas `/login`, `/registro`, `/recuperar` y `/nueva-contrasena`, `/auth/callback` y `/auth/salir` (POST). **Sin las variables `NEXT_PUBLIC_SUPABASE_*` la app corre en "modo sin cuenta"** (no protege nada, plan en `localStorage`). Probado contra el proyecto Supabase real ("Finup"); Redirect URLs: `http://localhost:3000/**` (sumar el dominio de producción al desplegar). Ojo: en el plan Free el proyecto se pausa por inactividad y su dominio deja de resolver (el login falla con `ENOTFOUND`); se reactiva con "Resume project" en el dashboard.
2. ✅ **Plan guardado en Supabase** (`planes_inversion`) cuando hay login: `usePlan()` (en `store.ts`) usa Supabase (`remoto.ts`) si hay sesión y `localStorage` si no. Rehacer el cuestionario archiva el plan anterior (historial). Un plan local previo se pasa a la cuenta la primera vez. Falta: probarlo contra el proyecto Supabase real.
3. **Límites Free/Plus en `/api/chat`** con `uso_finbot` (escribe solo el servidor con service role) y reemplazar `rate-limit.ts` (en memoria, por IP).
4. Pantalla de planes y cuenta.
5. Mostrar montos en ARS con dólar MEP (DolarAPI) y comparar contra inflación.
6. Notificaciones de mercado (Plus).

## Pendientes conocidos

- `npm run lint` apunta a `eslint .` pero eslint no está instalado como dependencia.
- Comparador: completar `ENLACES` en `lib/plataforma/comparador/enlaces.ts` (hoy muchas entidades dicen "Sin link disponible").
- Biblioteca: verificar los datos marcados `TODO-VERIFICAR` en `lib/plataforma/instrumentos/datos.ts` (ratios de CEDEARs, series reales de las ONs `YPF-ON`/`PAMP-ON`, panel líder) y después pasar `LISTA_EN_BORRADOR` a `false`.
- Supabase Auth: "Confirm email" está **apagado** para desarrollar (el correo gratuito de Supabase manda muy pocos mails por hora y daba `over_email_send_rate_limit`). Antes de lanzar: configurar SMTP propio (Authentication → Emails) y volver a encenderlo.
- Aún no hay revisión legal (términos, privacidad, límites de lo que puede decir FinBot); el entregable 2 la contempla.
