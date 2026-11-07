const usdFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// "USD 1.250"
export const usd = (n: number) => `USD ${usdFmt.format(Math.round(n))}`;

const signo = (n: number) => (n < 0 ? "−" : "+");

// "−USD 121" o, sin moneda, "−121"
export const montoConSigno = (n: number, conMoneda = true) => `${signo(n)}${conMoneda ? "USD " : ""}${usdFmt.format(Math.abs(Math.round(n)))}`;

// "+USD 29 a 69"; si cruza el cero, "−5 a +30"
export function rangoConSigno(min: number, max: number, conMoneda = true): string {
  const prefijo = conMoneda ? "USD " : "";
  const abs = (n: number) => usdFmt.format(Math.abs(Math.round(n)));
  if (Math.round(min) < 0 && Math.round(max) > 0) return `${signo(min)}${prefijo}${abs(min)} a ${signo(max)}${abs(max)}`;
  return `${signo(max)}${prefijo}${abs(min)} a ${abs(max)}`;
}

// "$ 1.500.000"
export const ars = (n: number) => `$ ${usdFmt.format(Math.round(n))}`;

// Fechas: se arman a mano (no con toLocaleString) para que servidor y navegador
// den exactamente el mismo texto y no haya errores de hidratación.
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const partesAr = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// "2026-10-09" → "09/10/2026"; "2026-10-09T04:53:38Z" → "09/10/2026 01:53" (hora argentina)
export function fecha(iso: string): string {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (soloFecha) return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const p = Object.fromEntries(partesAr.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

// "2026-08-31" → "agosto 2026"
export function mesAnio(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m ? `${MESES[Number(m[2]) - 1]} ${m[1]}` : iso;
}

// "7,5%" (con signo opcional)
export const pct = (n: number, decimales = 1) =>
  `${n.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}%`;

// "−12%" o "+2,9%": con el signo menos real, para las cifras grandes
export const pctConSigno = (n: number, decimales = 1) => `${signo(n)}${pct(Math.abs(n), decimales)}`;
