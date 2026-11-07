"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Aviso } from "@/components/plataforma/primitivas";
import { mensajeDeError, validarEmail, validarPassword } from "@/lib/auth/rutas";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";

/** Pide el mail para cambiar la contraseña. Responde igual exista o no la cuenta. */
export function FormRecuperar() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (!AUTH_CONFIGURADA) {
    return (
      <Aviso nivel="info" titulo="Por ahora no hay cuentas">
        Tu plan se guarda solo en este navegador. <Link href="/dashboard" className="font-medium underline underline-offset-4">Ir a mi plan</Link>
      </Aviso>
    );
  }

  if (enviado) {
    return (
      <Card>
        <CardHeader>
          <MailCheck className="mb-1 h-8 w-8 text-enlace" aria-hidden />
          <CardTitle className="text-2xl font-black">Revisá tu email</CardTitle>
          <CardDescription>
            Si <span className="font-medium text-foreground">{email}</span> tiene una cuenta, te llega un mail con un enlace para elegir una contraseña nueva. Si no aparece, mirá en spam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Volver a ingresar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validarEmail(email)) return setError("Revisá que el email esté bien escrito.");
    setEnviando(true);
    const { error: err } = await crearClienteNavegador().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?siguiente=/nueva-contrasena`,
    });
    setEnviando(false);
    if (err) return setError(mensajeDeError(err.code, err.message));
    setEnviado(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-black tracking-[-0.03em]">
          <h1>Olvidé mi contraseña</h1>
        </CardTitle>
        <CardDescription className="text-base leading-snug">Escribí tu email y te mandamos un enlace para elegir una nueva.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-md" />
          </div>
          {error && (
            <Aviso nivel="error" role="alert" compacto>
              {error}
            </Aviso>
          )}
          <Button type="submit" size="cta" disabled={enviando}>
            {enviando ? "Un momento…" : "Mandarme el enlace"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="font-medium text-enlace underline underline-offset-4">
            Volver a ingresar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/** Destino del enlace del mail: la sesión ya viene del callback, solo falta la contraseña nueva. */
export function FormNuevaContrasena() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validarPassword(password)) return setError("La contraseña necesita al menos 8 caracteres, con letras y números.");
    setEnviando(true);
    const { error: err } = await crearClienteNavegador().auth.updateUser({ password });
    if (err) {
      setEnviando(false);
      if (err.code === "session_not_found" || err.name === "AuthSessionMissingError") {
        return setError("El enlace venció o ya se usó. Pedí uno nuevo desde «Olvidé mi contraseña».");
      }
      return setError(mensajeDeError(err.code, err.message));
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-black tracking-[-0.03em]">
          <h1>Elegí una contraseña nueva</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña nueva</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-md" />
            <p className="text-sm text-muted-foreground">Mínimo 8 caracteres, con letras y números.</p>
          </div>
          {error && (
            <Aviso nivel="error" role="alert" compacto>
              {error}
            </Aviso>
          )}
          <Button type="submit" size="cta" disabled={enviando}>
            {enviando ? "Un momento…" : "Guardar contraseña"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/recuperar" className="font-medium text-enlace underline underline-offset-4">
            Pedir otro enlace
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
