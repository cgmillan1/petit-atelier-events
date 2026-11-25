/* ===== Customer site ===== */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CATS = [['all', 'All', 'Todo'], ['backdrops', 'Backdrops', 'Fondos'], ['balloons', 'Balloons', 'Globos'], ['furniture', 'Furniture', 'Muebles'], ['props', 'Props', 'Props']];
const WALLS = ['#ece6e3', '#f4f0ea', '#e9ece4', '#e8e4ee', '#e4ebee', '#d9d2cc', '#cfc7c9'];
const FT = 48; // stage units per real foot; the wall/floor line is at y = 470
const ST = {
  lang: lget('lang', 'en'), date: lget('date', ''), wall: WALLS[0], placements: [], sel: null, colors: [], balloon: { style: '', request: '', plan: null },
  cat: 'all', scat: 'all', reserved: {}, assets: [], S: SEED_SETTINGS, fulfillment: 'pickup', protection: 'care', space: null, roomScale: 1,
};
Object.assign(ST, lget('draft', {}));
let uidN = Date.now();
const T = k => (I18N[ST.lang] || I18N.en)[k] || I18N.en[k] || k;
const ES = () => ST.lang === 'es';
const nm = a => (ES() && a.es) ? a.es : a.name;
const ds = a => (ES() && a.desc_es) ? a.desc_es : a.desc;
const A = id => ST.assets.find(a => a.id === id);
const colorName = c => { const x = BALLOON_COLORS.find(b => b[0] === c); return x ? (ES() ? x[1] : x[0]) : c; };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); }
function saveDraft() { lset('draft', { wall: ST.wall, placements: ST.placements, colors: ST.colors, balloon: ST.balloon, fulfillment: ST.fulfillment, protection: ST.protection }); }
const canPlace = a => !!(a.cutout || a.parts);
const gidOf = p => p.gid || p.uid;

/* ---------- quantities, availability, pricing ---------- */
function counts() { const m = {}, seen = new Set(); ST.placements.forEach(p => { const g = gidOf(p); if (seen.has(g)) return; seen.add(g); m[p.id] = (m[p.id] || 0) + 1; }); return m; }
function availLeft(id) { const a = A(id); if (!a) return 0; return Math.max(0, a.qty - (ST.reserved[id] || 0)); }
function canAdd(id) { return (counts()[id] || 0) < availLeft(id); }
function pricing() {
  const S = ST.S; const items = [];
  const seen = new Set();
  for (const pl of ST.placements) {
    const a = A(pl.id); if (!a) continue; const g = gidOf(pl); if (seen.has(g)) continue; seen.add(g);
    if (a.perFt) { const cfg = bCfg(pl), bp = bPrice(cfg); items.push({ id: a.id, qty: 1, ft: bp.ft, price: bp.total, name: bLabel(cfg), cfg: { ...cfg } }); continue; }
    const ex = items.find(i => i.id === a.id); if (ex) ex.qty++; else items.push({ id: a.id, qty: 1, price: a.price, name: a.name });
  }
  items.sort((x, y) => CATS.findIndex(k => k[0] === A(x.id).cat) - CATS.findIndex(k => k[0] === A(y.id).cat));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const install = items.length && ST.fulfillment === 'install' ? S.installFee : 0;
  const care = items.length && ST.protection === 'care' ? S.carePlan : 0;
  const securityDeposit = items.length && ST.protection !== 'care' ? S.securityDeposit : 0;
  const total = subtotal + install + care;
  return { items, subtotal, discount: 0, install, care, securityDeposit, total, retainer: Math.round(total * S.depositPct / 100) };
}
const hasBalloons = () => ST.placements.some(p => A(p.id)?.perFt);
const itemLabel = it => (it.qty > 1 ? it.qty + ' × ' : '') + (it.cfg ? `${ES() ? 'Globos' : 'Balloons'}: ${bLabel(it.cfg)}` : it.ft ? `${nm(A(it.id) || { name: it.name })} · ${it.ft} ft` : nm(A(it.id) || { name: it.name }));

async function refreshAvail() {
  ST.reserved = ST.date ? await DB.reserved(ST.date, ST.S.bufferDays).catch(() => ({})) : {};
  const msg = ST.date ? `${T('avail_for')} ${fmtDate(ST.date, ST.lang)}` : '';
  $('#collAvail').textContent = msg; $('#heroAvail').textContent = ST.date ? msg + '. ' + (ES() ? 'La colección y el estudio ya muestran lo que está libre.' : 'The collection and studio now show what is free.') : '';
  renderAll();
}

/* ---------- placements ---------- */
function addPiece(id, x, y, s) {
  const a = A(id); if (!a) return false;
  if (!canPlace(a)) { toast(ES() ? 'Esta pieza aún no tiene foto recortada para el estudio.' : 'This piece has no cut-out photo for the studio yet.'); return false; }
  if (ST.date && !canAdd(id)) { toast(availLeft(id) ? (ES() ? `Solo ${availLeft(id)} disponible(s) en tu fecha` : `Only ${availLeft(id)} available on your date`) : `${nm(a)}: ${T('booked')}`); return false; }
  if (!ST.date && (counts()[id] || 0) >= a.qty) { toast(ES() ? `Karol tiene ${a.qty}` : `Karol has ${a.qty} of these`); return false; }
  const same = counts()[id] || 0;
  const made = makePlacements(a, x ?? Math.min(940, a.x + same * 120), y ?? a.y, s ?? 1);
  if (a.perFt) { made[0].len = 10; }
  ST.placements.push(...made); ST.sel = made[0].uid; saveDraft();
  if (a.parts && !lget('partsTip')) { lset('partsTip', 1); toast(ES() ? 'Es un set: puedes mover cada pieza por separado.' : 'This is a set: you can move each piece on its own.'); }
  return true;
}
/* sets (arches, tables) become one placement per piece, sharing a group id; the rental is the whole set */
function makePlacements(a, x, y, s) {
  const gid = 'g' + (uidN++);
  if (!a.parts) return [{ uid: 'u' + (uidN++), gid, id: a.id, x, y, s }];
  return a.parts.map((pt, i) => ({ uid: 'u' + (uidN++), gid, id: a.id, part: i, x: Math.max(40, Math.min(960, x + (pt.dx || 0) * s)), y: y + (pt.dy || 0), s }));
}
function removeOne(id) { const last = [...ST.placements].reverse().find(p => p.id === id); if (last) { const g = gidOf(last); ST.placements = ST.placements.filter(p => gidOf(p) !== g); } saveDraft(); }
function lookPlacements(look) { return look.place.flatMap(([id, x, y, s]) => { const a = A(id); if (!a || !canPlace(a)) return []; const m = makePlacements(a, x, y, s || 1); if (a.perFt) m[0].len = 10; return m; }); }
function loadLook(look) { ST.placements = lookPlacements(look); ST.wall = look.wall; ST.sel = null; saveDraft(); renderAll(); }

