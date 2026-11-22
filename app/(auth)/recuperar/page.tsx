import type { Metadata } from "next";
import { FormRecuperar } from "@/components/plataforma/form-recuperar";

export const metadata: Metadata = { title: "Recuperar contraseña · FinUp", robots: { index: false } };

export default function Page() {
  return <FormRecuperar />;
}
