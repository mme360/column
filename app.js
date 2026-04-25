const state = {
  catalog: [],
  competitors: [],
  filtered: [],
  visible: 18,
  cart: new Map(),
  compare: new Map(),
  favorites: new Map(),
  view: "cards",
  wizardStep: 0,
  wizard: {
    mode: "",
    format: "",
    performance: "",
  },
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

const wizardSteps = ["mode", "format", "performance"];
const wizardChoices = {
  mode: [
    {
      label: "Small molecules, general purpose",
      help: "Start with C18/C8 reverse phase columns for acidic, basic, or neutral analytes.",
      filters: { phase: ["C18", "C8", "ODS2", "ODS"] },
      query: "c18 c8 ods",
    },
    {
      label: "100% aqueous or polar retention",
      help: "AQ-C18 phases are tuned for highly aqueous mobile phases and polar analytes.",
      filters: { phase: ["AQ-C18"] },
      query: "aq-c18 aqueous polar",
    },
    {
      label: "Aromatics and halogenated analytes",
      help: "Phenyl, PFP, and biphenyl phases add pi-pi and shape selectivity.",
      filters: { phase: ["Phenyl", "PFP", "Biphenyl", "Phenyl-Hexyl"] },
      query: "phenyl pfp biphenyl",
    },
    {
      label: "Very polar compounds",
      help: "HILIC, amide, diol, amino, cyano, and silica phases support polar retention.",
      filters: { phase: ["HILIC", "Amide", "Diol", "NH2", "CN", "SiO2", "Si60"] },
      query: "hilic amide diol nh2 cn sio2",
    },
    {
      label: "Ionic analytes",
      help: "SAX, SCX, WAX, and WCX columns cover anion and cation exchange work.",
      filters: { phase: ["SAX", "SCX", "WAX", "WCX"] },
      query: "sax scx wax wcx",
    },
    {
      label: "Proteins, peptides, polymers, sugars",
      help: "Use wide-pore C4/SEC/HIC/Protein A or sugar ligand-exchange options.",
      filters: { phase: ["C4", "SEC", "HIC", "Protein", "Sugar"] },
      query: "c4 sec hic protein sugar 300",
    },
  ],
  format: [
    { label: "Analytical method", help: "Routine method development and QC work.", filters: { category: ["Analytical column"] } },
    { label: "Guard cartridge", help: "Protect the analytical or prep column inlet.", filters: { category: ["Analytical guard column", "prep guard column"] } },
    { label: "Preparative purification", help: "Higher diameter columns for loading and collection.", filters: { category: ["Prep Column"] } },
  ],
  performance: [
    { label: "Fast UHPLC / high efficiency", help: "Narrow-bore, small-particle, and core-shell options.", filters: { particle: ["1.7", "1.8", "2.5", "2.6", "2.7", "3"] }, query: "coreshell" },
    { label: "Robust routine HPLC", help: "5 um columns are the broadest, most transferable catalog option.", filters: { particle: ["5"] } },
    { label: "Biomolecules / large analytes", help: "300A and larger pores reduce steric exclusion for peptides and proteins.", filters: { pore: ["300Å", "500Å", "1000Å", "2000Å"] } },
    { label: "High load prep", help: "Longer, wider columns and larger particles support purification workflows.", filters: { particle: ["10", "15", "20"], diameter: ["10", "20", "30", "40", "50"] } },
  ],
};

const stopWords = new Set(["a", "an", "analysis", "analyze", "and", "assay", "by", "column", "columns", "for", "in", "lc", "method", "mm", "need", "of", "test", "the", "with"]);
const expertRules = [
  {
    id: "reverse-phase",
    label: "Reverse phase",
    keywords: ["reverse phase", "rp", "rplc", "ods", "octadecyl", "nonpolar", "hydrophobic", "general purpose"],
    phases: ["C18", "C8", "ODS2", "ODS", "AQ-C18"],
    score: 44,
    reason: "Reverse-phase fit",
  },
  {
    id: "aqueous",
    label: "Aqueous mobile phase",
    keywords: ["aqueous", "100% aqueous", "water", "polar retention", "polar analyte", "polar analytes"],
    phases: ["AQ-C18"],
    score: 54,
    reason: "AQ phase for aqueous methods",
  },
  {
    id: "basic",
    label: "Basic analytes",
    keywords: ["base", "basic", "alkaline", "amine", "amines", "low silanol", "tailing"],
    phases: ["ODS-B", "BDS C18", "C18", "C8"],
    packings: ["Hypersil BDS", "Supersil"],
    score: 30,
    reason: "Good for basic analytes",
  },
  {
    id: "aromatic",
    label: "Aromatics",
    keywords: ["aromatic", "aromatics", "benzene", "phenyl", "pi-pi", "halogen", "halogenated", "pesticide"],
    phases: ["Phenyl", "PFP", "Biphenyl", "Phenyl-Hexyl", "C6H5"],
    score: 48,
    reason: "Aromatic selectivity",
  },
  {
    id: "hilic",
    label: "HILIC / polar",
    keywords: ["hilic", "hydrophilic", "very polar", "amide", "diol", "amino", "normal phase", "normal-phase"],
    phases: ["HILIC", "Amide", "Diol", "NH2", "NH2-S", "CN", "SiO2", "Si60"],
    score: 48,
    reason: "Polar/HILIC chemistry",
  },
  {
    id: "ion-exchange",
    label: "Ion exchange",
    keywords: ["ion", "ionic", "anion", "cation", "exchange", "sax", "scx", "wax", "wcx"],
    phases: ["SAX", "SCX", "WAX", "WCX"],
    score: 50,
    reason: "Ion-exchange chemistry",
  },
  {
    id: "sugar",
    label: "Carbohydrates / sugar",
    keywords: ["sugar", "sugars", "carbohydrate", "carbohydrates", "glucose", "fructose", "sucrose"],
    phases: ["Sugar", "NH2", "NH2-S"],
    packings: ["Amber"],
    score: 58,
    reason: "Carbohydrate analysis",
  },
  {
    id: "peptide-protein",
    label: "Peptides / proteins",
    keywords: ["peptide", "peptides", "protein", "proteins", "biologic", "biological", "antibody", "adc", "insulin", "semaglutide"],
    phases: ["C4", "SEC", "HIC", "Protein A", "Amide", "HILIC"],
    pores: ["300A", "500A", "1000A", "2000A"],
    score: 56,
    reason: "Biomolecule suitable",
  },
  {
    id: "sec",
    label: "Size exclusion",
    keywords: ["sec", "gfc", "gpc", "size exclusion", "polymer", "polymers", "molecular weight"],
    phases: ["SEC", "GPC"],
    packings: ["Amber"],
    score: 56,
    reason: "Size-exclusion mode",
  },
  {
    id: "uhplc",
    label: "UHPLC speed",
    keywords: ["uhplc", "uplc", "fast", "high efficiency", "high resolution", "core shell", "core-shell", "coreshell"],
    particles: ["1.7", "1.8", "2.5", "2.6", "2.7", "3"],
    packings: ["Supersil Coreshell", "Ecoreshell"],
    score: 38,
    reason: "High-efficiency option",
  },
  {
    id: "prep",
    label: "Preparative",
    keywords: ["prep", "preparative", "purification", "scale up", "load", "loading"],
    categories: ["Prep Column", "prep guard column"],
    diameters: ["10", "20", "30", "40", "50"],
    score: 46,
    reason: "Preparative format",
  },
  {
    id: "guard",
    label: "Guard column",
    keywords: ["guard", "cartridge", "protect"],
    categories: ["Analytical guard column", "prep guard column"],
    lengths: ["5", "10", "15", "30"],
    score: 48,
    reason: "Guard format",
  },
];

const $ = (selector) => document.querySelector(selector);

async function init() {
  const [catalog, competitors] = await Promise.all([
    fetch("data/catalog.json").then((response) => response.json()),
    fetch("data/competitor-columns.json").then((response) => response.json()),
  ]);
  state.catalog = catalog;
  state.competitors = competitors;
  const favoriteIds = JSON.parse(localStorage.getItem("mmeColumnFavorites") || "[]");
  favoriteIds.forEach((id) => {
    const product = state.catalog.find((item) => item.id === id);
    if (product) state.favorites.set(id, product);
  });
  state.filtered = [...state.catalog];
  updateStats();
  setupFilters();
  setupWizard();
  bindEvents();
  applyFilters();
}

function updateStats() {
  $("#statProducts").textContent = state.catalog.length.toLocaleString();
  $("#statPackings").textContent = uniqueValues("packing").length;
  $("#statPhases").textContent = `${uniqueValues("phase").length}+`;
}

function uniqueValues(field) {
  return [...new Set(state.catalog.map((item) => item[field]).filter(Boolean))].sort(naturalSort);
}

function naturalSort(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function setupFilters() {
  fields.forEach((field) => {
    const select = document.getElementById(filterIds[field]);
    select.innerHTML = `<option value="">All ${labelFor(field)}</option>`;
    uniqueValues(field).forEach((value) => {
      select.append(new Option(value, value));
    });
  });
}

function setupWizard() {
  Object.entries(wizardChoices).forEach(([key, choices]) => {
    const host = document.getElementById(`${key}Choices`);
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "choice";
      button.type = "button";
      button.dataset.key = key;
      button.dataset.index = index;
      button.innerHTML = `<strong>${choice.label}</strong><span>${choice.help}</span>`;
      host.append(button);
    });
  });
}