/* ---------- scene rendering (real photo cut-outs only) ---------- */
function pieceSVG(a, pl) {
  const pt = a.parts && pl && pl.part != null ? a.parts[pl.part] : null; const src = pt ? pt.cutout : a.cutout;
  const h = ((pt || a).ft || 4) * FT, w = h * ((pt || a).ar || 1);
  return `<ellipse cx="0" cy="-2" rx="${(w * .46).toFixed(1)}" ry="${Math.max(5, w * .05).toFixed(1)}" fill="#2b2220" opacity=".28" filter="url(#soft)"/><image href="${esc(src)}" x="${(-w / 2).toFixed(1)}" y="${(-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMax meet"/>`;
}
function sceneSVG(placements, wall, interactive, bg, rs) {
  const list = placements.map(pl => ({ pl, a: A(pl.id) })).filter(o => o.a && (o.a.cutout || (o.a.parts && o.pl.part != null))).sort((m, n) => ((m.a.cat === 'backdrops' ? 0 : m.a.cat === 'balloons' ? 1 : 2) - (n.a.cat === 'backdrops' ? 0 : n.a.cat === 'balloons' ? 1 : 2)) || (m.pl.y - n.pl.y));
  const body = list.filter(o => !o.a.perFt).map(({ pl, a }) => { const k = (pl.s || 1) * (rs || 1); return `<g class="pl${interactive && ST.sel === pl.uid ? ' sel' : ''}" data-uid="${pl.uid}" data-k="${k}" transform="translate(${pl.x} ${pl.y}) scale(${k})">${pieceSVG(a, pl)}</g>`; }).join('')
    + list.filter(o => o.a.perFt).map(({ pl }) => `<g class="pl gl${interactive && ST.sel === pl.uid ? ' sel' : ''}" data-uid="${pl.uid}" data-k="1">${garlandSVG(pl)}</g>`).join('');
  const room = bg ? `<image href="${esc(bg)}" width="1000" height="620" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="1000" height="470" fill="${esc(wall)}"/><rect width="1000" height="470" fill="url(#wallg)"/><ellipse cx="500" cy="300" rx="520" ry="300" fill="url(#spot)"/>
       <rect y="470" width="1000" height="150" fill="${esc(wall)}"/><rect y="470" width="1000" height="150" fill="#8a7468" opacity=".22"/><rect y="470" width="1000" height="150" fill="url(#floorg)"/><rect y="466" width="1000" height="6" fill="#fff" opacity=".35"/>`;
  return `${SVG_DEFS}${room}${body}${interactive && !list.length ? `<text x="500" y="250" text-anchor="middle" font-family="Forum,serif" font-size="30" fill="#8d8084">${esc(T('empty_setup'))}</text>` : ''}<g id="selbox"></g>`;
}
function renderStage() { $('#stage').innerHTML = sceneSVG(ST.placements, ST.wall, true, ST.space, ST.space ? ST.roomScale : 1); drawSel(); renderTools(); }
function drawSel() {
  { const p0 = ST.placements.find(p => p.uid === ST.sel); if (p0 && A(p0.id)?.perFt) { const g0 = $('#selbox'); if (g0) g0.innerHTML = ''; return; } }
  const g = $('#selbox'); if (!g) return; g.innerHTML = '';
  const el = ST.sel && $(`#stage .pl[data-uid="${ST.sel}"]`); if (!el) return;
  const b = el.getBBox(), pl = ST.placements.find(p => p.uid === ST.sel), k = +el.dataset.k;
  g.innerHTML = `<rect x="${pl.x + b.x * k - 6}" y="${pl.y + b.y * k - 6}" width="${b.width * k + 12}" height="${b.height * k + 12}" fill="none" stroke="#a8556f" stroke-width="2" stroke-dasharray="7 6" rx="8" pointer-events="none"/>`;
}
function renderTools() {
  const pl = ST.placements.find(p => p.uid === ST.sel), el = $('#tools');
  if (!pl) { el.innerHTML = `<span class="small muted">${ES() ? 'Toca una pieza del escenario para moverla, cambiar su tamaño o quitarla. Las flechas la mueven poco a poco.' : 'Tap a piece on the stage to move, resize or remove it. Arrow keys nudge it.'}</span>`; return; }
  const a = A(pl.id); const pt = a.parts && pl.part != null ? a.parts[pl.part] : null;
  el.innerHTML = `<b style="margin-right:auto">${esc(nm(a))}${pt ? ` <span class="small">· ${esc(pt.name)} (${ES() ? 'pieza' : 'piece'} ${pl.part + 1}/${a.parts.length})</span>` : ''} <span class="muted small">${a.perFt ? money(bPrice(bCfg(pl)).total) : pt ? `${money(a.price)} ${ES() ? 'el set' : 'for the set'}` : money(a.price)}</span></b>
    ${a.perFt ? `<span class="small">${esc(bLabel(bCfg(pl)))} · <a href="#balloonBox">${ES() ? 'editar abajo' : 'edit below'}</a></span>` : ''}
    ${a.perFt ? '' : `<button class="chip" data-t="smaller" aria-label="Smaller">−</button><button class="chip" data-t="bigger" aria-label="Bigger">+</button>`}
    <button class="chip" data-t="del">${pt ? (ES() ? 'Quitar pieza' : 'Remove piece') : T('remove')}</button>${pt ? `<button class="chip" data-t="delset">${ES() ? 'Quitar set' : 'Remove set'}</button>` : ''}`;
}
function svgPoint(svg, e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function bindStage() {
  const svg = $('#stage'); let drag = null;
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('.pl'); if (!g) { ST.sel = null; renderStage(); return; }
    const pl = ST.placements.find(p => p.uid === g.dataset.uid); ST.sel = pl.uid;
    const pt = svgPoint(svg, e); drag = { pl, dx: pt.x - pl.x, dy: pt.y - pl.y, g, moved: false, x0: pl.x, y0: pl.y, gl: !!A(pl.id)?.perFt };
    if (drag.gl) { ST.bSel = pl.uid; renderBalloon(); if (bTarget(bCfg(pl)).found) drag = null; }
    svg.setPointerCapture(e.pointerId); $$('#stage .pl').forEach(n => n.classList.toggle('sel', n === g)); renderTools(); drawSel();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return; const pt = svgPoint(svg, e);
    drag.pl.x = Math.round(Math.max(20, Math.min(980, pt.x - drag.dx))); drag.pl.y = Math.round(Math.max(150, Math.min(618, pt.y - drag.dy))); drag.moved = true;
    drag.g.setAttribute('transform', drag.gl ? `translate(${drag.pl.x - drag.x0} ${drag.pl.y - drag.y0})` : `translate(${drag.pl.x} ${drag.pl.y}) scale(${drag.g.dataset.k})`); if (!drag.gl) drawSel();
  });
  const end = () => { if (drag) { if (drag.moved) { saveDraft(); renderStage(); } drag = null; } };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', e => {
    const pl = ST.placements.find(p => p.uid === ST.sel); if (!pl) return;
    const d = e.shiftKey ? 20 : 6; const mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (mv) { pl.x += mv[0]; pl.y += mv[1]; e.preventDefault(); saveDraft(); renderStage(); }
    if (e.key === 'Delete' || e.key === 'Backspace') { ST.placements = ST.placements.filter(p => p !== pl); ST.sel = null; e.preventDefault(); saveDraft(); renderAll(); }
  });
  $('#tools').addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return; const pl = ST.placements.find(p => p.uid === ST.sel); if (!pl) return;
    const t = b.dataset.t;
    if (t === 'smaller') pl.s = Math.max(.4, +(pl.s - .1).toFixed(2));
    if (t === 'bigger') pl.s = Math.min(2, +(pl.s + .1).toFixed(2));
    if (t === 'del') { ST.placements = ST.placements.filter(p => p !== pl); ST.sel = null; if (pl.part != null && ST.placements.some(p => gidOf(p) === gidOf(pl))) toast(ES() ? 'El set sigue rentado mientras quede una pieza en el escenario.' : 'The set stays in your rental while any of its pieces is on the stage.'); }
    if (t === 'delset') { const g = gidOf(pl); ST.placements = ST.placements.filter(p => gidOf(p) !== g); ST.sel = null; }
    saveDraft(); renderAll();
  });
}

/* ---------- panels ---------- */
function availBadge(a) {
  if (a.made) return `<span class="badge fresh">${T('made_fresh')}</span>`;
  const left = availLeft(a.id), used = counts()[a.id] || 0;
  if (!ST.date) return `<span class="badge">${a.qty} ${ES() ? 'en inventario' : 'in stock'}</span>`;
  if (left <= 0) return `<span class="badge no">${T('booked')}</span>`;
  return `<span class="badge ok">${left - used > 0 ? `${left - used} ${T('available')}` : (ES() ? 'Ya en tu montaje' : 'In your setup')}</span>`;
}
function catChips(active, attr) { const used = new Set(ST.assets.filter(a => a.active !== false).map(a => a.cat)); return CATS.filter(([k]) => k === 'all' || used.has(k)).map(([k, en, es]) => `<button class="chip" ${attr}="${k}" aria-pressed="${active === k}">${ES() ? es : en}</button>`).join(''); }
function pic(a) { return a.photo ? `<img src="${esc(a.photo)}" alt="${esc(nm(a))}" loading="lazy">` : a.cutout ? `<img src="${esc(a.cutout)}" alt="${esc(nm(a))}" loading="lazy" class="cut">` : `<span class="muted small">${ES() ? 'Foto pronto' : 'Photo coming soon'}</span>`; }
function thumb(a) { const src = a.cutout || a.photo; return src ? `<img src="${esc(src)}" alt="" class="${a.cutout ? 'cut' : ''}">` : ''; }
function priceTag(a) { return a.perFt ? `${money(a.price)} <span class="small muted">${T('perft')}</span>` : money(a.price); }
function renderGrid() {
  $('#filters').innerHTML = catChips(ST.cat, 'data-cat');
  const list = ST.assets.filter(a => a.active !== false && (ST.cat === 'all' || a.cat === ST.cat)); const c = counts();
  $('#grid').innerHTML = list.map(a => {
    const dis = !canPlace(a) || (ST.date ? (c[a.id] || 0) >= availLeft(a.id) : (c[a.id] || 0) >= a.qty);
    return `<article class="card"><button class="pic${a.photo ? ' photo' : ''}" data-info="${a.id}" aria-label="${esc(nm(a))} details">${pic(a)}</button><div class="body">
    <h3>${esc(nm(a))}</h3><p class="small muted" style="margin:0">${esc(ds(a))}</p>
    <div class="row" style="margin-top:auto;padding-top:8px"><span class="price">${priceTag(a)}</span>${availBadge(a)}</div>
    <div class="row">${c[a.id] ? `<span class="small">${c[a.id]} ${ES() ? 'en tu montaje' : 'in your setup'}</span><button class="btn ghost sm" data-rm="${a.id}">${T('remove')}</button>` : `<span class="small muted">${canPlace(a) ? '' : T('photo_only')}</span>`}<button class="btn sm" data-add="${a.id}" ${dis ? 'disabled' : ''}>${canPlace(a) ? T('add') : (ES() ? 'Pídela en notas' : 'Ask in notes')}</button></div>
    </div></article>`;
  }).join('') || `<p class="muted">Nothing in this category yet.</p>`;
}
function renderPieces() {
  $('#sFilters').innerHTML = catChips(ST.scat, 'data-scat');
  const list = ST.assets.filter(a => a.active !== false && canPlace(a) && (ST.scat === 'all' || a.cat === ST.scat)); const c = counts();
  $('#pieces').innerHTML = list.map(a => { const dis = ST.date ? (c[a.id] || 0) >= availLeft(a.id) : (c[a.id] || 0) >= a.qty;
    return `<button class="piece" data-place="${a.id}" ${dis ? 'disabled' : ''} title="${esc(nm(a))}"><div class="th">${thumb(a)}</div><div>${esc(nm(a))}<small>${a.perFt ? money(a.price) + ' ' + T('perft') : money(a.price)}${ST.date && !a.made && availLeft(a.id) <= 0 ? ' · ' + T('booked') : ''}</small></div><span>${c[a.id] ? '×' + c[a.id] : '+'}</span></button>`; }).join('');
}
/* ---------- Karol's real projects (hero): a fairy builds the real setup item by item ----------
   Base = the empty room (AI cleanup of Karol's photo). Each step = Karol's real photo masked to that item (img/proj/{id}_c{k}.png).
   The fairy (img/proj/fairy.webp, original character) flies to each item; her wand sparkles and the item pops into place. */
