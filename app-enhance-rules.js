/* Adds family-level matching support for PDF-derived column application rules. Loaded after app-final.js and before DOMContentLoaded fires. */
(function () {
  function clean(value) {
    return String(value || '').toLowerCase().replace(/[µμ]/g, 'u').replace(/å/g, 'a').replace(/angstroms?/g, 'a').replace(/[^a-z0-9.+%*-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function num(value) {
    return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
  }
  function poreNum(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
  function includesAny(haystack, needles) {
    if (!needles || !needles.length) return true;
    const h = clean(haystack);
    return needles.some((needle) => h.includes(clean(needle)));
  }
  window.ruleMatches = function ruleMatches(product, rule) {
    const match = rule.match || {};
    const same = (field, values) => !values || !values.length || values.includes(product[field]);
    if (!same('category', match.category)) return false;
    if (!same('packing', match.packing)) return false;
    if (!same('phase', match.phase)) return false;
    if (!same('particle', match.particle)) return false;
    if (!same('diameter', match.diameter)) return false;
    if (!same('length', match.length)) return false;
    if (match.particleMax && num(product.particle) > match.particleMax) return false;
    if (match.particleMin && num(product.particle) < match.particleMin) return false;
    if (match.diameterMin && num(product.diameter) < match.diameterMin) return false;
    if (match.diameterMax && num(product.diameter) > match.diameterMax) return false;
    if (match.poreMin && poreNum(product.pore) < match.poreMin) return false;
    if (match.poreMax && poreNum(product.pore) > match.poreMax) return false;
    if (!includesAny(product.category, match.categoryContains)) return false;
    if (!includesAny(product.packing, match.packingContains)) return false;
    if (!includesAny(product.phase, match.phaseContains)) return false;
    if (!includesAny(product.name, match.nameContains)) return false;
    if (!includesAny(`${product.name} ${product.packing} ${product.phase} ${product.search || ''}`, match.anyContains)) return false;
    return true;
  };
})();
