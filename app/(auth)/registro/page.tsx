import type { Metadata } from "next";
import { FormAuth } from "@/components/plataforma/form-auth";

export const metadata: Metadata = { title: "Crear cuenta · FinUp" };

export default function Page() {
  return <FormAuth modo="registro" />;
}
