const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
const quoteKey = 'mmeQuoteDraft';
const replacementRecordKey = 'mmeReplacementRecords';

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function demoOrders() {
  return readJson('mmePreviousOrders', [
    { date: '2025-12-12', code: '31110052', name: 'Hypersil BDS C18 3μm ID4.6mm*150mm', status: 'Example previous quote', qty: 2, application: 'Routine QC / C18 method' },
    { date: '2025-11-04', code: '31110053', name: 'Hypersil BDS C18 5μm ID4.6mm*250mm', status: 'Example previous quote', qty: 1, application: 'Longer routine HPLC method' }
  ]);
}
function suggestions(orders, favorites, quote, replacements) {
  const all = [...orders, ...favorites, ...quote, ...replacements.map((row) => row.equivalent || {})];
  const hasC18 = all.some((item) => /c18|ods/i.test(`${item.name || ''} ${item.phase || ''}`));
  const hasAnalytical = all.some((item) => /4\.6|2\.1|analytical/i.test(`${item.name || ''} ${item.diameter || ''}`));
  const rows = [
    { title: 'Guard columns', text: 'Add a compatible guard column to protect the analytical column inlet.', action: 'Search guards', href: 'index.html#catalog' },
    { title: 'Method review', text: 'Share current mobile phase, flow, detector, sample type, and competitor column for safer recommendations.', action: 'Find equivalent', href: 'replacement.html' },
    { title: 'Comparison report', text: 'Shortlist 2–4 columns and compare particle, pore, ID, length, and phase before sending the quote.', action: 'Open catalog', href: 'index.html#catalog' }
  ];
  if (replacements.length) rows.unshift({ title: 'Saved replacement records', text: 'Review original competitor columns and the selected MME equivalents before sending a quotation request.', action: 'Open replacement', href: 'replacement.html' });
  if (hasC18) rows.push({ title: 'Alternative selectivity', text: 'Consider C8, AQ-C18, Phenyl, PFP, or HILIC if C18 does not resolve your analytes.', action: 'Search alternatives', href: 'index.html#catalog' });
  if (hasAnalytical) rows.push({ title: 'Prep scale-up', text: 'For purification, review preparative IDs and matching guard/prep guard columns.', action: 'Search prep', href: 'index.html#catalog' });
  return rows;
}
function renderList(host, rows, emptyText, mapper) {
  if (!host) return;
  if (!rows.length) {
    host.innerHTML = `<div class="dashboard-empty">${esc(emptyText)}</div>`;
    return;
  }
  host.innerHTML = rows.map(mapper).join('');
}
function saveQuoteItemQty(id, qty) {
  const quote = readJson(quoteKey, []);
  const item = quote.find((row) => row.id === id);
  if (item) item.qty = Math.max(1, Number(qty) || 1);
  writeJson(quoteKey, quote);
  initDashboard();
}
function removeQuoteItem(id) {
  writeJson(quoteKey, readJson(quoteKey, []).filter((item) => item.id !== id));
  initDashboard();
}
function removeFavorite(id) {
  writeJson('mmeColumnFavorites', readJson('mmeColumnFavorites', []).filter((itemId) => itemId !== id));
  initDashboard();
}
function removeReplacementRecord(id) {
  writeJson(replacementRecordKey, readJson(replacementRecordKey, []).filter((item) => item.id !== id));
  initDashboard();
}
function quoteReplacementEquivalent(id) {
  const record = readJson(replacementRecordKey, []).find((item) => item.id === id);
  if (!record?.equivalent) return;
  const quote = readJson(quoteKey, []);
  const existing = quote.find((item) => item.id === record.equivalent.id);
  if (existing) existing.qty = Number(existing.qty || 1) + 1;
  else quote.push({ ...record.equivalent, qty: 1, addedAt: new Date().toISOString(), sourceReplacementRecordId: id });
  writeJson(quoteKey, quote);
  initDashboard();
}
function reorderItem(order) {
  const quote = readJson(quoteKey, []);
  quote.push({ id: `reorder-${Date.now()}`, code: order.code, name: order.name, qty: order.qty || 1, addedAt: new Date().toISOString() });
  writeJson(quoteKey, quote);
  initDashboard();
}
function exportDashboardSummary(quote, favorites, orders, replacements) {
  const lines = ['MME dashboard summary', '', 'Quote items:'];
  quote.forEach((item, i) => lines.push(`${i + 1}. ${item.code || ''} | ${item.name || ''} | Qty ${item.qty || 1}`));
  lines.push('', 'Favorites:');
  favorites.forEach((item, i) => lines.push(`${i + 1}. ${item.code || ''} | ${item.name || ''}`));
  lines.push('', 'Replacement records:');
  replacements.forEach((item, i) => lines.push(`${i + 1}. Original: ${item.original?.brand || ''} ${item.original?.partNumber || ''} ${item.original?.name || ''} -> MME: ${item.equivalent?.code || ''} ${item.equivalent?.name || ''} | Fit ${item.percent || 0}%`));
  lines.push('', 'Previous orders:');
  orders.forEach((item, i) => lines.push(`${i + 1}. ${item.date || ''} | ${item.code || ''} | ${item.name || ''} | Qty ${item.qty || 1}`));
  navigator.clipboard?.writeText(lines.join('\n'));
  alert('Dashboard summary copied.');
}
function renderReplacementRecord(record) {
  const original = record.original || {};
  const equivalent = record.equivalent || {};
  const detailSummary = (record.details || []).filter((row) => row.quality === 'exact' || row.quality === 'close').slice(0, 4).map((row) => `${row.label}: ${row.result}`).join(' · ');
  return `
    <div class="dashboard-list-row replacement-record-row">
      <div>
        <span>${esc(new Date(record.savedAt).toLocaleDateString())} · ${esc(record.percent || 0)}% overall fit</span>
        <strong>Original: ${esc(original.brand || '')} ${esc(original.partNumber || '')} — ${esc(original.name || original.family || '')}</strong>
        <em>${esc(original.phase || '-')} · ${esc(original.particle || '-')} µm · ${esc(original.pore || '-')} · ${esc(original.diameter || '-')} x ${esc(original.length || '-')} mm</em>
        <strong>MME equivalent: ${esc(equivalent.code || '')} — ${esc(equivalent.name || '')}</strong>
        <em>${esc(equivalent.phase || '-')} · ${esc(equivalent.particle || '-')} µm · ${esc(equivalent.pore || '-')} · ${esc(equivalent.diameter || '-')} x ${esc(equivalent.length || '-')} mm</em>
        <em>${esc(detailSummary)}</em>
      </div>
      <div>
        <button class="button ghost" onclick="quoteReplacementEquivalent('${esc(record.id)}')">Add equivalent to quote</button>
        <button class="button ghost" onclick="removeReplacementRecord('${esc(record.id)}')">Remove</button>
      </div>
    </div>`;
}
async function initDashboard() {
  const catalog = await fetch('data/catalog.json').then((response) => response.json()).catch(() => []);
  const favoriteIds = readJson('mmeColumnFavorites', []);
  const favorites = favoriteIds.map((id) => catalog.find((item) => item.id === id)).filter(Boolean);
  const quote = readJson(quoteKey, []);
  const orders = demoOrders();
  const replacements = readJson(replacementRecordKey, []);
  const suggestionRows = suggestions(orders, favorites, quote, replacements);
  $('#dashQuoteCount').textContent = quote.length;
  $('#dashFavoriteCount').textContent = favorites.length;
  $('#dashOrderCount').textContent = orders.length;
  $('#dashSuggestionCount').textContent = suggestionRows.length;
  if ($('#dashReplacementCount')) $('#dashReplacementCount').textContent = replacements.length;
  renderList($('#dashboardQuoteItems'), quote, 'No saved quote items yet. Add products to quote from the catalog or replacement page.', (item) => `
    <div class="dashboard-list-row dashboard-row-actions"><div><span>${esc(item.code || 'Quote item')}</span><strong>${esc(item.name || item.product || '')}</strong><em>${esc(item.phase || '')} ${esc(item.particle || '')}${item.particle ? ' µm' : ''}</em></div><div><label>Qty <input type="number" min="1" value="${esc(item.qty || 1)}" onchange="saveQuoteItemQty('${esc(item.id)}', this.value)"></label><button class="button ghost" onclick="removeQuoteItem('${esc(item.id)}')">Remove</button></div></div>`);
  renderList($('#dashboardReplacements'), replacements, 'No replacement records saved yet. Use the Replacement page to save the original competitor column and selected MME equivalent.', renderReplacementRecord);
  renderList($('#dashboardFavorites'), favorites, 'No favorites saved yet.', (item) => `
    <div class="dashboard-list-row dashboard-row-actions"><div><span>${esc(item.code)}</span><strong>${esc(item.name)}</strong><em>${esc(item.phase)} · ${esc(item.particle)} µm · ${esc(item.diameter)} x ${esc(item.length)} mm</em></div><div><a class="button ghost" href="index.html#catalog">Open catalog</a><button class="button ghost" onclick="removeFavorite('${esc(item.id)}')">Remove</button></div></div>`);
  renderList($('#dashboardOrders'), orders, 'No previous orders found.', (item) => `
    <div class="dashboard-list-row dashboard-row-actions"><div><span>${esc(item.date)}</span><strong>${esc(item.code)} — ${esc(item.name)}</strong><em>${esc(item.status)} · Qty ${esc(item.qty)} · ${esc(item.application || '')}</em></div><div><button class="button ghost" onclick='reorderItem(${JSON.stringify(item).replace(/'/g, '&apos;')})'>Reorder</button></div></div>`);
  renderList($('#dashboardSuggestions'), suggestionRows, 'No suggestions yet.', (item) => `
    <div class="dashboard-list-row dashboard-row-actions"><div><span>${esc(item.title)}</span><strong>${esc(item.text)}</strong></div><div><a class="button ghost" href="${esc(item.href)}">${esc(item.action)}</a></div></div>`);
  $('#clearDashboardHistory')?.addEventListener('click', () => { localStorage.setItem('mmePreviousOrders', '[]'); location.reload(); });
  $('#exportDashboard')?.addEventListener('click', () => exportDashboardSummary(quote, favorites, orders, replacements));
}
window.saveQuoteItemQty = saveQuoteItemQty;
window.removeQuoteItem = removeQuoteItem;
window.removeFavorite = removeFavorite;
window.removeReplacementRecord = removeReplacementRecord;
window.quoteReplacementEquivalent = quoteReplacementEquivalent;
window.reorderItem = reorderItem;
document.addEventListener('DOMContentLoaded', initDashboard);
