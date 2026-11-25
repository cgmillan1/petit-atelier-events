// Petit Atelier · ai-balloons
// mode "plan":   turns the customer's description into balloon pieces (style, what it goes around, coverage, strands, colors, extras) plus a short message (Claude API).
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
      const colors: string[] = (body.colors || []).map(String).slice(0, 60);
      const AROUND = ["window-arch", "half-arches", "hoop", "doorway", "table", "backdrop-top", "floor"];
      const prompt = `You are the balloon designer for Petit Atelier Events, a party decor rental in Utah. Most customers plan kids birthday parties, so read the request carefully, word by word: a character, show, movie or game name means its well-known signature colors. Never invent an unrelated theme. Turn the customer's request into balloon pieces. Reply with JSON only:
{"theme": short theme name or "", "character": true if they mention a licensed character, show, game or brand,
 "message": one or two friendly sentences in ${body.lang === "es" ? "Spanish" : "English"} describing the design and one easy accent idea (never promise printed licensed characters; we match colors and feel),
 "pieces": [ {"kind": one of ["classic","organic","full","column","cluster"], "around": one of ${JSON.stringify(AROUND)}, "cover": one of ["full","half","corner","base"], "strands": 1-3, "ft": length in feet or 0 to size it to the piece automatically, "count": clusters count if kind is cluster, "colors": 2 to 6 names chosen ONLY from ${JSON.stringify(colors)} that best match the theme (for a character or game use its signature colors, for example Mario Bros: Red, Royal blue, Yellow, Green, Brown, White), "chrome": bool, "greenery": bool, "confetti": bool, "statement": 0-4, "foils": 0-3 } ]}
"main arch" or "the arch" means window-arch. "around" the arch means cover "full". Use one piece unless they ask for several. Pieces already on their stage: ${JSON.stringify((body.pieces || []).slice(0, 20))}
${body.theme?.name ? `\nDetected theme: ${String(body.theme.name).slice(0, 60)}. Use exactly these colors: ${JSON.stringify((body.theme.colors || []).filter((c: string) => colors.includes(c)))}.` : ''}${(body.named || []).length ? `\nThe customer named these colors, use them: ${JSON.stringify((body.named || []).filter((c: string) => colors.includes(c)))}.` : ''}
Customer request: ${JSON.stringify(text)}`;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
      });
      if (!r.ok) throw new Error(await r.text());
      const out = await r.json();
      const plan = JSON.parse((out.content?.[0]?.text || "{}").match(/\{[\s\S]*\}/)?.[0] || "{}");
      plan.pieces = (Array.isArray(plan.pieces) ? plan.pieces : []).slice(0, 4).map((p: any) => ({ ...p, colors: (p.colors || []).filter((c: string) => colors.includes(c)).slice(0, 6) }));
      return json(plan);
    }

    // render: image edit on top of the customer's real-piece layout
    const b64 = String(body.image || "").replace(/^data:image\/png;base64,/, "");
    if (b64.length < 1000 || b64.length > 12_000_000) return json({ error: "Bad image" }, 400);
    const colors = (body.colors || []).map(String).slice(0, 6).join(", ");
    const theme = String(body.theme || "").slice(0, 80);
    const pieces = String(body.placement || "an organic garland on the main arch").slice(0, 400);
    const prompt = `Edit this photo into a photorealistic, professionally styled party setup photo. Keep every existing decor piece (gold arches, tables, pedestals, furniture) exactly where it is, same size and shape, and keep the wall, floor, camera angle and lighting. ` +
      `Add real latex balloon decor built by a professional balloon artist: ${pieces}. Organic style with mixed sizes (5, 11, 18 and a few 24 inch balloons), clustered tightly and attached to the structure, with matte, pearl and chrome finishes. ` +
      `Colors: ${colors || "soft neutrals"}.${theme ? ` Theme: ${theme}, shown only through the colors and finishes.` : ""} Customer idea: ${text}. ` +
      `Do not add text, logos, printed characters or cartoon figures. Natural soft lighting, sharp focus, realistic shadows.`;
    const form = new FormData();
    form.append("model", Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1");
    form.append("image", new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "image/png" }), "stage.png");
    form.append("prompt", prompt);
    form.append("size", "1536x1024");
    form.append("quality", "high");
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
