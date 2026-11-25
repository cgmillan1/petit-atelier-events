/* ---------- Balloon builder: custom garlands with live estimate + drawn preview on the stage ----------
   Each balloon piece is a placement of asset 'balloons' with pl.cfg = {kind, around, cover, strands, ft, auto, colors[], chrome, greenery, confetti, statement, foils}.
   Prices come from settings.balloon (Karol edits them in the admin). The server recalculates with the same formula. */
const B_DEFAULT_RATES = { classic: 16, organic: 22, full: 30, column: 18, cluster: 35, extraColor: 15, chrome: 3, greenery: 4, confetti: 2, statement: 12, foil: 25, frame: 40, minFt: 4, includedColors: 3, maxColors: 6, strandFactor: 0.85 };
const B_KINDS = {
  classic: ['Classic garland', 'Guirnalda clásica', 'Same-size balloons in a neat pattern', 'Globos del mismo tamaño en patrón'],
  organic: ['Organic garland', 'Guirnalda orgánica', 'Mixed 5" to 18" balloons, the most popular', 'Globos de 5" a 18", la más popular'],
  full: ['Full luxe garland', 'Guirnalda llena de lujo', 'Extra full, adds 24" statement balloons', 'Extra llena, con globos de 24"'],
  column: ['Balloon column', 'Columna de globos', 'A standing tower, priced by height', 'Torre de globos, por altura'],
  cluster: ['Clusters', 'Racimos', 'Bouquet clusters, priced each', 'Racimos, precio por pieza'],
};
const B_AROUND = {
  'window-arch': ['Gold window arch', 'Arco dorado tipo ventana', 'window-arch'],
  'half-arches': ['Gold open arches', 'Arcos dorados abiertos', 'half-arches'],
  'hoop': ['Round hoop', 'Aro redondo', ''],
  'doorway': ['Doorway arch (frame included)', 'Arco de entrada (incluye estructura)', ''],
  'table': ['Front of a table', 'Frente de una mesa', 'cane-console'],
  'backdrop-top': ['Top of the backdrop', 'Parte de arriba del fondo', ''],
  'floor': ['On the floor', 'En el piso', ''],
};
const B_COVER = { full: ['All the way around', 'Todo alrededor', 1], half: ['One side, up and over', 'Un lado, subiendo', .55], corner: ['Top corner cascade', 'Cascada en la esquina', .32], base: ['Both bases', 'En las dos bases', .36] };
const BR = () => ({ ...B_DEFAULT_RATES, ...(ST.S?.balloon || {}) });
const bName = (o, es) => o ? (es ? o[1] : o[0]) : '';

