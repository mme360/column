const state = {
  catalog: [],
  competitors: [],
  scored: [],
  filtered: [],
  cart: new Map(),
  favorites: new Map(),
  compare: new Map(),
  view: "cards",
  page: 1,
  pageSize: 50,
  tableFilters: {},
  expandedGroups: new Set(),
  wizard: {},
};

const fields = ["category", "packing", "phase", "particle", "pore", "diameter", "length"];
const filterIds = {
  category: "categoryFilter",
  packing: "packingFilter",
  phase: "phaseFilter",
  particle: "particleFilter",
  pore: "poreFilter",
  diameter: "diameterFilter",
  length: "lengthFilter",
};
const tableFields = ["name", "code", "category", "packing", "phase", "particle", "pore", "diameter", "length"];
const quoteEmail = "sales@almurtaja.com";
const quoteWhatsapp = "962000000000";
const $ = (selector) => document.querySelector(selector);

const wizardQuestions = [
  {
    key: "mode",
    title: "What type of separation do you need?",
    choices: [
      { label: "General reverse phase", help: "Small molecules, acids, bases, neutral compounds.", rules: { phase: ["C18", "C8", "ODS", "ODS2", "AQ-C18"] }, query: "reverse phase C18 C8" },
      { label: "Highly aqueous / polar retention", help: "Methods with high water and polar compounds.", rules: { phase: ["AQ-C18"] }, query: "aqueous polar AQ-C18" },
      { label: "Aromatics / halogenated", help: "Extra pi-pi or shape selectivity.", rules: { phase: ["Phenyl", "PFP", "Biphenyl", "Phenyl-Hexyl"] }, query: "phenyl PFP biphenyl aromatic" },
      { label: "Very polar / HILIC", help: "Amino, amide, diol, silica, cyano and HILIC work.", rules: { phase: ["HILIC", "Amide", "Diol", "NH2", "NH2-S", "CN", "SiO2", "Si60"] }, query: "HILIC amide diol amino polar" },
      { label: "Ionic analytes", help: "Anion/cation exchange mode.", rules: { phase: ["SAX", "SCX", "WAX", "WCX"] }, query: "ion exchange SAX SCX WAX WCX" },
      { label: "Sugars / carbohydrates", help: "Carbohydrate and sugar methods.", rules: { phase: ["Sugar", "NH2", "NH2-S"] }, query: "sugar carbohydrate" },
      { label: "Proteins / peptides / polymers", help: "Large molecule work; usually wide-pore or SEC/HIC/C4.", rules: { phase: ["C4", "SEC", "HIC", "Protein A", "Amide", "HILIC"], pore: ["300Å", "500Å", "1000Å", "2000Å"] }, query: "protein peptide SEC C4 300A" },
    ],
  },
  {
    key: "format",
    title: "Which column format is needed?",
    choices: [
      { label: "Analytical method", help: "Routine HPLC/UHPLC method development and QC.", rules: { category: ["Analytical column"] } },
      { label: "Guard cartridge", help: "Protect the analytical or prep column inlet.", rules: { category: ["Analytical guard column", "prep guard column"] } },
      { label: "Preparative purification", help: "Higher loading and collection workflows.", rules: { category: ["Prep Column", "prep guard column"] } },
      { label: "Not sure", help: "Keep all formats and let search rank results.", rules: {} },
    ],
  },
  {
    key: "performance",
    title: "What performance target matters most?",
    choices: [
      { label: "Fast UHPLC", help: "Small particles and core-shell choices.", rules: { particle: ["1.7", "1.8", "1.9", "2.5", "2.6", "2.7", "3"] }, query: "UHPLC fast core shell" },
      { label: "Routine robust HPLC", help: "5 um is broad, durable, and method-transfer friendly.", rules: { particle: ["5"] }, query: "robust routine 5um" },
      { label: "Biomolecules / large analytes", help: "Wide pores reduce size exclusion for large analytes.", rules: { pore: ["300Å", "500Å", "1000Å", "2000Å"] }, query: "biomolecule wide pore" },
      { label: "High-load prep", help: "Larger particles and larger IDs.", rules: { particle: ["10", "15", "20"], diameter: ["10", "20", "30", "40", "50"] }, query: "prep high load" },
    ],
  },
  {
    key: "dimensions",
    title: "Do you have preferred dimensions?",
    choices: [
      { label: "4.6 x 150 mm", help: "Most common analytical HPLC format.", rules: { diameter: ["4.6"], length: ["150"] }, query: "4.6x150" },
      { label: "4.6 x 250 mm", help: "More resolving power for routine HPLC.", rules: { diameter: ["4.6"], length: ["250"] }, query: "4.6x250" },
      { label: "2.1 mm ID", help: "LC-MS / lower solvent use.", rules: { diameter: ["2.1"] }, query: "2.1mm" },
      { label: "Short fast columns", help: "30 to 100 mm lengths for faster runs.", rules: { length: ["30", "50", "75", "100"] }, query: "short fast" },
      { label: "No fixed dimensions", help: "Show all matching sizes.", rules: {} },
    ],
  },
];

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[µμ]/g, "u")
    .replace(/å/g, "a")
    .replace(/angstroms?|ang\b/g, "a")
    .replace(/[^a-z0-9.+%*-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function naturalSort(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }); }