const PJ = { id: PROJECTS[0].id, step: 0, timer: null, seen: false, fx: null };
const TIP = [.066, .087];            // wand star position inside the fairy sprite (fractions)
const PJP = () => PROJECTS.find(x => x.id === PJ.id);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function renderProjects() {
  const es = ES(), p = PJP();
  $('#projTabs').innerHTML = PROJECTS.map(x => `<button class="chip" data-proj="${x.id}" aria-pressed="${x.id === PJ.id}">${esc(es ? x.es : x.name)}</button>`).join('');
  $('#heroH').textContent = es ? 'Mira cómo nace una fiesta.' : 'Watch a party come to life.';
  $('#heroLead').textContent = es ? 'Estos son montajes reales de Karol. Mira cómo aparece cada pieza, una por una, y reserva el mismo look para tu fecha.' : 'These are real setups Karol built. Watch each piece appear, one by one, then book the same look for your date.';
  const st = $('#projStage'); st.style.aspectRatio = `${p.w} / ${p.h}`; st.style.width = `min(100%, calc(72vh * ${(p.w / p.h).toFixed(3)}))`; st.style.margin = '0 auto';
  const useVid = p.video && !p.noVideo && !reduced();
  if (useVid) {
    st.style.aspectRatio = `${p.vw} / ${p.vh}`; st.style.width = `min(100%, calc(72vh * ${(p.vw / p.vh).toFixed(3)}))`;
    st.innerHTML = `<video class="pv" src="${esc(p.video)}" poster="img/proj/${p.id}_start.jpg" muted playsinline preload="auto" aria-label="${esc(es ? p.es : p.name)}: ${es ? 'el montaje aparece pieza por pieza' : 'the setup appearing piece by piece'}"></video><img class="full" src="img/proj/${p.id}_final.jpg" alt="${esc(es ? p.es : p.name)} by Petit Atelier Events"><span class="tag">${es ? 'Proyecto real de Karol' : 'A real Petit Atelier setup'}</span>`;
    const v = st.querySelector('video');
    v.addEventListener('ended', () => { PJ.vidDone = true; st.querySelector('.full')?.classList.add('on'); showStep(0); });
    v.addEventListener('error', () => { p.noVideo = true; renderProjects(); playProject(true); });
  } else {
    st.innerHTML = `<img class="base" src="img/proj/${p.id}_empty.jpg" alt="${esc(p.name)}: the empty space before setup" width="${p.w}" height="${p.h}">`
      + p.steps.map((s, i) => `<img class="layer" data-k="${i + 1}" src="img/proj/${p.id}.jpg" alt="" style="--ox:${(p.at[i][0] * 100).toFixed(1)}%;--oy:${(p.at[i][1] * 100).toFixed(1)}%;-webkit-mask-image:url(img/proj/${p.id}_c${i + 1}.png);mask-image:url(img/proj/${p.id}_c${i + 1}.png)">`).join('')
      + `<img class="full" src="img/proj/${p.id}.jpg" alt="${esc(es ? p.es : p.name)} by Petit Atelier Events"><canvas class="fx"></canvas><div class="fairy" id="fairy"><img src="img/proj/fairy.webp" alt=""></div><span class="tag">${es ? 'Proyecto real de Karol' : 'A real Petit Atelier setup'}</span>`;
    fxInit();
  }
  $('#projSteps').innerHTML = p.steps.map((s, i) => `<i data-k="${i + 1}" title="${esc(es ? s[1] : s[0])}"></i>`).join('');
  $('#projCtaT').textContent = es ? '¿Te encanta este look?' : 'Love this look?';
  $('#projCtaP').textContent = es ? 'Karol lo puede recrear para tu fecha. O diseña tu propio montaje con sus piezas reales y mira el precio al instante.' : 'Karol can recreate it for your date. Or design your own setup with her real pieces and see the price as you go.';
  $('#projUse').textContent = es ? 'Quiero este look' : 'I want this look'; $('#projOwn').textContent = es ? 'Diseñar el mío' : 'Design my own';
  $('#projPrev').hidden = $('#projNext').hidden = !!useVid; $('#projPlay').hidden = false;
  showStep(PJ.step, true);
}
/* --- sparkle particles + fairy flight (one rAF loop per stage) --- */
function fxInit() {
  if (PJ.fx) cancelAnimationFrame(PJ.fx.raf);
  const st = $('#projStage'), cv = st.querySelector('canvas.fx'), fe = $('#fairy');
  const F = { cv, ctx: cv.getContext('2d'), fe, parts: [], x: .9, y: .05, from: null, to: null, t0: 0, dur: 1, trail: true, raf: 0 };
  const size = () => { const r = st.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; F.W = r.width; F.H = r.height; F.d = d; };
  size(); F.size = size;
  const tick = now => {
    if (!cv.isConnected) return;
    if (cv.width !== Math.round(st.clientWidth * F.d)) size();
    if (F.to) { let k = Math.min(1, (now - F.t0) / F.dur); const e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; const mx = (F.from[0] + F.to[0]) / 2, my = Math.min(F.from[1], F.to[1]) - .14;
      F.x = (1 - e) ** 2 * F.from[0] + 2 * (1 - e) * e * mx + e * e * F.to[0]; F.y = (1 - e) ** 2 * F.from[1] + 2 * (1 - e) * e * my + e * e * F.to[1]; if (k >= 1) F.to = null; }
    const fw = fe.offsetWidth; fe.style.transform = `translate(${F.x * F.W - TIP[0] * fw}px, ${F.y * F.H - TIP[1] * fw}px)`;
    if (F.trail && !reduced()) for (let i = 0; i < 2; i++) emit(F, F.x * F.W, F.y * F.H, 1);
    const c = F.ctx; c.setTransform(F.d, 0, 0, F.d, 0, 0); c.clearRect(0, 0, F.W, F.H); c.globalCompositeOperation = 'lighter';
    F.parts = F.parts.filter(q => (q.life -= 16) > 0);
    for (const q of F.parts) { q.x += q.vx; q.y += q.vy; q.vy += .03; q.vx *= .985; const a = Math.max(0, q.life / q.max); c.globalAlpha = a; c.fillStyle = q.c;
      if (q.star) { c.save(); c.translate(q.x, q.y); c.rotate(q.r += .1); c.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? q.s * .35 : q.s; c.lineTo(Math.cos(k * Math.PI / 4) * r, Math.sin(k * Math.PI / 4) * r); } c.fill(); c.restore(); }
      else { c.beginPath(); c.arc(q.x, q.y, q.s * a, 0, 6.283); c.fill(); } }
    c.globalAlpha = 1; F.raf = requestAnimationFrame(tick);
  };
  F.raf = requestAnimationFrame(tick); PJ.fx = F;
}
const SPARK = ['#fff6d5', '#ffd36b', '#ffe9a8', '#f7c6d9', '#e9d5ff', '#ffffff'];
function emit(F, x, y, n, power = .6) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = Math.random() * power * 4; const life = 500 + Math.random() * 900;
    F.parts.push({ x: x + (Math.random() - .5) * 6, y: y + (Math.random() - .5) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .4, s: 1.5 + Math.random() * (power > 1 ? 5 : 3), life, max: life, c: SPARK[i % SPARK.length], star: Math.random() < .35, r: Math.random() * 3 }); }
  if (F.parts.length > 900) F.parts.splice(0, F.parts.length - 900);
}
function flyTo(x, y, dur = 900) { const F = PJ.fx; if (!F) return; F.from = [F.x, F.y]; F.to = [x, y]; F.t0 = performance.now(); F.dur = dur; }
function wave() { const f = $('#fairy'); if (!f) return; f.classList.remove('wave'); void f.offsetWidth; f.classList.add('wave'); }
function burst(x, y, big) { const F = PJ.fx; if (F) emit(F, x * F.W, y * F.H, big ? 220 : 70, big ? 2.2 : 1.3); }
function showStep(k, instant) {
  const p = PJP(), n = p.steps.length + 1; const prev = PJ.step; PJ.step = Math.max(0, Math.min(n, k)); const es = ES();
  if (p.video && !p.noVideo && !reduced()) { $('#projCount').textContent = es ? p.es : p.name; $('#projStep').textContent = PJ.vidDone ? (es ? '¡Listo para la fiesta!' : 'Ready to party!') : (es ? 'Un espacio vacío... y un poco de magia' : 'An empty space... and a little magic'); $('#projPlay').textContent = PJ.vidDone ? (es ? 'Repetir' : 'Replay') : (es ? 'Ver' : 'Play'); return; }
  const fwd = PJ.step === prev + 1 && !instant && !reduced();
  const apply = () => { $$('#projStage .layer').forEach(l => l.classList.toggle('on', +l.dataset.k <= PJ.step)); $('#projStage .full')?.classList.toggle('on', PJ.step >= n); };
  if (PJ.step >= 1 && PJ.step < n) {
    const [cx, cy] = p.at[PJ.step - 1]; const tx = Math.min(.93, cx + .06), ty = Math.max(.06, cy - .08);
    if (fwd) { flyTo(tx, ty, 380); setTimeout(wave, 340); setTimeout(() => { burst(cx, cy); apply(); }, 430); }
    else { if (PJ.fx) { PJ.fx.to = null; PJ.fx.x = tx; PJ.fx.y = ty; } apply(); }
  } else if (PJ.step >= n) {
    if (fwd) { flyTo(.5, .32, 400); setTimeout(() => { const f = $('#fairy'); f.classList.remove('spin'); void f.offsetWidth; f.classList.add('spin'); burst(.5, .45, true); apply(); }, 420); setTimeout(() => flyTo(.86, .1, 700), 1100); }
    else { if (PJ.fx) { PJ.fx.to = null; PJ.fx.x = .86; PJ.fx.y = .1; } apply(); }
  } else { if (PJ.fx) { if (fwd || !instant) flyTo(.86, .1, 400); else { PJ.fx.x = .86; PJ.fx.y = .1; } } apply(); }
  $$('#projSteps i').forEach(li => li.classList.toggle('on', +li.dataset.k <= PJ.step));
  $('#projCount').textContent = PJ.step && PJ.step < n ? `${es ? 'Paso' : 'Step'} ${PJ.step} ${es ? 'de' : 'of'} ${n - 1}` : (es ? p.es : p.name);
  $('#projStep').textContent = PJ.step === 0 ? (es ? 'Un espacio vacío... y un poco de magia' : 'An empty space... and a little magic') : PJ.step >= n ? (es ? '¡Listo para la fiesta!' : 'Ready to party!') : (es ? p.steps[PJ.step - 1][1] : p.steps[PJ.step - 1][0]);
  $('#projPlay').textContent = PJ.timer ? (es ? 'Pausa' : 'Pause') : PJ.step >= n ? (es ? 'Repetir' : 'Replay') : (es ? 'Ver' : 'Play');
}
function playProject(restart) {
  clearInterval(PJ.timer); PJ.timer = null;
  const p = PJP(), n = p.steps.length + 1;
  if (p.video && !p.noVideo && !reduced()) { const v = $('#projStage video'); if (!v) return; PJ.vidDone = false; $('#projStage .full')?.classList.remove('on'); v.currentTime = 0; v.play().catch(() => {}); showStep(0); return; }
  if (restart || PJ.step >= n) showStep(0, true);
  if (reduced()) { showStep(n, true); return; }
  PJ.timer = setInterval(() => { if (PJ.step >= n) { clearInterval(PJ.timer); PJ.timer = null; showStep(n); return; } showStep(PJ.step + 1); }, 800);
  setTimeout(() => { if (PJ.timer && PJ.step === 0) showStep(1); }, 400);
  showStep(PJ.step, true);
}
function useProject() {
  const p = PJP(); const ins = INSP(p.insp);
  ST.balloon.request = ES() ? p.req_es : p.req; ST.balloon.plan = null;
  useInspiration(p.insp);
  toast(ES() ? 'Agregamos los globos de este look. Agrega tus piezas y Karol recrea el resto.' : 'We added this look’s balloons. Add your pieces and Karol recreates the rest.');
}

