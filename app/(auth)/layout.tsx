import Link from "next/link";
import { Marca } from "@/components/plataforma/primitivas";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 text-foreground">
      <Link href="/" aria-label="FinUp, volver a la portada" className="mb-6">
        <Marca className="text-3xl" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 max-w-sm text-center text-legal leading-snug text-muted-foreground">Versión beta. Contenido educativo, no es asesoramiento financiero.</p>
    </div>
  );
}
