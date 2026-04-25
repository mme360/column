/* Fix competitor comparison wording: close numeric values are not shown as exact matches. */
(function () {
  function clean(value) {
    return String(value || '').toLowerCase().replace(/[µμ]/g, 'u').replace(/å/g, 'a').replace(/angstroms?|ang\b/g, 'a').replace(/[^a-z0-9.+%*-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function valueNum(value) {
    return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
  }
  function poreValue(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
  function groupPhase(value) {
    const x = clean(value);
    if (['c18', 'ods', 'ods2', 'aq c18'].some((p) => x.includes(p))) return 'C18';
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
  function exact(label, competitor, mme, points) {
    const ok = clean(competitor) === clean(mme);
    return {
      l: label,
      a: competitor || '-',
      b: mme || '-',
      quality: ok ? 'exact' : 'different',
      ok,
      pts: ok ? points : 0,
      note: ok ? 'Exact' : 'Different'
    };
  }
  function numeric(label, competitor, mme, points, closeTolerance, unit) {
    const a = valueNum(competitor);
    const b = valueNum(mme);
    const diff = Math.abs(a - b);
    if (!a || !b) {
      return { l: label, a: competitor || '-', b: mme || '-', quality: 'different', ok: false, pts: 0, note: 'Missing value' };
    }
    if (diff <= 0.01) {
      return { l: label, a: competitor || '-', b: mme || '-', quality: 'exact', ok: true, pts: points, note: 'Exact' };
    }
    if (diff <= closeTolerance) {
      return { l: label, a: competitor || '-', b: mme || '-', quality: 'close', ok: false, pts: Math.round(points * 0.68), note: `Close, Δ ${diff.toFixed(diff < 1 ? 1 : 0)}${unit || ''}` };
    }
    return { l: label, a: competitor || '-', b: mme || '-', quality: 'different', ok: false, pts: Math.max(0, Math.round(points * 0.2)), note: `Different, Δ ${diff.toFixed(diff < 1 ? 1 : 0)}${unit || ''}` };
  }
  function poreMatch(competitor, mme) {
    const a = poreValue(competitor);
    const b = poreValue(mme);
    const diff = Math.abs(a - b);
    if (!a || !b) return { l: 'Pore size', a: competitor || '-', b: mme || '-', quality: 'different', ok: false, pts: 0, note: 'Missing value' };
    if (diff <= 1) return { l: 'Pore size', a: competitor || '-', b: mme || '-', quality: 'exact', ok: true, pts: 12, note: 'Exact' };
    if (diff <= 20) return { l: 'Pore size', a: competitor || '-', b: mme || '-', quality: 'close', ok: false, pts: 8, note: `Close, Δ ${diff}Å` };
    return { l: 'Pore size', a: competitor || '-', b: mme || '-', quality: 'different', ok: false, pts: Math.max(0, 6 - Math.round(diff / 25)), note: `Different, Δ ${diff}Å` };
  }
  window.matchDetails = function matchDetails(competitor, product) {
    const details = [];
    details.push(exact('Phase group', groupPhase(competitor.phase), groupPhase(product.phase), 35));
    details.push(numeric('Particle size', competitor.particle, product.particle, 18, 0.35, 'µm'));
    details.push(poreMatch(competitor.pore, product.pore));
    details.push(numeric('ID', competitor.diameter, product.diameter, 15, 0.25, 'mm'));
    details.push(numeric('Length', competitor.length, product.length, 15, 5, 'mm'));
    const competitorPrep = clean(competitor.mode).includes('prep');
    const mmePrep = clean(product.category).includes('prep');
    const competitorAnalytical = !competitorPrep;
    const mmeAnalytical = clean(product.category).includes('analytical');
    const exactFormat = (competitorPrep && mmePrep) || (competitorAnalytical && mmeAnalytical);
    details.push({
      l: 'Format',
      a: competitor.mode || '-',
      b: product.category || '-',
      quality: exactFormat ? 'exact' : 'different',
      ok: exactFormat,
      pts: exactFormat ? 5 : 0,
      note: exactFormat ? 'Same format class' : 'Different format class'
    });
    return details;
  };
  window.bestEquivalent = function bestEquivalent(competitor) {
    const all = state.catalog.map((product) => {
      const details = window.matchDetails(competitor, product);
      const score = details.reduce((sum, row) => sum + row.pts, 0);
      return { product, p: product, details, score, percent: Math.max(0, Math.min(99, Math.round(score))) };
    }).sort((a, b) => b.score - a.score);
    return all[0];
  };
  window.comparison = function comparison(competitor, best) {
    const exactCount = best.details.filter((row) => row.quality === 'exact').length;
    const closeCount = best.details.filter((row) => row.quality === 'close').length;
    return `<div class="equiv-summary"><span class="match-score">${best.percent}% overall fit</span><strong>Closest MME: ${esc(best.p.code)} - ${esc(best.p.name)}</strong><button class="button ghost" onclick="addToCartById('${best.p.id}')">Add MME column to quote</button></div><table class="product-table compare-equivalent"><thead><tr><th>Specification</th><th>${esc(competitor.brand)} column</th><th>MME equivalent</th><th>Result</th></tr></thead><tbody>${best.details.map((row) => `<tr class="spec-${row.quality}"><td>${esc(row.l)}</td><td>${esc(row.a)}</td><td>${esc(row.b)}</td><td>${esc(row.note)}</td></tr>`).join('')}</tbody></table><p class="equiv-why">Why: ${exactCount} exact specification match(es), ${closeCount} close specification match(es). “Close” means commercially similar, not identical. Equivalent suggestions are suitable starting points and require method validation.</p>`;
  };
})();
