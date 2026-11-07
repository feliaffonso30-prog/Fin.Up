"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EscenariosCompactos } from "@/components/plataforma/escenarios";
import { Marca } from "@/components/plataforma/primitivas";
import { ejemploDePortada } from "@/lib/plataforma/escenarios";
import { usd } from "@/lib/plataforma/formato";
import { usePlan } from "@/lib/plataforma/store";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";

const EJEMPLO = ejemploDePortada();

// La portada: muestra lo bueno y lo malo antes de pedir nada. Quien ya tiene un plan sigue a Mi plan.
export function Inicio() {
  const router = useRouter();
  const { plan } = usePlan();

  useEffect(() => {
    if (plan) router.replace("/dashboard");
  }, [plan, router]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 md:max-w-5xl md:px-8">
      <header className="flex items-center justify-between py-5">
        <Marca />
        {AUTH_CONFIGURADA && (
          <Link href="/login" className="flex min-h-10 items-center px-2 text-base font-medium underline-offset-4 hover:underline">
            Ingresar
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col md:grid md:grid-cols-[1.2fr_1fr] md:content-center md:items-center md:gap-10 md:pb-16">
        <div className="bloque-azul rounded-2xl px-5 pb-7 pt-6 md:px-9 md:py-11">
          <h1 className="text-[clamp(2rem,10.6vw,2.5rem)] font-black leading-[1] tracking-[-0.035em] md:text-6xl">
            Antes de poner <br className="md:hidden" />
            un peso, <br className="md:hidden" />
            mirá qué <br className="md:hidden" />
            puede pasar.
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-snug md:text-xl">Tu plan en 3 minutos, con lo bueno y lo malo a la vista.</p>
        </div>

        <div className="mt-7 flex flex-1 flex-col md:mt-0 md:flex-none">
          <section aria-labelledby="ejemplo">
            <h2 id="ejemplo" className="text-base font-bold">
              Si arrancás con {usd(EJEMPLO.capital)}, en dólares
            </h2>
            <EscenariosCompactos analisis={EJEMPLO.analisis} capital={EJEMPLO.capital} className="mt-3" />
            <p className="mt-2.5 text-sm text-muted-foreground">Es un ejemplo, no una promesa.</p>
          </section>

          <div className="mt-auto pb-5 pt-6 md:mt-8 md:pb-0">
            <Button asChild size="cta">
              <Link href="/onboarding">Armar mi plan</Link>
            </Button>
            <p className="mt-2.5 text-center text-sm text-muted-foreground">Sin cuenta. No movemos tu plata.</p>
            <p className="mt-1 text-center text-legal text-muted-foreground">Contenido educativo, no es asesoramiento financiero.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
