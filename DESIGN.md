---
name: FinUp
description: Plataforma para decidir antes de invertir, con lo bueno y lo malo a la vista y del mismo tamaño.
colors:
  noche-profunda: "#0b0e30"
  noche-media: "#171c5e"
  luz-media: "#3740ac"
  luz-esquina: "#5361e0"
  azul-claro: "#4d5eff"
  azul-hondo: "#3140d6"
  blanco: "#ffffff"
  blanco-hover: "#eceeff"
  blanco-active: "#d9dcff"
  texto-secundario: "#d3d7f2"
  texto-en-vidrio: "#e4e6ff"
  vidrio: "rgba(255, 255, 255, 0.09)"
  vidrio-suave: "rgba(255, 255, 255, 0.08)"
  borde-vidrio: "rgba(255, 255, 255, 0.14)"
  borde-campo: "rgba(255, 255, 255, 0.42)"
  vidrio-mal: "rgba(150, 160, 255, 0.22)"
  borde-vidrio-mal: "rgba(200, 206, 255, 0.45)"
  lavanda-mal: "#d3d7ff"
  lavanda-mal-texto: "#eef0ff"
  lavanda-enlace: "#c8cdff"
  acento: "#8d99ff"
  riesgo-bajo: "#c9e4ff"
  riesgo-medio: "#c8cdff"
  riesgo-alto: "#efe6ff"
  parte-fija: "#7c89ff"
  parte-variable: "#b9c0ff"
  parte-dividendos: "#ffffff"
  parte-liquidez: "#5b66c9"
  parte-alternativo: "#9aa7e8"
  grafico-referencia: "#9fa5cf"
  error-sistema: "#ffb3a6"
typography:
  display:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2rem, 10.6vw, 2.5rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.035em"
  perfil:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "3.125rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  cifra-grande:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  cifra-compacta:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 8vw, 1.875rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "2.0625rem"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  title-bloque:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title-seccion:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.55
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  legal:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  2xl: "24px"
  full: "9999px"
spacing:
  control-gap: "10px"
  card: "14px"
  card-amplia: "20px"
  pantalla: "16px"
  pantalla-amplia: "32px"
  seccion: "40px"
components:
  button-primary:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.noche-profunda}"
    rounded: "{rounded.lg}"
    height: "56px"
    width: "100%"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.blanco-hover}"
  button-primary-active:
    backgroundColor: "{colors.blanco-active}"
  button-ghost:
    textColor: "{colors.blanco}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.vidrio-suave}"
  button-outline:
    textColor: "{colors.blanco}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  card-vidrio:
    backgroundColor: "{colors.vidrio}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    padding: "14px"
  card-mal-anio:
    backgroundColor: "{colors.vidrio-mal}"
    textColor: "{colors.lavanda-mal}"
    rounded: "{rounded.lg}"
    padding: "14px"
  opcion:
    backgroundColor: "{colors.vidrio}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  input-grande:
    backgroundColor: "{colors.vidrio}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    height: "64px"
  nav-inferior:
    backgroundColor: "{colors.noche-media}"
    textColor: "{colors.texto-secundario}"
    height: "64px"
  nav-finbot:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.noche-profunda}"
    rounded: "{rounded.full}"
    height: "40px"
---

# Design System: FinUp

## Overview

**Creative North Star: "La noche con la luz prendida"**

FinUp es una fintech conocida y prolija, con presencia nocturna. La convención es deliberada: el fundador descartó los mundos conceptuales y pidió el nivel de terminación de Nubank y Revolut, sin tomar su marca. Lo propio está en otro lado: una noche azul profunda con una luz visible desde la esquina superior derecha, y la pérdida posible a la vista, con el mismo tamaño que la ganancia.

La densidad es baja y pensada para el celular. Hay pocas cajas, cifras enormes, una decisión por pantalla y un solo botón blanco que se lleva toda la atención. Las tarjetas son vidrio sin desenfoque, para que no pesen en celulares baratos. El sistema rechaza el panel azul oscuro de tarjetas iguales con bordes y rótulos en mayúsculas.

Este sistema se extrajo de la primera etapa construida: portada, cuestionario, resultado y Mi plan. Tus pesos, Ejemplos y Aprender solo heredan la paleta hasta la etapa 2: lo que hoy muestran no es precedente para pantallas nuevas.