function uniqueValues(field) { return [...new Set(state.catalog.map((item) => item[field]).filter(Boolean))].sort(naturalSort); }
function productText(item) { return norm(`${item.name} ${item.code} ${item.category} ${item.packing} ${item.phase} ${item.particle} ${item.pore} ${item.diameter} ${item.length} ${item.search || ""}`); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[m])); }

async function init() {
  try {
    const [catalog, competitors] = await Promise.all([
      fetch("data/catalog.json").then((r) => r.json()),
      fetch("data/competitor-columns.json").then((r) => r.json()).catch(() => []),
    ]);
    state.catalog = catalog;
    state.competitors = competitors;
    state.pageSize = Number($("#pageSizeSelect")?.value || 50);
    loadSavedFavorites();
    setupFilters();
    setupWizard();
    bindEvents();
    applyFilters();
  } catch (error) {
    console.error(error);
    $("#resultCount").textContent = "Catalog could not be loaded. Check data/catalog.json path.";
  }
}

function bindEvents() {
  $("#searchInput")?.addEventListener("input", () => { state.page = 1; applyFilters(); });
  $("#sortSelect")?.addEventListener("change", () => { state.page = 1; renderProducts(); });
  $("#pageSizeSelect")?.addEventListener("change", (event) => { state.pageSize = Number(event.target.value); state.page = 1; renderProducts(); });
  $("#clearFilters")?.addEventListener("click", clearFilters);
  $("#replacementInput")?.addEventListener("input", renderReplacementMatches);
  $("#quoteButton")?.addEventListener("click", openCheckout);
  $("#copyQuote")?.addEventListener("click", copyQuote);
  $("#submitQuote")?.addEventListener("click", submitQuoteEmail);
  $("#whatsappQuote")?.addEventListener("click", submitQuoteWhatsapp);
  document.querySelectorAll(".view-button").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  fields.forEach((field) => document.getElementById(filterIds[field])?.addEventListener("change", () => { state.page = 1; applyFilters(); }));
  $("#loadMore")?.setAttribute("hidden", "hidden");
}

function setupFilters() {
  fields.forEach((field) => {
    const select = document.getElementById(filterIds[field]);
    if (!select) return;
    select.innerHTML = `<option value="">All ${labelFor(field)}</option>`;
    uniqueValues(field).forEach((value) => select.append(new Option(value, value)));
  });
  $("#statProducts").textContent = state.catalog.length.toLocaleString();
  $("#statPackings").textContent = uniqueValues("packing").length;
  $("#statPhases").textContent = `${uniqueValues("phase").length}+`;
}
function labelFor(field) {
  return { category: "categories", packing: "packings", phase: "phases", particle: "particles", pore: "pores", diameter: "IDs", length: "lengths" }[field] || field;
}

