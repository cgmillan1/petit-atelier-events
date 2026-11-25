/* ===== boot ===== */
async function route() {
  if (location.hash === '#admin') { await showAdmin(); }
  else if (document.body.classList.contains('adm')) { hideAdmin(); ST.assets = await DB.assets(); ST.S = await DB.settings(); refreshAvail(); }
}
(async () => {
  try {
    await DB.init();
    ST.assets = await DB.assets(); ST.S = await DB.settings();
    $('#heroDate').min = todayISO(2); $('#heroDate').value = ST.date && ST.date >= todayISO(2) ? ST.date : '';
    if (ST.date && ST.date < todayISO(2)) { ST.date = ''; lset('date', ''); }
    bindSite(); bindBalloons(); bindAdmin();
    await refreshAvail();
    setInterval(() => { if (!window.heroPaused && !document.hidden && !document.body.classList.contains('adm') && !matchMedia('(prefers-reduced-motion: reduce)').matches) { heroLook = (heroLook + 1) % LOOKS.length; renderHero(); } }, 7000);
    window.addEventListener('hashchange', route); route();
  } catch (err) {
    document.body.insertAdjacentHTML('afterbegin', `<p class="err" style="padding:16px">Something went wrong loading the site: ${esc(err.message)}</p>`);
  }
})();
