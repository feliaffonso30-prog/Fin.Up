// Acciones argentinas y bonos que se pueden anotar en "Lo que tenés".
// Sin licencia de Market Data de BYMA no mostramos su precio: se anotan con el valor
// que la persona ve en su app. Esta lista solo sirve para encontrarlos por nombre.
//
// TODO-VERIFICAR: armada a mano (panel líder y las más conocidas del panel general).
// Revisarla contra "Empresas listadas" de BYMA y sumar las que falten.

export interface ActivoLocal {
  ticker: string;
  nombre: string;
  tipo: "Acción argentina" | "Bono soberano";
}

const accion = (ticker: string, nombre: string): ActivoLocal => ({ ticker, nombre, tipo: "Acción argentina" });
const bono = (ticker: string, nombre: string): ActivoLocal => ({ ticker, nombre, tipo: "Bono soberano" });

export const ACCIONES_ARGENTINAS: readonly ActivoLocal[] = [
  // Panel líder
  accion("ALUA", "Aluar"),
  accion("BBAR", "BBVA Argentina"),
  accion("BMA", "Banco Macro"),
  accion("BYMA", "Bolsas y Mercados Argentinos"),
  accion("CEPU", "Central Puerto"),
  accion("COME", "Sociedad Comercial del Plata"),
  accion("CRES", "Cresud"),
  accion("CVH", "Cablevisión Holding"),
  accion("EDN", "Edenor"),
  accion("GGAL", "Grupo Financiero Galicia"),
  accion("HARG", "Holcim Argentina"),
  accion("IRSA", "IRSA"),
  accion("LOMA", "Loma Negra"),
  accion("METR", "Metrogas"),
  accion("MIRG", "Mirgor"),
  accion("PAMP", "Pampa Energía"),
  accion("SUPV", "Grupo Supervielle"),
  accion("TECO2", "Telecom Argentina"),
  accion("TGNO4", "Transportadora de Gas del Norte"),
  accion("TGSU2", "Transportadora de Gas del Sur"),
  accion("TRAN", "Transener"),
  accion("TXAR", "Ternium Argentina"),
  accion("VALO", "Grupo Financiero Valores"),
  accion("YPFD", "YPF"),
  // Panel general (las más conocidas)
  accion("A3", "A3 Mercados"),
  accion("AGRO", "Agrometal"),
  accion("AUSO", "Autopistas del Sol"),
  accion("BHIP", "Banco Hipotecario"),
  accion("BOLT", "Boldt"),
  accion("BPAT", "Banco Patagonia"),
  accion("CADO", "Carlos Casado"),
  accion("CAPX", "Capex"),
  accion("CARC", "Carboclor"),
  accion("CECO2", "Central Costanera"),
  accion("CELU", "Celulosa Argentina"),
  accion("CGPA2", "Camuzzi Gas Pampeana"),
  accion("CTIO", "Consultatio"),
  accion("DGCU2", "Distribuidora de Gas Cuyana"),
  accion("DOME", "Domec"),
  accion("ECOG", "Ecogas"),
  accion("FERR", "Ferrum"),
  accion("FIPL", "Fiplasto"),
  accion("GBAN", "Naturgy BAN"),
  accion("GCLA", "Grupo Clarín"),
  accion("GRIM", "Grimoldi"),
  accion("HAVA", "Havanna"),
  accion("INTR", "Compañía Introductora de Buenos Aires"),
  accion("INVJ", "Inversora Juramento"),
  accion("LEDE", "Ledesma"),
  accion("LONG", "Longvie"),
  accion("MOLA", "Molinos Agro"),
  accion("MOLI", "Molinos Río de la Plata"),
  accion("MORI", "Morixe"),
  accion("OEST", "Grupo Concesionario del Oeste"),
  accion("PATA", "Importadora y Exportadora de la Patagonia"),
  accion("RICH", "Laboratorios Richmond"),
  accion("RIGO", "Rigolleau"),
  accion("SAMI", "San Miguel"),
  accion("SEMI", "Molinos Juan Semino"),
];

export const BONOS_SOBERANOS: readonly ActivoLocal[] = [
  bono("AL29", "Bonar 2029 (ley argentina)"),
  bono("AL30", "Bonar 2030 (ley argentina)"),
  bono("AL35", "Bonar 2035 (ley argentina)"),
  bono("AE38", "Bonar 2038 (ley argentina)"),
  bono("AL41", "Bonar 2041 (ley argentina)"),
  bono("GD29", "Global 2029 (ley de Nueva York)"),
  bono("GD30", "Global 2030 (ley de Nueva York)"),
  bono("GD35", "Global 2035 (ley de Nueva York)"),
  bono("GD38", "Global 2038 (ley de Nueva York)"),
  bono("GD41", "Global 2041 (ley de Nueva York)"),
  bono("GD46", "Global 2046 (ley de Nueva York)"),
];