/* ---------- balloon designer: inspirations, colors, custom request, AI ---------- */
const INSP = id => INSPIRATIONS.find(i => i.id === id);
const swatch = c => { const x = BALLOON_COLORS.find(b => b[0] === c); return `<i class="dot" style="background:${x ? x[2] : '#ccc'}" title="${esc(colorName(c))}"></i>`; };
function renderInspirations() {
  $('#inspGrid').innerHTML = INSPIRATIONS.map(i => `<article class="card"><button class="pic photo" data-zoom="${esc(i.img)}" aria-label="${esc(i.name)} photo"><img src="${esc(i.img)}" alt="${esc(ES() ? i.es : i.name)}" loading="lazy"></button><div class="body">
    <div class="row"><h3>${esc(ES() ? i.es : i.name)}</h3><span class="badge ${i.karol ? 'ok' : ''}">${i.karol ? (ES() ? 'Trabajo de Karol' : 'Karol’s work') : (ES() ? 'Inspiración' : 'Inspiration')}</span></div>
    <p class="small muted" style="margin:0">${esc(ES() ? i.note_es : i.note)}</p>
    <p style="margin:6px 0 0">${i.colors.map(swatch).join('')} <span class="small muted">${i.colors.map(colorName).join(' · ')}</span></p>
    <div class="row" style="margin-top:auto;padding-top:8px"><span class="price">~${i.ft} ft · ${money(i.ft * (A('balloons')?.price || 22))}</span><button class="btn sm" data-insp="${i.id}">${ES() ? 'Usar este estilo' : 'Use this style'}</button></div></div></article>`).join('');
  $('#themeChips').innerHTML = THEMES.map(t => `<button class="chip" data-theme="${esc(t.name)}">${t.colors.map(swatch).join('')} ${esc(ES() ? t.es : t.name)}</button>`).join('');
}
/* AI photo preview (live site): sends a picture of their real-piece layout to the ai-balloons function */
async function stagePNG() {
  const svg = $('#stage').cloneNode(true); svg.querySelector('#selbox')?.remove(); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', 1536); svg.setAttribute('height', 952);
  for (const im of svg.querySelectorAll('image')) { const href = im.getAttribute('href'); if (href.startsWith('data:')) continue; const blob = await (await fetch(href)).blob(); im.setAttribute('href', await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); })); }
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  const img = new Image(); img.src = url; await img.decode(); const c = document.createElement('canvas'); c.width = 1536; c.height = 952; c.getContext('2d').drawImage(img, 0, 0, 1536, 952); URL.revokeObjectURL(url);
  return c.toDataURL('image/png');
}
async function aiRender() {
  if (!bLines().length) await aiPlan(); const plan = ST.balloon.plan || (ST.balloon.plan = { theme: '', message: '' });
  $('#aiOut').insertAdjacentHTML('beforeend', `<p class="small muted" id="rendering">✦ ${ES() ? 'Creando la foto (20 a 40 segundos)…' : 'Creating the photo (20 to 40 seconds)…'}</p>`);
  try {
    const image = await stagePNG();
    const { data, error } = await sb.functions.invoke('ai-balloons', { body: { mode: 'render', image, text: ST.balloon.request, colors: ST.colors, theme: ST.balloon.plan?.theme || '', placement: bLines().map(p => { const c = bCfg(p); return `${c.strands > 1 ? c.strands + ' strands of ' : ''}${bName(B_KINDS[c.kind], false).toLowerCase()} ${c.kind === 'column' || c.kind === 'cluster' ? '' : (c.cover === 'full' ? 'all the way around ' : c.cover === 'corner' ? 'cascading from the top corner of ' : c.cover === 'base' ? 'at both bases of ' : 'up one side and over the top of ') + 'the ' + bName(B_AROUND[c.around], false).toLowerCase()}, about ${c.ft} ft, in ${c.colors.join(', ')}${c.greenery ? ', with greenery' : ''}${c.statement ? `, ${c.statement} giant balloons` : ''}`; }).join('; '), ft: bLines().reduce((s, p) => s + (bCfg(p).ft || 0), 0) } });
    if (error || !data?.url) throw new Error(data?.error || error?.message || 'No image');
    plan.preview = data.url; saveDraft(); renderBalloon();
  } catch (err) { $('#rendering').textContent = (ES() ? 'No se pudo crear la foto: ' : 'Could not create the photo: ') + err.message; }
}
function renderSummary() {
  const P = pricing(), S = ST.S; const es = ES();
  $('#summary').innerHTML = `<h3>${T('your_setup')}</h3>
    ${P.items.length ? `<ul>${P.items.map(it => `<li><span>${esc(itemLabel(it))}</span><span>${money(it.price * it.qty)}</span></li>`).join('')}</ul>` : `<p class="small muted">${T('empty_setup')}</p>`}
    ${hasBalloons() ? `<p class="small" style="margin:0">${T('colors')}: ${ST.colors.length ? esc(ST.colors.map(colorName).join(', ')) : `<span class="err">${es ? 'elige en el estudio' : 'pick them in the studio'}</span>`}</p>` : ''}
    <label for="sDate" style="margin-top:10px">${T('pick_date')}</label><input type="date" id="sDate" value="${esc(ST.date)}" min="${todayISO(2)}">
    <fieldset style="border:0;padding:0;margin:12px 0 0"><legend class="small muted" style="margin-bottom:4px">${T('get_it')}</legend>
      <label class="radio" style="padding:10px;margin-bottom:6px"><input type="radio" name="sFul" value="pickup" ${ST.fulfillment !== 'install' ? 'checked' : ''}><span><b>${T('pickup')}</b> · ${T('free')}<br><span class="small muted">${esc(S.pickupPlace)}</span></span></label>
      <label class="radio" style="padding:10px;margin-bottom:0"><input type="radio" name="sFul" value="install" ${ST.fulfillment === 'install' ? 'checked' : ''}><span><b>${T('install')}</b> · ${money(S.installFee)}<br><span class="small muted">${es ? 'Entrega, montaje y desmontaje' : 'Delivery, setup and teardown'} · ${esc(S.installArea)}</span></span></label></fieldset>
    ${ST.fulfillment !== 'install' && hasBalloons() ? `<p class="small muted" style="margin:6px 0 0">${es ? 'Las guirnaldas viajan mejor en SUV o van con los asientos abajo.' : 'Balloon garlands travel best in an SUV or van with the seats folded down.'}</p>` : ''}
    <div style="margin-top:12px">
      <div class="line"><span>${T('subtotal')}</span><span>${money(P.subtotal)}</span></div>
      <div class="line"><span>${ST.fulfillment === 'install' ? T('install') : T('pickup')}</span><span>${P.install ? money(P.install) : T('free')}</span></div>
      <div class="line"><span>${ST.protection === 'care' ? 'Petit Care Plan' : (es ? 'Depósito reembolsable (aparte)' : 'Refundable deposit (separate)')}</span><span>${money(ST.protection === 'care' ? P.care : P.securityDeposit)}</span></div>
    </div>
    <div class="tot"><span>${T('est_total')}</span><b>${money(P.total)}</b></div>
    <p class="small muted" style="margin:2px 0 12px">${T('deposit_today')}: <b>${money(P.retainer)}</b> (${S.depositPct}%)</p>
    ${P.items.length && P.subtotal < S.minOrder ? `<p class="err">${T('min_order')}: ${money(S.minOrder)}</p>` : ''}
    <button class="btn blush" style="width:100%" id="reserveBtn" ${canReserve(P) ? '' : 'disabled'}>${T('reserve')}</button>
    ${!ST.date && P.items.length ? `<p class="small muted" style="margin-top:8px">${es ? 'Elige tu fecha para confirmar disponibilidad.' : 'Pick your date to confirm availability.'}</p>` : ''}
    ${LIVE ? '' : `<p class="demo">${es ? 'Modo demo: las solicitudes se guardan en este navegador.' : 'Demo mode: requests are saved in this browser until Supabase is connected.'}</p>`}`;
  $('#cartTotal').textContent = money(P.total); $('#mTotal').textContent = money(P.total);
  $('#mReserve').disabled = !canReserve(P);
}
function canReserve(P) { return P.items.length && P.subtotal >= ST.S.minOrder && overbooked().length === 0 && (!hasBalloons() || ST.colors.length > 0); }
function overbooked() { if (!ST.date) return []; const c = counts(); return Object.keys(c).filter(id => !A(id)?.made && c[id] > availLeft(id)); }
function renderWalls() {
  $('#walls').innerHTML = (ST.space ? '' : WALLS.map(w => `<button class="sw" data-wall="${w}" style="background:${w}" aria-label="Wall color ${w}" aria-pressed="${ST.wall === w}"></button>`).join(''))
    + (ST.space ? `<label class="small muted" for="roomScale" style="margin:0 6px 0 0">${T('room_scale')}</label><input type="range" id="roomScale" min="0.3" max="2" step="0.05" value="${ST.roomScale}" style="width:160px;min-height:0;padding:0">` : '')
    + `<label class="chip" for="spaceFile" style="margin:0;color:inherit">${ST.space ? T('space') + ' ↺' : T('space')}</label><input type="file" id="spaceFile" accept="image/*" hidden>`
    + (ST.space ? `<button class="chip" id="spaceOff">${T('space_off')}</button>` : '');
}
function renderLooks() {
  $('#studioLooks').innerHTML = `<span class="small muted" style="align-self:center">${T('start_look')}:</span>` + LOOKS.map(l => `<button class="chip" data-look="${l.id}">${esc(ES() ? l.es : l.name)}</button>`).join('');
}
let heroLook = 0;
function renderHero() {
  if (!$('#heroStage')) return;
  const l = LOOKS[heroLook]; const pl = lookPlacements(l);
  const tot = pl.reduce((s, p) => { const a = A(p.id); return s + (a.perFt ? a.price * 10 : a.price); }, 0);
  $('#heroStage').innerHTML = `<svg viewBox="0 0 1000 620" role="img" aria-label="${esc(l.name)} setup">${sceneSVG(pl, l.wall, false)}
    <g transform="translate(24 24)"><rect width="260" height="68" rx="14" fill="#fffaf8" opacity=".94"/><text x="16" y="28" font-family="Josefin Sans,sans-serif" font-size="16" fill="#6f6460">${esc(ES() ? l.es : l.name)}</text><text x="16" y="56" font-family="Forum,serif" font-size="26" fill="#2b2624">${money(tot)} ${ES() ? 'en piezas reales' : 'in real pieces'}</text></g></svg>`;
  $('#heroLooks').innerHTML = LOOKS.map((x, i) => `<button class="chip" data-hero="${i}" aria-pressed="${i === heroLook}">${esc(ES() ? x.es : x.name)}</button>`).join('') + `<button class="chip" data-look="${l.id}" style="border-color:var(--blushd)">${ES() ? 'Editar este look' : 'Edit this look'} →</button>`;
}
function renderStatic() {
  const S = ST.S; $('#carePrice').textContent = money(S.carePlan); $('#careCap').textContent = money(S.carePlanCap); $('#depPrice').textContent = money(S.securityDeposit);
  $('#faqPickup').textContent = ES() ? `Todo está listo en ${S.pickupPlace}. Horarios: ${S.pickupSlots.join(' o ')}. Devolución: ${S.returnSlot}. Revisas las piezas con Karol al recoger y al devolver. Devoluciones tarde: ${money(S.lateFee)} por día.` : `Everything is ready at ${S.pickupPlace}. Pickup times: ${S.pickupSlots.join(' or ')}. Return: ${S.returnSlot}. You check the pieces with Karol at pickup and at return. Late returns are ${money(S.lateFee)} per day.`;
  $('#faqInstall').textContent = ES() ? `Sí. La instalación cuesta ${money(S.installFee)} e incluye entrega, montaje y desmontaje en ${S.installArea}. Elígela al reservar.` : `Yes. Installation is ${money(S.installFee)} and covers delivery, setup and teardown in ${S.installArea}. Choose it when you reserve.`;
  $('#ftMail').textContent = CONFIG.BUSINESS_EMAIL; $('#ftPhone').textContent = CONFIG.PHONE; $('#igLink').href = CONFIG.INSTAGRAM;
  const gal = [...(S.gallery || []), 'img/proj/mermaid.jpg', 'img/proj/neverland.jpg', 'img/proj/blocks.jpg', 'img/arch_set_styled.jpg', 'img/acrylic.jpg'];
  $('#gallery').innerHTML = gal.map(g => `<img src="${esc(g)}" alt="Petit Atelier setup" loading="lazy">`).join('');
  $$('.igl').forEach(a => a.href = CONFIG.INSTAGRAM); $$('.ftPhone2').forEach(x => x.textContent = CONFIG.PHONE);
  $('#bio1').textContent = ES() ? '¡Soy Karol! Soy brasileña, amo las fiestas y tengo una gran pasión por la decoración y la estética. Me encanta tomar ideas creativas y convertirlas en realidades hermosas, siempre con muchísimo amor.' : 'I\u2019m Karol! I\u2019m a party enthusiast from Brazil with a deep passion for decor and aesthetics. I love taking creative ideas and turning them into beautiful realities, all while infusing them with an abundance of love.';
  $('#bio2').textContent = ES() ? 'Si buscas una decoradora que ponga el corazón en tu evento, aquí estoy. Trabajemos juntos para hacer realidad la fiesta que imaginas. ¡Me muero por crear algo mágico contigo!' : 'If you\u2019re looking for a decorator who will pour their heart and soul into your event, look no further. Let\u2019s work together to bring your party vision to life. I can\u2019t wait to create something magical with you!';
  $$('[data-i]').forEach(el => el.textContent = T(el.dataset.i));
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === ST.lang)); document.documentElement.lang = ST.lang;
}
function renderAll() { renderStatic(); renderHero(); renderGrid(); renderPieces(); renderWalls(); renderLooks(); renderInspirations(); renderBalloon(); renderStage(); renderSummary(); if (!PJ.rendered || PJ.lang !== ST.lang) { PJ.rendered = 1; PJ.lang = ST.lang; renderProjects(); } }

