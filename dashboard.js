const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function demoOrders() {
  return readJson('mmePreviousOrders', [
    { date: '2025-12-12', code: '31110052', name: 'Hypersil BDS C18 3μm ID4.6mm*150mm', status: 'Example previous quote', qty: 2 },
    { date: '2025-11-04', code: '31110053', name: 'Hypersil BDS C18 5μm ID4.6mm*250mm', status: 'Example previous quote', qty: 1 }
  ]);
}

function suggestions() {
  return [
    { title: 'Guard columns', text: 'Add a compatible guard column to protect the analytical column inlet.' },
    { title: 'Method review', text: 'Share current mobile phase, flow, detector, and sample type for a safer equivalent recommendation.' },
    { title: 'Reorder list', text: 'Save frequently requested columns for faster repeat quotation.' },
    { title: 'Comparison report', text: 'Compare shortlisted MME columns before sending the quote request.' },
    { title: 'Competitor replacement check', text: 'Paste the competitor part number to verify exact, close, and different specifications.' }
  ];
}

function renderList(host, rows, emptyText, mapper) {
  if (!host) return;
  if (!rows.length) {
    host.innerHTML = `<div class="dashboard-empty">${esc(emptyText)}</div>`;
    return;
  }
  host.innerHTML = rows.map(mapper).join('');
}

async function initDashboard() {
  const catalog = await fetch('data/catalog.json').then((response) => response.json()).catch(() => []);
  const favoriteIds = readJson('mmeColumnFavorites', []);
  const favorites = favoriteIds.map((id) => catalog.find((item) => item.id === id)).filter(Boolean);
  const quote = readJson('mmeQuoteDraft', []);
  const orders = demoOrders();
  const suggestionRows = suggestions();

  $('#dashQuoteCount').textContent = quote.length;
  $('#dashFavoriteCount').textContent = favorites.length;
  $('#dashOrderCount').textContent = orders.length;
  $('#dashSuggestionCount').textContent = suggestionRows.length;

  renderList($('#dashboardQuoteItems'), quote, 'No saved quote items yet. Add products to quote from the catalog.', (item) => `
    <div class="dashboard-list-row"><span>${esc(item.code || 'Quote item')}</span><strong>${esc(item.name || item.product || '')}</strong><em>Qty ${esc(item.qty || 1)}</em></div>`);
  renderList($('#dashboardFavorites'), favorites, 'No favorites saved yet.', (item) => `
    <div class="dashboard-list-row"><span>${esc(item.code)}</span><strong>${esc(item.name)}</strong><em>${esc(item.phase)} · ${esc(item.particle)} µm · ${esc(item.diameter)} x ${esc(item.length)} mm</em></div>`);
  renderList($('#dashboardOrders'), orders, 'No previous orders found.', (item) => `
    <div class="dashboard-list-row"><span>${esc(item.date)}</span><strong>${esc(item.code)} — ${esc(item.name)}</strong><em>${esc(item.status)} · Qty ${esc(item.qty)}</em></div>`);
  renderList($('#dashboardSuggestions'), suggestionRows, 'No suggestions yet.', (item) => `
    <div class="dashboard-list-row"><span>${esc(item.title)}</span><strong>${esc(item.text)}</strong></div>`);

  $('#clearDashboardHistory')?.addEventListener('click', () => {
    localStorage.setItem('mmePreviousOrders', '[]');
    location.reload();
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
