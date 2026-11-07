"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartPie, Library, LogOut, Wallet } from "lucide-react";
import { FinBotChat } from "@/components/finbot/finbot-chat";
import { Button } from "@/components/ui/button";
import { Marca } from "@/components/plataforma/primitivas";
import { abrirFinBot } from "@/lib/finbot/abrir";
import { aContextoEstrategia } from "@/lib/plataforma/plan";
import { usePlan } from "@/lib/plataforma/store";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

// Cuatro secciones, nombradas por lo que la persona quiere hacer, no por la herramienta.
// "Rehacer mi perfil" es una acción: vive en Mi plan, no en el menú.
const NAV = [
  { href: "/dashboard", etiqueta: "Mi plan", Icono: ChartPie },
  { href: "/comparador", etiqueta: "Tus pesos", Icono: Wallet },
  { href: "/instrumentos", etiqueta: "Ejemplos", Icono: Library },
  { href: "/aprender", etiqueta: "Aprender", Icono: BookOpen },
];

const esActivo = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

/** Cerrar sesión: solo existe con cuenta. La pantalla de cuenta llega con el paso 4 de la hoja de ruta. */
function BotonSalir({ compacto, sinCuenta }: { compacto?: boolean; sinCuenta: boolean }) {
  if (!AUTH_CONFIGURADA) return null;
  if (sinCuenta) {
    return (
      <Link
        href="/login"
        className={cn(
          "flex items-center rounded-md text-sm font-medium underline-offset-4 hover:underline",
          compacto ? "min-h-11 px-2" : "min-h-10 w-full px-3 py-2",
        )}
      >
        Ingresar
      </Link>
    );
  }
  return (
    <form action="/auth/salir" method="post">
      <button
        type="submit"
        aria-label={compacto ? "Cerrar sesión" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
          compacto ? "h-11 w-11 justify-center" : "min-h-10 w-full px-3 py-2",
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        {!compacto && <span className="whitespace-nowrap">Cerrar sesión</span>}
      </button>
    </form>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan, sinCuenta } = usePlan();

  return (
    <div className="min-h-screen text-foreground md:grid md:grid-cols-[220px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border p-4 md:flex">
        <Link href="/dashboard" className="mb-6 block px-3 pt-2" aria-label="FinUp, ir a Mi plan">
          <Marca />
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {NAV.map(({ href, etiqueta, Icono }) => {
            const activo = esActivo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-base transition-colors",
                  activo
                    ? "bg-white/12 font-bold text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icono className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{etiqueta}</span>
              </Link>
            );
          })}
        </nav>
        <Button type="button" onClick={() => abrirFinBot()} className="mt-5 h-11 w-full">
          Preguntale a FinBot
        </Button>
        <div className="mt-auto">
          <BotonSalir sinCuenta={sinCuenta} />
        </div>
        <p className="mt-2 px-3 text-legal text-muted-foreground">Versión beta. Contenido educativo, no es asesoramiento financiero.</p>
      </aside>

      <div className="min-w-0">
        {/* Barra superior (celular): solo marca y cuenta; la navegación va abajo, al alcance del pulgar */}
        <header className="flex h-16 items-center justify-between px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center" aria-label="FinUp, ir a Mi plan">
            <Marca />
          </Link>
          <div className="flex items-center gap-1">
            <BotonSalir compacto sinCuenta={sinCuenta} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 pb-32 pt-3 md:px-8 md:pb-28 md:pt-10">{children}</main>
      </div>

      {/* Barra inferior (celular): 4 secciones con FinBot al centro */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-popover pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
          {NAV.slice(0, 2).map((item) => (
            <li key={item.href}>
              <PestanaInferior {...item} activo={esActivo(pathname, item.href)} />
            </li>
          ))}
          <li className="flex items-center justify-center px-0.5">
            <button
              type="button"
              onClick={() => abrirFinBot()}
              className="h-10 w-full rounded-full bg-primary text-xs font-extrabold text-primary-foreground transition-transform duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active motion-reduce:active:scale-100"
            >
              FinBot
            </button>
          </li>
          {NAV.slice(2).map((item) => (
            <li key={item.href}>
              <PestanaInferior {...item} activo={esActivo(pathname, item.href)} />
            </li>
          ))}
        </ul>
      </nav>

      <FinBotChat contexto={plan ? aContextoEstrategia(plan) : null} />
    </div>
  );
}

function PestanaInferior({
  href,
  etiqueta,
  Icono,
  activo,
}: {
  href: string;
  etiqueta: string;
  Icono: (typeof NAV)[number]["Icono"];
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors",
        activo ? "font-extrabold text-foreground" : "font-medium text-muted-foreground",
      )}
    >
      <Icono className="h-5 w-5" aria-hidden />
      {etiqueta}
    </Link>
  );
}