function bindEvents() {
  $("#searchInput").addEventListener("input", () => applyFilters());
  $("#sortSelect").addEventListener("change", () => renderProducts());
  $("#loadMore").addEventListener("click", () => {
    state.visible += 18;
    renderProducts();
  });
  $("#clearFilters").addEventListener("click", clearFilters);
  $("#backStep").addEventListener("click", previousWizardStep);
  $("#nextStep").addEventListener("click", nextWizardStep);
  $("#resetWizard").addEventListener("click", resetWizard);
  $("#quoteButton").addEventListener("click", requestQuote);
  $("#replacementInput").addEventListener("input", () => renderReplacementMatches());
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  fields.forEach((field) => {
    document.getElementById(filterIds[field]).addEventListener("change", () => applyFilters());
  });

  document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => chooseWizard(button));
  });
}

function labelFor(field) {
  return {
    category: "categories",
    packing: "packings",
    phase: "phases",
    particle: "particles",
    pore: "pores",
    diameter: "IDs",
    length: "lengths",
  }[field];
}

function applyFilters() {
  const query = $("#searchInput").value.trim();
  const searchPlan = buildSearchPlan(query);
  const selected = Object.fromEntries(fields.map((field) => [field, document.getElementById(filterIds[field]).value]));

  state.filtered = state.catalog
    .map((item) => scoreItem(item, searchPlan))
    .filter(({ item, score, passes }) => {
      const matchesFilters = fields.every((field) => !selected[field] || item[field] === selected[field]);
      return matchesFilters && passWizard(item) && passes && score > -1;
    });

  state.visible = 18;
  updateFilterOptions(selected, searchPlan);
  renderExpertPanel(searchPlan);
  renderActiveFilters(selected, searchPlan.tokens);
  renderProducts();
}

