import type { Metadata } from "next";
import { Glosario } from "@/components/plataforma/glosario";

export const metadata: Metadata = {
  title: "Glosario | FinUp",
  robots: { index: false },
};

export default function Page() {
  return <Glosario />;
}