function applyFilters() {
  const query = $("#searchInput")?.value.trim() || "";
  const selected = Object.fromEntries(fields.map((field) => [field, document.getElementById(filterIds[field])?.value || ""]));
  const terms = norm(query).split(" ").filter(Boolean);
  state.scored = state.catalog.map((item) => ({ item, score: scoreProduct(item, terms) }));
  state.filtered = state.scored.filter(({ item, score }) => {
    const selectMatch = fields.every((field) => !selected[field] || item[field] === selected[field]);
    const textMatch = !terms.length || score > 0;
    const wizardMatch = passWizard(item);
    const tableMatch = passTableFilters(item);
    return selectMatch && textMatch && wizardMatch && tableMatch;
  });
  renderExpertPanel(query, terms);
  renderActiveFilters(selected, terms);
  renderProducts();
}

function scoreProduct(item, terms) {
  if (!terms.length) return defaultBoost(item);
  const hay = productText(item);
  let score = 0;
  for (const term of terms) {
    if (!hay.includes(term)) return 0;
    if (norm(item.code).includes(term)) score += 100;
    else if (norm(item.phase).includes(term)) score += 40;
    else if (norm(item.name).includes(term)) score += 25;
    else if (norm(item.packing).includes(term)) score += 15;
    else score += 5;
  }
  return score + defaultBoost(item);
}
function defaultBoost(item) {
  let score = 1;
  if (item.category === "Analytical column") score += 8;
  if (item.particle === "5") score += 5;
  if (item.diameter === "4.6") score += 3;
  if (["150", "250"].includes(item.length)) score += 2;
  return score;
}
function passWizard(item) {
  return Object.values(state.wizard).every((choice) => {
    if (!choice?.rules) return true;
    return Object.entries(choice.rules).every(([field, values]) => !values?.length || values.includes(item[field]));
  });
}
function passTableFilters(item) {
  return Object.entries(state.tableFilters).every(([field, value]) => !value || norm(item[field]).includes(norm(value)));
}

function renderExpertPanel(query, terms) {
  const panel = $("#expertPanel");
  if (!panel) return;
  const tags = [...terms.map((term) => `Text: ${term}`), ...Object.values(state.wizard).map((choice) => choice?.label).filter(Boolean)];
  panel.hidden = !query && tags.length === 0;
  if (!panel.hidden) {
    $("#expertSummary").textContent = tags.length ? `Using ${tags.slice(0, 4).join(", ")}${tags.length > 4 ? "..." : ""}` : "Using catalog search";
    $("#expertTags").innerHTML = tags.map((tag) => `<span class="expert-tag">${escapeHtml(tag)}</span>`).join("");
  }
}
function renderActiveFilters(selected, terms) {
  const host = $("#activeFilters");
  if (!host) return;
  const tags = [
    ...Object.entries(selected).filter(([, value]) => value).map(([field, value]) => `${field}: ${value}`),
    ...terms.map((term) => `Search: ${term}`),
    ...Object.values(state.wizard).map((choice) => choice?.label).filter(Boolean).map((label) => `Wizard: ${label}`),
    ...Object.entries(state.tableFilters).filter(([, value]) => value).map(([field, value]) => `${field}: ${value}`),
  ];
  host.innerHTML = tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("");
}

function sortedResults() {
  const sort = $("#sortSelect")?.value || "relevance";
  return [...state.filtered].sort((a, b) => {
    if (sort === "relevance") return b.score - a.score || naturalSort(a.item.name, b.item.name);
    if (sort === "particle") return Number(a.item.particle) - Number(b.item.particle) || naturalSort(a.item.name, b.item.name);
    if (sort === "length") return Number(a.item.length) - Number(b.item.length) || naturalSort(a.item.name, b.item.name);
    return naturalSort(a.item.name, b.item.name);
  });
}

function pageRows(rows) {
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * state.pageSize;
  return { shown: rows.slice(start, start + state.pageSize), totalPages, start };
}