function updateFilterOptions(selected, searchPlan) {
  fields.forEach((targetField) => {
    const select = document.getElementById(filterIds[targetField]);
    const currentValue = select.value;
    const available = new Set(
      state.catalog
        .filter((item) => {
          const matchesOtherFilters = fields.every((field) => {
            if (field === targetField) return true;
            return !selected[field] || item[field] === selected[field];
          });
          const scored = scoreItem(item, searchPlan);
          return matchesOtherFilters && passWizard(item) && scored.passes && scored.score > -1;
        })
        .map((item) => item[targetField])
        .filter(Boolean)
    );
    const values = uniqueValues(targetField).filter((value) => available.has(value));
    select.innerHTML = `<option value="">All ${labelFor(targetField)}</option>`;
    values.forEach((value) => select.append(new Option(value, value)));
    select.value = values.includes(currentValue) ? currentValue : "";
    if (!select.value) selected[targetField] = "";
  });
}

function buildSearchPlan(query) {
  const normalized = normalizeText(query);
  const consumed = new Set();
  const matchedRules = expertRules.filter((rule) =>
    rule.keywords.some((keyword) => {
      const phrase = normalizeText(keyword);
      if (!normalized.includes(phrase)) return false;
      phrase.split(" ").forEach((word) => consumed.add(word));
      return true;
    })
  );

  const constraints = extractExplicitConstraints(normalized, consumed);
  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !stopWords.has(token) && !consumed.has(token))
    .filter((token) => !/^\d+(?:\.\d+)?(?:x|\*)\d+(?:\.\d+)?$/.test(token))
    .filter((token) => !/^\d+(?:\.\d+)?(?:um|micron|microns|a)$/.test(token));

  return { original: query, normalized, matchedRules, constraints, tokens };
}

function extractExplicitConstraints(normalized, consumed) {
  const constraints = [];
  const dimensions = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)/g)];
  dimensions.forEach((match) => {
    constraints.push({ field: "diameter", value: match[1], label: `ID ${match[1]} mm`, reason: `ID ${match[1]} mm` });
    constraints.push({ field: "length", value: match[2], label: `Length ${match[2]} mm`, reason: `${match[2]} mm length` });
    consumed.add(match[1]);
    consumed.add(match[2]);
  });

  const particle = normalized.match(/(\d+(?:\.\d+)?)\s*(?:um|micron|microns|µm|μm)/);
  if (particle) {
    constraints.push({ field: "particle", value: particle[1], label: `${particle[1]} um particle`, reason: `${particle[1]} um particle` });
    consumed.add(particle[1]);
  }

  const pore = normalized.match(/(\d{2,4})\s*(?:a|angstrom|ang)$/) || normalized.match(/(\d{2,4})\s*(?:a|angstrom|ang)\b/);
  if (pore) {
    constraints.push({ field: "pore", value: `${pore[1]}A`, label: `${pore[1]}A pore`, reason: `${pore[1]}A pore` });
    consumed.add(pore[1]);
  }

  uniqueValues("phase").forEach((phase) => {
    const normPhase = normalizeText(phase);
    if (normPhase && hasPhrase(normalized, normPhase)) {
      constraints.push({ field: "phase", value: phase, label: `${phase} phase`, reason: `${phase} phase match` });
      normPhase.split(" ").forEach((word) => consumed.add(word));
    }
  });

  if (/\bguard\b/.test(normalized)) constraints.push({ field: "category", value: "guard", label: "Guard format", reason: "Guard format" });
  if (/\bprep|preparative\b/.test(normalized)) constraints.push({ field: "category", value: "prep", label: "Prep format", reason: "Prep format" });

  return constraints;
}

