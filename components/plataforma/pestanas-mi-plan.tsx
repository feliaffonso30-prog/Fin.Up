import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * En el celular, "Lo que tenés" vive dentro de Mi plan (la barra inferior no tiene lugar
 * para una quinta sección). En escritorio no hace falta: está en la barra lateral.
 */
export function PestanasMiPlan({ activa, className }: { activa: "plan" | "cartera"; className?: string }) {
  const pestanas = [
    { id: "plan", href: "/dashboard", etiqueta: "Tu plan sugerido" },
    { id: "cartera", href: "/cartera", etiqueta: "Lo que tenés" },
  ] as const;
  return (
    <nav aria-label="Mi plan" className={cn("vidrio flex rounded-full p-1 md:hidden", className)}>
      {pestanas.map((p) => (
        <Link
          key={p.id}
          href={p.href}
          aria-current={activa === p.id ? "page" : undefined}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center rounded-full px-3 text-sm",
            activa === p.id ? "bg-white/20 font-extrabold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          {p.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
