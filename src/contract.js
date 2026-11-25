/* ===== Rental agreement generated from the booking ===== */
function money(n) { return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
function fmtDate(iso, lang) { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }

function contractHTML(b, S, assets) {
  const t = b.totals; const care = b.protection === 'care';
  const rows = b.items.map(it => { const a = assets.find(x => x.id === it.id) || {}; return `<tr><td>${esc(it.name)}</td><td class="n">${it.qty}</td><td class="n">${money(it.price)}</td><td class="n">${a.made ? 'Made to order' : money(a.repl || 0)}</td></tr>`; }).join('');
  return `<div class="contract">
  <h3>Petit Atelier Events: Decor Rental Agreement</h3>
  <p class="muted">Agreement ${esc(S.contractVersion)} · Reservation ${esc(b.code)}</p>
  <p>This agreement is between <b>Petit Atelier Events</b> (Eagle Mountain, Utah, "Petit Atelier") and <b>${esc(b.customer.name || 'the Client')}</b> ("Client") for the decor rental for an event on <b>${esc(fmtDate(b.event.date))}</b>.</p>
  <h4>1. Reservation and payment</h4>
  <p>Submitting this form is a request. The date is held once Petit Atelier confirms availability and receives the non-refundable retainer of ${S.depositPct}% (${money(t.retainer)}), which is applied to the total of ${money(t.total)}. The remaining balance is due 7 days before the event. Requests not confirmed within 48 hours release their hold.</p>
  <h4>2. Pickup, return and installation</h4>
  ${b.event.fulfillment === 'install'
    ? `<p><b>Client added installation (${money(S.installFee)}).</b> Petit Atelier delivers, sets up and takes down the decor at ${esc(b.event.address)}, arriving before the event start time and returning for teardown at a time agreed in advance. Client gives clear access, a flat surface and permission from the venue or HOA where needed. Installed pieces should not be moved by guests.</p>`
    : `<p><b>Client picks up and returns the decor.</b> Pickup: ${esc(b.event.pickupSlot || S.pickupSlots[0])} at ${esc(S.pickupPlace)}. Return: ${esc(b.event.returnSlot || S.returnSlot)}, at the same place. Balloon pieces are built and ready at pickup. Client brings a vehicle large enough for the order (an SUV or van for garlands and arches) and is responsible for loading, transport, setup and the pieces' care until they are returned. Client and Petit Atelier check the pieces together at pickup and at return.</p>`}
  <p>Pieces returned late are charged ${money(S.lateFee)} per day. Installation can be added for ${money(S.installFee)} up to 7 days before the event, subject to Petit Atelier's schedule.</p>
  <h4>3. Care of the decor</h4>
  <p>No tape, nails, glitter, paint, confetti cannons or open flame on or near any piece. Keep fabric backdrops away from food, drinks, sprinklers and rain. Take outdoor pieces down if wind or rain could damage the decor or harm guests.</p>
  <h4>4. Damage, loss and protection</h4>
  ${care
    ? `<p><b>Client chose the Petit Care Plan (${money(S.carePlan)}, non-refundable).</b> It covers accidental damage during normal use up to ${money(S.carePlanCap)} in combined replacement value. It does not cover loss or theft, intentional damage, damage from the misuse described in section 3, or pieces left outdoors against Petit Atelier's advice. Damage the plan does not cover is billed at the replacement value in Exhibit A.</p>`
    : `<p><b>Client declined the Care Plan.</b> A refundable security deposit of ${money(S.securityDeposit)} is due with the balance and is returned within 7 days after pickup and inspection. Client is responsible for the full replacement value in Exhibit A for any piece that is damaged, stained beyond normal cleaning, lost or stolen. Charges above the deposit are due within 14 days of the invoice.</p>`}
  <p>Petit Atelier inspects and photographs every piece when it leaves and when it comes back. Normal wear (light scuffs, a loose sequin) is never charged.</p>
  <h4>5. Balloons</h4>
  <p>Balloons are made of natural latex and are made fresh for each event. Heat, direct sun and cold cause oxidation and popping, which is not a defect and is not refunded. Balloons and their pieces are a choking hazard: keep away from children under 8. Tell Petit Atelier about any latex allergy before the event.</p>
  <h4>6. Changes and cancellations</h4>
  <p>Pieces can be added up to 7 days before the event, subject to availability. One date change is free with 14 or more days' notice, subject to availability. Cancellation 30 or more days before the event turns the retainer into a credit usable within 12 months. Cancellation within 30 days forfeits the retainer; within 7 days the full balance is due. If Petit Atelier must cancel, all payments are refunded in full.</p>
  <h4>7. Liability</h4>
  <p>Client is responsible for guests' conduct around the decor and, when picking up, for setting the pieces up safely. Petit Atelier is not responsible for injury or damage caused by transport, setup by Client, misuse of the decor or moving installed pieces. Petit Atelier's liability is limited to the amount paid under this agreement.</p>
  <h4>8. Photos</h4>
  <p>Petit Atelier may share photos of the setup (not of guests) on its website and Instagram unless Client opts out below.</p>
  <h4>9. Electronic signature</h4>
  <p>Typing a name and drawing a signature below has the same effect as a handwritten signature. This agreement is governed by the laws of the State of Utah.</p>
  <h4>Exhibit A: pieces and replacement values</h4>
  <table class="ctable"><thead><tr><th>Piece</th><th class="n">Qty</th><th class="n">Rental</th><th class="n">Replacement</th></tr></thead><tbody>${rows}</tbody></table>
  ${b.balloonColors?.length ? `<p>Balloon colors: ${esc(b.balloonColors.join(', '))}. Balloon shades can vary slightly by batch.${(b.balloon?.pieces || []).length ? ` Balloon pieces: ${esc(b.balloon.pieces.map(p => p.label + (p.strands > 1 ? `, ${p.strands} strands` : '') + ', ' + (p.colors || []).join('/')).join('; '))}. Balloon prices are estimates based on the options chosen; Petit Atelier confirms the final price in writing before the retainer is due.` : ''}${b.balloon?.request ? ` Customer's balloon idea: “${esc(b.balloon.request)}”. Petit Atelier confirms the final balloon design in writing before the event; licensed characters are matched by color only and are not printed.` : ''}</p>` : ''}
  <table class="ctable totals"><tbody>
    <tr><td>Rental subtotal</td><td class="n">${money(t.subtotal)}</td></tr>
    ${t.discount ? `<tr><td>Package savings</td><td class="n">-${money(t.discount)}</td></tr>` : ''}
    <tr><td>${b.event.fulfillment === 'install' ? 'Installation (delivery, setup, teardown)' : 'Pickup and return by Client'}</td><td class="n">${t.install ? money(t.install) : 'Free'}</td></tr>
    <tr><td>${care ? 'Petit Care Plan' : 'Security deposit (refundable, not in total)'}</td><td class="n">${care ? money(t.care) : money(t.securityDeposit)}</td></tr>
    <tr class="grand"><td>Total</td><td class="n">${money(t.total)}</td></tr>
    <tr><td>Retainer to hold the date (${S.depositPct}%)</td><td class="n">${money(t.retainer)}</td></tr>
  </tbody></table>
  ${b.contract?.signed_at ? `<div class="signed"><div>${/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.contract.signature || '') ? `<img src="${b.contract.signature}" alt="Signature">` : ''}<p><b>${esc(b.contract.name)}</b><br>Signed electronically ${esc(new Date(b.contract.signed_at).toLocaleString('en-US'))}${b.contract.photoOptOut ? '<br>Opted out of setup photos' : ''}</p></div></div>` : ''}
  </div>`;
}