function scoreItem(item, plan) {
  const reasons = [];
  let score = plan.original ? 0 : 1;
  let passes = true;
  const normalizedItem = normalizeText(`${item.code} ${item.name} ${item.category} ${item.packing} ${item.phase} ${item.particle} ${item.pore} ${item.diameter} ${item.length}`);

  for (const token of plan.tokens) {
    if (!normalizedItem.includes(token)) {
      passes = false;
      break;
    }
    if (normalizeText(item.code).includes(token)) score += 90;
    else if (normalizeText(item.name).includes(token)) score += 18;
    else if (normalizeText(item.phase).includes(token)) score += 16;
    else if (normalizeText(item.packing).includes(token)) score += 9;
    else score += 3;
  }

  if (passes) {
    for (const constraint of plan.constraints) {
      const matched = explicitConstraintMatches(item, constraint);
      if (!matched) {
        passes = false;
        break;
      }
      score += 34;
      reasons.push(constraint.reason);
    }
  }

  if (passes) {
    for (const rule of plan.matchedRules) {
      const ruleScore = scoreRule(item, rule);
      if (ruleScore > 0) {
        score += rule.score + ruleScore;
        reasons.push(rule.reason);
      } else if (!plan.tokens.length && !plan.constraints.length) {
        score -= 8;
      }
    }
  }

  score += defaultMerchandisingBoost(item, plan);
  return { item, score, passes, reasons: [...new Set(reasons)].slice(0, 3) };
}

function explicitConstraintMatches(item, constraint) {
  if (constraint.field === "category" && constraint.value === "guard") return normalizeText(item.category).includes("guard");
  if (constraint.field === "category" && constraint.value === "prep") return normalizeText(item.category).includes("prep");
  if (constraint.field === "pore") return normalizeText(item.pore) === normalizeText(constraint.value);
  return normalizeText(item[constraint.field]) === normalizeText(constraint.value);
}

function scoreRule(item, rule) {
  let score = 0;
  if (rule.phases?.some((value) => containsNormalized(item.phase, value) || containsNormalized(item.name, value))) score += 18;
  if (rule.packings?.some((value) => containsNormalized(item.packing, value) || containsNormalized(item.name, value))) score += 12;
  if (rule.pores?.some((value) => normalizeText(item.pore) === normalizeText(value))) score += 16;
  if (rule.particles?.some((value) => normalizeText(item.particle) === normalizeText(value))) score += 12;
  if (rule.categories?.some((value) => containsNormalized(item.category, value))) score += 18;
  if (rule.diameters?.some((value) => normalizeText(item.diameter) === normalizeText(value))) score += 7;
  if (rule.lengths?.some((value) => normalizeText(item.length) === normalizeText(value))) score += 7;
  return score;
}

function defaultMerchandisingBoost(item, plan) {
  if (plan.original && (plan.tokens.length || plan.constraints.length || plan.matchedRules.length)) return 0;
  let score = 0;
  if (item.category === "Analytical column") score += 8;
  if (item.particle === "5") score += 6;
  if (item.diameter === "4.6") score += 3;
  if (item.length === "150" || item.length === "250") score += 3;
  return score;
}

function containsNormalized(source, value) {
  return normalizeText(source).includes(normalizeText(value));
}

