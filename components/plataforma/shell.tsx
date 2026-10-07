"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, LogOut, RefreshCw } from "lucide-react";
import { FinBotChat } from "@/components/finbot/finbot-chat";
import { aContextoEstrategia } from "@/lib/plataforma/plan";
import { usePlan } from "@/lib/plataforma/store";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

function BotonSalir() {
  if (!AUTH_CONFIGURADA) return null;
  return (
    <form action="/auth/salir" method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">Cerrar sesión</span>
      </button>
    </form>
  );
}

const NAV = [
  { href: "/dashboard", etiqueta: "Mi cartera", Icono: LayoutDashboard },
  { href: "/aprender", etiqueta: "Aprender", Icono: BookOpen },
  { href: "/onboarding", etiqueta: "Rehacer perfil", Icono: RefreshCw },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan } = usePlan();

  const enlaces = NAV.map(({ href, etiqueta, Icono }) => {
    const activo = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        aria-current={activo ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          activo ? "bg-secondary font-semibold text-blue-400" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        <Icono className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{etiqueta}</span>
      </Link>
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[220px_1fr]">
      {/* Barra lateral (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card/60 p-4 md:flex">
        <Link href="/dashboard" className="mb-6 block">
          <img src="/finup.logo.1.png" alt="FinUp" className="h-14 w-auto" />
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {enlaces}
        </nav>
        <div className="mt-auto">
          <BotonSalir />
        </div>
        <p className="mt-2 px-3 text-[11px] leading-snug text-muted-foreground/70">
          Versión beta. Contenido educativo, no es asesoramiento financiero.
        </p>
      </aside>

      <div className="min-w-0">
        {/* Barra superior (mobile) */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 pt-2">
            <Link href="/dashboard">
              <img src="/finup.logo.1.png" alt="FinUp" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-blue-400">Beta</span>
              <BotonSalir />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 py-2" aria-label="Principal">
            {enlaces}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-8 md:px-8">{children}</main>
      </div>

      <FinBotChat contexto={plan ? aContextoEstrategia(plan) : null} />
    </div>
  );
}
