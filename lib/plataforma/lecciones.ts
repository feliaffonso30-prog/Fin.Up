// Lecciones cortas de la sección "Aprender". Contenido estático y revisable por
// el equipo; el glosario completo vive en lib/finbot/knowledge.ts.

export interface Leccion {
  id: string;
  titulo: string;
  resumen: string;
  puntos: string[];
}

export const LECCIONES: Leccion[] = [
  {
    id: "diversificar",
    titulo: "No pongas todos los huevos en la misma canasta",
    resumen: "Repartir tu plata entre distintos activos es la herramienta más simple para cuidarla.",
    puntos: [
      "Si una inversión cae, las otras amortiguan el golpe en tu cartera.",
      "Un ETF ya diversifica: con una sola compra tenés participación en muchas empresas.",
      "Diversificar no elimina el riesgo: en una crisis fuerte casi todo baja a la vez, aunque la caída suele ser menor.",
    ],
  },
  {
    id: "interes-compuesto",
    titulo: "El interés compuesto: ganar sobre lo ya ganado",
    resumen: "Los intereses que cobrás se suman al capital y empiezan a generar más intereses.",
    puntos: [
      "USD 100 al 8% anual se convierten en unos USD 216 en 10 años si reinvertís todo.",
      "Cuanto antes empezás, más trabaja el tiempo a tu favor, incluso con montos chicos.",
      "Funciona para los dos lados: una deuda con tasa alta también se multiplica.",
    ],
  },
  {
    id: "riesgo-retorno",
    titulo: "Más retorno posible, más riesgo",
    resumen: "No existe una inversión que prometa mucho rendimiento y no tenga riesgo.",
    puntos: [
      "El riesgo no es solo perder: es que el camino sea inestable, con subas y bajas fuertes.",
      "Por eso importa cuándo vas a necesitar la plata: a más plazo, más caídas podés esperar a que se recuperen.",
      "Tu perfil de riesgo mide cuánta caída podés aguantar sin vender por pánico.",
    ],
  },
  {
    id: "inflacion",
    titulo: "La inflación: el rival silencioso",
    resumen: "Que tu plata crezca en números no significa que alcance para comprar más.",
    puntos: [
      "Si tu inversión rinde menos que la suba de precios, perdés poder de compra aunque el saldo aumente.",
      "Por eso conviene comparar siempre un rendimiento contra la inflación, no solo contra cero.",
      "Guardar todo en efectivo y sin rendimiento es, a la larga, una forma segura de perder valor.",
    ],
  },
  {
    id: "anti-humo",
    titulo: "Cómo detectar el humo",
    resumen: "Las estafas y los falsos gurús comparten señales. Si ves varias juntas, desconfiá.",
    puntos: [
      "Prometen ganancias garantizadas o rendimientos muy por encima del mercado. Nadie puede garantizarlo.",
      "Te apuran: \"quedan pocos lugares\", \"entrá hoy o te lo perdés\".",
      "Te piden transferir a una cuenta personal o que \"les dejes manejar\" tu plata, en vez de operar vos en un broker registrado en la CNV.",
      "Solo muestran las ganancias y nunca explican qué puede salir mal.",
      "Te piden sumar gente para ganar más: eso es el esquema de una pirámide.",
    ],
  },
];