function hasPhrase(source, phrase) {
  return new RegExp(`(^|\\s)${escapeRegex(phrase)}($|\\s)`).test(source);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u00b5\u03bc]/g, "u")
    .replace(/\u00e5|angstroms?|ang\b/g, "a")
    .replace(/[^a-z0-9.+%*-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderExpertPanel(plan) {
  const panel = $("#expertPanel");
  const tags = [
    ...plan.matchedRules.map((rule) => rule.label),
    ...plan.constraints.map((constraint) => constraint.label),
    ...plan.tokens.map((token) => `Text: ${token}`),
  ];

  panel.hidden = !plan.original || tags.length === 0;
  if (panel.hidden) return;

  $("#expertSummary").textContent = tags.length
    ? `Interpreting this as ${tags.slice(0, 3).join(", ")}${tags.length > 3 ? "..." : ""}`
    : "Using literal catalog search";
  $("#expertTags").innerHTML = tags.map((tag) => `<span class="expert-tag">${tag}</span>`).join("");
}

function renderProducts() {
  const grid = $("#productGrid");
  const sort = $("#sortSelect").value;
  const products = [...state.filtered].sort((a, b) => {
    if (sort === "relevance") return b.score - a.score || naturalSort(a.item.name, b.item.name);
    if (sort === "particle") return Number(a.item.particle) - Number(b.item.particle) || naturalSort(a.item.name, b.item.name);
    if (sort === "length") return Number(a.item.length) - Number(b.item.length) || naturalSort(a.item.name, b.item.name);
    return naturalSort(a.item.name, b.item.name);
  });

  const shown = products.slice(0, state.visible);
  grid.innerHTML = "";
  grid.className = `product-grid ${state.view}-view`;
  if (state.view === "table") renderTableView(grid, shown);
  else if (state.view === "compact") renderCompactView(grid, products);
  else shown.forEach((result) => grid.append(renderProduct(result.item, result.reasons)));

  $("#resultCount").textContent = `${products.length.toLocaleString()} matching columns`;
  $("#loadMore").hidden = state.view === "compact" || state.visible >= products.length;
}

function renderProduct(product, reasons = []) {
  const node = $("#productTemplate").content.firstElementChild.cloneNode(true);
  node.querySelector(".category").textContent = product.category;
  node.querySelector("h3").textContent = product.name;
  node.querySelector(".code").textContent = `Code ${product.code}`;
  node.querySelector(".recommendations").innerHTML = reasons.map((reason) => `<span class="reason">${reason}</span>`).join("");
  ["phase", "packing", "particle", "pore", "diameter", "length"].forEach((field) => {
    const suffix = field === "particle" ? " um" : field === "diameter" || field === "length" ? " mm" : "";
    node.querySelector(`[data-field="${field}"]`).textContent = `${product[field] || "-"}${suffix}`;
  });
  node.querySelector(".compare").addEventListener("click", () => toggleCompare(product));
  node.querySelector(".favorite").addEventListener("click", () => toggleFavorite(product));
  node.querySelector(".favorite").classList.toggle("active", state.favorites.has(product.id));
  node.querySelector(".compare").classList.toggle("active", state.compare.has(product.id));
  node.querySelector(".product-quote").addEventListener("click", () => addToCart(product));
  return node;
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  renderProducts();
}

function renderTableView(host, rows) {
  host.innerHTML = `
    <div class="table-wrap">
      <table class="product-table">
        <thead>
          <tr>
            <th>Product</th><th>Code</th><th>Category</th><th>Phase</th><th>Particle</th><th>Pore</th><th>ID</th><th>Length</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(({ item }) => `
            <tr>
              <td>${item.name}</td><td>${item.code}</td><td>${item.category}</td><td>${item.phase}</td>
              <td>${item.particle} um</td><td>${item.pore || "-"}</td><td>${item.diameter} mm</td><td>${item.length} mm</td>
              <td class="table-actions">
                <button type="button" onclick="toggleCompareById('${item.id}')">Compare</button>
                <button type="button" onclick="toggleFavoriteById('${item.id}')">Favorite</button>
                <button type="button" onclick="addToCartById('${item.id}')">Quote</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCompactView(host, products) {
  const groups = new Map();
  products.forEach(({ item, score, reasons }) => {
    const key = compactKey(item);
    if (!groups.has(key)) groups.set(key, { base: item, score, reasons, variants: [] });
    groups.get(key).variants.push(item);
  });
  const grouped = [...groups.values()].sort((a, b) => b.score - a.score).slice(0, state.visible);
  host.innerHTML = grouped.map((group) => {
    const particles = compactValues(group.variants, "particle");
    const pores = compactValues(group.variants, "pore");
    const diameters = compactValues(group.variants, "diameter");
    const lengths = compactValues(group.variants, "length");
    return `
      <article class="compact-row">
        <div>
          <strong>${group.base.packing} ${group.base.phase}</strong>
          <span>${group.variants.length} variants · ${group.base.category}</span>
        </div>
        <div class="compact-specs">
          <span>${particles} um</span><span>${pores}</span><span>ID ${diameters} mm</span><span>${lengths} mm</span>
        </div>
        <button class="button ghost" type="button" onclick="setView('cards')">View variants</button>
      </article>
    `;
  }).join("");
}

function compactKey(item) {
  return [item.category, item.packing, item.phase].map(normalizeText).join("|");
}

function compactValues(items, field) {
  const values = [...new Set(items.map((item) => item[field]).filter(Boolean))].sort(naturalSort);
  if (values.length <= 4) return values.join(", ");
  return `${values[0]}-${values[values.length - 1]}`;
}

function renderReplacementMatches() {
  const query = $("#replacementInput").value.trim();
  const host = $("#replacementResults");
  if (!query) {
    host.innerHTML = "";
    return;
  }

  const competitorMatches = findCompetitorMatches(query).slice(0, 3);
  if (!competitorMatches.length) {
    host.innerHTML = `<div class="replacement-card"><div class="competitor-match"><h4>No competitor match yet</h4><p class="code">Try brand + family + specs, for example Agilent Eclipse Plus C18 4.6x150 5um.</p></div></div>`;
    return;
  }

  host.innerHTML = competitorMatches.map((match) => renderReplacementCard(match)).join("");
}

function findCompetitorMatches(query) {
  const parsed = parseExternalColumn(query);
  return state.competitors
    .map((competitor) => {
      const score = scoreCompetitor(competitor, parsed);
      const enriched = { ...competitor, ...removeEmpty(parsed.specs) };
      const mme = findMmeEquivalents(enriched).slice(0, 3);
      return { competitor, parsed, score, mme };
    })
    .filter((match) => match.score > 0 || match.mme.length)
    .sort((a, b) => b.score - a.score);
}

function parseExternalColumn(query) {
  const normalized = normalizeText(query);
  const specs = {};
  const dimension = normalized.match(/(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)/);
  const particle = normalized.match(/(\d+(?:\.\d+)?)\s*(?:um|micron|microns|u)/);
  const pore = normalized.match(/(\d{2,4})\s*(?:a|angstrom|ang)\b/);

  if (dimension) {
    specs.diameter = dimension[1];
    specs.length = dimension[2];
  }
  if (particle) specs.particle = particle[1];
  if (pore) specs.pore = `${pore[1]}A`;

  uniqueValues("phase").forEach((phase) => {
    if (!specs.phase && hasPhrase(normalized, normalizeText(phase))) specs.phase = phase;
  });

  if (!specs.phase) {
    if (hasPhrase(normalized, "ods") || hasPhrase(normalized, "octadecyl")) specs.phase = "C18";
    if (hasPhrase(normalized, "amide")) specs.phase = "Amide";
    if (hasPhrase(normalized, "amino")) specs.phase = "NH2";
    if (hasPhrase(normalized, "cyano")) specs.phase = "CN";
  }

  return { query, normalized, specs };
}

function scoreCompetitor(competitor, parsed) {
  const text = normalizeText(`${competitor.brand} ${competitor.family} ${(competitor.aliases || []).join(" ")} ${competitor.phase} ${competitor.usp}`);
  let score = 0;
  parsed.normalized.split(/\s+/).filter((token) => token && !stopWords.has(token)).forEach((token) => {
    if (text.includes(token)) score += 12;
  });
  Object.entries(parsed.specs).forEach(([field, value]) => {
    if (normalizeText(competitor[field]) === normalizeText(value)) score += 18;
  });
  if (text.includes(parsed.normalized)) score += 60;
  return score;
}

function findMmeEquivalents(external) {
  return state.catalog
    .map((item) => scoreEquivalent(item, external))
    .filter((result) => result.score >= 35)
    .sort((a, b) => b.score - a.score || naturalSort(a.item.name, b.item.name));
}

function scoreEquivalent(item, external) {
  const reasons = [];
  let score = 0;
  const phaseScore = phaseCompatibility(item.phase, external.phase);
  if (phaseScore) {
    score += phaseScore.score;
    reasons.push(phaseScore.reason);
  }

  if (external.usp && sameUsp(external.usp, item.phase)) {
    score += 12;
    reasons.push(`USP ${external.usp} chemistry family`);
  }

  if (external.particleType === "Core Shell" && containsNormalized(item.packing, "coreshell")) {
    score += 20;
    reasons.push("Core-shell/SPP performance class");
  }

  [
    ["particle", 16, "particle size"],
    ["pore", 14, "pore size"],
    ["diameter", 14, "internal diameter"],
    ["length", 14, "column length"],
  ].forEach(([field, points, label]) => {
    if (external[field] && normalizeText(item[field]) === normalizeText(external[field])) {
      score += points;
      reasons.push(`Same ${label}`);
    }
  });

  if (containsNormalized(external.mode, "prep") && containsNormalized(item.category, "prep")) {
    score += 18;
    reasons.push("Preparative format");
  } else if (!containsNormalized(external.mode, "prep") && item.category === "Analytical column") {
    score += 8;
    reasons.push("Analytical format");
  }

  return { item, score, percent: Math.min(score, 99), reasons: [...new Set(reasons)].slice(0, 5) };
}

function phaseCompatibility(mmePhase, externalPhase) {
  const mme = normalizeText(mmePhase);
  const ext = normalizeText(externalPhase);
  if (!ext) return null;
  if (mme === ext || mme.includes(ext) || ext.includes(mme)) return { score: 42, reason: `Same ${externalPhase} phase` };
  const groups = [
    { phases: ["c18", "ods", "ods2", "ods b", "bds c18"], reason: "Closest C18 / ODS reversed-phase chemistry" },
    { phases: ["aq c18", "aqueous c18"], reason: "Aqueous-compatible C18 chemistry" },
    { phases: ["c8"], reason: "Same C8 reversed-phase chemistry" },
    { phases: ["phenyl", "pfp", "biphenyl", "phenyl hexyl", "c6h5"], reason: "Aromatic-selective phase family" },
    { phases: ["hilic", "amide", "diol"], reason: "Polar/HILIC phase family" },
    { phases: ["nh2", "amino", "nh2 s"], reason: "Amino polar phase family" },
    { phases: ["cn", "cyano"], reason: "Cyano polar phase family" },
    { phases: ["sax", "wax"], reason: "Anion-exchange family" },
    { phases: ["scx", "wcx"], reason: "Cation-exchange family" },
    { phases: ["sec", "gpc"], reason: "Size-exclusion family" },
  ];
  const group = groups.find((candidate) => candidate.phases.includes(ext));
  if (group && group.phases.some((phase) => mme.includes(phase))) return { score: 32, reason: group.reason };
  return null;
}

function sameUsp(usp, phase) {
  return normalizeText(usp) === "l1" && /c18|ods|aq c18/.test(normalizeText(phase));
}

function removeEmpty(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value));
}

function renderReplacementCard(match) {
  const competitor = { ...match.competitor, ...removeEmpty(match.parsed.specs) };
  const mmeRows = match.mme
    .map((result) => {
      const reasons = result.reasons.map((reason) => `<li>${reason}</li>`).join("");
      return `
        <tr>
          <td><span class="match-score">${result.percent}%</span></td>
          <td>${result.item.name}<br><span class="code">Code ${result.item.code}</span></td>
          <td>${competitor.phase || "-"}</td><td>${result.item.phase || "-"}</td>
          <td>${competitor.particle || "-"} um</td><td>${result.item.particle || "-"} um</td>
          <td>${competitor.pore || "-"}</td><td>${result.item.pore || "-"}</td>
          <td>${competitor.diameter || "-"} x ${competitor.length || "-"}</td>
          <td>${result.item.diameter || "-"} x ${result.item.length || "-"}</td>
          <td><ul class="reason-list">${reasons}</ul></td>
          <td><button class="button product-quote" type="button" onclick="addToCartById('${result.item.id}')">Quote</button></td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="replacement-card">
      <div class="competitor-match">
        <h4>${competitor.brand} ${competitor.family}</h4>
        <p class="code">${competitor.phase || "-"} · ${competitor.particle || "-"} um · ${competitor.pore || "pore n/a"} · ${competitor.diameter || "-"} x ${competitor.length || "-"} mm</p>
        <p>${competitor.notes}</p>
      </div>
      <div class="table-wrap">
        ${mmeRows ? `
          <table class="product-table replacement-table">
            <thead>
              <tr>
                <th>Match</th><th>MME option</th><th>Other phase</th><th>MME phase</th>
                <th>Other particle</th><th>MME particle</th><th>Other pore</th><th>MME pore</th>
                <th>Other size</th><th>MME size</th><th>Why chosen</th><th></th>
              </tr>
            </thead>
            <tbody>${mmeRows}</tbody>
          </table>
        ` : `<div class="mme-match"><h4>No close MME equivalent found</h4><p class="code">Try adding phase, particle size, and dimensions.</p></div>`}
      </div>
    </div>
  `;
}

function addToCartById(id) {
  const product = state.catalog.find((item) => item.id === id);
  if (product) addToCart(product);
}

function toggleCompareById(id) {
  const product = state.catalog.find((item) => item.id === id);
  if (product) toggleCompare(product);
}

function toggleFavoriteById(id) {
  const product = state.catalog.find((item) => item.id === id);
  if (product) toggleFavorite(product);
}

function toggleCompare(product) {
  if (state.compare.has(product.id)) state.compare.delete(product.id);
  else state.compare.set(product.id, product);
  renderCompare();
  renderProducts();
}

function toggleFavorite(product) {
  if (state.favorites.has(product.id)) state.favorites.delete(product.id);
  else state.favorites.set(product.id, product);
  localStorage.setItem("mmeColumnFavorites", JSON.stringify([...state.favorites.keys()]));
  renderProducts();
}

function renderCompare() {
  const section = $("#compareSection");
  const host = $("#compareTable");
  const items = [...state.compare.values()];
  section.hidden = items.length < 2;
  if (section.hidden) return;
  host.innerHTML = `
    <div class="table-wrap">
      <table class="product-table compare-table">
        <thead>
          <tr><th>Spec</th>${items.map((item) => `<th>${item.code}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${[
            ["Product", "name"],
            ["Category", "category"],
            ["Packing", "packing"],
            ["Phase", "phase"],
            ["Particle", "particle"],
            ["Pore", "pore"],
            ["ID", "diameter"],
            ["Length", "length"],
          ].map(([label, field]) => `<tr><th>${label}</th>${items.map((item) => `<td>${item[field] || "-"}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderActiveFilters(selected, tokens) {
  const host = $("#activeFilters");
  const pills = [];
  if (tokens.length) pills.push(`Search: ${tokens.join(" ")}`);
  Object.values(state.wizard).forEach((choice) => {
    if (choice) pills.push(`Wizard: ${choice.label}`);
  });
  fields.forEach((field) => {
    if (selected[field]) pills.push(`${fieldLabel(field)}: ${selected[field]}`);
  });
  host.innerHTML = pills.map((pill) => `<span class="pill">${pill}</span>`).join("");
}

function passWizard(item) {
  return Object.values(state.wizard).every((choice) => {
    if (!choice) return true;
    return Object.entries(choice.filters || {}).every(([field, values]) => {
      const haystack = `${item[field]} ${item.name} ${item.packing} ${item.phase}`.toLowerCase();
      return values.some((value) => haystack.includes(String(value).toLowerCase()));
    });
  });
}

function fieldLabel(field) {
  return {
    category: "Category",
    packing: "Packing",
    phase: "Phase",
    particle: "Particle",
    pore: "Pore",
    diameter: "ID",
    length: "Length",
  }[field];
}

function clearFilters() {
  $("#searchInput").value = "";
  fields.forEach((field) => {
    document.getElementById(filterIds[field]).value = "";
  });
  state.wizard = { mode: "", format: "", performance: "" };
  state.wizardStep = 0;
  document.querySelectorAll(".choice").forEach((button) => button.classList.remove("selected"));
  updateWizardStep();
  applyFilters();
}

function chooseWizard(button) {
  const key = button.dataset.key;
  const choice = wizardChoices[key][Number(button.dataset.index)];
  state.wizard[key] = choice;

  document.querySelectorAll(`.choice[data-key="${key}"]`).forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  applyWizardFilters();
}

function applyWizardFilters() {
  applyFilters();
}

function nextWizardStep() {
  if (state.wizardStep < wizardSteps.length - 1) {
    state.wizardStep += 1;
    updateWizardStep();
  } else {
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  }
}

function previousWizardStep() {
  state.wizardStep = Math.max(0, state.wizardStep - 1);
  updateWizardStep();
}

function updateWizardStep() {
  const active = wizardSteps[state.wizardStep];
  document.querySelectorAll(".question-block").forEach((block) => {
    block.classList.toggle("hidden", block.dataset.question !== active);
  });
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.toggle("active", step.dataset.step === active);
  });
  $("#backStep").disabled = state.wizardStep === 0;
  $("#nextStep").textContent = state.wizardStep === wizardSteps.length - 1 ? "View matches" : "Next";
}

function resetWizard() {
  state.wizard = { mode: "", format: "", performance: "" };
  state.wizardStep = 0;
  document.querySelectorAll(".choice").forEach((button) => button.classList.remove("selected"));
  updateWizardStep();
  applyFilters();
}

function addToCart(product) {
  const existing = state.cart.get(product.id);
  state.cart.set(product.id, { product, qty: existing ? existing.qty + 1 : 1 });
  renderCart();
}

function removeFromCart(id) {
  state.cart.delete(id);
  renderCart();
}

function renderCart() {
  const host = $("#cartItems");
  if (!state.cart.size) {
    host.innerHTML = `<span class="pill">No columns selected yet</span>`;
    return;
  }
  host.innerHTML = "";
  state.cart.forEach(({ product, qty }) => {
    const chip = document.createElement("span");
    chip.className = "cart-item";
    chip.innerHTML = `
      <strong>${product.code}</strong>
      <label>Qty <input type="number" min="1" value="${qty}" aria-label="Quantity for ${product.code}"></label>
      <button type="button" aria-label="Remove ${product.code}">x</button>
    `;
    chip.querySelector("input").addEventListener("change", (event) => updateCartQty(product.id, event.target.value));
    chip.querySelector("button").addEventListener("click", () => removeFromCart(product.id));
    host.append(chip);
  });
}

function updateCartQty(id, value) {
  const line = state.cart.get(id);
  if (!line) return;
  line.qty = Math.max(1, Number(value) || 1);
  state.cart.set(id, line);
  renderCart();
}

function requestQuote() {
  const items = [...state.cart.values()];
  if (!items.length) {
    alert("Select at least one column to request a quote.");
    return;
  }
  const lines = items.map(({ product, qty }) => `${qty} x ${product.code} - ${product.name}`).join("%0D%0A");
  window.location.href = `mailto:sales@example.com?subject=HPLC column quote request&body=Please quote:%0D%0A${lines}`;
}

init().catch((error) => {
  $("#resultCount").textContent = "Could not load catalog.";
  console.error(error);
});
