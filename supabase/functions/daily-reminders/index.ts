// Petit Atelier · daily-reminders (run every morning by pg_cron, see cron.sql)
// Sends: 7-day reminder (balance due), day-before reminder, and a morning prep digest to Karol.
// Deploy: supabase functions deploy daily-reminders --no-verify-jwt ; secret CRON_SECRET must match cron.sql
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const money = (n: number) => "$" + Number(n).toLocaleString("en-US");
const iso = (d: Date) => d.toISOString().slice(0, 10);

async function sendMail(to: string, subject: string, text: string, replyTo?: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: Deno.env.get("FROM_EMAIL"), to: [to], subject, text, reply_to: replyTo }),
  });
  if (!r.ok) throw new Error(await r.text());
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("no", { status: 401 });
  // Utah time
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Denver" }));
  const plus = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return iso(d); };
  const { data: s } = await db.from("settings").select("data").eq("id", 1).maybeSingle();
  const karol = s?.data?.notifyEmail || "askpetitatelier@gmail.com";
  const { data: rows } = await db.from("bookings").select("code,data").in("status", ["confirmed", "ready"]).gte("event_date", plus(0)).lte("event_date", plus(8));
  const sent: string[] = [];
  for (const { data: b } of rows || []) {
    const first = String(b.customer.name).split(" ")[0];
    const has = (k: string) => (b.reminders || []).some((r: any) => r.kind === k);
    const bal = money(b.totals.total - b.totals.retainer);
    let kind = "", subject = "", text = "";
    if (b.event.date === plus(7) && !has("week")) {
      kind = "week"; subject = `One week to go · ${b.code}`;
      text = `Hi ${first},\n\nYour event is one week away (${b.event.date})!\n\n- Balance: ${b.payments?.balance ? "already paid, thank you!" : bal + " is due now"}\n${b.event.fulfillment === "install" ? `- I'll arrive before ${b.event.start} to install. Please keep the area clear and accessible.` : `- Pickup: ${b.event.pickupSlot} at ${s?.data?.pickupPlace || "Eagle Mountain"}. Bring an SUV or van for balloon pieces.\n- Return: ${b.event.returnSlot}.`}\n- Any last changes to colors or pieces? Reply to this email today.${b.protection !== "care" ? `\n- Refundable security deposit of ${money(b.totals.securityDeposit)} is due with the balance.` : ""}\n\nKarol · Petit Atelier Events`;
    } else if (b.event.date === plus(1) && !has("day")) {
      kind = "day"; subject = `See you tomorrow! · ${b.code}`;
      text = b.event.fulfillment === "install"
        ? `Hi ${first},\n\nTomorrow is the day! I'll arrive ahead of ${b.event.start} at ${b.event.address} to set up.\n\nPlease keep candles, tape, glitter and drinks away from the backdrops and balloons, and don't move installed pieces. I'll come back for teardown at the time we agreed.\n\nHave the best time!\nKarol`
        : `Hi ${first},\n\nYour decor is built and ready! Pickup: ${b.event.pickupSlot} at ${s?.data?.pickupPlace || "Eagle Mountain"}.\n\n- Bring an SUV or van with the seats folded down for balloon pieces.\n- We'll check every piece together before you leave.\n- Return: ${b.event.returnSlot}. Late returns are ${money(s?.data?.lateFee ?? 25)} per day.\n\nHave the best time!\nKarol`;
    }
    if (kind) {
      await sendMail(b.customer.email, subject, text, karol);
      b.reminders = [...(b.reminders || []), { kind, at: new Date().toISOString(), via: "auto" }];
      await db.from("bookings").update({ data: b }).eq("code", b.code);
      sent.push(`${b.code} ${kind}`);
    }
  }
  // Morning digest for Karol: events in the next 3 days and pieces not yet prepped
  const soon = (rows || []).map((r: any) => r.data).filter((b: any) => b.event.date <= plus(3));
  if (soon.length) {
    const lines = soon.map((b: any) => {
      const todo = b.items.filter((i: any) => !b.prep?.[i.id]).map((i: any) => `${i.qty} x ${i.name}`);
      return `${b.event.date} · ${b.event.type} · ${b.customer.name}\n  ${b.event.fulfillment === "install" ? "INSTALL at " + b.event.address + " before " + b.event.start : "Pickup " + b.event.pickupSlot}\n  ${todo.length ? "Still to prep: " + todo.join(", ") : "All pieces prepped"}${b.payments?.balance ? "" : "\n  Balance not marked paid"}`;
    });
    await sendMail(karol, `Your next 3 days · ${soon.length} event${soon.length > 1 ? "s" : ""}`, lines.join("\n\n") + (sent.length ? `\n\nReminders sent today: ${sent.join(", ")}` : ""));
  }
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
