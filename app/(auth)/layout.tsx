export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <img src="/finup.logo.1.png" alt="FinUp" className="mb-6 h-16 w-auto" />
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 max-w-sm text-center text-[11px] leading-snug text-muted-foreground/70">
        Versión beta. Contenido educativo, no es asesoramiento financiero.
      </p>
    </div>
  );
}
