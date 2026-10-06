import type { Metadata } from "next";
import { Dashboard } from "@/components/plataforma/dashboard";

export const metadata: Metadata = {
  title: "Mi cartera | FinUp",
  robots: { index: false },
};

export default function Page() {
  return <Dashboard />;
}