/* geometry of what the garland goes around, in stage units (x0..x1, top/bottom) */
function bTarget(cfg) {
  const id = B_AROUND[cfg.around]?.[2];
  let pl = id ? ST.placements.find(p => p.id === id && (p.part == null || p.part === 1)) : null;
  if (cfg.around === 'backdrop-top') pl = ST.placements.find(p => A(p.id)?.cat === 'backdrops');
  if (cfg.around === 'table') pl = ST.placements.find(p => A(p.id)?.cat === 'furniture' && !A(p.id).parts) || pl;
  if (pl) { const a = A(pl.id), pt = a.parts && pl.part != null ? a.parts[pl.part] : null; const k = pl.s || 1; const h = (pt || a).ft * FT * k, w = h * ((pt || a).ar || 1); return { x: pl.x, y: pl.y, w, h, found: true }; }
  const self = ST.placements.find(p => p.cfg === cfg) || { x: 500, y: 560 };
  const shape = { hoop: [300, 300], doorway: [260, 340], table: [240, 110], floor: [280, 40], 'window-arch': [170, 345], 'half-arches': [170, 345], 'backdrop-top': [300, 340] }[cfg.around] || [260, 300];
  return { x: self.x, y: self.y, w: shape[0], h: shape[1], found: false };
}
/* path the balloons follow, as points [x,y] (stage units) */
function bPath(cfg) {
  const g = bTarget(cfg), pts = [], N = 160, L = g.x - g.w / 2, R = g.x + g.w / 2, B = g.y, T = g.y - g.h;
  if (cfg.kind === 'column') { for (let i = 0; i <= N; i++) pts.push([g.found ? R + 30 : g.x, B - (cfg.ft * FT) * i / N]); return pts; }
  if (cfg.kind === 'cluster') return [[L - 10, B - 30], [R + 10, B - 30], [L + 10, T + 30]];
  const a = cfg.around;
  if (a === 'hoop') { const r = Math.min(g.w, g.h) / 2, cx = g.x, cy = B - r; for (let i = 0; i <= N; i++) { const t = Math.PI / 2 + i / N * Math.PI * 2; pts.push([cx + Math.cos(t) * r * -1, cy + Math.sin(t) * r]); } }
  else if (a === 'table' || a === 'backdrop-top') { const y = a === 'table' ? T + 8 : T + 14; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([L - 6 + (g.w + 12) * u, y + Math.sin(u * Math.PI * 3) * 10 + (a === 'table' ? Math.sin(u * Math.PI) * 8 : 0)]); } }
  else if (a === 'floor') { for (let i = 0; i <= N; i++) { const u = i / N; pts.push([L + g.w * u, B - 14 - Math.sin(u * Math.PI) * 26]); } }
  else { const r = g.w / 2, side = g.h - r; const per = side * 2 + Math.PI * r;
    for (let i = 0; i <= N; i++) { let d = i / N * per;
      if (d < side) pts.push([L, B - d]); else if (d < side + Math.PI * r) { const t = Math.PI - (d - side) / r; pts.push([g.x + Math.cos(t) * r, B - side - Math.sin(t) * r]); } else pts.push([R, B - side + (d - side - Math.PI * r)]); } }
  const cov = B_COVER[cfg.cover] || B_COVER.full; if (cfg.cover === 'full' || cfg.kind === 'column') return pts;
  const n = pts.length; if (cfg.cover === 'half') return pts.slice(0, Math.round(n * .58));
  if (cfg.cover === 'corner') return pts.slice(Math.round(n * .22), Math.round(n * .55));
  if (cfg.cover === 'base') return [...pts.slice(0, Math.round(n * .2)), null, ...pts.slice(Math.round(n * .8))];
  return pts;
}
/* auto length in feet from the shape */
function bAutoFt(cfg) {
  if (cfg.kind === 'column') return cfg.ft || 6; if (cfg.kind === 'cluster') return 0;
  const g = bTarget(cfg); let per;
  if (cfg.around === 'hoop') per = Math.PI * Math.min(g.w, g.h);
  else if (cfg.around === 'table' || cfg.around === 'backdrop-top' || cfg.around === 'floor') per = g.w * 1.15;
  else { const r = g.w / 2; per = (g.h - r) * 2 + Math.PI * r; }
  const frac = ['table', 'backdrop-top', 'floor'].includes(cfg.around) ? 1 : (B_COVER[cfg.cover] || B_COVER.full)[2];
  return Math.max(BR().minFt, Math.round(per / FT * frac));
}
function bPrice(cfg) {
  const r = BR(), lines = [], es = ES();
  const ft = cfg.kind === 'cluster' ? 0 : Math.max(r.minFt, Math.round(cfg.ft || 0));
  const strands = cfg.kind === 'column' || cfg.kind === 'cluster' ? 1 : Math.max(1, Math.min(3, cfg.strands || 1));
  const sf = 1 + (strands - 1) * r.strandFactor;
  if (cfg.kind === 'cluster') lines.push([`${cfg.count || 3} × ${bName(B_KINDS.cluster, es)}`, (cfg.count || 3) * r.cluster]);
  else lines.push([`${ft} ft · ${bName(B_KINDS[cfg.kind], es)}${strands > 1 ? ` × ${strands} ${es ? 'líneas' : 'strands'}` : ''}`, Math.round(ft * r[cfg.kind] * sf)]);
  const extraC = Math.max(0, Math.min(r.maxColors, (cfg.colors || []).length) - r.includedColors); if (extraC) lines.push([`+${extraC} ${es ? 'color(es) extra' : 'extra color' + (extraC > 1 ? 's' : '')}`, extraC * r.extraColor]);
  const lf = cfg.kind === 'cluster' ? 0 : ft * sf;
  if (cfg.chrome) lines.push([es ? 'Cromados / metálicos' : 'Chrome / metallic accents', Math.round(lf * r.chrome)]);
  if (cfg.greenery) lines.push([es ? 'Follaje' : 'Greenery tucked in', Math.round(lf * r.greenery)]);
  if (cfg.confetti) lines.push([es ? 'Globos con confeti' : 'Confetti / clear accents', Math.round(lf * r.confetti)]);
  if (cfg.statement) lines.push([`${cfg.statement} × ${es ? 'globos gigantes 24-36"' : 'giant 24-36" balloons'}`, cfg.statement * r.statement]);
  if (cfg.foils) lines.push([`${cfg.foils} × ${es ? 'globos de foil / número' : 'foil or number balloons'}`, cfg.foils * r.foil]);
  if (cfg.around === 'doorway' && cfg.kind !== 'column' && cfg.kind !== 'cluster') lines.push([es ? 'Estructura del arco' : 'Arch frame rental', r.frame]);
  return { lines, total: lines.reduce((s, l) => s + l[1], 0), ft, strands };
}
function bLabel(cfg) { const es = ES(); return `${bName(B_KINDS[cfg.kind], es)}${cfg.kind === 'cluster' ? '' : ` · ${cfg.ft} ft`}${['column', 'cluster'].includes(cfg.kind) ? '' : ` · ${bName(B_AROUND[cfg.around], es)}`}`; }
const bNewCfg = (o = {}) => ({ kind: 'organic', around: 'window-arch', cover: 'half', strands: 1, ft: 0, auto: true, colors: [], chrome: false, greenery: false, confetti: false, statement: 0, foils: 0, count: 3, ...o });
function bLines() { return ST.placements.filter(p => A(p.id)?.perFt); }
function bAdd(cfg, opts = {}) {
  const tgt = B_AROUND[cfg.around]?.[2]; const anchor = ST.placements.find(p => p.id === tgt) || ST.placements.find(p => A(p.id)?.cat === 'backdrops');
  addPiece('balloons', anchor ? anchor.x : 500, anchor ? anchor.y : 560, 1);
  const pl = bLines().slice(-1)[0]; pl.cfg = bNewCfg(cfg); if (pl.cfg.auto || !pl.cfg.ft) pl.cfg.ft = bAutoFt(pl.cfg); pl.len = pl.cfg.ft;
  ST.bSel = pl.uid; ST.sel = pl.uid; syncBalloonColors(); if (!opts.quiet) { saveDraft(); renderAll(); } return pl;
}
function bCfg(pl) { if (!pl.cfg) { pl.cfg = bNewCfg({ around: 'floor', colors: ST.colors.slice(0, 3), ft: pl.len || 10, auto: false }); } return pl.cfg; }
function syncBalloonColors() { ST.colors = [...new Set(bLines().flatMap(p => bCfg(p).colors || []))]; }
/* drawn balloons along the path, deterministic per placement */
function garlandSVG(pl) {
  const cfg = bCfg(pl); const pts = bPath(cfg); if (!pts.length) return '';
  const cols = (cfg.colors.length ? cfg.colors : ['Blush', 'Cream', 'Chrome gold']).map(c => (BALLOON_COLORS.find(b => b[0] === c) || [0, 0, '#ddd'])[2]);
  let seed = [...pl.uid].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const dens = { classic: 1, organic: 1.25, full: 1.7, column: 1.3, cluster: 1 }[cfg.kind] || 1.2, strands = ['column', 'cluster'].includes(cfg.kind) ? 1 : (cfg.strands || 1);
  const out = []; const R0 = { classic: 19, organic: 20, full: 22, column: 19, cluster: 19 }[cfg.kind];
  const ids = cols.map((c, i) => `bg${pl.uid}_${i}`);
  const defs = cols.map((c, i) => `<radialGradient id="${ids[i]}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".25" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".92"/></radialGradient>`).join('')
    + `<radialGradient id="ch${pl.uid}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#e9d39a"/><stop offset=".7" stop-color="#a7843a"/><stop offset="1" stop-color="#5a4520"/></radialGradient>`;
  if (cfg.kind === 'cluster') { for (const [x, y] of pts) for (let i = 0; i < 9; i++) { const r = 12 + rnd() * 14; out.push([x + (rnd() - .5) * 60, y + (rnd() - .5) * 54, r, Math.floor(rnd() * cols.length)]); } }
  else {
    for (let s = 0; s < strands; s++) {
      const off = (s - (strands - 1) / 2) * 30;
      let prev = null, acc = 0; const step = 22 / dens;
      for (let i = 0; i < pts.length; i++) { const p = pts[i]; if (!p) { prev = null; continue; } if (prev) acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
        if (acc < step && i) continue; acc = 0;
        const q = pts[Math.min(pts.length - 1, i + 1)] || p, nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny) || 1;
        const per = cfg.kind === 'classic' ? 2 : 3;
        for (let k = 0; k < per; k++) { const big = cfg.kind === 'classic' ? 1 : (rnd() < .12 ? 1.6 : rnd() < .4 ? .45 : .7 + rnd() * .45);
          const r = R0 * big * (cfg.kind === 'full' && rnd() < .07 ? 1.6 : 1); const j = cfg.kind === 'classic' ? (k ? 12 : -12) : (rnd() - .5) * 40;
          const ci = cfg.kind === 'classic' ? (Math.round(i / 3) + k) % cols.length : Math.floor(rnd() * cols.length);
          out.push([p[0] + nx / nl * (off + j), p[1] + ny / nl * (off + j), r, ci]); } }
    }
    if (cfg.statement) for (let i = 0; i < cfg.statement; i++) { const p = pts.filter(Boolean)[Math.floor((i + .5) / cfg.statement * pts.filter(Boolean).length)]; out.push([p[0] + 6, p[1] - 4, 44, Math.floor(rnd() * cols.length)]); }
  }
  const leaves = cfg.greenery ? pts.filter((p, i) => p && i % 9 === 0).map(([x, y]) => `<ellipse cx="${(x + (rnd() - .5) * 30).toFixed(0)}" cy="${(y + (rnd() - .5) * 30).toFixed(0)}" rx="13" ry="5" fill="#6f8f6a" transform="rotate(${(rnd() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" opacity=".9"/>`).join('') : '';
  out.sort((m, n) => n[2] - m[2]);
  const balls = out.map(([x, y, r, ci]) => { const chrome = cfg.chrome && rnd() < .18; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${chrome ? 'ch' + pl.uid : ids[ci]})"/>`; }).join('');
  const sh = cfg.kind === 'cluster' || cfg.around === 'floor' ? '' : '';
  return `<defs>${defs}</defs><g class="garland" filter="url(#soft2)">${leaves}${balls}</g>${sh}`;
}

