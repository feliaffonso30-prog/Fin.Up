import type { Metadata } from "next";
import { FormAuth } from "@/components/plataforma/form-auth";

export const metadata: Metadata = { title: "Ingresar · FinUp" };

export default async function Page({ searchParams }: { searchParams: Promise<{ siguiente?: string; error?: string }> }) {
  const { siguiente, error } = await searchParams;
  return <FormAuth modo="login" siguiente={siguiente} errorEnlace={error === "enlace"} />;
}
