"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { destinoSeguro, mensajeDeError, validarEmail, validarPassword } from "@/lib/auth/rutas";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { reiniciarPlanRemoto } from "@/lib/plataforma/store";

type Props = { modo: "login" | "registro"; siguiente?: string; errorEnlace?: boolean };

export function FormAuth({ modo, siguiente, errorEnlace }: Props) {
  const router = useRouter();
  const esLogin = modo === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(errorEnlace ? "El enlace venció o ya se usó. Ingresá o pedí uno nuevo." : null);
  const [enviando, setEnviando] = useState(false);
  const [revisarMail, setRevisarMail] = useState(false);

  if (!AUTH_CONFIGURADA) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuentas no configuradas</CardTitle>
          <CardDescription>
            Faltan las variables de Supabase en este entorno. Mientras tanto podés usar la plataforma sin cuenta: tu plan se guarda solo en este navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">Entrar sin cuenta</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (revisarMail) {
    return (
      <Card>
        <CardHeader>
          <MailCheck className="mb-1 h-8 w-8 text-blue-400" aria-hidden />
          <CardTitle>Revisá tu email</CardTitle>
          <CardDescription>
            Si el email es válido, te enviamos un enlace para confirmar tu cuenta. Si no lo ves, mirá en spam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Ir a ingresar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validarEmail(email)) return setError("Revisá que el email esté bien escrito.");
    if (!esLogin && !validarPassword(password)) {
      return setError("La contraseña necesita al menos 8 caracteres, con letras y números.");
    }
    if (esLogin && password.length === 0) return setError("Ingresá tu contraseña.");

    setEnviando(true);
    const supabase = crearClienteNavegador();

    if (esLogin) {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        setError(mensajeDeError(err.code, err.message));
        setEnviando(false);
        return;
      }
      reiniciarPlanRemoto();
      router.replace(destinoSeguro(siguiente));
      router.refresh();
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?siguiente=/onboarding` },
    });
    if (err) {
      setError(mensajeDeError(err.code, err.message));
      setEnviando(false);
      return;
    }
    if (data.session) {
      // El proyecto no exige confirmar el email: ya hay sesión.
      reiniciarPlanRemoto();
      router.replace("/onboarding");
      router.refresh();
      return;
    }
    setEnviando(false);
    setRevisarMail(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{esLogin ? "Ingresá a FinUp" : "Creá tu cuenta"}</CardTitle>
        <CardDescription>
          {esLogin ? "Retomá tu cartera donde la dejaste." : "Guardá tu perfil y tu cartera para entrar desde cualquier dispositivo."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={esLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {!esLogin && <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con letras y números.</p>}
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5 text-sm text-red-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Un momento…" : esLogin ? "Ingresar" : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {esLogin ? (
            <>
              ¿No tenés cuenta?{" "}
              <Link href="/registro" className="font-medium text-blue-400 hover:underline">
                Creala acá
              </Link>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-blue-400 hover:underline">
                Ingresá
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
