import { redirect } from "next/navigation";

// La landing vive en otro repositorio. Acá la raíz lleva directo a la plataforma.
export default function Page() {
  redirect("/dashboard");
}
