"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bot, ChartPie, Library, LogOut, Wallet } from "lucide-react";
import { FinBotChat } from "@/components/finbot/finbot-chat";
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
function BotonSalir({ compacto }: { compacto?: boolean }) {
  if (!AUTH_CONFIGURADA) return null;
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
  const { plan } = usePlan();

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[220px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card/60 p-4 md:flex">
        <Link href="/dashboard" className="mb-6 block">
          <img src="/finup.logo.1.png" alt="FinUp" className="h-14 w-auto" />
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
                  "relative flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  activo
                    ? "bg-secondary font-semibold text-foreground before:filo-vertical before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icono className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{etiqueta}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <BotonSalir />
        </div>
        <p className="mt-2 px-3 text-legal text-muted-foreground/80">Versión beta. Contenido educativo, no es asesoramiento financiero.</p>
      </aside>

      <div className="min-w-0">
        {/* Barra superior (celular): solo marca y cuenta; la navegación va abajo, al alcance del pulgar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center">
            <img src="/finup.logo.1.png" alt="FinUp" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <span className="rounded-full border border-border px-2 py-0.5 text-legal font-medium text-enlace">Beta</span>
            <BotonSalir compacto />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 pb-32 pt-8 md:px-8 md:pb-28">{children}</main>
      </div>

      {/* Barra inferior (celular): 4 secciones con FinBot al centro */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
          {NAV.slice(0, 2).map((item) => (
            <li key={item.href}>
              <PestanaInferior {...item} activo={esActivo(pathname, item.href)} />
            </li>
          ))}
          <li className="flex items-start justify-center">
            <button
              type="button"
              onClick={() => abrirFinBot()}
              className="-mt-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_12px_24px_-8px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-primary-hover active:bg-primary-active"
            >
              <Bot className="h-5 w-5" aria-hidden />
              <span className="sr-only">Abrir FinBot</span>
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
        "relative flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
        activo ? "text-foreground before:filo before:absolute before:inset-x-3 before:top-0 before:h-0.5" : "text-muted-foreground",
      )}
    >
      <Icono className="h-5 w-5" aria-hidden />
      {etiqueta}
    </Link>
  );
}
