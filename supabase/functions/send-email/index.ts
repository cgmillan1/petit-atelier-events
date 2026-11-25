// Petit Atelier · send-email
// Deploy: supabase functions deploy send-email --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=... FROM_EMAIL="Petit Atelier <hello@yourdomain.com>"
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const money = (n: number) => "$" + Number(n).toLocaleString("en-US");

export async function sendMail(to: string, subject: string, text: string, replyTo?: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: Deno.env.get("FROM_EMAIL"), to: [to], subject, text, reply_to: replyTo }),
  });
  if (!r.ok) throw new Error(`Email failed: ${await r.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { kind, code, subject, text } = await req.json();
    const { data: row } = await db.from("bookings").select("data").eq("code", String(code || "")).maybeSingle();
    if (!row) return json({ error: "Booking not found" }, 404);
    const b = row.data;
    const { data: s } = await db.from("settings").select("data").eq("id", 1).maybeSingle();
    const karol = s?.data?.notifyEmail || "askpetitatelier@gmail.com";

    if (kind === "new_booking") {
      // Anyone may trigger this, but only once per booking, and only to Karol and the booking's own email.
      if (b.notified) return json({ ok: true, already: true });
      const items = b.items.map((i: any) => `${i.qty} x ${i.name}  ${money(i.price * i.qty)}`).join("\n");
      await sendMail(karol, `New request ${b.code}: ${b.event.type} on ${b.event.date}`,
        `${b.customer.name} · ${b.customer.email} · ${b.customer.phone}\n${b.event.type} on ${b.event.date} at ${b.event.start}\n${b.event.fulfillment === "install" ? "INSTALLATION at " + b.event.address : "Pickup: " + b.event.pickupSlot}\n\n${items}\n\nTotal ${money(b.totals.total)} · Retainer ${money(b.totals.retainer)} · ${b.protection === "care" ? "Care Plan" : "Security deposit"}\nNotes: ${b.event.notes || "none"}\n\nOpen your dashboard to confirm.`, b.customer.email);
      await sendMail(b.customer.email, `We received your request ${b.code} · Petit Atelier Events`,
        `Hi ${String(b.customer.name).split(" ")[0]},\n\nThank you for designing your party with Petit Atelier Events! Your request ${b.code} for ${b.event.date} is in. Karol will confirm within 48 hours and send how to pay the ${money(b.totals.retainer)} retainer.\n${b.event.fulfillment === "install" ? "Installation at " + b.event.address : "Pickup: " + b.event.pickupSlot + ". Return: " + b.event.returnSlot}\n\n${items}\nEstimated total: ${money(b.totals.total)}\n\nLook up your reservation and signed agreement anytime with your code and this email.\n\nKarol · Petit Atelier Events`, karol);
      b.notified = true;
      await db.from("bookings").update({ data: b }).eq("code", b.code);
      return json({ ok: true });
    }

    // Every other email is written by Karol in the dashboard: caller must be an admin.
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await db.auth.getUser(jwt);
    const email = u?.user?.email?.toLowerCase();
    const { data: adm } = email ? await db.from("admins").select("email").eq("email", email).maybeSingle() : { data: null };
    if (!adm) return json({ error: "Not allowed" }, 403);
    await sendMail(b.customer.email, String(subject).slice(0, 200), String(text).slice(0, 10000), karol);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
function json(o: unknown, status = 200) { return new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } }); }