**Key Characteristics:**
- Misma noche y misma gama en todas las pantallas.
- Mal año y año normal siempre juntos y del mismo tamaño.
- Un solo bloque azul por pantalla y botón principal blanco.
- Vidrio translúcido sin desenfoque y pocas cajas.
- Cifras enormes en Schibsted Grotesk Black.
- Revelado escalonado del resultado como único momento firmado.

## Colors

Una sola gama azul y lavanda sobre noche profunda, con el blanco reservado para lo que más importa.

### Primary
- **Blanco de acción** (`blanco`): botón principal de cada pantalla, botón FinBot, cifras y títulos. Es lo que más resalta sobre la noche. Al pasar el cursor baja a `blanco-hover` y al presionar a `blanco-active`.
- **Azul de bloque** (`azul-claro` a `azul-hondo`): el degradado suave `linear-gradient(150deg, #4d5eff, #3140d6)` del único bloque protagonista de la pantalla, con texto blanco.

### Secondary
- **Lavanda de mal año** (`lavanda-mal`, `lavanda-mal-texto`): las cifras y los textos de lo que puede salir mal, sobre `vidrio-mal` con su borde `borde-vidrio-mal`. También es el relleno del piso del gráfico de proyección.
- **Lavanda de enlace** (`lavanda-enlace`): enlaces, viñetas, anillo de foco y cursor de los campos.
- **Acento** (`acento`): selección de texto y serie "si va mal" del gráfico.

### Tertiary
- **Niveles de riesgo** (`riesgo-bajo`, `riesgo-medio`, `riesgo-alto`): tonos dentro de la gama. Lo que distingue el nivel son las barras 1/2/3 y la etiqueta, no el color.
- **Partes del plan** (`parte-fija`, `parte-variable`, `parte-dividendos`, `parte-liquidez`, `parte-alternativo`): barra de reparto y marcadores de la lista de partes.

### Neutral
- **Noche profunda** (`noche-profunda`): fondo de la página y texto sobre blanco.
- **La luz de la esquina** (`luz-esquina`, `luz-media`, `noche-media`): el fondo `radial-gradient(135% 88% at 94% -10%, #5361e0 0%, #3740ac 30%, #171c5e 62%, #0b0e30 100%)`, aplicado al alto de la ventana. Lo que se desplaza cae sobre noche profunda. `noche-media` es además el fondo opaco de lo que flota: FinBot, menús y barra inferior.
- **Vidrio** (`vidrio`, `vidrio-suave`, `borde-vidrio`): tarjetas, superficies secundarias y su contorno interior de 1 px.
- **Borde de campo** (`borde-campo`): borde de campos y controles, con 3:1 de contraste sobre la noche.
- **Texto secundario** (`texto-secundario`, `texto-en-vidrio`): bajadas, notas y etiquetas apagadas.
- **Referencia de gráfico** (`grafico-referencia`): la línea de lo aportado.
- **Error de sistema** (`error-sistema`): solo errores de formularios y de conexión. Es la única salida de la gama en la primera etapa y no habla de inversiones.

### Named Rules
**The Misma Gama Rule.** Decisión del fundador: el fondo y la gama son los mismos en todas las pantallas. Ninguna etapa del recorrido cambia de color.

**The Mal Año en Lavanda Rule.** Decisión del fundador: el mal año va en lavanda sobre vidrio, nunca en rojo, ámbar, coral ni rayado. El color no dice "peligro" por sí solo, a propósito: la advertencia se sostiene con la etiqueta "Mal año", el signo menos y el mismo tamaño que el año normal.

**The Bloque Azul Único Rule.** Decisión del fundador: un solo bloque azul por pantalla. Si dos cosas compiten por ser el bloque, una pasa a vidrio.

**The Botón Blanco Rule.** Decisión del fundador: el botón principal es blanco. Ninguna otra superficie compite con él en luminosidad.

## Typography

