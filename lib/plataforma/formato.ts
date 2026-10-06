const usdFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// "USD 1.250"
export const usd = (n: number) => `USD ${usdFmt.format(Math.round(n))}`;

// "7,5%" (con signo opcional)
export const pct = (n: number, decimales = 1) =>
  `${n.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}%`;