/* ---------- the builder panel ---------- */
function renderBalloon() {
  const box = $('#balloonBox'); if (!box) return; const es = ES(); const lines = bLines();
  if (!lines.find(p => p.uid === ST.bSel)) ST.bSel = lines[0]?.uid;
  const pl = lines.find(p => p.uid === ST.bSel); const cfg = pl ? bCfg(pl) : null;
  const totalB = lines.reduce((s, p) => s + bPrice(bCfg(p)).total, 0);
  const chips = (obj, key, cur) => Object.entries(obj).map(([k, v]) => `<button class="chip" data-b="${key}" data-v="${k}" aria-pressed="${cur === k}" title="${esc(v[2] && typeof v[2] === 'string' && key === 'kind' ? (es ? v[3] : v[2]) : '')}">${esc(bName(v, es))}</button>`).join('');
  box.innerHTML = `<div class="row"><h3 style="margin:0">${es ? 'Diseña tus globos' : 'Design your balloons'}</h3>${lines.length ? `<b>${money(totalB)}</b>` : ''}</div>
    <div class="aibox"><label for="bReq" style="margin:0 0 6px">✦ ${es ? 'Cuéntanos tu idea y la armamos' : 'Tell us your idea and we will build it'}</label>
      <textarea id="bReq" rows="2" placeholder="${es ? 'Ej.: guirnalda alrededor del arco principal con colores de Mario Bros' : 'e.g. a balloon garland around the main arch in Mario Bros colors'}">${esc(ST.balloon.request)}</textarea>
      <div class="row" style="margin-top:8px"><span class="small muted">${es ? 'Puedes ajustar todo abajo. Karol confirma el diseño final.' : 'You can fine-tune everything below. Karol confirms the final design.'}</span><span class="row" style="gap:6px"><button class="btn sm" id="aiPlanBtn">✦ ${es ? 'Armarlo' : 'Build it'}</button>${LIVE && lines.length ? `<button class="btn sm ghost" id="aiRenderBtn">${es ? 'Foto con IA' : 'AI photo'}</button>` : ''}</span></div>
      <div id="aiOut" aria-live="polite">${ST.balloon.plan ? planCard(ST.balloon.plan) : ''}</div></div>
    <div class="blines">${lines.map((p, i) => { const c = bCfg(p); return `<button class="bline" data-bsel="${p.uid}" aria-pressed="${p.uid === ST.bSel}"><span class="dots">${(c.colors.length ? c.colors : ['Blush']).map(swatch).join('')}</span><span>${i + 1}. ${esc(bLabel(c))}</span><b>${money(bPrice(c).total)}</b></button>`; }).join('')}
      <button class="btn sm ghost" id="bAdd">+ ${lines.length ? (es ? 'Agregar otra pieza de globos' : 'Add another balloon piece') : (es ? 'Agregar globos' : 'Add balloons')}</button></div>
    ${cfg ? `<div class="bed">
      <p class="bq">1 · ${es ? 'Estilo' : 'Style'}</p><div class="opts">${chips(B_KINDS, 'kind', cfg.kind)}</div>
      <p class="small muted" style="margin:4px 0 0">${esc(es ? B_KINDS[cfg.kind][3] : B_KINDS[cfg.kind][2])}</p>
      ${cfg.kind === 'cluster' ? `<p class="bq">2 · ${es ? '¿Cuántos racimos?' : 'How many clusters?'}</p><div class="stepper"><button class="chip" data-bn="count" data-d="-1">−</button><b>${cfg.count}</b><button class="chip" data-bn="count" data-d="1">+</button></div>` : cfg.kind === 'column' ? `<p class="bq">2 · ${es ? 'Altura' : 'Height'}</p><div class="row" style="justify-content:flex-start;gap:10px"><input type="range" id="bFt" min="4" max="10" value="${cfg.ft}"><b>${cfg.ft} ft</b></div>` : `
      <p class="bq">2 · ${es ? '¿Alrededor de qué?' : 'Around what?'}</p><div class="opts">${chips(B_AROUND, 'around', cfg.around)}</div>
      ${['window-arch', 'half-arches', 'hoop', 'doorway'].includes(cfg.around) ? `<p class="bq">3 · ${es ? '¿Cuánto cubre?' : 'How much of it?'}</p><div class="opts">${chips(B_COVER, 'cover', cfg.cover)}</div>` : ''}
      <p class="bq">${es ? 'Líneas de globos' : 'Balloon strands'}</p><div class="opts">${[1, 2, 3].map(n => `<button class="chip" data-b="strands" data-v="${n}" aria-pressed="${cfg.strands === n}">${n === 1 ? (es ? 'Una línea' : 'Single line') : n + (es ? ' líneas' : ' lines')}</button>`).join('')}</div>
      <p class="bq">${es ? 'Tamaño' : 'Size'}</p><div class="row" style="justify-content:flex-start;gap:10px;flex-wrap:wrap"><input type="range" id="bFt" min="4" max="40" value="${cfg.ft}"><b>${cfg.ft} ft</b>${cfg.auto ? `<span class="small muted">${es ? 'calculado para la pieza' : 'sized to fit'}</span>` : `<button class="chip" id="bAuto">${es ? 'Ajustar a la pieza' : 'Fit to the piece'}</button>`}</div>`}
      ${(() => { const t = bTarget(cfg); return !t.found && ['window-arch', 'half-arches', 'table', 'backdrop-top'].includes(cfg.around) ? `<p class="small err" style="margin:6px 0 0">${es ? 'Agrega esa pieza al escenario para verlo alrededor.' : 'Add that piece to the stage to see the garland on it.'} <button class="chip" data-addfor="${B_AROUND[cfg.around][2] || 'window-arch'}">${es ? 'Agregar' : 'Add it'}</button></p>` : ''; })()}
      <p class="bq">${es ? 'Colores' : 'Colors'} <span class="small muted">(${es ? `${BR().includedColors} incluidos, extra ${money(BR().extraColor)} c/u` : `${BR().includedColors} included, ${money(BR().extraColor)} each extra`})</span></p>
      <div class="opts" style="align-items:center">${BALLOON_COLORS.map(([en, esn, hex]) => `<button class="sw" data-bcolor="${en}" style="background:${hex}" aria-pressed="${cfg.colors.includes(en)}" title="${es ? esn : en}" aria-label="${es ? esn : en}"></button>`).join('')}</div>
      <p class="small" style="margin:6px 0 0">${cfg.colors.length ? cfg.colors.map(colorName).join(' · ') : `<span class="muted">${es ? 'Elige tus colores.' : 'Pick your colors.'}</span>`}</p>
      <p class="bq">${es ? 'Extras' : 'Extras'}</p><div class="opts">
        ${[['chrome', es ? 'Cromados' : 'Chrome accents'], ['greenery', es ? 'Follaje' : 'Greenery'], ['confetti', es ? 'Confeti' : 'Confetti balloons']].map(([k, l]) => `<button class="chip" data-btog="${k}" aria-pressed="${!!cfg[k]}">${l}</button>`).join('')}
        <span class="stepper"><span class="small">${es ? 'Gigantes' : 'Giant 24-36"'}</span><button class="chip" data-bn="statement" data-d="-1">−</button><b>${cfg.statement}</b><button class="chip" data-bn="statement" data-d="1">+</button></span>
        <span class="stepper"><span class="small">${es ? 'Foil / número' : 'Foil / number'}</span><button class="chip" data-bn="foils" data-d="-1">−</button><b>${cfg.foils}</b><button class="chip" data-bn="foils" data-d="1">+</button></span></div>
      <div class="est"><b>${es ? 'Estimado de esta pieza' : 'Estimate for this piece'}</b>${bPrice(cfg).lines.map(([l, v]) => `<div class="row"><span>${esc(l)}</span><span>${money(v)}</span></div>`).join('')}<div class="row tot"><span>${es ? 'Total globos' : 'Balloon piece total'}</span><b>${money(bPrice(cfg).total)}</b></div>
        <button class="chip" id="bRemove" style="margin-top:8px">${es ? 'Quitar esta pieza' : 'Remove this piece'}</button></div>
    </div>` : `<p class="small muted">${es ? 'Agrega una guirnalda, columna o racimos, o escribe tu idea arriba.' : 'Add a garland, column or clusters, or describe your idea above.'}</p>`}`;
}
function planCard(plan) {
  const es = ES();
  return `<div class="plan"><b>✦ ${plan.theme ? esc(plan.theme) : (es ? 'Tu diseño' : 'Your design')}</b>${plan.message ? `<p class="small" style="margin:4px 0 0">${esc(plan.message)}</p>` : ''}
    ${plan.character ? `<p class="small" style="margin:4px 0 0;color:var(--blushd)">${es ? 'Personajes con licencia: igualamos los colores y el estilo; no se imprimen personajes.' : 'Licensed characters: we match the colors and feel; characters are not printed.'}</p>` : ''}
    ${plan.preview ? `<img src="${esc(plan.preview)}" alt="AI preview" style="width:100%;border-radius:12px;margin-top:8px">` : ''}</div>`;
}

