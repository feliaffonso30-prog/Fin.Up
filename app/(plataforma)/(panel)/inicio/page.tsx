import type { Metadata } from "next";
import { TuInicio } from "@/components/plataforma/tu-inicio";

export const metadata: Metadata = {
  title: "Inicio | FinUp",
  robots: { index: false },
};

export default function Page() {
  return <TuInicio />;
}
