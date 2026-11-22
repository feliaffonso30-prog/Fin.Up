import type { Metadata } from "next";
import { LoQueTenes } from "@/components/plataforma/cartera-real/lo-que-tenes";

export const metadata: Metadata = {
  title: "Lo que tenés | FinUp",
  robots: { index: false },
};

export default function Page() {
  return <LoQueTenes />;
}
