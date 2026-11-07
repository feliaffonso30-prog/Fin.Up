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
import { destinoSeguro, mensajeDeError, validarEmail, validarPassword } from "@/lib/auth/rutas";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { reiniciarPlanRemoto } from "@/lib/plataforma/store";

type Props = { modo: "login" | "registro"; siguiente?: string; errorEnlace?: boolean };

// Al confirmar el email, sigue a Mi plan: si armó un plan antes de registrarse, ya queda en su cuenta.
const urlConfirmacion = () => `${window.location.origin}/auth/callback?siguiente=/dashboard`;

export function FormAuth({ modo, siguiente, errorEnlace }: Props) {
  const router = useRouter();
  const esLogin = modo === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(errorEnlace ? "El enlace venció o ya se usó. Escribí tu email y pedí uno nuevo." : null);
  const [sinConfirmar, setSinConfirmar] = useState(Boolean(errorEnlace));
  const [enviando, setEnviando] = useState(false);
  const [revisarMail, setRevisarMail] = useState(false);

  if (!AUTH_CONFIGURADA) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-black">Por ahora podés usar FinUp sin cuenta</CardTitle>
          <CardDescription>Tu plan se guarda solo en este navegador: si borrás los datos o cambiás de dispositivo, se pierde.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="cta">
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
          <MailCheck className="mb-1 h-8 w-8 text-enlace" aria-hidden />
          <CardTitle className="text-2xl font-black">Revisá tu email</CardTitle>
          <CardDescription>
            Te mandamos un mail a <span className="font-medium text-foreground">{email}</span>. Abrilo en este mismo dispositivo y tocá el enlace para guardar tu plan. Si no llega en unos minutos, mirá en spam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ReenviarConfirmacion email={email} />
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Ya confirmé, quiero ingresar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSinConfirmar(false);
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
        setSinConfirmar(err.code === "email_not_confirmed");
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
      options: { emailRedirectTo: urlConfirmacion() },
    });
    if (err) {
      setError(mensajeDeError(err.code, err.message));
      setEnviando(false);
      return;
    }
    if (data.session) {
      // El proyecto no exige confirmar el email: ya hay sesión.
      reiniciarPlanRemoto();
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setEnviando(false);
    setRevisarMail(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-black tracking-[-0.03em]">
          <h1>{esLogin ? "Ingresá a FinUp" : "Guardá tu plan"}</h1>
        </CardTitle>
        <CardDescription className="text-base leading-snug">
          {esLogin ? "Retomá tu plan donde lo dejaste." : "Creá tu cuenta para no perderlo y verlo desde cualquier dispositivo."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={esLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-md"
            />
            {!esLogin && <p className="text-sm text-muted-foreground">Mínimo 8 caracteres, con letras y números.</p>}
          </div>

          {error && (
            <Aviso nivel="error" role="alert" compacto>
              {error}
            </Aviso>
          )}
          {sinConfirmar && <ReenviarConfirmacion email={email} />}

          <Button type="submit" size="cta" disabled={enviando}>
            {enviando ? "Un momento…" : esLogin ? "Ingresar" : "Crear mi cuenta"}
          </Button>
        </form>

        {esLogin && (
          <p className="mt-4 text-center text-sm">
            <Link href="/recuperar" className="font-medium text-enlace underline underline-offset-4">
              Olvidé mi contraseña
            </Link>
          </p>
        )}
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {esLogin ? (
            <>
              ¿No tenés cuenta?{" "}
              <Link href="/registro" className="font-medium text-enlace underline underline-offset-4">
                Creala acá
              </Link>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-enlace underline underline-offset-4">
                Ingresá
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

/** Vuelve a mandar el mail de confirmación. La respuesta no revela si el email existe. */
function ReenviarConfirmacion({ email }: { email: string }) {
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado">("listo");
  const [error, setError] = useState<string | null>(null);

  async function reenviar() {
    setError(null);
    if (!validarEmail(email)) return setError("Escribí tu email para poder mandártelo de nuevo.");
    setEstado("enviando");
    const { error: err } = await crearClienteNavegador().auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: urlConfirmacion() },
    });
    if (err) {
      setError(mensajeDeError(err.code, err.message));
      setEstado("listo");
      return;
    }
    setEstado("enviado");
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="h-12 w-full" onClick={reenviar} disabled={estado !== "listo"}>
        {estado === "enviando" ? "Enviando…" : estado === "enviado" ? "Te lo mandamos de nuevo" : "Reenviar el mail"}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
