import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// galnac-notify — notifica por Telegram un nuevo lead de la demo de GALNAC.
// El lead ya se inserta en leads_web desde el cliente (origen='demo-galnac');
// esta función SOLO envía la notificación vía Telegram Bot API, manteniendo el
// token EXCLUSIVAMENTE server-side.
//
// Recibe (POST JSON): { nombre, telefono, sector, interes, mensaje, origen }.
// Acepta `servicio`/`equipo` como alias de `interes` (compatibilidad).
// El cliente llama con navigator.sendBeacon y Content-Type
// "text/plain;charset=UTF-8" (evita el preflight CORS que descarta el POST);
// el body sigue siendo JSON y se parsea igual.
//
// Secrets usados (nunca en cliente):
//   - TELEGRAM_BOT_TOKEN : token del bot de Telegram
//   - TELEGRAM_CHAT_ID   : chat destino del aviso
//
// Regla del proyecto: si el envío falla → console.warn, nunca interrumpe nada.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const data = (payload.args ?? payload) as Record<string, unknown>;
  const nombre = String(data.nombre ?? "").trim();
  const telefono = String(data.telefono ?? "").trim();
  const sector = String(data.sector ?? "galnac").trim();
  const interes = String(
    data.interes ?? data.servicio ?? data.equipo ?? "",
  ).trim();
  const mensaje = String(data.mensaje ?? data.uso ?? "").trim();
  const origen = String(data.origen ?? "demo-galnac").trim();

  // Guard de lead incompleto — estándar WhiteMoon.
  // Un lead solo es válido con nombre Y teléfono: sin ambos no se avisa.
  if (!nombre || !telefono) {
    return json({ ok: false, error: "lead incompleto" }, 400);
  }

  const message =
    `🔔 Nuevo lead (${origen}) · ${sector}\n` +
    `Nombre: ${nombre || "-"}\n` +
    `Teléfono: ${telefono || "-"}\n` +
    `Interés: ${interes || "-"}\n` +
    `Consulta: ${mensaje || "-"}`;

  let notified = false;
  try {
    const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const tgChat = Deno.env.get("TELEGRAM_CHAT_ID");
    if (tgToken && tgChat) {
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tgChat, text: message }),
      });
      notified = r.ok;
      if (!r.ok) {
        console.warn("[galnac-notify] Telegram falló:", r.status, await r.text());
      }
    } else {
      console.warn("[galnac-notify] sin TELEGRAM_BOT_TOKEN/CHAT_ID, mensaje:", message);
    }
  } catch (e) {
    console.warn("[galnac-notify] error enviando Telegram:", e);
  }

  return json({ ok: true, notified });
});