function renderProducts() {
  const grid = $("#productGrid");
  if (!grid) return;
  const all = sortedResults();
  const { shown, totalPages, start } = pageRows(all);
  grid.innerHTML = "";
  grid.className = `product-grid ${state.view}-view`;
  $("#tableColumnFilters") && ($("#tableColumnFilters").hidden = state.view !== "table");
  if (state.view === "table") {
    renderTableFilters();
    renderTableView(grid, shown);
  } else if (state.view === "compact") {
    renderCompactView(grid, all);
  } else {
    shown.forEach((result) => grid.append(renderProductCard(result.item, result.score)));
  }
  $("#resultCount").textContent = `${all.length.toLocaleString()} matching columns · showing ${all.length ? start + 1 : 0}-${Math.min(start + state.pageSize, all.length)} · ${state.pageSize} per page`;
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const host = $("#pagination");
  if (!host) return;
  if (totalPages <= 1) { host.innerHTML = ""; return; }
  const pages = new Set([1, totalPages, state.page - 1, state.page, state.page + 1]);
  let html = `<button type="button" ${state.page === 1 ? "disabled" : ""} onclick="goToPage(${state.page - 1})">Prev</button>`;
  [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b).forEach((page, index, arr) => {
    if (index && page - arr[index - 1] > 1) html += `<span>...</span>`;
    html += `<button type="button" class="${page === state.page ? "active" : ""}" onclick="goToPage(${page})">${page}</button>`;
  });
  html += `<button type="button" ${state.page === totalPages ? "disabled" : ""} onclick="goToPage(${state.page + 1})">Next</button>`;
  host.innerHTML = html;
}
window.goToPage = function(page) { state.page = page; renderProducts(); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

function renderProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card upgraded-card";
  card.innerHTML = `
    <div class="column-art ${categoryClass(product)}">${columnSvg(product)}</div>
    <div class="product-top"><span class="category">${escapeHtml(product.category)}</span><div class="quick-actions"><button class="icon-button favorite ${state.favorites.has(product.id) ? "active" : ""}" type="button" title="Save favorite">♡</button><button class="icon-button compare ${state.compare.has(product.id) ? "active" : ""}" type="button" title="Compare">⇄</button></div></div>
    <p class="code">Code ${escapeHtml(product.code)}</p>
    <h3>${escapeHtml(product.name)}</h3>
    <dl class="specs icon-specs">${specHtml(product)}</dl>
    <button class="button product-quote" type="button">Add to quote</button>`;
  card.querySelector(".favorite").addEventListener("click", () => toggleFavorite(product));
  card.querySelector(".compare").addEventListener("click", () => toggleCompare(product));
  card.querySelector(".product-quote").addEventListener("click", () => addToCart(product));
  return card;
}
function categoryClass(product) { return norm(product.category).includes("prep") ? "prep-art" : norm(product.category).includes("guard") ? "guard-art" : "analytical-art"; }
function columnSvg(product) {
  const phase = norm(product.phase).replace(/[^a-z0-9]/g, "");
  const long = Number(product.length) >= 200;
  const wide = Number(product.diameter) >= 10;
  const particles = Math.max(3, Math.min(12, Math.round(30 / Math.max(2, Number(product.particle) || 5))));
  return `<svg viewBox="0 0 220 84" role="img" aria-label="Column visual"><defs><linearGradient id="g-${product.id}" x1="0" x2="1"><stop offset="0"/><stop offset="1"/></linearGradient></defs><rect class="tube ${phase}" x="${wide ? 22 : 42}" y="30" width="${long ? 156 : 120}" height="24" rx="12"/><rect class="cap" x="24" y="25" width="24" height="34" rx="8"/><rect class="cap" x="174" y="25" width="24" height="34" rx="8"/>${Array.from({length: particles}).map((_, i) => `<circle class="particle-dot" cx="${62 + i * 10}" cy="42" r="2.5"/>`).join("")}<text x="110" y="75" text-anchor="middle">${escapeHtml(product.phase)} · ${escapeHtml(product.particle)}um · ${escapeHtml(product.diameter)}x${escapeHtml(product.length)}</text></svg>`;
}
function specHtml(product) {
  const specs = [
    ["phase", "⚗", "Phase", product.phase], ["packing", "▧", "Packing", product.packing], ["particle", "●", "Particle", `${product.particle || "-"} um`],
    ["pore", "◌", "Pore", product.pore || "-"], ["diameter", "↔", "ID", `${product.diameter || "-"} mm`], ["length", "━", "Length", `${product.length || "-"} mm`],
  ];
  return specs.map(([key, icon, label, value]) => `<div class="spec-${key}"><dt><span class="spec-icon">${icon}</span>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function renderTableFilters() {
  const host = $("#tableColumnFilters");
  if (!host) return;
  host.hidden = false;
  host.innerHTML = tableFields.map((field) => `<label>${field}<input type="search" value="${escapeHtml(state.tableFilters[field] || "")}" placeholder="Filter ${field}" data-table-filter="${field}"></label>`).join("");
  host.querySelectorAll("input").forEach((input) => input.addEventListener("input", () => {
    state.tableFilters[input.dataset.tableFilter] = input.value;
    state.page = 1;
    applyFilters();
  }));
}
function renderTableView(host, rows) {
  host.innerHTML = `<div class="table-wrap"><table class="product-table"><thead><tr><th>Product</th><th>Code</th><th>Category</th><th>Packing</th><th>Phase</th><th>Particle</th><th>Pore</th><th>ID</th><th>Length</th><th>Actions</th></tr></thead><tbody>${rows.map(({ item }) => variantRow(item)).join("")}</tbody></table></div>`;
}
function variantRow(item) {
  return `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.packing)}</td><td>${escapeHtml(item.phase)}</td><td>${escapeHtml(item.particle)} um</td><td>${escapeHtml(item.pore || "-")}</td><td>${escapeHtml(item.diameter)} mm</td><td>${escapeHtml(item.length)} mm</td><td class="table-actions"><button type="button" onclick="toggleFavoriteById('${item.id}')">${state.favorites.has(item.id) ? "Saved" : "Favorite"}</button><button type="button" onclick="addToCartById('${item.id}')">Quote</button></td></tr>`;
}

function renderCompactView(host, rows) {
  const groups = new Map();
  rows.forEach(({ item, score }) => {
    const key = [item.category, item.packing, item.phase].map(norm).join("|");
    if (!groups.has(key)) groups.set(key, { base: item, score, variants: [] });
    groups.get(key).variants.push(item);
  });
  const groupedRows = [...groups.entries()].sort((a, b) => b[1].score - a[1].score);
  const { shown, totalPages, start } = pageRows(groupedRows);
  host.innerHTML = shown.map(([key, group]) => compactGroupHtml(key, group)).join("");
  $("#resultCount").textContent = `${groupedRows.length.toLocaleString()} column families · showing ${groupedRows.length ? start + 1 : 0}-${Math.min(start + state.pageSize, groupedRows.length)} · ${state.pageSize} per page`;
  renderPagination(totalPages);
}
function compactGroupHtml(key, group) {
  const expanded = state.expandedGroups.has(key);
  return `<article class="compact-row ${expanded ? "expanded" : ""}"><div><strong>${escapeHtml(group.base.packing)} ${escapeHtml(group.base.phase)}</strong><span>${group.variants.length} variants · ${escapeHtml(group.base.category)}</span></div><div class="compact-specs"><span>${compactValues(group.variants, "particle")} um</span><span>${compactValues(group.variants, "pore")}</span><span>ID ${compactValues(group.variants, "diameter")} mm</span><span>${compactValues(group.variants, "length")} mm</span></div><button class="button ghost" type="button" onclick="toggleCompactGroup('${encodeURIComponent(key)}')">${expanded ? "Hide variants" : "View variants"}</button>${expanded ? `<div class="compact-variants"><table class="product-table"><thead><tr><th>Product</th><th>Code</th><th>Particle</th><th>Pore</th><th>ID</th><th>Length</th><th>Actions</th></tr></thead><tbody>${group.variants.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.particle)} um</td><td>${escapeHtml(item.pore || "-")}</td><td>${escapeHtml(item.diameter)} mm</td><td>${escapeHtml(item.length)} mm</td><td class="table-actions"><button type="button" onclick="toggleFavoriteById('${item.id}')">${state.favorites.has(item.id) ? "Saved" : "Favorite"}</button><button type="button" onclick="addToCartById('${item.id}')">Quote</button></td></tr>`).join("")}</tbody></table></div>` : ""}</article>`;
}
window.toggleCompactGroup = function(encodedKey) { const key = decodeURIComponent(encodedKey); state.expandedGroups.has(key) ? state.expandedGroups.delete(key) : state.expandedGroups.add(key); renderProducts(); };
function compactValues(items, field) { const values = [...new Set(items.map((item) => item[field]).filter(Boolean))].sort(naturalSort); return values.length <= 4 ? values.join(", ") : `${values[0]}-${values[values.length - 1]}`; }

