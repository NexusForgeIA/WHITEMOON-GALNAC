# WHITEMOON · GALNAC — Demo

Demo web de sector **maquinaria industrial** para **GALNAC S.L.** (Porriño, Pontevedra), construida por [WhiteMoon Agencia IA](https://whitemoon.es).

> Maquinaria Industrial · desde 1996 — Compresores, perforadoras, reparación de segunda mano y repuestos. ISO 9001 certificado por Bureau Veritas.

## Stack

- **Frontend:** HTML/CSS/JS puro (sin frameworks), todo en `index.html`.
- **Animación:** GSAP + ScrollTrigger (CDN), reveal con stagger, parallax, cursor personalizado.
- **Diseño:** dark industrial premium. Display *Barlow Condensed*, body *Inter*.
- **Backend (chatbot GALAN):** Supabase Edge Functions
  - `galnac-chat` → proxy a Claude (`claude-haiku-4-5-20251001`), API key 100% server-side.
  - `galnac-notify` → aviso WhatsApp del lead vía CallMeBot.
  - Leads → tabla `leads_web` (`sector='maquinaria-industrial'`, `origen='galnac-demo'`).

## Despliegue

GitHub Pages sobre `main` (raíz). La demo se sirve en
`https://nexusforgeia.github.io/WHITEMOON-GALNAC/`.

## Asistente técnico GALAN

Agente conversacional con personalidad de ingeniero industrial senior. Énfasis en
compresores eléctricos (Epiroc · Atlas Copco), reparación de compresores de segunda
mano y maquinaria de perforación (Doofor · Epiroc). Nunca da precios: deriva siempre a
presupuesto personalizado y captura el lead para contacto en 24 h.

---

© 1996—2026 GALNAC S.L. · Demo IA por WhiteMoon.
