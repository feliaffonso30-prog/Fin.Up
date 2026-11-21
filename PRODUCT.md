# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jóvenes y principiantes de Argentina (el mercado alcanzable se estimó en 18-29 años con cuenta) que nunca invirtieron o recién empiezan. Se informan por redes, suelen entrar desde el celular y les cuesta entender finanzas. Su tarea: entender qué hacer con su plata y cuánto podrían perder, antes de poner un peso. Si algo les resulta difícil, abandonan.

## Product Purpose

FinUp ayuda a decidir ANTES de invertir: arma un plan según el perfil de la persona y explica el porqué de cada parte y qué puede salir mal. El éxito se mide en usuarios activos, conversión Free → Plus y retención.

## Positioning

Seguridad y progreso. (Reemplaza al posicionamiento anterior "anti-humo", que definía a FinUp por oposición a los gurús; el rechazo al humo sigue vigente como consecuencia, no como identidad.)

- **Seguridad** es claridad, acompañamiento y protección: la persona decide sabiendo qué puede salir mal. Nunca significa "no vas a perder plata" ni se comunica como garantía.
- **Progreso** es avanzar en entender, decidir y sostener su plan, a su ritmo. Nunca significa "invertí ya" ni empuja a comprar nada.
- Tagline: "Tu progreso financiero, paso a paso". Mantra: "Entendé. Decidí. Progresá." (en el recorrido: entendés → decidís → avanzás con tu plan).

Interviene en el momento previo a la decisión y muestra de frente lo que puede salir mal, sin vender productos ni prometer ganancias. No es asesor financiero, no opera y no integra brokers (límite intencional del MVP). Competencia directa: investIA y Welfi. Indirecta: redes sociales, Mercado Pago y brokers.

## Operating Context

Primera visita desde el celular, con poco tiempo y desconfianza hacia las promesas de plata. Vive en un contexto de inflación y dólar: piensa en pesos aunque el plan se calcule en dólares. Vuelve para seguir un recorrido guiado de un paso por vez, comparar dónde dejar sus pesos y preguntarle a FinBot.

## Capabilities and Constraints

- Motor determinístico por reglas: mismas respuestas, mismo plan. La IA (FinBot) explica y conversa; no decide la cartera.
- Topes de seguridad en el perfil: exigidos por tests, no se relajan por diseño.
- Pantallas: cuestionario, Mi plan, Tus pesos (comparador), Ejemplos (biblioteca educativa), Aprender, FinBot, login y registro.
- Decisión confirmada (06/11/2026): se puede armar y ver el plan antes de crear la cuenta; la cuenta se ofrece después, para guardarlo.
- Retornos y caídas son supuestos ilustrativos, nunca datos de mercado. Los ejemplos son educativos: nunca "comprá X" ni "te recomendamos".
- Precios de BYMA no disponibles a propósito: requieren licencia de Market Data.
- Modelo de negocio: Free y Plus (ARS 9.999/mes). Después, Pro y Campus para instituciones.
- Esta plataforma y la landing (`FinUp-app-2`) son repositorios separados.
- Sin revisión legal todavía (términos, privacidad, límites de FinBot).

## Brand Commitments

- Nombre: FinUp. Es lo único confirmado como fijo: el logo y la identidad visual actuales pueden cambiar por completo (decisión del fundador, 06/11/2026). Si cambian, después hay que alinear la landing.
- Dirección visual elegida por el fundador (06/11/2026): cercana al estándar de las fintech, pero liviana, limpia, atractiva y llamativa. Descartó los mundos conceptuales (Ramal, Etiqueta frontal, Señal): la convención es deliberada. Referencias de nivel: Nubank (color de marca muy presente, tono cercano) y Revolut (cifras grandes, contraste). Se toma su nivel de terminación, no su marca. El fundador pidió el mismo fondo y la misma gama en todas las pantallas (nada de cambiar de color por etapa) y sin fondos rayados en las advertencias. Combinación que le gustó (boceto en `.impeccable/mocks/fintech/final.html`): noche profunda con una luz visible desde la esquina, tarjetas translúcidas, botones principales blancos, bloques azules con degradado suave, pocas cajas y revelado suave del resultado. Decisión del fundador: el mal año va dentro de la misma gama azul (lavanda sobre vidrio), aunque el color no diga "peligro" por sí solo; rojo, ámbar y coral descartados por chocar con la estética. La advertencia se sostiene con la etiqueta "Mal año", el signo menos y el mismo tamaño que el año normal.
- Actitud pedida por el fundador: frontal y con carácter, con identidad propia que llame la atención a primera vista.
- Voz: español rioplatense con voseo, **segura y firme**, directa y sin jerga sin explicar. Cercana, pero sin rodeos: afirma con seguridad lo que se sabe, dice con la misma firmeza "esto nadie lo puede saber" cuando no se sabe, no se disculpa de más, no suplica ni presiona, y no cede ante pedidos de garantías o de "comprá X". La firmeza va al servicio de la seguridad de la persona: es la de un mentor que sabe, no la de un vendedor. Frases que hay que conservar en espíritu: "No movemos tu plata", "No juzgamos", "No hace falta que inviertas hoy".
- La gama actual (azules) es una guía flexible, no una obligación.

## Evidence on Hand

- Encuesta propia: 50 personas; 16 invierten (11 se informan por redes, 9 con dificultad para entender); 37 de 50 dicen que usarían FinUp.
- Final de una competencia de startups (octubre de 2026).
- No hay testimonios, clientes, prensa ni cifras de rendimiento reales: no inventarlos.

## Product Principles

1. Primero lo que puede salir mal: el riesgo se muestra con el mismo peso que la posible ganancia.
2. Una decisión por pantalla: si hay que explicarlo dos veces, está mal diseñado.
3. Valor antes que esfuerzo: ver algo útil antes de pedir datos o cuenta.
4. Decir el porqué: cada recomendación general se explica en palabras cotidianas.
5. Nunca vender: ningún diseño puede empujar a invertir.
6. El progreso es entender y avanzar en el plan, no invertir: "Progresá" y "paso a paso" nunca se usan como llamado a comprar, y un avance solo se marca cuando de verdad ocurrió (nada de "Hecho" por tocar un botón).

## Accessibility & Inclusion

Pensada para el celular y para quien no sabe de finanzas. Mantener el nivel AA de contraste y la navegación por teclado ya trabajados, y no comunicar el riesgo solo con color. Avisos legales de 12 px como mínimo.