function setView(view) { state.view = view; state.page = 1; document.querySelectorAll(".view-button").forEach((button) => button.classList.toggle("active", button.dataset.view === view)); renderProducts(); }

function setupWizard() {
  const stepsHost = $("#wizardSteps");
  if (stepsHost) stepsHost.innerHTML = wizardQuestions.map((q, i) => `<div class="step ${i === 0 ? "active" : ""}" data-wizard-step="${i}"><span>${i + 1}</span><div><strong>${escapeHtml(q.title)}</strong><p>${state.wizard[q.key]?.label || "Choose option"}</p></div></div>`).join("");
  renderWizardQuestion(0);
}
function renderWizardQuestion(index) {
  state.wizardIndex = Math.max(0, Math.min(index, wizardQuestions.length - 1));
  const host = $("#wizardQuestion");
  if (!host) return;
  const question = wizardQuestions[state.wizardIndex];
  host.innerHTML = `<div class="question-block"><h3>${escapeHtml(question.title)}</h3><div class="choice-grid">${question.choices.map((choice, i) => `<button type="button" class="choice ${state.wizard[question.key]?.label === choice.label ? "selected" : ""}" onclick="chooseWizard(${state.wizardIndex}, ${i})"><strong>${escapeHtml(choice.label)}</strong><span>${escapeHtml(choice.help)}</span></button>`).join("")}</div></div>`;
  document.querySelectorAll("[data-wizard-step]").forEach((step) => step.classList.toggle("active", Number(step.dataset.wizardStep) === state.wizardIndex));
}
window.chooseWizard = function(qIndex, cIndex) { const q = wizardQuestions[qIndex]; state.wizard[q.key] = q.choices[cIndex]; state.page = 1; setupWizard(); renderWizardQuestion(Math.min(qIndex + 1, wizardQuestions.length - 1)); applyFilters(); };
function nextWizardStep() { renderWizardQuestion((state.wizardIndex || 0) + 1); }
function previousWizardStep() { renderWizardQuestion((state.wizardIndex || 0) - 1); }
function resetWizard() { state.wizard = {}; state.page = 1; setupWizard(); applyFilters(); }

