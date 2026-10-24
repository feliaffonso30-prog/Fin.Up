import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NoEncontrado() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
        <SearchX className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold">No tenemos ficha de ese instrumento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        La biblioteca es chica a propósito: solo incluye instrumentos muy negociados que sirven para explicar cada parte de una cartera. Revisá
        que el ticker esté bien escrito o buscalo en el listado.
      </p>
      <Button asChild className="mt-6 font-semibold">
        <Link href="/instrumentos">Ver todos los instrumentos</Link>
      </Button>
    </div>
  );
}
