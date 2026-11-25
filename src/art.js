/* ===== Shared helpers. Every piece on the site is a real photo of Karol's inventory. ===== */
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const SVG_DEFS = `<defs>
  <filter id="soft2" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#3a2a2a" flood-opacity=".28"/></filter>
  <linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".05"/></linearGradient>
  <linearGradient id="floorg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".10"/><stop offset=".25" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>
  <radialGradient id="spot" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;
/* Balloon colors Karol works with (up to 3 per garland) */
const BALLOON_COLORS = [
  ['White', 'Blanco', '#ffffff'], ['Cream', 'Crema', '#f4ead7'], ['Blush', 'Rosa palo', '#f3c9cf'], ['Pastel pink', 'Rosa pastel', '#f7b8c8'],
  ['Hot pink', 'Fucsia', '#e0428a'], ['Lilac', 'Lila', '#c8b1e4'], ['Lavender', 'Lavanda', '#a993d6'], ['Baby blue', 'Azul bebé', '#b9d8ec'],
  ['Dusty blue', 'Azul empolvado', '#8fb3c3'], ['Teal', 'Verde azulado', '#2f6b73'], ['Sage', 'Salvia', '#a9b99a'], ['Eucalyptus', 'Eucalipto', '#7d9a86'],
  ['Peach', 'Durazno', '#f6c3a3'], ['Terracotta', 'Terracota', '#c4704f'], ['Chrome gold', 'Dorado cromado', '#c9a85c'], ['Chrome silver', 'Plateado cromado', '#c3c6cb'],
  ['Black', 'Negro', '#1f1d1c'], ['Clear', 'Transparente', '#eef3f6'], ['Red', 'Rojo', '#c8262f'], ['Yellow', 'Amarillo', '#f3cf3a'],
  ['Orange', 'Naranja', '#ee8a2e'], ['Navy', 'Azul marino', '#24345c'], ['Royal blue', 'Azul rey', '#1f3fb8'], ['Green', 'Verde', '#1f9a4a'], ['Lime', 'Verde limón', '#9ccc3c'], ['Purple', 'Morado', '#6a3fa0'], ['Brown', 'Café', '#7a4a2a'], ['Rose gold', 'Oro rosa', '#d9a08f'],
];
