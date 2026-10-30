"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abrirFinBot } from "@/lib/finbot/abrir";

export function PreguntarFinBot({ pregunta }: { pregunta: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => abrirFinBot(pregunta)} className="h-auto min-h-9 w-full whitespace-normal py-2 text-center sm:w-auto">
      <Bot className="h-4 w-4" aria-hidden />
      Preguntale al asistente sobre este instrumento
    </Button>
  );
}
