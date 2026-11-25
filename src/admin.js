/* ===== Karol's dashboard (#admin) ===== */
const AD = { tab: 'overview', bookings: [], filter: 'open', month: null, open: null };
const FLOW = ['new', 'confirmed', 'ready', 'delivered', 'returned', 'closed'];
const ST_EN = { new: 'New request', confirmed: 'Confirmed', ready: 'Ready for pickup', delivered: 'Picked up', returned: 'Returned', closed: 'Closed', declined: 'Declined', cancelled: 'Cancelled' };
const isInst = b => b.event.fulfillment === 'install';
const stLabel = b => isInst(b) ? ({ ready: 'Ready to install', delivered: 'Installed', returned: 'Taken down' }[b.status] || ST_EN[b.status]) : ST_EN[b.status];
const howGet = b => isInst(b) ? `Installation · ${b.event.address || ''}` : `Pickup · ${b.event.pickupSlot || ''}`;
const daysTo = iso => dnum(iso) - dnum(todayISO());

async function showAdmin() {
  document.body.classList.add('adm'); window.scrollTo(0, 0);
  if (!(await DB.auth.session())) return adminLogin();
  ST.S = await DB.settings(); ST.assets = await DB.assets(); AD.bookings = await DB.bookings().catch(() => []);
  renderAdmin();
}
function hideAdmin() { document.body.classList.remove('adm'); }
function adminLogin() {
  $('#admin').innerHTML = `<div class="adm" style="max-width:420px;margin-top:10vh"><h2>Karol's dashboard</h2>
    <form id="lgForm">${LIVE ? `<label for="lgEmail">Email</label><input id="lgEmail" type="email" autocomplete="username" required>` : ''}
    <label for="lgPw" style="margin-top:10px">${LIVE ? 'Password' : 'Demo PIN'}</label><input id="lgPw" type="password" autocomplete="current-password" required>
    <p class="err" id="lgErr"></p><div class="row"><a href="#top">← Back to site</a><button class="btn">Sign in</button></div></form>
    ${LIVE ? '' : `<p class="demo">Demo mode. The PIN is 2468 until Karol changes it in Settings. Once Supabase is connected, Karol signs in with her email and password instead.</p>`}</div>`;
  $('#lgForm').onsubmit = async e => { e.preventDefault(); try { await DB.auth.signIn(LIVE ? $('#lgEmail').value : '', $('#lgPw').value); showAdmin(); } catch (err) { $('#lgErr').textContent = err.message; } };
}
function renderAdmin() {
  const tabs = [['overview', 'Overview'], ['requests', 'Requests'], ['calendar', 'Calendar'], ['inventory', 'Inventory'], ['settings', 'Settings']];
  const nNew = AD.bookings.filter(b => b.status === 'new').length;
  $('#admin').innerHTML = `<div class="adm-top"><b style="font-family:'Cormorant Garamond',serif;font-size:22px;margin-right:12px">Petit Atelier · Dashboard</b>
    <nav class="tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" aria-pressed="${AD.tab === k}">${l}${k === 'requests' && nNew ? ` <span class="st new">${nNew}</span>` : ''}</button>`).join('')}</nav>
    <a class="btn ghost sm" href="#top">View site</a><button class="btn ghost sm" id="logout">Sign out</button></div><div class="adm" id="admBody"></div>`;
  ({ overview: admOverview, requests: admRequests, calendar: admCalendar, inventory: admInventory, settings: admSettings })[AD.tab]();
}
const live = b => !['declined', 'cancelled'].includes(b.status);

function admOverview() {
  const L = AD.bookings.filter(live); const up = L.filter(b => daysTo(b.event.date) >= 0 && b.status !== 'closed').sort((a, b) => a.event.date.localeCompare(b.event.date));
  const m = todayISO().slice(0, 7); const monthRev = L.filter(b => b.event.date.startsWith(m)).reduce((s, b) => s + b.totals.total, 0);
  const owed = L.filter(b => b.status !== 'new' && !b.payments.balance).reduce((s, b) => s + b.totals.total - (b.payments.retainer ? b.totals.retainer : 0), 0);
  const next7 = up.filter(b => daysTo(b.event.date) <= 7);
  const todo = [];
  AD.bookings.filter(b => b.status === 'new').forEach(b => todo.push([b, `Confirm or decline the request (${Math.max(0, Math.round((Date.now() - new Date(b.created_at)) / 36e5))} h old)`]));
  up.forEach(b => { const d = daysTo(b.event.date);
    if (b.status === 'confirmed' && !b.payments.retainer) todo.push([b, 'Retainer not marked paid']);
    if (d <= 8 && d >= 6 && !hasRem(b, 'week')) todo.push([b, 'Send the 7-day reminder (balance due)']);
    if (d <= 1 && !hasRem(b, 'day')) todo.push([b, 'Send the day-before reminder']);
    if (d <= 3 && b.items.some(i => !b.prep?.[i.id])) todo.push([b, `Build and prep: ${b.items.filter(i => !b.prep?.[i.id]).length} pieces not ready for ${isInst(b) ? 'installation' : 'pickup'}`]);
    if (d <= 2 && b.status === 'confirmed' && b.items.every(i => b.prep?.[i.id])) todo.push([b, `All prepped: mark it ${isInst(b) ? 'ready to install' : 'ready for pickup'}`]); });
  AD.bookings.filter(b => b.status === 'delivered' && daysTo(b.event.date) < 0).forEach(b => todo.push([b, isInst(b) ? 'Take down and check the pieces' : `Due back: ${b.event.returnSlot || ST.S.returnSlot}`]));
  AD.bookings.filter(b => b.status === 'returned' && b.protection !== 'care' && !b.payments.depositReturned).forEach(b => todo.push([b, 'Inspect pieces and return the security deposit']));
  $('#admBody').innerHTML = `${LIVE ? '' : '<p class="demo" style="margin-bottom:16px">Demo mode: data lives in this browser. Requests marked "Sample" are examples.</p>'}
    <div class="kpis"><div class="kpi"><span class="muted small">New requests</span><b>${AD.bookings.filter(b => b.status === 'new').length}</b></div>
    <div class="kpi"><span class="muted small">Events in the next 7 days</span><b>${next7.length}</b></div>
    <div class="kpi"><span class="muted small">Booked this month</span><b>${money(monthRev)}</b></div>
    <div class="kpi"><span class="muted small">Still to collect</span><b>${money(owed)}</b></div></div>
    <div class="drawer"><div><h3>To do</h3>${todo.length ? `<table class="t stack"><thead><tr><th>Event</th><th>What</th><th></th></tr></thead><tbody>${todo.map(([b, w]) => `<tr><td>${esc(fmtShort(b.event.date))}<br><span class="small muted">${esc(b.customer.name)}</span></td><td>${esc(w)}</td><td><button class="btn sm ghost" data-open="${esc(b.code)}">Open</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">All caught up.</p>'}</div>
    <div><h3>Coming up</h3>${up.slice(0, 8).map(b => `<button class="pane row" style="width:100%;margin-bottom:8px;cursor:pointer;text-align:left" data-open="${esc(b.code)}"><span><b>${esc(fmtShort(b.event.date))}</b> · ${esc(b.event.type)}<br><span class="small muted">${esc(b.customer.name)} · ${b.items.reduce((s, i) => s + i.qty, 0)} pieces · ${isInst(b) ? 'Installation' : 'Pickup ' + esc((b.event.pickupSlot || '').split(',')[0])}</span></span><span class="st ${esc(b.status)}">${esc(stLabel(b))}</span></button>`).join('') || '<p class="muted">No upcoming events.</p>'}</div></div>`;
}
const hasRem = (b, k) => (b.reminders || []).some(r => r.kind === k);
const fmtShort = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };

function admRequests() {
  const F = { open: b => live(b) && b.status !== 'closed', new: b => b.status === 'new', past: b => b.status === 'closed' || daysTo(b.event.date) < -2, all: () => true };
  const rows = AD.bookings.filter(F[AD.filter]).sort((a, b) => a.event.date.localeCompare(b.event.date));
  $('#admBody').innerHTML = `<div class="filters" style="margin-top:0">${[['open', 'Open'], ['new', 'New'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => `<button class="chip" data-af="${k}" aria-pressed="${AD.filter === k}">${l}</button>`).join('')}</div>
    <table class="t stack"><thead><tr><th>Event date</th><th>Client</th><th>Event</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead><tbody>
    ${rows.map(b => `<tr class="click" data-open="${esc(b.code)}"><td><b>${esc(fmtShort(b.event.date))}</b><br><span class="small muted">${esc(b.code)}${b.sample ? ' · Sample' : ''}</span></td><td>${esc(b.customer.name)}<br><span class="small muted">${esc(b.customer.phone)}</span></td><td>${esc(b.event.type)}<br><span class="small muted">${b.items.reduce((s, i) => s + i.qty, 0)} pieces</span></td><td class="n">${money(b.totals.total)}</td><td>${b.payments.balance ? 'Paid in full' : b.payments.retainer ? 'Retainer' : 'Nothing yet'}</td><td><span class="st ${esc(b.status)}">${esc(stLabel(b))}</span></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No requests here.</td></tr>'}
    </tbody></table>`;
}
function openBooking(code) {
  const b = AD.bookings.find(x => x.code === code); if (!b) return; AD.open = code; const S = ST.S; const d = daysTo(b.event.date);
  const nextSt = { new: 'confirmed', confirmed: 'ready', ready: 'delivered', delivered: 'returned', returned: 'closed' }[b.status];
  const verb = { confirmed: 'Confirm request', ready: isInst(b) ? 'Mark ready to install' : 'Mark ready for pickup', delivered: isInst(b) ? 'Mark installed' : 'Mark picked up', returned: isInst(b) ? 'Mark taken down' : 'Mark returned', closed: 'Close out' }[nextSt];
  openModal(`<div class="row" style="margin-right:48px"><h2 style="margin:0">${esc(b.event.type)} · ${esc(fmtShort(b.event.date))}</h2><span class="st ${esc(b.status)}">${esc(stLabel(b))}</span></div>
    <p class="muted">${esc(b.code)} · ${d >= 0 ? `in ${d} day${d === 1 ? '' : 's'}` : `${-d} days ago`} · start ${esc(b.event.start || '')}</p>
    <div class="drawer"><div>
      <svg viewBox="0 0 1000 620" style="width:100%;border-radius:14px">${sceneSVG((b.design?.placements || []).map((p, i) => ({ ...p, uid: 'a' + i })), b.design?.wall || WALLS[0], false)}</svg>
      ${b.balloonColors?.length ? `<div class="plan"><b>Balloons:</b> ${esc(b.balloonColors.join(', '))}${b.balloon?.style ? ` · style: ${esc(b.balloon.style)}` : ''}${b.balloon?.plan ? ` · ${esc(String(b.balloon.plan.ft || ''))} ft ${esc(b.balloon.plan.placement || '')}` : ''}${b.balloon?.request ? `<br>Idea: “${esc(b.balloon.request)}”` : ''}${/^https:\/\//.test(b.balloon?.plan?.preview || '') ? `<br><img src="${esc(b.balloon.plan.preview)}" alt="AI preview" style="width:100%;border-radius:10px;margin-top:6px">` : ''}</div>` : ''}
      <h3 style="margin-top:10px">${isInst(b) ? 'Prep checklist' : 'Ready-for-pickup checklist'}</h3><ul class="prep">${b.items.map(i => `<li><input type="checkbox" data-prep="${esc(i.id)}" ${b.prep?.[i.id] ? 'checked' : ''} aria-label="${esc(i.name)} ready"><span style="flex:1">${i.qty > 1 ? i.qty + ' × ' : ''}${esc(i.name)}</span><span class="small muted">${money(i.price * i.qty)}</span></li>`).join('')}</ul>
    </div><div>
      <div class="pane"><b>${esc(b.customer.name)}</b><br><a href="mailto:${esc(b.customer.email)}">${esc(b.customer.email)}</a><br><a href="tel:${esc(b.customer.phone)}">${esc(b.customer.phone)}</a>
        <p class="small" style="margin:8px 0 0"><b>${esc(howGet(b))}</b>${isInst(b) ? '' : `<br>Return: ${esc(b.event.returnSlot || S.returnSlot)}`}<br>${esc(b.event.setting || '')} · ${esc(b.event.guests || '?')} guests</p>${b.event.notes ? `<p class="small muted" style="margin:6px 0 0">“${esc(b.event.notes)}”</p>` : ''}</div>
      <div class="pane" style="margin-top:10px">
        <div class="line"><span>Total</span><b>${money(b.totals.total)}</b></div>
        <label class="check"><input type="checkbox" data-pay="retainer" ${b.payments.retainer ? 'checked' : ''}> Retainer ${money(b.totals.retainer)} received</label>
        <label class="check"><input type="checkbox" data-pay="balance" ${b.payments.balance ? 'checked' : ''}> Balance ${money(b.totals.total - b.totals.retainer)} received</label>
        ${b.protection === 'care' ? `<p class="small muted" style="margin:0">Care Plan ${money(b.totals.care)} (covers up to ${money(S.carePlanCap)})</p>` : `<label class="check"><input type="checkbox" data-pay="depositReturned" ${b.payments.depositReturned ? 'checked' : ''}> Security deposit ${money(b.totals.securityDeposit)} returned</label>`}
      </div>
      <div class="pane" style="margin-top:10px"><b>Email ${esc(b.customer.name.split(' ')[0])}</b>
        <div class="filters" style="margin:8px 0 0">${[['confirm', 'Confirmation + retainer'], ['week', '7-day reminder'], ['day', isInst(b) ? 'Day-before reminder' : 'Ready for pickup'], ['thanks', 'Thank you + review']].map(([k, l]) => `<button class="chip" data-mail="${k}">${hasRem(b, k) ? '✓ ' : ''}${l}</button>`).join('')}</div>
        ${(b.reminders || []).length ? `<p class="small muted" style="margin:8px 0 0">${b.reminders.map(r => `${esc(r.kind)} ${esc(new Date(r.at).toLocaleDateString())}`).join(' · ')}</p>` : ''}</div>
      <div class="filters" style="margin-top:12px">${nextSt ? `<button class="btn" data-st="${nextSt}">${verb}</button>` : ''}${b.status === 'new' ? '<button class="btn ghost" data-st="declined">Decline</button>' : ''}${live(b) && b.status !== 'closed' && b.status !== 'new' ? '<button class="btn ghost sm" data-st="cancelled">Cancel booking</button>' : ''}<button class="btn ghost sm" id="vContract">Signed agreement</button></div>
    </div></div>`);
  $('#sheet').onchange = async e => {
    const t = e.target;
    if (t.dataset.prep) { b.prep = { ...(b.prep || {}), [t.dataset.prep]: t.checked }; }
    if (t.dataset.pay) { b.payments[t.dataset.pay] = t.checked; }
    await DB.updateBooking(b); renderAdmin();
  };
  $('#sheet').onclick = async e => {
    const t = e.target;
    if (t.dataset.st) { b.status = t.dataset.st; await DB.updateBooking(b); renderAdmin(); openBooking(code); if (t.dataset.st === 'confirmed') toast('Confirmed. Send the confirmation email next.'); }
    if (t.dataset.mail) { const [subj, body] = mailTemplate(t.dataset.mail, b); composeMail(b, t.dataset.mail, subj, body); }
    if (t.id === 'vContract') openModal(`<button class="btn ghost sm" data-open="${esc(b.code)}" style="margin-bottom:10px">← Back</button>` + contractHTML(b, S, ST.assets));
  };
}
function mailTemplate(kind, b) {
  const first = b.customer.name.replace(/^Sample:\s*/, '').split(' ')[0], when = fmtDate(b.event.date), bal = money(b.totals.total - b.totals.retainer);
  const list = b.items.map(i => `  ${i.qty} x ${i.name}`).join('\n');
  return {
    confirm: [`Your date is held! ${b.code} · Petit Atelier Events`, `Hi ${first},\n\nGreat news: your decor for ${when} is available and confirmed.\n\nTo lock it in, please send the ${money(b.totals.retainer)} retainer within 48 hours (Venmo, Zelle or cash). The balance of ${bal} is due 7 days before your event.\n\n${isInst(b) ? `Installation at ${b.event.address} is included.` : `Pickup: ${b.event.pickupSlot} at ${ST.S.pickupPlace} (I'll send the exact address). Return: ${b.event.returnSlot || ST.S.returnSlot}.`}\n\n${list}\n\nThank you for choosing Petit Atelier!\nKarol`],
    week: [`One week to go · ${b.code}`, `Hi ${first},\n\nYour event is one week away (${when})! A few quick things:\n\n- Balance due now: ${b.payments.balance ? 'already paid, thank you!' : bal}\n${isInst(b) ? `- I'll arrive before ${b.event.start} to install. Please make sure the area is clear and I have access.` : `- Pickup: ${b.event.pickupSlot} at ${ST.S.pickupPlace}. Please bring an SUV or van for balloon pieces.\n- Return: ${b.event.returnSlot || ST.S.returnSlot}.`}\n- Any last changes to colors or pieces? Reply to this email today.\n${b.protection !== 'care' ? `- Refundable security deposit of ${money(b.totals.securityDeposit)} is due with the balance.\n` : ''}\nKarol · Petit Atelier Events`],
    day: [`See you tomorrow! · ${b.code}`, isInst(b) ? `Hi ${first},\n\nTomorrow is the day! I'll arrive ahead of ${b.event.start} at ${b.event.address} to set up.\n\nPlease keep candles, tape, glitter and drinks away from the backdrops and balloons, and don't move installed pieces. I'll come back for teardown at the time we agreed.\n\nHave the best time!\nKarol` : `Hi ${first},\n\nYour decor is built and ready! Pickup: ${b.event.pickupSlot} at ${ST.S.pickupPlace}.\n\n- Bring an SUV or van with the seats folded down for balloon pieces.\n- We'll check every piece together before you leave.\n- Keep candles, tape, glitter and drinks away from backdrops and balloons.\n- Return: ${b.event.returnSlot || ST.S.returnSlot}. Late returns are ${money(ST.S.lateFee)} per day.\n\nHave the best time!\nKarol`],
    thanks: [`Thank you from Petit Atelier`, `Hi ${first},\n\nThank you for letting me be part of your celebration! I hope everyone loved it.\n\nIf you have a minute, a review or tagging @petitatelier_events on Instagram helps my small business so much. Photos of your setup would make my day!\n${b.protection !== 'care' ? `\nYour ${money(b.totals.securityDeposit)} security deposit ${b.payments.depositReturned ? 'has been returned.' : 'will be returned within 7 days after inspection.'}\n` : ''}\nWith love,\nKarol`],
  }[kind];
}
function composeMail(b, kind, subj, body) {
  openModal(`<button class="btn ghost sm" data-open="${esc(b.code)}" style="margin-bottom:10px">← Back</button><h3>Email to ${esc(b.customer.email)}</h3>
    <label for="mSubj">Subject</label><input id="mSubj" value="${esc(subj)}"><label for="mBody" style="margin-top:10px">Message</label><textarea id="mBody" style="min-height:260px">${esc(body)}</textarea>
    <p class="err" id="mErr"></p><div class="row"><span class="small muted">${LIVE ? 'Sends from your Petit Atelier email address.' : 'Demo mode: opens your email app with this message ready.'}</span><button class="btn" id="mSend">${LIVE ? 'Send email' : 'Open in email app'}</button></div><div id="mOut"></div>`);
  $('#mSend').onclick = async () => {
    try {
      const r = await DB.email(b.customer.email, $('#mSubj').value, $('#mBody').value, kind, b.code);
      b.reminders = [...(b.reminders || []), { kind, at: new Date().toISOString(), via: r.sent ? 'email' : 'manual' }]; await DB.updateBooking(b);
      if (r.sent) { toast('Email sent'); openBooking(b.code); }
      else { $('#mOut').innerHTML = `<p class="demo"><a href="${esc(r.mailto)}">Open this message in your email app</a>. If nothing opens, copy the text above and send it to ${esc(b.customer.email)}. Logged as sent.</p>`; }
    } catch (err) { $('#mErr').textContent = err.message; }
  };
}

function admCalendar() {
  const base = AD.month || todayISO().slice(0, 7); const [y, m] = base.split('-').map(Number);
  const first = new Date(y, m - 1, 1), start = new Date(first); start.setDate(1 - first.getDay());
  const cells = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const shift = k => { const d = new Date(y, m - 1 + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  $('#admBody').innerHTML = `<div class="row" style="margin-bottom:12px"><button class="btn ghost sm" data-mon="${shift(-1)}">←</button><h3 style="margin:0">${first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3><button class="btn ghost sm" data-mon="${shift(1)}">→</button></div>
    <div class="scroll"><div class="cal" style="min-width:640px">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="hd">${d}</div>`).join('')}
    ${cells.map(d => { const k = iso(d); const evs = AD.bookings.filter(b => live(b) && b.event.date === k);
      return `<div class="${d.getMonth() !== m - 1 ? 'off' : ''}"${k === todayISO() ? ' style="border-color:var(--blushd)"' : ''}>${d.getDate()}${evs.map(b => `<button class="ev ${b.status === 'new' ? '' : 'confirmed'}" data-open="${esc(b.code)}">${esc(b.event.type)} · ${esc(b.customer.name.replace('Sample: ', ''))}</button>`).join('')}</div>`; }).join('')}</div></div>
    <p class="small muted" style="margin-top:10px">Pink: waiting for your confirmation. Green: confirmed or later. Pieces are blocked ${ST.S.bufferDays} day before and after each event.</p>`;
}

function admInventory() {
  $('#admBody').innerHTML = `<div class="row" style="margin-bottom:14px"><p class="muted" style="margin:0">Pieces marked "Catalog only" have a photo but no cut-out yet, so customers can't place them in the Design Studio: open one and upload a straight-on photo. Prices, quantities and photos update the website right away. Replacement value is what a client pays for a lost or damaged piece without the Care Plan.</p><button class="btn" id="newAsset">Add a piece</button></div>
    <div class="inv">${ST.assets.map(a => `<article class="card"><div class="pic" style="cursor:default">${a.photo ? `<img src="${esc(a.photo)}" alt="">` : a.cutout ? `<img class="cut" src="${esc(a.cutout)}" alt="">` : '<span class="small muted">No photo yet</span>'}</div><div class="body">
      <div class="row"><h3>${esc(a.name)}</h3>${a.active === false ? '<span class="badge no">Hidden</span>' : ''}${a.cutout ? '<span class="badge ok">In the Studio</span>' : '<span class="badge">Catalog only</span>'}</div>
      <div class="line"><span>Rental</span><b>${money(a.price)}${a.perFt ? ' per ft' : ''}</b></div><div class="line"><span>Owned</span><span>${a.qty}</span></div><div class="line"><span>Replacement</span><span>${a.made ? 'Made to order' : money(a.repl)}</span></div>
      <button class="btn ghost sm" data-edit="${esc(a.id)}" style="margin-top:8px">Edit</button></div></article>`).join('')}</div>`;
}
function editAsset(id, draft) {
  const isNew = draft ? !ST.assets.some(x => x.id === draft.id) : !id;
  const a = draft ? draft : id ? { ...ST.assets.find(x => x.id === id) } : { id: 'p' + Date.now().toString(36), cat: 'furniture', name: '', es: '', price: 25, qty: 1, repl: 100, ft: 3, ar: 1, x: 500, y: 580, s: 1, desc: '', desc_es: '', active: true, photo: '', cutout: '' };
  openModal(`<h2>${isNew ? 'New piece' : 'Edit piece'}</h2><form id="aForm" class="f2">
    <div class="full"><label for="aName">Name (English)</label><input id="aName" required value="${esc(a.name)}"></div>
    <div class="full"><label for="aEs">Name (Spanish)</label><input id="aEs" value="${esc(a.es || '')}"></div>
    <div><label for="aPrice">Rental price ($)</label><input id="aPrice" type="number" min="0" step="1" value="${a.price}"></div>
    <div><label for="aQty">How many you own</label><input id="aQty" type="number" min="0" step="1" value="${a.qty}"></div>
    <div><label for="aRepl">Replacement value ($)</label><input id="aRepl" type="number" min="0" step="1" value="${a.repl || 0}"></div>
    <div><label for="aCat">Category</label><select id="aCat">${CATS.slice(1).map(([k, l]) => `<option value="${k}" ${a.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <label class="check"><input type="checkbox" id="aPerFt" ${a.perFt ? 'checked' : ''}> Priced per foot (balloons)</label><div></div>
    <div class="full"><label for="aDesc">Description</label><textarea id="aDesc">${esc(a.desc || '')}</textarea></div>
    <div class="full"><label for="aDescEs">Description (Spanish)</label><textarea id="aDescEs">${esc(a.desc_es || '')}</textarea></div>
    <div><label for="aFt">Real height (feet)</label><input id="aFt" type="number" min="0.3" max="12" step="0.1" value="${a.ft || 4}"></div><div></div>
    <div class="full pane" style="background:var(--soft)"><b>Real piece for the Design Studio</b><p class="small muted" style="margin:4px 0 8px">Take the photo straight on, whole piece in frame, plain wall behind it. The background is removed automatically and the piece shows at its real height.</p>
      <div class="row"><div id="cutPrev" style="height:120px;min-width:120px;display:grid;place-items:center;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px;border-radius:10px;padding:6px">${a.cutout ? `<img src="${esc(a.cutout)}" alt="" style="max-height:108px">` : '<span class="small muted">No cut-out yet</span>'}</div>
        <span class="row" style="gap:6px"><label class="chip" style="margin:0;color:inherit" for="aCut">Upload photo</label><input type="file" id="aCut" accept="image/*" data-cutpal="" hidden>${a.cutout ? '<button type="button" class="chip" data-cutdel="">Remove</button>' : ''}</span></div>
      <label class="check"><input type="checkbox" id="aAuto" ${window.paAutoBg === false ? '' : 'checked'}> Remove the background automatically (turn off if you upload a PNG that is already cut out)</label>
      <p class="small" id="cutMsg" aria-live="polite"></p></div>
    <div class="full"><label for="aPhoto">Catalog photo (optional, shown on the collection card)</label><input id="aPhoto" type="file" accept="image/*"><div id="aPrev" style="margin-top:8px">${a.photo ? `<img src="${esc(a.photo)}" alt="" style="max-width:200px;border-radius:10px">` : ''}</div></div>
    <label class="check full"><input type="checkbox" id="aMade" ${a.made ? 'checked' : ''}> Made fresh per event (balloons): no replacement value</label>
    <label class="check full"><input type="checkbox" id="aActive" ${a.active !== false ? 'checked' : ''}> Show on the website</label>
    <p class="err full" id="aErr"></p>
    <div class="full row">${!isNew ? '<button type="button" class="btn ghost sm" id="aDel">Delete</button>' : '<span></span>'}<button class="btn">Save</button></div></form>`);
  const collect = () => ({ name: $('#aName').value.trim(), es: $('#aEs').value.trim(), price: Math.max(0, +$('#aPrice').value), qty: Math.max(0, Math.floor(+$('#aQty').value)), repl: Math.max(0, +$('#aRepl').value), cat: $('#aCat').value, perFt: $('#aPerFt').checked, desc: $('#aDesc').value.trim(), desc_es: $('#aDescEs').value.trim(), made: $('#aMade').checked, active: $('#aActive').checked, ft: Math.min(12, Math.max(.3, +$('#aFt').value || 4)) });
  const cutState = { a };
  $('#sheet').onchange = async e => {
    const inp = e.target; if (inp.id === 'aAuto') { window.paAutoBg = inp.checked; return; }
    if (inp.id === 'aCat') { Object.assign(a, collect()); editAsset(null, a); return; }
    if (!('cutpal' in inp.dataset) || !inp.files[0]) return; const f = inp.files[0];
    const msg = $('#cutMsg'); msg.textContent = 'Working on the photo… this can take 20 to 40 seconds the first time.';
    try {
      let blob = f;
      if ($('#aAuto').checked) { try { blob = await removeBg(f); } catch (err) { msg.textContent = 'Automatic background removal is not available here, so the photo is used as is. Tip: cut it out with Canva or remove.bg and upload the PNG.'; } }
      const { blob: png, ar } = await trimAlpha(blob, LIVE ? 1400 : 700);
      const url = await DB.uploadCutout(png);
      a.cutout = url;
      a.ar = ar; Object.assign(a, collect());
      editAsset(null, a); $('#cutMsg').textContent = 'Done. Save to publish it.';
    } catch (err) { msg.textContent = 'Could not use that photo: ' + err.message; }
  };
  $('#sheet').onclick = e => { const del = e.target.closest('[data-cutdel]'); if (!del) return; a.cutout = ''; Object.assign(a, collect()); editAsset(null, a); };
  $('#aPhoto').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('#aPrev').textContent = 'Uploading…'; try { a.photo = await DB.uploadPhoto(f); $('#aPrev').innerHTML = `<img src="${esc(a.photo)}" alt="" style="max-width:200px;border-radius:10px">`; } catch (err) { $('#aErr').textContent = err.message; } };
  $('#aForm').onsubmit = async e => {
    e.preventDefault();
    Object.assign(a, collect());
    if (!a.y) a.y = a.cat === 'backdrops' ? 472 : 580;
    if (!a.name) { $('#aErr').textContent = 'Give the piece a name.'; return; }
    try { await DB.saveAsset(a); ST.assets = await DB.assets(); closeModal(); renderAdmin(); toast('Saved'); } catch (err) { $('#aErr').textContent = err.message; }
  };
  if (!isNew) $('#aDel').onclick = async () => {
    const id = a.id;
    const used = AD.bookings.some(b => live(b) && daysTo(b.event.date) >= 0 && b.items.some(i => i.id === id));
    if (used) { $('#aErr').textContent = 'This piece is in an upcoming booking. Hide it instead (uncheck "Show on the website").'; return; }
    const btn = $('#aDel'); if (btn.dataset.sure !== '1') { btn.dataset.sure = '1'; btn.textContent = 'Tap again to delete for good'; return; }
    await DB.deleteAsset(id); ST.assets = await DB.assets(); closeModal(); renderAdmin(); toast('Deleted');
  };
}

function admSettings() {
  const S = ST.S;
  $('#admBody').innerHTML = `<form id="sForm" style="max-width:760px"><h3>Money</h3><div class="f2">
    <div><label for="sDep">Retainer to hold a date (%)</label><input id="sDep" type="number" min="0" max="100" value="${S.depositPct}"></div>
    <div><label for="sMin">Minimum order ($)</label><input id="sMin" type="number" min="0" value="${S.minOrder}"></div>
    <div><label for="sCare">Care Plan price ($)</label><input id="sCare" type="number" min="0" value="${S.carePlan}"></div>
    <div><label for="sCap">Care Plan covers up to ($)</label><input id="sCap" type="number" min="0" value="${S.carePlanCap}"></div>
    <div><label for="sSec">Security deposit if no plan ($)</label><input id="sSec" type="number" min="0" value="${S.securityDeposit}"></div>
    <div><label for="sInst">Installation add-on ($)</label><input id="sInst" type="number" min="0" value="${S.installFee}"></div>
    <div><label for="sLate">Late return fee per day ($)</label><input id="sLate" type="number" min="0" value="${S.lateFee}"></div>
    <div><label for="sBuf">Days blocked before and after events</label><input id="sBuf" type="number" min="0" max="3" value="${S.bufferDays}"></div></div>
    <h3 style="margin-top:24px">Pickup and installation</h3><div class="f2">
    <div class="full"><label for="sPlace">Pickup place (shown to clients)</label><input id="sPlace" value="${esc(S.pickupPlace)}"></div>
    <div class="full"><label for="sSlots">Pickup times, one per line</label><textarea id="sSlots">${esc(S.pickupSlots.join('\n'))}</textarea></div>
    <div class="full"><label for="sRet">Return time</label><input id="sRet" value="${esc(S.returnSlot)}"></div>
    <div class="full"><label for="sArea">Installation area</label><input id="sArea" value="${esc(S.installArea)}"></div></div>
    <h3 style="margin-top:24px">Notifications</h3><label for="sMail">Send new requests to</label><input id="sMail" type="email" value="${esc(S.notifyEmail)}">
    ${LIVE ? '' : `<label for="sPin" style="margin-top:10px">Demo PIN</label><input id="sPin" value="${esc(S.pin)}">`}
    <h3 style="margin-top:24px">Recent setups gallery</h3><p class="small muted">Upload photos from Instagram posts. They replace the drawn looks in the "Recent setups" section.</p>
    <input type="file" id="sGal" accept="image/*" multiple><div class="ig" id="galPrev">${(S.gallery || []).map((g, i) => `<div style="position:relative"><img src="${esc(g)}" alt=""><button type="button" class="chip" data-gdel="${i}" style="position:absolute;top:6px;right:6px">Remove</button></div>`).join('')}</div>
    <p class="err" id="sErr"></p><button class="btn" style="margin-top:12px">Save settings</button></form>`;
  $('#sGal').onchange = async e => { for (const f of e.target.files) { try { S.gallery = [...(S.gallery || []), await DB.uploadPhoto(f)]; } catch (err) { $('#sErr').textContent = err.message; } } await DB.saveSettings(S); admSettings(); };
  $('#galPrev').onclick = async e => { const i = e.target.dataset.gdel; if (i === undefined) return; S.gallery.splice(+i, 1); await DB.saveSettings(S); admSettings(); };
  $('#sForm').onsubmit = async e => {
    e.preventDefault(); const n = id => Math.max(0, +$(id).value);
    Object.assign(S, { depositPct: Math.min(100, n('#sDep')), minOrder: n('#sMin'), carePlan: n('#sCare'), carePlanCap: n('#sCap'), securityDeposit: n('#sSec'), installFee: n('#sInst'), lateFee: n('#sLate'), pickupPlace: $('#sPlace').value.trim(), returnSlot: $('#sRet').value.trim(), installArea: $('#sArea').value.trim(), pickupSlots: $('#sSlots').value.split('\n').map(x => x.trim()).filter(Boolean), bufferDays: Math.min(3, Math.floor(n('#sBuf'))), notifyEmail: $('#sMail').value.trim() });
    if (!LIVE) S.pin = $('#sPin').value.trim() || S.pin;
    if (!S.pickupSlots.length) S.pickupSlots = [...SEED_SETTINGS.pickupSlots];
    try { await DB.saveSettings(S); toast('Settings saved'); } catch (err) { $('#sErr').textContent = err.message; }
  };
}

function bindAdmin() {
  $('#admin').addEventListener('click', async e => {
    const t = e.target;
    const tab = t.closest('[data-tab]'); if (tab) { AD.tab = tab.dataset.tab; renderAdmin(); }
    const f = t.closest('[data-af]'); if (f) { AD.filter = f.dataset.af; admRequests(); }
    const mo = t.closest('[data-mon]'); if (mo) { AD.month = mo.dataset.mon; admCalendar(); }
    const ed = t.closest('[data-edit]'); if (ed) editAsset(ed.dataset.edit);
    if (t.id === 'newAsset') editAsset(null);
    if (t.id === 'logout') { await DB.auth.signOut(); location.hash = 'top'; }
  });
  document.addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o && document.body.classList.contains('adm')) openBooking(o.dataset.open); });
}