function clearFilters() {
  $("#searchInput").value = "";
  fields.forEach((field) => { const select = document.getElementById(filterIds[field]); if (select) select.value = ""; });
  state.tableFilters = {};
  state.page = 1;
  applyFilters();
}

function addToCart(product) { const existing = state.cart.get(product.id) || { product, qty: 0 }; existing.qty += 1; state.cart.set(product.id, existing); renderCart(); }
function addToCartById(id) { const product = state.catalog.find((item) => item.id === String(id)); if (product) addToCart(product); }
function toggleFavorite(product) { state.favorites.has(product.id) ? state.favorites.delete(product.id) : state.favorites.set(product.id, product); saveFavorites(); renderProducts(); }
function toggleFavoriteById(id) { const product = state.catalog.find((item) => item.id === String(id)); if (product) toggleFavorite(product); }
function toggleCompare(product) { state.compare.has(product.id) ? state.compare.delete(product.id) : state.compare.set(product.id, product); renderCompare(); renderProducts(); }
function loadSavedFavorites() { JSON.parse(localStorage.getItem("mmeColumnFavorites") || "[]").forEach((id) => { const item = state.catalog.find((p) => p.id === id); if (item) state.favorites.set(id, item); }); }
function saveFavorites() { localStorage.setItem("mmeColumnFavorites", JSON.stringify([...state.favorites.keys()])); }
window.addToCartById = addToCartById; window.toggleFavoriteById = toggleFavoriteById;

