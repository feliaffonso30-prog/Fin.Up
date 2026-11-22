import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Marca } from "@/components/plataforma/primitivas";

export const metadata: Metadata = { title: "No encontramos esa página | FinUp", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <header className="py-5">
        <Link href="/" aria-label="FinUp, volver a la portada">
          <Marca />
        </Link>
      </header>
      <main className="flex flex-1 flex-col justify-center pb-20">
        <h1 className="text-[2.75rem] font-black leading-none tracking-[-0.035em]">No encontramos esa página</h1>
        <p className="mt-4 text-lg leading-snug text-muted-foreground">Puede que el enlace esté mal escrito o que la página ya no exista. Tu plan sigue donde lo dejaste.</p>
        <Button asChild size="cta" className="mt-8">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </main>
    </div>
  );
}
