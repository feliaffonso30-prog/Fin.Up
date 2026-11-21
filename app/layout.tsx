import type { Metadata, Viewport } from 'next'
import { Schibsted_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: '--font-schibsted',
});

export const metadata: Metadata = {
  title: 'FinUp: antes de invertir, mirá qué puede pasar',
  description: 'Tu plan en 3 minutos, con lo bueno y lo malo a la vista. FinUp te ayuda a decidir antes de invertir, con claridad y sin mover tu plata.',
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
      <body className={`${schibsted.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
