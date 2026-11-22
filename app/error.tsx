"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Marca } from "@/components/plataforma/primitivas";

// Si algo falla al dibujar una pantalla: explica qué pasó y deja reintentar, sin mostrar detalles técnicos.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <header className="py-5">
        <Link href="/" aria-label="FinUp, volver a la portada">
          <Marca />
        </Link>
      </header>
      <main className="flex flex-1 flex-col justify-center pb-20">
        <h1 className="text-[2.75rem] font-black leading-none tracking-[-0.035em]">Algo no salió bien</h1>
        <p className="mt-4 text-lg leading-snug text-muted-foreground">Fue un problema nuestro. Probá de nuevo y, si sigue pasando, volvé en un rato.</p>
        <Button type="button" size="cta" onClick={reset} className="mt-8">
          Probar de nuevo
        </Button>
        <Button asChild variant="ghost" className="mt-2 h-12 w-full">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </main>
    </div>
  );
}
