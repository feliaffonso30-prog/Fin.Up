import type { Metadata } from "next";
import { Aprender } from "@/components/plataforma/aprender";

export const metadata: Metadata = {
  title: "Aprender | FinUp",
  robots: { index: false },
};

export default function Page() {
  return <Aprender />;
}
