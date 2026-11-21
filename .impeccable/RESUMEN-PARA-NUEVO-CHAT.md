# FinUp: resumen del trabajo de diseño (para continuar en un chat nuevo)

Fecha del resumen: 13/11/2026. Rama: `mejora-finup`. Este documento resume un chat largo de rediseño. El chat nuevo es para **explorar y profundizar el diseño** (logo, identidad, funciones nuevas). El chat anterior queda para **aplicar** lo que se decida.

## Leer primero

- `CLAUDE.md`: estructura del repo, comandos, hoja de ruta.
- `PRODUCT.md`: producto, público, principios y decisiones del fundador. **Cambió hace poco**: el posicionamiento ya no es "anti-humo" sino **"Seguridad y progreso"**, y la voz es **"segura y firme"** (mentor que sabe, no vendedor). El rechazo al humo sigue, pero como consecuencia, no como identidad.
- `DESIGN.md` y `.impeccable/design.json`: sistema visual vigente.
- Memoria del proyecto: proponer estructura antes de construir secciones grandes y preguntar ante dudas.

## Con quién se trabaja

Felipe Affonso, fundador (junto con Lorenzo Colángelo). No es técnico: explicarle en lenguaje simple, mostrarle bocetos que se puedan ver y tocar, y pedir aprobación antes de construir. Decide mirando opciones lado a lado. Pide usar skills y subagentes.

## Herramientas instaladas (carpeta `.claude/`, ignorada por git)

- Skills de Emil Kowalski (`emil-design-eng`, `animate`, `choreograph`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `remove-animations`, `animation-performance`, `break-ui`, `mobile-native`, `pick-ui-library`, `prototype`), `frontend-design` (Anthropic), `web-design-guidelines` (Vercel) y `nextjs-finup` (propia; quedó desactualizada con colores y fuentes nuevos).
- Impeccable 4.8.0, con hooks que revisan cada edición de UI. Telemetría apagada.
- Agentes propios: `ux-principiantes`, `diseno-visual-sistema`, `backend-datos-finup`, `frontend-finup`.
- Servidores de prueba en `.claude/launch.json`: `dev-sin-cuenta` (3100), `dev-login-simulado` (3101), `prod-sin-cuenta` (3100, requiere build). Solo puede correr un `next dev` por vez; el fundador suele tener uno en el puerto 3000.

## Lo que ya está construido y subido a GitHub

1. **Identidad "Noche"** (commit `5b5093e`): fondo noche con luz en la esquina superior derecha, tarjetas de vidrio translúcido, un solo bloque azul por pantalla, botón principal blanco, letra Schibsted Grotesk en toda la app.
2. **Plan antes de la cuenta**: portada pública con ejemplo de ganancia y pérdida, cuestionario de 10 preguntas (una por pantalla, montos en pesos pasados a dólares con el MEP, avance que se recupera), resultado con revelado escalonado, Mi plan con un solo próximo paso.
3. **Acceso**: reenvío de mail y recuperación de contraseña. Toda la plataforma se usa sin cuenta (`RUTAS_PROTEGIDAS` vacía).
4. **Tus pesos simplificado** (commit `173c04e`): una tarjeta por tipo con cuánto ganarías, si le gana a la inflación, cuándo podés sacarla y el riesgo; tasas y pestañas plegadas en "Ver el detalle".
5. **Retoques**: páginas 404 y de error, FinBot sin clave avisa que no está disponible, sin textos de "demo".
6. **Bocetos de logo** (commit `4e34964`, hecho por el fundador).

Hay cambios sin commitear hechos por el fundador: `CLAUDE.md`, `PRODUCT.md`, `components/plataforma/dashboard.tsx`, `lib/finbot/prompt.ts`.

## Decisiones del fundador que no se discuten

- Estilo cercano al estándar fintech, pero liviano, limpio y llamativo. Referencias de nivel: Nubank y Revolut. Descartó mundos conceptuales (Ramal, Etiqueta frontal, Señal).
- **Misma gama y mismo fondo en todas las pantallas.**
- **Sin fondos rayados.**
- **El mal año va en lavanda** (`#d3d7ff` sobre vidrio), dentro de la gama. Rojo, ámbar y coral descartados. Lo distinguen la etiqueta, el signo menos y el tamaño.
- Lo bueno y lo malo se muestran juntos y con el mismo tamaño de cifra.
- Solo el nombre "FinUp" es fijo: logo e identidad pueden cambiar por completo.
- Nunca "comprá X" ni promesas de ganancia. El motor es por reglas; la IA explica, no decide.