/* ---------- detail modal ---------- */
function openModal(html) { $('#sheet').onclick = null; $('#sheet').onchange = null; $('#sheet').innerHTML = `<button class="x" data-close aria-label="Close">×</button>` + html; $('#modal').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal() { $('#modal').classList.remove('open'); document.body.style.overflow = ''; }
function showInfo(id) {
  const a = A(id); if (!a) return;
  openModal(`<div class="drawer"><div class="infopic">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(nm(a))}">` : a.cutout ? `<img class="cut" src="${esc(a.cutout)}" alt="${esc(nm(a))}">` : ''}${a.photo && a.cutout ? `<img class="cut mini" src="${esc(a.cutout)}" alt="">` : ''}</div><div>
    <h2>${esc(nm(a))}</h2><p class="muted">${esc(ds(a))}</p><p class="price" style="font-size:26px">${a.perFt ? `${money(a.price)} <span class="small muted">${T('perft')}</span>` : `${money(a.price)} <span class="small muted">${ES() ? 'por evento' : 'per event'}</span>`}</p>
    <p class="small muted">${ES() ? 'Altura real aprox.' : 'Real height about'} ${a.ft} ft</p>
    <p>${availBadge(a)}</p><p class="small muted">${a.made ? (ST.lang === 'es' ? 'Se hace nuevo para tu fecha; no hay valor de reposición.' : 'Made new for your date, so there is no replacement value.') : `${ST.lang === 'es' ? 'Valor de reposición' : 'Replacement value'}: ${money(a.repl)}`}</p>
    ${canPlace(a) ? `<button class="btn" data-add="${a.id}" data-close>${T('add')}</button>` : `<p class="small">${T('photo_only')}. ${ES() ? 'Agrégala en las notas de tu reservación.' : 'Mention it in the notes when you reserve.'}</p>`}</div></div>`);
}

/* ---------- checkout ---------- */
const CK = { step: 0, form: {} };
function openCheckout() { CK.step = 0; CK.form = lget('ckform', {}); renderCheckout(); }
function stepsBar() { return `<div class="prog">${[T('step_event'), T('step_review'), T('step_sign'), T('step_done')].map((s, i) => `<span class="${i <= CK.step ? 'on' : ''}">${s}</span>`).join('')}</div>`; }
function renderCheckout() {
  const S = ST.S, P = pricing(), f = CK.form, es = ST.lang === 'es';
  if (CK.step === 0) {
    openModal(`${stepsBar()}<h2>${T('step_event')}</h2><form id="ck0" class="f2" novalidate>
      <div><label for="cName">${T('name')}</label><input id="cName" autocomplete="name" required value="${esc(f.name || '')}"></div>
      <div><label for="cEmail">${T('email')}</label><input id="cEmail" type="email" autocomplete="email" required value="${esc(f.email || '')}"></div>
      <div><label for="cPhone">${T('phone')}</label><input id="cPhone" type="tel" autocomplete="tel" required value="${esc(f.phone || '')}"></div>
      <div><label for="cType">${T('event_type')}</label><select id="cType">${['Birthday', 'Baby shower', 'Bridal shower', 'Quinceañera', 'Wedding', 'Gender reveal', 'Graduation', 'Corporate', 'Other'].map(t => `<option ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div><label for="cDate">${T('pick_date')}</label><input id="cDate" type="date" required min="${todayISO(2)}" value="${esc(ST.date)}"></div>
      <div><label for="cStart">${T('start')}</label><input id="cStart" type="time" required value="${esc(f.start || '15:00')}"></div>
      <div class="full"><label>${T('get_it')}</label><div class="f2">
        <label class="radio" style="margin:0"><input type="radio" name="cFul" value="pickup" ${ST.fulfillment !== 'install' ? 'checked' : ''}><span><b>${T('pickup')}</b> · ${T('free')}<br><span class="small muted">${esc(S.pickupPlace)}. ${es ? 'Devolución' : 'Return'}: ${esc(S.returnSlot)}.</span></span></label>
        <label class="radio" style="margin:0"><input type="radio" name="cFul" value="install" ${ST.fulfillment === 'install' ? 'checked' : ''}><span><b>${T('install')}</b> · ${money(S.installFee)}<br><span class="small muted">${es ? 'Llevamos, montamos y recogemos' : 'We deliver, set up and take down'} · ${esc(S.installArea)}</span></span></label></div></div>
      <div id="slotBox"><label for="cSlot">${T('slot')}</label><select id="cSlot">${S.pickupSlots.map(x => `<option ${f.pickupSlot === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="full" id="addrBox"><label for="cAddr">${T('address')}</label><input id="cAddr" autocomplete="street-address" value="${esc(f.address || '')}"></div>
      <div><label for="cGuests">${T('guests')}</label><input id="cGuests" type="number" min="1" value="${esc(f.guests || '')}"></div>
      <div class="full"><label>${T('setting')}</label><div class="filters" style="margin:0">${[['indoor', T('indoor')], ['covered', T('covered')], ['outdoor', T('outdoor')]].map(([v, l]) => `<label class="chip" style="margin:0;color:inherit"><input type="radio" name="cSet" value="${v}" ${(f.setting || 'indoor') === v ? 'checked' : ''} style="width:auto;min-height:0"> ${l}</label>`).join('')}</div></div>
      ${hasBalloons() ? `<p class="full small">${T('colors')}: <b>${esc(ST.colors.map(colorName).join(', '))}</b>${ST.balloon.style ? ` · ${esc(ES() ? INSP(ST.balloon.style)?.es : INSP(ST.balloon.style)?.name)}` : ''}${ST.balloon.request ? `<br>${ES() ? 'Tu idea' : 'Your idea'}: “${esc(ST.balloon.request)}”` : ''}</p>` : ''}
      <div class="full"><label for="cNotes">${T('notes')}</label><textarea id="cNotes">${esc(f.notes || '')}</textarea></div>
      <p class="err full" id="ckErr"></p>
      <div class="full row"><span class="muted">${T('est_total')}: <b>${money(P.total)}</b></span><button class="btn" type="submit">${T('next')}</button></div></form>`);
    const syncFul = () => { const v = $$('[name=cFul]').find(r => r.checked)?.value; $('#addrBox').style.display = v === 'install' ? '' : 'none'; $('#slotBox').style.display = v === 'install' ? 'none' : ''; };
    $$('[name=cFul]').forEach(r => r.addEventListener('change', syncFul)); syncFul();
    $('#ck0').addEventListener('submit', async e => {
      e.preventDefault();
      const v = { name: $('#cName').value.trim(), email: $('#cEmail').value.trim(), phone: $('#cPhone').value.trim(), type: $('#cType').value, start: $('#cStart').value, address: $('#cAddr').value.trim(), guests: $('#cGuests').value, setting: $$('[name=cSet]').find(r => r.checked)?.value, notes: $('#cNotes').value.trim() };
      const date = $('#cDate').value, ful = $$('[name=cFul]').find(r => r.checked)?.value || 'pickup'; v.pickupSlot = $('#cSlot').value;
      const miss = [!v.name && T('name'), !/^\S+@\S+\.\S+$/.test(v.email) && T('email'), v.phone.replace(/\D/g, '').length < 10 && T('phone'), !date && T('pick_date'), ful === 'install' && !v.address && T('address')].filter(Boolean);
      if (miss.length) { $('#ckErr').textContent = (es ? 'Revisa: ' : 'Please check: ') + miss.join(', '); return; }
      if (date < todayISO(2)) { $('#ckErr').textContent = es ? 'Reservamos con al menos 2 días de anticipación.' : 'Please book at least 2 days ahead.'; return; }
      CK.form = v; lset('ckform', v); ST.fulfillment = ful;
      if (date !== ST.date) { ST.date = date; lset('date', date); await refreshAvail(); }
      const over = overbooked(); if (over.length) { $('#ckErr').textContent = (es ? 'No disponible esa fecha: ' : 'Not available that date: ') + over.map(id => nm(A(id))).join(', '); return; }
      saveDraft(); renderSummary(); CK.step = 1; renderCheckout();
    });
  }
  if (CK.step === 1) {
    openModal(`${stepsBar()}<h2>${es ? 'Protección contra daños' : 'Damage protection'}</h2>
      <label class="radio"><input type="radio" name="prot" value="care" ${ST.protection === 'care' ? 'checked' : ''}><div><b>Petit Care Plan · ${money(S.carePlan)}</b><br><span class="small muted">${es ? `Cubre daños accidentales hasta ${money(S.carePlanCap)}. No reembolsable.` : `Covers accidental damage up to ${money(S.carePlanCap)} in replacement value. Non-refundable. No surprise bills for normal accidents.`}</span></div></label>
      <label class="radio"><input type="radio" name="prot" value="deposit" ${ST.protection !== 'care' ? 'checked' : ''}><div><b>${es ? 'Depósito de seguridad reembolsable' : 'Refundable security deposit'} · ${money(S.securityDeposit)}</b><br><span class="small muted">${es ? 'Se devuelve 7 días después. Pagas el valor de reposición de lo que se dañe o pierda.' : 'Returned within 7 days after pickup. You pay the listed replacement value of anything damaged or lost.'}</span></div></label>
      <div id="ck1sum"></div>
      <div class="row" style="margin-top:16px"><button class="btn ghost" data-back>${T('back')}</button><button class="btn" id="ck1next">${T('next')}</button></div>`);
    const sum = () => { const P = pricing(); $('#ck1sum').innerHTML = `<div class="pane" style="margin-top:8px">${P.items.map(it => `<div class="line"><span>${esc(itemLabel(it))}</span><span>${money(it.price * it.qty)}</span></div>`).join('')}<div class="line"><span>${ST.fulfillment === 'install' ? T('install') : T('pickup')}</span><span>${P.install ? money(P.install) : T('free')}</span></div>
      <div class="line"><span>${ST.protection === 'care' ? 'Petit Care Plan' : (es ? 'Depósito reembolsable (se paga con el saldo, no incluido)' : 'Refundable deposit (paid with balance, not in total)')}</span><span>${money(ST.protection === 'care' ? P.care : P.securityDeposit)}</span></div>
      <div class="tot"><span>Total</span><b>${money(P.total)}</b></div><div class="line"><span>${T('deposit_today')}</span><b>${money(P.retainer)}</b></div></div>`; };
    sum(); $$('[name=prot]').forEach(r => r.addEventListener('change', () => { ST.protection = r.value; saveDraft(); sum(); renderSummary(); }));
    $('#ck1next').onclick = () => { CK.step = 2; renderCheckout(); };
  }
  if (CK.step === 2) {
    const b = draftBooking();
    openModal(`${stepsBar()}<h2>${es ? 'Revisa y firma' : 'Review and sign'}</h2>
      <div class="contractbox">${contractHTML(b, S, ST.assets)}</div>
      <label class="check"><input type="checkbox" id="ag1"> <span>${es ? 'Leí y acepto el contrato de renta, incluyendo la sección de daños.' : 'I have read and agree to the rental agreement, including section 4 on damage and loss.'}</span></label>
      <label class="check"><input type="checkbox" id="ag2"> <span>${es ? 'Entiendo que el clima puede dañar los globos y que eso no es reembolsable.' : 'I understand heat, sun and wind can pop balloons and that weather damage is not refunded.'}</span></label>
      <label class="check"><input type="checkbox" id="ag3"> <span class="muted">${es ? 'No compartir fotos de mi montaje (opcional).' : 'Please do not share photos of my setup (optional).'}</span></label>
      <div class="f2" style="margin-top:8px"><div><label for="sgName">${es ? 'Escribe tu nombre completo' : 'Type your full name'}</label><input id="sgName" value="${esc(CK.form.name || '')}"></div><div></div>
      <div class="full"><div class="row"><label style="margin:0">${es ? 'Firma aquí' : 'Sign here'}</label><button class="chip" id="sgClear" type="button">${es ? 'Borrar' : 'Clear'}</button></div><canvas id="sig" aria-label="Signature pad"></canvas></div></div>
      <p class="err" id="sgErr"></p>
      <div class="row"><button class="btn ghost" data-back>${T('back')}</button><button class="btn blush" id="sgSubmit">${T('sign_submit')}</button></div>`);
    const pad = sigPad($('#sig')); $('#sgClear').onclick = pad.clear;
    $('#sgSubmit').onclick = async () => {
      const nmv = $('#sgName').value.trim();
      if (!$('#ag1').checked || !$('#ag2').checked) { $('#sgErr').textContent = es ? 'Marca las dos casillas para continuar.' : 'Please check both boxes to continue.'; return; }
      if (nmv.length < 3) { $('#sgErr').textContent = es ? 'Escribe tu nombre completo.' : 'Please type your full name.'; return; }
      if (pad.empty()) { $('#sgErr').textContent = es ? 'Dibuja tu firma.' : 'Please draw your signature.'; return; }
      const btn = $('#sgSubmit'); btn.disabled = true; btn.textContent = '…';
      const bk = draftBooking(); bk.contract = { name: nmv, signature: pad.data(), signed_at: new Date().toISOString(), version: S.contractVersion, photoOptOut: $('#ag3').checked, ua: navigator.userAgent.slice(0, 120) };
      try {
        await refreshAvail(); const over = overbooked(); if (over.length) throw new Error((es ? 'Alguien acaba de reservar: ' : 'Just booked by someone else: ') + over.map(id => nm(A(id))).join(', '));
        bk.code = await DB.createBooking(bk) || bk.code; CK.booking = bk;
        const mails = [];
        mails.push(DB.email(S.notifyEmail, `New request ${bk.code}: ${bk.event.type} on ${bk.event.date}`, adminMail(bk), 'new_request', bk.code));
        mails.push(DB.email(bk.customer.email, `We received your request ${bk.code} · Petit Atelier Events`, customerMail(bk), 'request_received', bk.code));
        CK.mail = await Promise.all(mails).catch(() => null);
        CK.step = 3; renderCheckout();
      } catch (err) { $('#sgErr').textContent = err.message || String(err); btn.disabled = false; btn.textContent = T('sign_submit'); }
    };
  }
  if (CK.step === 3) {
    const b = CK.booking; const notify = CK.mail && CK.mail[0] && !CK.mail[0].sent ? CK.mail[0].mailto : '';
    openModal(`${stepsBar()}<h2>${T('confirm_title')}</h2>
      <p>${es ? 'Tu código' : 'Your reservation code'}: <b style="font-size:26px;font-family:Forum,serif">${esc(b.code)}</b></p>
      <p>${es ? `Karol revisará tu solicitud y te confirmará en 48 horas. Después pagarás el anticipo de ${money(b.totals.retainer)} para apartar la fecha.` : `Karol will review your request and confirm within 48 hours. Then you'll pay the ${money(b.totals.retainer)} retainer to lock in ${fmtDate(b.event.date)}. ${b.event.fulfillment === 'install' ? 'Installation is included.' : `Pickup: ${b.event.pickupSlot}. Return: ${ST.S.returnSlot}.`}`}</p>
      <ul class="small"><li>${es ? 'Saldo 7 días antes del evento.' : 'Balance due 7 days before your event.'}</li><li>${es ? 'Recordatorios por correo antes del evento.' : 'Email reminders 7 days and 1 day before.'}</li><li>${es ? 'Busca tu reservación con el código y tu correo.' : 'Look up your reservation anytime with your code and email.'}</li></ul>
      ${notify ? `<p class="demo">Demo mode: emails are not sent yet. <a href="${esc(notify)}">Open the notice to Karol in your email app</a> (${esc(ST.S.notifyEmail)}).</p>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn ghost" id="icsBtn">${es ? 'Agregar al calendario' : 'Add to calendar'}</button><button class="btn" data-close>${es ? 'Listo' : 'Done'}</button></div>`);
    $('#icsBtn').onclick = () => downloadICS(b);
    ST.placements = []; ST.colors = []; ST.balloon = { style: '', request: '', plan: null }; ST.sel = null; saveDraft(); refreshAvail();
  }
}
function draftBooking() {
  const P = pricing(), f = CK.form;
  return { code: newCode(), created_at: new Date().toISOString(), status: 'new', lang: ST.lang,
    customer: { name: f.name, email: f.email, phone: f.phone },
    event: { date: ST.date, start: f.start, type: f.type, fulfillment: ST.fulfillment, pickupSlot: ST.fulfillment === 'install' ? '' : f.pickupSlot, returnSlot: ST.fulfillment === 'install' ? '' : ST.S.returnSlot, address: ST.fulfillment === 'install' ? f.address : '', guests: +f.guests || null, setting: f.setting, notes: f.notes },
    items: P.items, balloonColors: hasBalloons() ? [...ST.colors] : [], balloon: hasBalloons() ? { style: ST.balloon.style, request: ST.balloon.request, pieces: bLines().map(p => ({ ...bCfg(p), label: bLabel(bCfg(p)), price: bPrice(bCfg(p)).total })), plan: ST.balloon.plan ? { theme: ST.balloon.plan.theme, message: ST.balloon.plan.message, character: ST.balloon.plan.character, preview: ST.balloon.plan.preview || '' } : null } : null, design: { wall: ST.wall, placements: ST.placements.map(({ uid, ...r }) => r) },
    protection: ST.protection, totals: { subtotal: P.subtotal, discount: 0, install: P.install, care: P.care, securityDeposit: P.securityDeposit, total: P.total, retainer: P.retainer },
    contract: null, prep: {}, payments: { retainer: false, balance: false, depositReturned: false }, reminders: [] };
}
function adminMail(b) { return `New decor request ${b.code}\n\n${b.customer.name} · ${b.customer.email} · ${b.customer.phone}\n${b.event.type} on ${fmtDate(b.event.date)} at ${b.event.start}\n${b.event.fulfillment === 'install' ? 'INSTALLATION at ' + b.event.address : 'Pickup: ' + b.event.pickupSlot}\n\n${b.items.map(i => `${i.qty} x ${i.name}  ${money(i.price * i.qty)}`).join('\n')}${b.balloonColors?.length ? '\nBalloon colors: ' + b.balloonColors.join(', ') : ''}${b.balloon?.style ? '\nBalloon style: ' + b.balloon.style : ''}${b.balloon?.request ? '\nBalloon idea: ' + b.balloon.request : ''}\n\nTotal ${money(b.totals.total)} · Retainer ${money(b.totals.retainer)} · ${b.protection === 'care' ? 'Care Plan' : 'Security deposit'}\nNotes: ${b.event.notes || 'none'}\n\nOpen your dashboard to confirm.`; }
function customerMail(b) { return `Hi ${b.customer.name.split(' ')[0]},\n\nThank you for designing your party with Petit Atelier Events! Your request ${b.code} for ${fmtDate(b.event.date)} is in. Karol will confirm within 48 hours and send how to pay the ${money(b.totals.retainer)} retainer.\n${b.event.fulfillment === 'install' ? 'Installation at ' + b.event.address : 'Pickup: ' + b.event.pickupSlot + '. Return: ' + b.event.returnSlot}\n\n${b.items.map(i => `${i.qty} x ${i.name}`).join('\n')}${b.balloonColors?.length ? '\nBalloon colors: ' + b.balloonColors.join(', ') : ''}\nEstimated total: ${money(b.totals.total)}\n\nYour signed rental agreement is saved with your reservation. Look it up anytime with your code and this email.\n\nKarol · Petit Atelier Events`; }
function downloadICS(b) {
  const d = b.event.date.replace(/-/g, ''); const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Petit Atelier//EN\r\nBEGIN:VEVENT\r\nUID:${b.code}@petitatelier\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z\r\nDTSTART;VALUE=DATE:${d}\r\nSUMMARY:${b.event.type} decor by Petit Atelier (${b.code})\r\nLOCATION:${(b.event.address || 'Petit Atelier pickup, Eagle Mountain UT').replace(/[,;]/g, ' ')}\r\nDESCRIPTION:${b.event.fulfillment === 'install' ? 'Installation before ' + b.event.start : 'Pickup ' + b.event.pickupSlot + '. Return ' + b.event.returnSlot}. Balance due 7 days before.\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = b.code + '.ics'; a.click(); toast('Calendar file downloaded'); } catch { toast('Your browser blocked the download'); }
}
function sigPad(c) {
  const ctx = c.getContext('2d'); let drawing = false, has = false;
  const fit = () => { const r = c.getBoundingClientRect(); c.width = r.width * 2; c.height = r.height * 2; ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1d1a19'; };
  fit();
  const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.addEventListener('pointerdown', e => { drawing = true; c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); });
  c.addEventListener('pointermove', e => { if (!drawing) return; ctx.lineTo(...pos(e)); ctx.stroke(); has = true; });
  c.addEventListener('pointerup', () => drawing = false);
  return { clear: () => { ctx.clearRect(0, 0, c.width, c.height); has = false; }, empty: () => !has, data: () => c.toDataURL('image/png') };
}

/* ---------- reservation lookup ---------- */
const STATUS = { new: ['Request received', 'Solicitud recibida'], confirmed: ['Confirmed', 'Confirmada'], ready: ['Ready for pickup', 'Lista para recoger'], delivered: ['Picked up', 'Recogida'], returned: ['Returned', 'Devuelta'], closed: ['Complete', 'Completa'], declined: ['Not available', 'No disponible'], cancelled: ['Cancelled', 'Cancelada'] };
function statusLabel(s) { return (STATUS[s] || [s, s])[ST.lang === 'es' ? 1 : 0]; }
async function lookup(e) {
  e.preventDefault(); const out = $('#lookupOut'); out.innerHTML = '<p class="muted">…</p>';
  try {
    const b = await DB.lookup($('#lkCode').value, $('#lkEmail').value);
    if (!b) { out.innerHTML = `<p class="err">${ST.lang === 'es' ? 'No encontramos esa reservación. Revisa el código y el correo.' : 'We could not find that reservation. Check the code and email.'}</p>`; return; }
    const flow = ['new', 'confirmed', 'ready', 'delivered', 'returned'];
    out.innerHTML = `<div class="pane"><div class="row"><h3 style="margin:0">${esc(b.code)} · ${esc(fmtDate(b.event.date, ST.lang))}</h3><span class="st ${esc(b.status)}">${esc(statusLabel(b.status))}</span></div>
      <div class="prog" style="margin:14px 0">${flow.map(s => `<span class="${flow.indexOf(s) <= flow.indexOf(b.status) ? 'on' : ''}">${esc(statusLabel(s))}</span>`).join('')}</div>
      <div class="drawer"><div><svg viewBox="0 0 1000 620" style="width:100%;border-radius:14px">${sceneSVG((b.design?.placements || []).map((p, i) => ({ ...p, uid: 'l' + i })), b.design?.wall || WALLS[0], false)}</svg></div>
      <div>${b.items.map(i => `<div class="line"><span>${esc(itemLabel(i))}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}
      <div class="tot"><span>Total</span><b>${money(b.totals.total)}</b></div>
      <div class="line"><span>Retainer ${money(b.totals.retainer)}</span><span>${b.payments?.retainer ? '✓ paid' : 'due on confirmation'}</span></div>
      <div class="line"><span>Balance ${money(b.totals.total - b.totals.retainer)}</span><span>${b.payments?.balance ? '✓ paid' : 'due 7 days before'}</span></div>
      <button class="btn ghost sm" style="margin-top:10px" id="viewContract">${ST.lang === 'es' ? 'Ver contrato firmado' : 'View signed agreement'}</button></div></div></div>`;
    $('#viewContract').onclick = () => openModal(contractHTML(b, ST.S, ST.assets));
  } catch (err) { out.innerHTML = `<p class="err">${esc(err.message)}</p>`; }
}

/* ---------- events ---------- */
function bindSite() {
  document.addEventListener('click', e => {
    const t = e.target;
    const add = t.closest('[data-add]'); if (add) { if (addPiece(add.dataset.add)) { toast(`${nm(A(add.dataset.add))} ${ST.lang === 'es' ? 'agregado a tu montaje' : 'added to your setup'}`); renderAll(); } }
    const rm = t.closest('[data-rm]'); if (rm) { removeOne(rm.dataset.rm); renderAll(); }
    const pl = t.closest('[data-place]'); if (pl) { if (addPiece(pl.dataset.place)) renderAll(); }
    const info = t.closest('[data-info]'); if (info) showInfo(info.dataset.info);
    const cat = t.closest('[data-cat]'); if (cat) { ST.cat = cat.dataset.cat; renderGrid(); }
    const sc = t.closest('[data-scat]'); if (sc) { ST.scat = sc.dataset.scat; renderPieces(); }
    const ins = t.closest('[data-insp]'); if (ins) useInspiration(ins.dataset.insp);
    const th = t.closest('[data-theme]'); if (th) { const T0 = THEMES.find(x => x.name === th.dataset.theme); ST.balloon.request = ES() ? `Guirnalda alrededor del arco, fiesta ${T0.es}` : `Garland around the arch for a ${T0.name} party`; document.getElementById('studio').scrollIntoView(); renderBalloon(); aiPlan(); }
    const zm = t.closest('[data-zoom]'); if (zm) openModal(`<img src="${esc(zm.dataset.zoom)}" alt="" style="width:100%;border-radius:14px">`);
    const pj = t.closest('[data-proj]'); if (pj) { PJ.id = pj.dataset.proj; PJ.step = 0; renderProjects(); playProject(true); }
    if (t.id === 'projPlay' && $('#projStage video')) { playProject(true); return; }
    if (t.id === 'projPlay') { if (PJ.timer) { clearInterval(PJ.timer); PJ.timer = null; showStep(PJ.step); } else playProject(); }
    if (t.id === 'projNext') { clearInterval(PJ.timer); PJ.timer = null; showStep(PJ.step + 1); }
    if (t.id === 'projPrev') { clearInterval(PJ.timer); PJ.timer = null; showStep(PJ.step - 1, true); }
    if (t.id === 'projUse') useProject();
    if (t.id === 'aiPlanBtn') aiPlan();
    if (t.id === 'aiRenderBtn') aiRender();
    const wl = t.closest('[data-wall]'); if (wl) { ST.wall = wl.dataset.wall; saveDraft(); renderWalls(); renderStage(); }
    const lk = t.closest('[data-look]'); if (lk) { loadLook(LOOKS.find(l => l.id === lk.dataset.look)); document.getElementById('studio').scrollIntoView(); }
    const hr = t.closest('[data-hero]'); if (hr) { heroLook = +hr.dataset.hero; window.heroPaused = true; renderHero(); }
    if (t.closest('[data-close]') || t.id === 'modal') closeModal();
    if (t.closest('[data-back]')) { CK.step--; renderCheckout(); }
    if (t.id === 'reserveBtn' || t.id === 'mReserve') openCheckout();
    if (t.id === 'spaceOff') { ST.space = null; renderWalls(); renderStage(); }
    if (t.id === 'clearBtn') { ST.placements = []; ST.sel = null; saveDraft(); renderAll(); }
    const lg = t.closest('[data-lang]'); if (lg) { ST.lang = lg.dataset.lang; lset('lang', ST.lang); refreshAvail(); }
  });
  document.addEventListener('change', async e => {
    if (e.target.id === 'heroDate' || e.target.id === 'sDate') { ST.date = e.target.value; lset('date', ST.date); $('#heroDate').value = ST.date; await refreshAvail(); }
    if (e.target.id === 'spaceFile' && e.target.files[0]) { try { ST.space = await shrink(e.target.files[0], 1600); ST.roomScale = 1; renderWalls(); renderStage(); toast(ST.lang === 'es' ? 'Tu foto se queda solo en este dispositivo.' : 'Your photo stays on this device only.'); } catch { toast('Could not read that photo'); } }
    if (e.target.name === 'sFul') { ST.fulfillment = e.target.value; saveDraft(); renderSummary(); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'roomScale') { ST.roomScale = +e.target.value; renderStage(); } if (e.target.id === 'bReq') { ST.balloon.request = e.target.value.slice(0, 600); saveDraft(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  $('#lookupForm').addEventListener('submit', lookup);
  try { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && !PJ.seen) { PJ.seen = true; playProject(true); } }, { threshold: .35 }); io.observe($('#projStage')); } catch { }
  bindStage();
}
