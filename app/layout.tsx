import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-jakarta',
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
  themeColor: '#0a1752',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
