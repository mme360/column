const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
const norm = (value) => String(value || '').toLowerCase().replace(/[µμ]/g, 'u').replace(/å/g, 'a').replace(/angstroms?|ang\b/g, 'a').replace(/[^a-z0-9.+%*-]+/g, ' ').replace(/\s+/g, ' ').trim();
const num = (value) => Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
const poreNum = (value) => {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
};
const quoteKey = 'mmeQuoteDraft';
let catalog = [];
let competitors = [];

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function phaseGroup(value) {
  const x = norm(value);
  if (['c18', 'ods', 'ods2', 'aq c18'].some((phase) => x.includes(phase))) return 'C18';
  if (x.includes('c8')) return 'C8';
  if (x.includes('phenyl')) return 'Phenyl';
  if (x.includes('pfp')) return 'PFP';
  if (x.includes('biphenyl')) return 'Biphenyl';
  if (x.includes('hilic')) return 'HILIC';
  if (x.includes('amide')) return 'Amide';
  if (x.includes('nh2') || x.includes('amino')) return 'NH2';
  if (x.includes('cn') || x.includes('cyano')) return 'CN';
  if (x.includes('sec')) return 'SEC';
  return value || '';
}
function competitorText(column) {
  return norm(`${column.brand} ${column.family} ${column.name} ${column.partNumber || ''} ${(column.aliases || []).join(' ')} ${column.phase} ${column.particle} ${column.pore} ${column.diameter} ${column.length} ${column.mode}`);
}
function exact(label, competitor, mme, points) {
  const ok = norm(competitor) === norm(mme);
  return { label, competitor: competitor || '-', mme: mme || '-', quality: ok ? 'exact' : 'different', points: ok ? points : 0, result: ok ? 'Exact' : 'Different' };
}
function numeric(label, competitor, mme, points, closeTolerance, unit) {
  const a = num(competitor), b = num(mme), diff = Math.abs(a - b);
  if (!a || !b) return { label, competitor: competitor || '-', mme: mme || '-', quality: 'different', points: 0, result: 'Missing value' };
  if (diff <= 0.01) return { label, competitor: competitor || '-', mme: mme || '-', quality: 'exact', points, result: 'Exact' };
  if (diff <= closeTolerance) return { label, competitor: competitor || '-', mme: mme || '-', quality: 'close', points: Math.round(points * 0.68), result: `Close, Δ ${diff.toFixed(diff < 1 ? 1 : 0)}${unit}` };
  return { label, competitor: competitor || '-', mme: mme || '-', quality: 'different', points: Math.max(0, Math.round(points * 0.2)), result: `Different, Δ ${diff.toFixed(diff < 1 ? 1 : 0)}${unit}` };
}
function poreMatch(competitor, mme) {
  const a = poreNum(competitor), b = poreNum(mme), diff = Math.abs(a - b);
  if (!a || !b) return { label: 'Pore size', competitor: competitor || '-', mme: mme || '-', quality: 'different', points: 0, result: 'Missing value' };
  if (diff <= 1) return { label: 'Pore size', competitor: competitor || '-', mme: mme || '-', quality: 'exact', points: 12, result: 'Exact' };
  if (diff <= 20) return { label: 'Pore size', competitor: competitor || '-', mme: mme || '-', quality: 'close', points: 8, result: `Close, Δ ${diff}Å` };
  return { label: 'Pore size', competitor: competitor || '-', mme: mme || '-', quality: 'different', points: Math.max(0, 6 - Math.round(diff / 25)), result: `Different, Δ ${diff}Å` };
}
function matchDetails(competitor, product) {
  const rows = [];
  rows.push(exact('Phase group', phaseGroup(competitor.phase), phaseGroup(product.phase), 35));
  rows.push(numeric('Particle size', competitor.particle, product.particle, 18, 0.35, 'µm'));
  rows.push(poreMatch(competitor.pore, product.pore));
  rows.push(numeric('ID', competitor.diameter, product.diameter, 15, 0.25, 'mm'));
  rows.push(numeric('Length', competitor.length, product.length, 15, 5, 'mm'));
  const competitorPrep = norm(competitor.mode).includes('prep');
  const productPrep = norm(product.category).includes('prep');
  const productAnalytical = norm(product.category).includes('analytical');
  const sameFormat = (competitorPrep && productPrep) || (!competitorPrep && productAnalytical);
  rows.push({ label: 'Format', competitor: competitor.mode || '-', mme: product.category || '-', quality: sameFormat ? 'exact' : 'different', points: sameFormat ? 5 : 0, result: sameFormat ? 'Same format class' : 'Different format class' });
  return rows;
}
function bestEquivalent(competitor) {
  return catalog.map((product) => {
    const details = matchDetails(competitor, product);
    const score = details.reduce((sum, row) => sum + row.points, 0);
    return { product, details, score, percent: Math.max(0, Math.min(99, Math.round(score))) };
  }).sort((a, b) => b.score - a.score)[0];
}
function addToQuote(product) {
  const quote = readJson(quoteKey, []);
  const existing = quote.find((item) => item.id === product.id);
  if (existing) existing.qty = Number(existing.qty || 1) + 1;
  else quote.push({ id: product.id, code: product.code, name: product.name, phase: product.phase, particle: product.particle, pore: product.pore, diameter: product.diameter, length: product.length, qty: 1, addedAt: new Date().toISOString() });
  writeJson(quoteKey, quote);
  alert('Added to quote. Open Dashboard to review saved quote items.');
}
window.addReplacementToQuote = function addReplacementToQuote(id) {
  const product = catalog.find((item) => item.id === id);
  if (product) addToQuote(product);
};
function renderComparison(competitor, best) {
  const exactCount = best.details.filter((row) => row.quality === 'exact').length;
  const closeCount = best.details.filter((row) => row.quality === 'close').length;
  return `
    <div class="equiv-summary">
      <span class="match-score">${best.percent}% overall fit</span>
      <strong>Closest MME: ${esc(best.product.code)} - ${esc(best.product.name)}</strong>
      <button class="button ghost" type="button" onclick="addReplacementToQuote('${best.product.id}')">Add MME column to quote</button>
    </div>
    <table class="product-table compare-equivalent">
      <thead><tr><th>Specification</th><th>${esc(competitor.brand)} column</th><th>MME equivalent</th><th>Result</th></tr></thead>
      <tbody>${best.details.map((row) => `<tr class="spec-${row.quality}"><td>${esc(row.label)}</td><td>${esc(row.competitor)}</td><td>${esc(row.mme)}</td><td>${esc(row.result)}</td></tr>`).join('')}</tbody>
    </table>
    <p class="equiv-why">Why: ${exactCount} exact specification match(es), ${closeCount} close specification match(es). Close means commercially similar, not identical. Use this as a starting point and validate your method.</p>`;
}
function renderResults(query) {
  const host = $('#replacementResults');
  if (!host) return;
  const terms = norm(query).split(' ').filter(Boolean);
  if (!terms.length) {
    host.innerHTML = '<div class="dashboard-empty">Paste a competitor part number or build a specification search.</div>';
    return;
  }
  const matches = competitors.map((column) => ({
    column,
    score: terms.reduce((sum, term) => sum + (competitorText(column).includes(term) ? 1 : 0), 0)
  })).filter((row) => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
  if (!matches.length) {
    host.innerHTML = '<div class="dashboard-empty">No competitor match found yet. Try brand + phase + dimensions, or use the builder.</div>';
    return;
  }
  host.innerHTML = matches.map(({ column }) => {
    const best = bestEquivalent(column);
    return `<div class="replacement-card">
      <div class="competitor-match">
        <h4>${esc(column.brand)} ${esc(column.name || column.family)}</h4>
        <p class="code">${esc(column.partNumber || '')} · ${esc(column.phase)} · ${esc(column.particle)} µm · ${esc(column.pore || '-')} · ${esc(column.diameter)} x ${esc(column.length)} mm</p>
        <p>${esc(column.notes || '')}</p>
        <small>${esc(column.source || '')}</small>
      </div>
      <div class="mme-match">${renderComparison(column, best)}</div>
    </div>`;
  }).join('');
}
async function initReplacement() {
  catalog = await fetch('data/catalog.json').then((response) => response.json()).catch(() => []);
  const seed = await fetch('data/competitor-columns.json').then((response) => response.json()).catch(() => []);
  competitors = [...(window.VERIFIED_COMPETITOR_ROWS || []), ...seed];
  $('#replacementStats').innerHTML = `
    <div><span>MME products</span><strong>${catalog.length.toLocaleString()}</strong></div>
    <div><span>Competitor records</span><strong>${competitors.length.toLocaleString()}</strong></div>
    <div><span>Result quality</span><strong>Exact / Close / Different</strong></div>`;
  const input = $('#replacementInput');
  input?.addEventListener('input', () => renderResults(input.value));
  $('#buildReplacementQuery')?.addEventListener('click', () => {
    const parts = ['builderBrand', 'builderPhase', 'builderParticle', 'builderPore', 'builderId', 'builderLength'].map((id) => document.getElementById(id)?.value).filter(Boolean);
    if (input) {
      input.value = parts.join(' ');
      renderResults(input.value);
    }
  });
  document.querySelectorAll('[data-example-query]').forEach((button) => button.addEventListener('click', () => {
    if (input) {
      input.value = button.dataset.exampleQuery;
      renderResults(input.value);
      input.focus();
    }
  }));
  renderResults('');
}
document.addEventListener('DOMContentLoaded', initReplacement);
