// Petit Atelier · ai-balloons
// mode "plan":   turns the customer's description into colors, length, placement and a short message (Claude API).
// mode "render": takes a picture of the customer's Design Studio layout (Karol's real pieces) and adds a photoreal
//                balloon garland in the chosen colors (OpenAI image edit). Saves it to the "ai" storage bucket.
// Deploy: supabase functions deploy ai-balloons --no-verify-jwt
// Secrets: ANTHROPIC_API_KEY, OPENAI_API_KEY   (limits: 20 plans and 4 photos per visitor per day)
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const LIMIT = { plan: 20, render: 4 };
const PLACE: Record<string, string> = {
  "around-arch": "wrapped around the arch / hoop",
  "half-cascade": "cascading down one side of the backdrop like a half arch, with a small cluster on the floor on the other side",
  "corner-clusters": "as two lush clusters at the base corners",
  "full-arch": "as a full organic arch over the backdrop",
};

async function allowed(ip: string, mode: "plan" | "render") {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await db.from("ai_usage").select("n").eq("ip", ip).eq("day", day).eq("mode", mode).maybeSingle();
  const n = data?.n ?? 0;
  if (n >= LIMIT[mode]) return false;
  await db.from("ai_usage").upsert({ ip, day, mode, n: n + 1 });
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const mode = body.mode === "render" ? "render" : "plan";
    if (!(await allowed(ip, mode))) return json({ error: "Daily limit reached. Karol can still design it with you." }, 429);
    const text = String(body.text || "").slice(0, 600);

    if (mode === "plan") {
      const colors: string[] = (body.colors || []).slice(0, 40), styles: string[] = (body.styles || []).slice(0, 10);
      const prompt = `You are the balloon designer for Petit Atelier Events, a party decor rental in Utah. Reply with JSON only:
{"theme": short theme name, "colors": up to 3 names chosen ONLY from ${JSON.stringify(colors)}, "placement": one of ["around-arch","half-cascade","corner-clusters","full-arch"], "ft": garland length in feet 6 to 30 (keep it simple and easy to build), "style": one of ${JSON.stringify(styles)}, "character": true if they mention a licensed character or brand, "message": one friendly sentence in ${body.lang === "es" ? "Spanish" : "English"} describing the design plus one easy accent idea. Never promise printed licensed characters; offer matching colors instead.}
Pieces in their setup: ${JSON.stringify((body.pieces || []).slice(0, 20))}
Customer idea: ${JSON.stringify(text)}`;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
      });
      if (!r.ok) throw new Error(await r.text());
      const out = await r.json();
      const plan = JSON.parse((out.content?.[0]?.text || "{}").match(/\{[\s\S]*\}/)?.[0] || "{}");
      plan.colors = (plan.colors || []).filter((c: string) => colors.includes(c)).slice(0, 3);
      return json(plan);
    }

    // render: image edit on top of the customer's real-piece layout
    const b64 = String(body.image || "").replace(/^data:image\/png;base64,/, "");
    if (b64.length < 1000 || b64.length > 12_000_000) return json({ error: "Bad image" }, 400);
    const colors = (body.colors || []).slice(0, 3).join(", ");
    const prompt = `Photorealistic event decor photo. Keep every existing piece (gold arches, tables, furniture), its position and size exactly as shown, and keep the wall and floor. ` +
      `Add one organic latex balloon garland (mixed sizes 5 to 18 inch, matte and chrome finishes) in ${colors || "soft neutral"} colors, ${PLACE[body.placement] || PLACE["half-cascade"]}, about ${Math.round(+body.ft || 12)} feet long. ` +
      `Customer idea: ${text}. Do not add text, logos, cartoon or licensed characters; use only the colors and simple shapes. Natural soft studio lighting.`;
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("image", new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "image/png" }), "stage.png");
    form.append("prompt", prompt);
    form.append("size", "1536x1024");
    const r = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` }, body: form });
    if (!r.ok) throw new Error(await r.text());
    const out = await r.json();
    const png = Uint8Array.from(atob(out.data[0].b64_json), (c) => c.charCodeAt(0));
    const path = `previews/${crypto.randomUUID()}.png`;
    const { error } = await db.storage.from("ai").upload(path, png, { contentType: "image/png" });
    if (error) throw error;
    return json({ url: db.storage.from("ai").getPublicUrl(path).data.publicUrl });
  } catch (e) {
    return json({ error: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
