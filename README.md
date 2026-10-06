# FinUp · Plataforma

Aplicación principal de FinUp: perfil de inversor, cartera sugerida con explicaciones, sección de aprendizaje y FinBot. La landing está en un repositorio aparte.

## Correrlo

```bash
npm install
cp .env.example .env.local   # completar GEMINI_API_KEY para FinBot
npm run dev                  # http://localhost:3000
```

Otros comandos: `npm test` (motor de cartera) · `npm run typecheck`.

Más contexto, decisiones de producto y hoja de ruta en [`CLAUDE.md`](./CLAUDE.md).
