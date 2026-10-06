import type { Metadata } from "next";
import { Onboarding } from "@/components/plataforma/onboarding";

export const metadata: Metadata = {
  title: "Tu perfil de inversor | FinUp",
  robots: { index: false }, // beta: no indexar hasta el lanzamiento
};

export default function Page() {
  return <Onboarding />;
}