function renderCart() {
  const host = $("#cartItems");
  if (!host) return;
  if (!state.cart.size) { host.innerHTML = `<span class="muted">No products selected yet.</span>`; return; }
  host.innerHTML = [...state.cart.values()].map(({ product, qty }) => `<span class="cart-item"><strong>${escapeHtml(product.code)}</strong><label>Qty <input type="number" min="1" value="${qty}" onchange="setCartQty('${product.id}', this.value)"></label><button type="button" onclick="removeCartItem('${product.id}')">×</button></span>`).join("");
}
window.setCartQty = function(id, qty) { const item = state.cart.get(id); if (!item) return; item.qty = Math.max(1, Number(qty) || 1); renderCart(); };
window.removeCartItem = function(id) { state.cart.delete(id); renderCart(); };
function checkoutText() {
  const lines = ["MME column quotation request", "", "Selected products:"];
  [...state.cart.values()].forEach(({ product, qty }, i) => lines.push(`${i + 1}. ${product.code} | ${product.name} | ${product.phase} | ${product.particle}um | ${product.diameter}x${product.length}mm | Qty ${qty}`));
  lines.push("", `Name: ${$("#customerName")?.value || ""}`, `Company: ${$("#customerCompany")?.value || ""}`, `Email: ${$("#customerEmail")?.value || ""}`, `Phone: ${$("#customerPhone")?.value || ""}`, `Notes: ${$("#customerNotes")?.value || ""}`);
  return lines.join("\n");
}
function openCheckout() {
  if (!state.cart.size) { alert("Please add at least one product to the quote basket."); return; }
  const list = $("#checkoutList");
  if (list) list.innerHTML = [...state.cart.values()].map(({ product, qty }) => `<div class="checkout-item"><strong>${escapeHtml(product.code)}</strong><span>${escapeHtml(product.name)}</span><em>Qty ${qty}</em></div>`).join("");
  const modal = $("#quoteModal");
  if (modal?.showModal) modal.showModal(); else alert(checkoutText());
}
function copyQuote() { navigator.clipboard?.writeText(checkoutText()); alert("Quotation request copied."); }
function submitQuoteEmail() { window.location.href = `mailto:${quoteEmail}?subject=${encodeURIComponent("MME column quotation request")}&body=${encodeURIComponent(checkoutText())}`; }
function submitQuoteWhatsapp() { window.open(`https://wa.me/${quoteWhatsapp}?text=${encodeURIComponent(checkoutText())}`, "_blank"); }
function requestQuote() { openCheckout(); }

function renderCompare() { const section = $("#compareSection"); const host = $("#compareTable"); if (!section || !host) return; section.hidden = !state.compare.size; host.innerHTML = state.compare.size ? `<div class="table-wrap"><table class="product-table"><tbody>${[...state.compare.values()].map((p) => variantRow(p)).join("")}</tbody></table></div>` : ""; }

function renderReplacementMatches() {
  const query = $("#replacementInput")?.value.trim() || "";
  const host = $("#replacementResults");
  if (!host) return;
  if (!query) { host.innerHTML = ""; return; }
  const q = norm(query);
  const matches = state.competitors.map((c) => ({ c, score: norm(`${c.brand} ${c.family} ${(c.aliases || []).join(" ")} ${c.phase} ${c.particle} ${c.pore} ${c.diameter} ${c.length}`).split(" ").filter((t) => q.includes(t)).length })).filter((m) => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  host.innerHTML = matches.length ? matches.map(({ c }) => `<div class="replacement-card"><div class="competitor-match"><h4>${escapeHtml(c.brand)} ${escapeHtml(c.family)}</h4><p class="code">${escapeHtml(c.phase)} · ${escapeHtml(c.particle)}um · ${escapeHtml(c.diameter)}x${escapeHtml(c.length)} · ${escapeHtml(c.pore || "")}</p><p>${escapeHtml(c.notes || "")}</p></div><div>${findEquivalent(c).map((p) => `<div class="mme-match"><span class="match-score">Closest MME option</span><h4>${escapeHtml(p.name)}</h4><p class="code">Code ${escapeHtml(p.code)}</p><button class="button ghost" onclick="addToCartById('${p.id}')">Add to quote</button></div>`).join("")}</div></div>`).join("") : `<div class="replacement-card"><div class="competitor-match"><h4>No competitor match yet</h4><p class="code">Try brand + family + specs, for example Agilent Eclipse Plus C18 4.6x150 5um.</p></div></div>`;
}
function findEquivalent(comp) { return state.catalog.filter((p) => (!comp.phase || p.phase === comp.phase) && (!comp.particle || p.particle === comp.particle)).sort((a, b) => (a.diameter === comp.diameter ? -1 : 1) + (a.length === comp.length ? -1 : 1)).slice(0, 3); }

document.addEventListener("DOMContentLoaded", init);