**Display Font:** Schibsted Grotesk (con system-ui, sans-serif)
**Body Font:** Schibsted Grotesk (con system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (con ui-monospace), solo para tickers y tasas en las pantallas que todavía heredan

**Character:** Una sola familia con mucho rango: Black apretado para títulos y cifras, regular cómoda para leer. Las cifras son la imagen del producto.

### Hierarchy
- **Display** (`display`): título de la portada, dentro del bloque azul. Sube a 3.75rem desde 768 px.
- **Perfil** (`perfil`): el perfil en el resultado. Es el mayor tamaño del recorrido en el celular.
- **Cifra grande** (`cifra-grande`): año normal y mal año en el resultado, siempre iguales.
- **Cifra compacta** (`cifra-compacta`): año normal y mal año en la portada y en Mi plan, siempre iguales.
- **Headline** (`headline`): cada pregunta del cuestionario. Los títulos de pantalla usan el mismo peso, de 2.25rem a 3rem.
- **Title de bloque** (`title-bloque`): el paso actual dentro del bloque azul.
- **Title de sección** (`title-seccion`): títulos de sección y plegables.
- **Body** (`body`): bajadas y explicaciones. Las bajadas de pantalla no pasan de 672 px de ancho.
- **Label** (`label`): etiquetas de cifras y notas breves, en caja normal.
- **Legal** (`legal`): avisos legales y notas al pie, nunca por debajo de 12 px ni escondidos.

### Named Rules
**The Mismo Tamaño Rule.** La cifra del mal año usa exactamente el mismo rol tipográfico que la del año normal. Si una crece, crecen las dos.

**The Sin Rótulos Rule.** Decisión del fundador: sin rótulos sobre los títulos. El título abre la pieza. El avance real ("Paso 2 de 5") es un dato de estado y va junto a su barra de segmentos, no reemplaza a un título.

**The Cifra Tabular Rule.** Las cifras que se comparan o cambian usan numerales tabulares.

## Layout

El modelo es de una columna, pensada desde el celular. La portada y el cuestionario viven en 448 px de ancho máximo con 16 px de margen, y empujan la acción principal al fondo de la pantalla, al alcance del pulgar. Las pantallas del panel llegan a 896 px, con 32 px de margen desde 768 px.

Desde 768 px, la portada pasa a dos columnas (1.2fr y 1fr) en hasta 1024 px, el cuestionario se ensancha a 576 px y el panel suma una barra lateral de 220 px en lugar de la barra inferior. Desde 1024 px, Mi plan pone el recorrido y las cifras del año lado a lado.

El ritmo es de 10 px entre controles y entre las dos cifras, 40 px entre secciones de Mi plan, y mucho aire en vez de cajas. Lo secundario se pliega: lo importante queda arriba y lo demás, a un toque.

### Named Rules
**The Pocas Cajas Rule.** Si un título y un texto se entienden sobre la noche, no llevan tarjeta. El vidrio se reserva para cifras, opciones, avisos y acciones contextuales.

## Elevation & Depth

La profundidad viene de capas tonales: la luz de fondo, el vidrio translúcido encima y lo opaco que flota. Sin desenfoque de fondo, por rendimiento en celulares baratos. Las sombras son pocas, blandas y siempre oscuras.

### Shadow Vocabulary
- **Sombra de bloque** (`box-shadow: 0 14px 30px -18px rgba(6, 10, 50, 0.9)`): solo bajo el bloque azul.
- **Contorno de vidrio** (`box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14)`): borde interior de las tarjetas de vidrio.
- **Contorno de mal año** (`box-shadow: inset 0 0 0 1px rgba(200, 206, 255, 0.45)`): borde interior del vidrio lavanda.
- **Flotante** (`box-shadow: 0 24px 48px -12px rgba(2, 6, 23, 0.6)`): panel y botón de FinBot en escritorio.

### Named Rules
**The Vidrio Sin Desenfoque Rule.** El vidrio es color translúcido con un contorno interior. Nunca lleva desenfoque de fondo.

## Shapes

Curvas amplias y amables, que crecen con la importancia de la pieza: ítems de menú de 10 px; campos, botones chicos e insignias de 14 px; botón principal, opciones y tarjetas de cifras de 18 px; avisos y tarjetas contextuales de 22 px; bloques azules y cifras del resultado de 24 px. Las barras de avance y el botón FinBot son píldoras completas. Las marcas chicas de color tienen 3 px.

## Components

### Buttons
Grandes, táctiles y sin adornos.
- **Shape:** curva amplia en el principal (18 px); curva media en los demás (14 px).
- **Primary:** blanco con texto de noche profunda, 56 px de alto, ancho completo y peso ExtraBold.
- **Hover / Focus:** baja a `blanco-hover`, se presiona con `blanco-active` y escala 0.97 en 150 ms, sin escala con movimiento reducido. El foco es un anillo lavanda de 3 px.
- **Secondary / Ghost / Outline:** el fantasma es texto sobre fondo transparente que se aclara al pasar. El contorno usa `borde-campo`. Ninguno compite con el principal.

### Chips
- **Style:** insignia de riesgo con borde y fondo del color de su nivel, al 30-40 % y al 10 %, más su texto.
- **State:** tres barras crecientes y la etiqueta. El nivel no depende solo del color.

### Cards / Containers
- **Corner Style:** 18 px en cifras compactas y bloques de lo que puede salir mal; 22 px en avisos; 24 px en el bloque azul.
- **Background:** `vidrio` para lo normal, `vidrio-mal` para lo malo, degradado azul para el único bloque protagonista.
- **Shadow Strategy:** contorno interior en el vidrio; sombra de bloque solo en el azul.
- **Border:** ninguno por fuera; el contorno es interior.
- **Internal Padding:** 14 px en cifras compactas, 16 px en avisos y 20 px en bloques.

### Inputs / Fields
- **Style:** en el cuestionario, vidrio de 64 px de alto y 18 px de curva, con la cifra escrita en Black a 1.5rem. En los formularios simples, contorno `borde-campo` y curva de 14 px.
- **Focus:** anillo lavanda de 3 px.
- **Error / Disabled:** anillo y mensaje en `error-sistema`, siempre con texto; deshabilitado al 50 %.

### Navigation
- **Celular:** barra inferior opaca de 64 px con cuatro secciones y el botón FinBot en píldora blanca al centro. El activo pasa a ExtraBold y blanco; el resto queda en texto secundario, con icono de 20 px.
- **Escritorio:** barra lateral de 220 px, sobre la noche y con un borde derecho de `borde-vidrio`. El activo lleva fondo blanco al 12 % y peso Bold.
- **Marca:** la palabra "finup" en minúsculas, Black. Es provisoria.

### Año Normal y Mal Año
La firma del sistema. Dos piezas juntas, del mismo tamaño y con el mismo rol tipográfico. En la portada y en Mi plan, vidrio y vidrio lavanda lado a lado. En el resultado, el año normal es el bloque azul de la pantalla y el mal año, vidrio lavanda.

### Opción de Respuesta
Fila de vidrio de 56 px como mínimo, título en Bold de 1.125rem y detalle opcional. Al elegirla pasa a bloque azul con un tilde: es el único azul de esa pregunta. Se presiona con escala 0.98.

### Qué Puede Salir Mal
Bloque de vidrio lavanda de 18 px, título Bold en `lavanda-mal` y texto en `lavanda-mal-texto`. Tiene siempre el mismo aspecto. Los avisos de atención usan el mismo vidrio con un icono de contorno.

### Revelado del Resultado
El momento firmado. Título, perfil, cifras y acción entran en orden, con 70 ms entre piezas y 120 ms de espera: 500 ms en `cubic-bezier(0.23, 1, 0.32, 1)`, subiendo 14 px. Con movimiento reducido queda solo el fundido. Se usa al llegar al resultado.

### Avance
Barra de segmentos de 6 px en píldora: blanco lo hecho, blanco al 25 % lo que falta. Dentro del recorrido, el paso actual va en blanco al 60 %.

## Do's and Don'ts

### Do:
- **Do** usar la misma noche, la misma luz y la misma gama en todas las pantallas.
- **Do** mostrar el mal año junto al año normal, con el mismo tamaño, la etiqueta "Mal año" y el signo menos.
- **Do** dejar un solo bloque azul por pantalla, con su degradado suave.
- **Do** hacer blanco el botón principal, con texto de noche profunda.
- **Do** abrir cada pieza con su título, sin nada encima.
- **Do** mantener AA de contraste y no comunicar el riesgo solo con color.
- **Do** tratar la marca "finup" como provisoria y dejarla reemplazable hasta tener el logo nuevo.
- **Do** tomar la primera etapa como referencia al rediseñar Tus pesos, Ejemplos y Aprender en la etapa 2.
- **Do** mantener avisos legales y notas en 12 px como mínimo.

### Don't:
- **Don't** pintar el mal año, las pérdidas o el riesgo de rojo, ámbar o coral.
- **Don't** usar fondos rayados en advertencias o en el mal año.
- **Don't** cambiar el fondo o la gama según la pantalla o la etapa.
- **Don't** poner dos bloques azules en la misma pantalla.
- **Don't** hacer de color el botón principal.
- **Don't** poner rótulos, en mayúsculas o no, sobre los títulos.
- **Don't** agrandar la ganancia por encima de la pérdida.
- **Don't** usar `error-sistema` para hablar de inversiones: es solo para errores de formularios y de conexión.
- **Don't** agregar desenfoque de fondo al vidrio.
- **Don't** copiar a pantallas nuevas lo que Tus pesos, Ejemplos y Aprender todavía arrastran: solo heredan la paleta hasta la etapa 2.