## En exploración (nada aprobado todavía)

### Logo

Tres rondas de bocetos, todos en `.impeccable/mocks/fintech/`:

- `logos.html` (ronda 1): De reojo, Dos puntos, Medio humo, Mismo peso, La p que baja.
- `logos-2.html` (ronda 2): Grilla espejada, La f que pregunta, El lazo, El abanico, Tu línea, La vela entera (única ligada a mercados).
- `logos-3.html` (ronda 3, con movimiento): Nivel de burbuja, Balancín, Faro, La onda pareja, El encastre, El péndulo de la i.

Lo que dijo el fundador:
- La ronda 1 le pareció demasiado simple.
- **Le gustó El abanico por su movimiento**: que se mueva sin parar mientras carga y haga un gesto al mostrar el resultado. No está seguro de que el abanico sea la mejor forma.
- Pidió seguir buscando otros objetos o identidades con esa cualidad. La ronda 3 responde a eso; **todavía no eligió**.

Recomendación pendiente de respuesta: La onda pareja (segunda: El encastre; el péndulo de la i puede sumarse a cualquiera).

Criterios acordados para el logo:
- No destacar "Up" ni sugerir que la plata sube.
- Evitar flechas ascendentes, monedas, cohetes, escudos, gemas, estética cripto o de banco antiguo.
- Debe funcionar a 16 px y sobre fondo oscuro.
- **Ojo:** el cambio a "Seguridad y progreso" puede cambiar qué logo conviene. Varios conceptos nacieron del "anti-humo" (De reojo, Medio humo). Revisar las opciones con el posicionamiento nuevo.
- Falta revisar parecidos con marcas registradas: los análisis salieron de la memoria de los agentes.
- La landing (otro repositorio, `FinUp-app-2`) tiene la identidad vieja y habrá que alinearla.

### Firma visual y función nueva

Boceto en `firma-y-detector.html`. Al fundador **le gustó todo**, pero no dio el OK para construir:

- **La línea de hoy**: lo que ponés es una línea; la ganancia se apoya arriba y la pérdida cuelga abajo. Decisión abierta: dibujarla a escala real (la pérdida se ve más larga; recomendado) o con el mismo alto.
- **Detector de promesas**: se carga cuánto te prometen y se marcan señales; devuelve el equivalente anual y las señales encontradas. Por reglas, sin IA. Nunca dice "es estafa" ni "es seguro". Viviría en Aprender y en el menú de FinBot. **Necesita revisión legal antes de publicarse.**

Otras ideas evaluadas y no elegidas: tarjeta para compartir ("Captura al revés"), Silueta del plan, Ensayo del mal año, Volver del mal año, Pesos quietos, simulador con historia real (descartado por riesgo legal).

## Pendientes conocidos

- Ejemplos y Aprender solo heredan la paleta: falta rediseñarlos.
- Probar con 5 a 10 jóvenes el recorrido, el logo y el Detector antes de construir más.
- Revisión legal (términos, privacidad, límites de FinBot). Dos riesgos detectados: FinBot consulta cotizaciones de acciones argentinas (tensión con la licencia de datos de BYMA) y sus instrucciones piden explicar por qué un activo encaja con el perfil.
- Computadora compartida: un plan armado sin cuenta pasa a la primera cuenta que se cree en ese navegador.
- La animación del resultado y las de los logos nunca se vieron en movimiento desde el chat: las juzga el fundador.
- `next-env.d.ts` puede aparecer modificado tras un build: es generado, no commitear.

## Cómo seguir en el chat nuevo

1. Releer `PRODUCT.md` y revisar las tres rondas de logo con el posicionamiento "Seguridad y progreso".
2. Pedirle al fundador que elija o descarte entre los logos con movimiento, o abrir una ronda nueva con ese posicionamiento.
3. Con el logo elegido: redibujarlo bien, definir su animación de carga y su gesto final, y mostrarlo dentro de las pantallas reales.
4. Definir la escala de la línea de hoy y si el Detector se construye.
5. Lo aprobado se lleva al chat de aplicación: bocetos en `.impeccable/mocks/`, sin tocar el código de la app desde el chat de exploración.
