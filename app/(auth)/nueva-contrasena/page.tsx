import type { Metadata } from "next";
import { FormNuevaContrasena } from "@/components/plataforma/form-recuperar";

export const metadata: Metadata = { title: "Contraseña nueva · FinUp", robots: { index: false } };

export default function Page() {
  return <FormNuevaContrasena />;
}