/* ---------- understanding a request (AI first, keywords as backup) ---------- */
const wordIn = (t, w) => new RegExp('(^|[^a-z0-9áéíóúñü])' + w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9áéíóúñü])').test(t);
function keywordPlan(text) {
  const t = text.toLowerCase(); const theme = THEMES.find(x => x.k.some(k => wordIn(t, k)));
  const named = BALLOON_COLORS.filter(([en, es]) => wordIn(t, en) || wordIn(t, es)).map(c => c[0]);
  const colors = (named.length ? named : theme ? theme.colors : ST.colors.length ? ST.colors : ['Blush', 'Cream', 'Chrome gold']).slice(0, 6);
  const around = /(hoop|aro\b|round arch|circle|círculo|circulo)/.test(t) ? 'hoop' : /(door|entrance|entrada|puerta)/.test(t) ? 'doorway' : /(table|mesa)/.test(t) ? 'table' : /(open arch|arcos abiertos|arches)/.test(t) ? 'half-arches' : /(floor|piso|ground)/.test(t) ? 'floor' : /(backdrop|wall|pared|fondo|panel)/.test(t) ? 'backdrop-top' : 'window-arch';
  const kind = /(column|columna|tower|torre)/.test(t) ? 'column' : /(cluster|racimo|bouquet|ramo)/.test(t) ? 'cluster' : /(classic|clásic|clasic|pattern|patrón)/.test(t) ? 'classic' : /(full|luxe|lujo|llena|big|grande)/.test(t) ? 'full' : 'organic';
  const cover = /(around|alrededor|whole|toda|todo|full|completo|entire)/.test(t) ? 'full' : /(corner|esquina|top|arriba)/.test(t) ? 'corner' : /(base|bottom|abajo)/.test(t) ? 'base' : 'half';
  const strands = /(double|doble|two lines|dos líneas|2 lines|2 líneas)/.test(t) ? 2 : /(triple|three lines|tres líneas|3 lines)/.test(t) ? 3 : 1;
  const m = t.match(/(\d{1,2})\s*(ft|feet|foot|pies|pie)/);
  return { source: 'rules', theme: theme ? (ES() ? theme.es : theme.name) : '', character: !!theme?.character, message: theme ? (ES() ? theme.tip_es : theme.tip) : '',
    pieces: [{ kind, around, cover, strands, colors, ft: m ? +m[1] : 0, auto: !m, chrome: /(chrome|cromad|metallic|metálic|gold|dorad)/.test(t) && !named.includes('Chrome gold'), greenery: /(green(ery)?\b|leaves|hojas|follaje|eucal)/.test(t), confetti: /(confetti|confeti)/.test(t), statement: /(giant|gigante|jumbo|big balloon)/.test(t) ? 2 : 0, foils: /(number|número|numero|foil)/.test(t) ? 1 : 0 }] };
}
async function claudeSample() { try { return window.claude?.use ? await window.claude.use('sample') : null; } catch { return null; } }
function aiPrompt(text) {
  const pieces = ST.placements.filter(p => !A(p.id)?.perFt).map(p => A(p.id)?.name).filter(Boolean);
  return `You are the balloon designer for Petit Atelier Events, a party decor rental in Utah. Turn the customer's request into balloon pieces. Reply with JSON only:
{"theme": short theme name or "", "character": true if they mention a licensed character, show, game or brand,
 "message": one or two friendly sentences in ${ST.lang === 'es' ? 'Spanish' : 'English'} describing the design and one easy accent idea (never promise printed licensed characters; we match colors and feel),
 "pieces": [ {"kind": one of ["classic","organic","full","column","cluster"], "around": one of ${JSON.stringify(Object.keys(B_AROUND))}, "cover": one of ["full","half","corner","base"], "strands": 1-3, "ft": length in feet or 0 to size it to the piece automatically, "count": clusters count if kind is cluster, "colors": 2 to 6 names chosen ONLY from ${JSON.stringify(BALLOON_COLORS.map(c => c[0]))} that best match the theme (for a character or game, use its signature colors, for example Mario Bros: Red, Royal blue, Yellow, Green, Brown, White), "chrome": bool, "greenery": bool, "confetti": bool, "statement": 0-4 giant balloons, "foils": 0-3 foil or number balloons } ]}
"main arch" or "the arch" means window-arch. "around" the arch means cover "full". Use one piece unless they ask for several (for example garland plus columns). Pieces already on their stage: ${JSON.stringify(pieces)}.
Customer request: ${JSON.stringify(text)}`;
}
async function aiPlan() {
  const text = ($('#bReq')?.value || ST.balloon.request || '').trim(); ST.balloon.request = text;
  if (!text) { toast(ES() ? 'Escribe tu idea primero' : 'Describe your idea first'); return; }
  $('#aiOut').innerHTML = `<p class="small muted">✦ ${ES() ? 'Diseñando…' : 'Designing…'}</p>`;
  let plan = null;
  try {
    if (LIVE) { const { data, error } = await sb.functions.invoke('ai-balloons', { body: { mode: 'plan', text, lang: ST.lang, pieces: ST.placements.filter(p => !A(p.id)?.perFt).map(p => A(p.id)?.name).filter(Boolean), colors: BALLOON_COLORS.map(c => c[0]) } }); if (!error && data?.pieces) plan = { ...data, source: 'ai' }; }
    else { const sample = await claudeSample(); if (sample) { const r = await sample(aiPrompt(text), { modelTier: 'quick' }); const j = JSON.parse((r.text.match(/\{[\s\S]*\}/) || ['{}'])[0]); if (j.pieces?.length) plan = { ...j, source: 'ai' }; } }
  } catch (err) { console.warn('AI plan failed', err); }
  if (!plan) plan = keywordPlan(text);
  const kp = keywordPlan(text).pieces[0];
  for (const p of bLines().filter(p => p.cfg?.fromAI)) ST.placements = ST.placements.filter(x => x !== p);
  for (const raw of plan.pieces.slice(0, 4)) {
    const c = { ...raw }; if (!B_KINDS[c.kind]) c.kind = 'organic'; if (!B_AROUND[c.around]) c.around = kp.around; if (!B_COVER[c.cover]) c.cover = kp.cover;
    c.colors = (c.colors || []).filter(x => BALLOON_COLORS.some(b => b[0] === x)).slice(0, BR().maxColors); if (!c.colors.length) c.colors = kp.colors;
    c.strands = Math.max(1, Math.min(3, +c.strands || 1)); c.statement = Math.max(0, Math.min(6, +c.statement || 0)); c.foils = Math.max(0, Math.min(4, +c.foils || 0)); c.count = Math.max(1, Math.min(12, +c.count || 3));
    c.ft = Math.max(0, Math.min(40, Math.round(+c.ft || 0))); c.auto = !c.ft; c.fromAI = true;
    bAdd(c, { quiet: true });
  }
  ST.balloon.plan = { theme: plan.theme || '', message: plan.message || '', character: !!plan.character, source: plan.source };
  syncBalloonColors(); saveDraft(); renderAll();
}
/* hook ups from the rest of the site */
function ensureBalloon(ft) { const ins = INSP(ST.balloon.style); return bLines()[0] || bAdd({ colors: (ins?.colors || ST.colors).slice(0, 6), ft: ft || 0, auto: !ft, around: ST.placements.some(p => p.id === 'window-arch') ? 'window-arch' : 'floor' }, { quiet: true }); }
function useInspiration(id) {
  const ins = INSP(id); if (!ins) return; ST.balloon.style = id;
  const pl = bLines()[0]; if (pl) { const c = bCfg(pl); c.colors = ins.colors.slice(0, 6); } else bAdd({ colors: ins.colors.slice(0, 6), around: ST.placements.some(p => p.id === 'window-arch') ? 'window-arch' : 'floor', kind: 'organic' }, { quiet: true });
  syncBalloonColors(); saveDraft(); renderAll(); document.getElementById('studio').scrollIntoView();
}
function bindBalloons() {
  document.addEventListener('click', e => {
    const t = e.target; if (!t.closest('#balloonBox') && !t.closest('[data-addfor]')) return;
    const pl = bLines().find(p => p.uid === ST.bSel); const cfg = pl && bCfg(pl);
    const done = () => { if (cfg?.auto) cfg.ft = bAutoFt(cfg); if (pl) pl.len = cfg.ft; syncBalloonColors(); saveDraft(); renderStage(); renderBalloon(); renderSummary(); renderGrid(); };
    const sel = t.closest('[data-bsel]'); if (sel) { ST.bSel = sel.dataset.bsel; ST.sel = ST.bSel; renderBalloon(); renderStage(); return; }
    if (t.id === 'bAdd') { bAdd({ colors: ST.colors.slice(0, 3), around: ST.placements.some(p => p.id === 'window-arch') ? 'window-arch' : 'floor' }); return; }
    const af = t.closest('[data-addfor]'); if (af) { addPiece(af.dataset.addfor, 500, A(af.dataset.addfor).cat === 'furniture' ? 565 : 472, 1); done(); renderAll(); return; }
    if (!cfg) return;
    const b = t.closest('[data-b]'); if (b) { const k = b.dataset.b, v = b.dataset.v; cfg[k] = k === 'strands' ? +v : v; if (k === 'kind' && v === 'column') { cfg.ft = 6; cfg.auto = false; } else if (k === 'kind' || k === 'around' || k === 'cover') cfg.auto = cfg.kind !== 'column'; done(); return; }
    const c = t.closest('[data-bcolor]'); if (c) { const v = c.dataset.bcolor; cfg.colors = cfg.colors.includes(v) ? cfg.colors.filter(x => x !== v) : cfg.colors.length >= BR().maxColors ? (toast(ES() ? `Máximo ${BR().maxColors} colores` : `Up to ${BR().maxColors} colors`), cfg.colors) : [...cfg.colors, v]; done(); return; }
    const tg = t.closest('[data-btog]'); if (tg) { cfg[tg.dataset.btog] = !cfg[tg.dataset.btog]; done(); return; }
    const n = t.closest('[data-bn]'); if (n) { const k = n.dataset.bn; cfg[k] = Math.max(k === 'count' ? 1 : 0, Math.min(k === 'count' ? 12 : 6, (cfg[k] || 0) + +n.dataset.d)); done(); return; }
    if (t.id === 'bAuto') { cfg.auto = true; done(); return; }
    if (t.id === 'bRemove') { const g = gidOf(pl); ST.placements = ST.placements.filter(p => gidOf(p) !== g); ST.bSel = null; syncBalloonColors(); saveDraft(); renderAll(); return; }
  });
  document.addEventListener('input', e => { if (e.target.id !== 'bFt') return; const pl = bLines().find(p => p.uid === ST.bSel); if (!pl) return; const cfg = bCfg(pl); cfg.ft = +e.target.value; cfg.auto = false; pl.len = cfg.ft; e.target.nextElementSibling.textContent = cfg.ft + ' ft'; renderStage(); renderSummary(); clearTimeout(bindBalloons.t); bindBalloons.t = setTimeout(() => { saveDraft(); renderBalloon(); renderGrid(); }, 400); });
}
