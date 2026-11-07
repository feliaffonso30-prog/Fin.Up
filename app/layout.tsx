import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: '--font-schibsted',
});

// Tickers, porcentajes y tasas
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: 'FinUp - Inteligencia Financiera Personalizada',
  description: 'Aprendé a invertir de forma simple, transparente y sin humo. Portafolios personalizados y educación financiera para jóvenes inversores.',
}

export const viewport: Viewport = {
  themeColor: '#0b0e30',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${schibsted.variable} ${jetbrains.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
