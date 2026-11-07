import type { Metadata } from "next";
import { Inicio } from "@/components/plataforma/inicio";

export const metadata: Metadata = {
  title: "Antes de invertir | FinUp",
  robots: { index: false }, // beta: no indexar hasta el lanzamiento
};

// La landing vive en otro repositorio. Esta es la puerta de entrada a la plataforma.
export default function Page() {
  return <Inicio />;
}
