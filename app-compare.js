/* Simplified card rendering with compare feature. Loaded after app-final.js. */
(function () {
  if (!state.compare) state.compare = new Map();

  function compareButtonLabel(product) {
    return state.compare.has(product.id) ? 'In compare' : 'Compare';
  }

  card = function card(product) {
    const node = document.createElement('article');
    node.className = 'product-card upgraded-card simple-product-card';
    node.innerHTML = `
      <div class="product-top">
        <span class="category">${esc(product.category)}</span>
        <div class="quick-actions">
          <button class="icon-button favorite ${state.fav.has(product.id) ? 'active' : ''}" type="button" title="Save favorite">♡</button>
        </div>
      </div>
      <p class="code">Code ${esc(product.code)}</p>
      <h3>${esc(product.name)}</h3>
      <div class="use-badges">${badges(product)}</div>
      <dl class="specs icon-specs">${specHtml(product)}</dl>
      <div class="card-actions">
        <button class="button product-quote" type="button">Add to quote</button>
        <button class="button ghost product-compare ${state.compare.has(product.id) ? 'active' : ''}" type="button">${compareButtonLabel(product)}</button>
      </div>`;
    node.querySelector('.favorite').onclick = () => toggleFav(product);
    node.querySelector('.product-quote').onclick = () => addCart(product);
    node.querySelector('.product-compare').onclick = () => toggleCompare(product);
    return node;
  };

  window.toggleCompare = function toggleCompare(product) {
    if (state.compare.has(product.id)) state.compare.delete(product.id);
    else state.compare.set(product.id, product);
    renderCompare();
    renderProducts();
  };

  window.toggleCompareById = function toggleCompareById(id) {
    const product = state.catalog.find((item) => item.id === String(id));
    if (product) toggleCompare(product);
  };

  const originalRow = row;
  row = function row(product) {
    return `<tr><td>${esc(product.name)}</td><td>${esc(product.code)}</td><td>${esc(product.category)}</td><td>${esc(product.packing)}</td><td>${esc(product.phase)}</td><td>${badges(product)}</td><td>${esc(product.particle)} um</td><td>${esc(product.pore || '-')}</td><td>${esc(product.diameter)} mm</td><td>${esc(product.length)} mm</td><td class="table-actions"><button onclick="toggleFavoriteById('${product.id}')">${state.fav.has(product.id) ? 'Saved' : 'Favorite'}</button><button onclick="toggleCompareById('${product.id}')">${state.compare.has(product.id) ? 'In compare' : 'Compare'}</button><button onclick="addToCartById('${product.id}')">Quote</button></td></tr>`;
  };

  window.renderCompare = function renderCompare() {
    const section = document.getElementById('compareSection');
    const host = document.getElementById('compareTable');
    if (!section || !host) return;
    const products = [...state.compare.values()];
    section.hidden = products.length === 0;
    if (!products.length) {
      host.innerHTML = '';
      return;
    }
    const specs = [
      ['Code', 'code'],
      ['Product', 'name'],
      ['Category', 'category'],
      ['Packing', 'packing'],
      ['Phase', 'phase'],
      ['Particle', 'particle'],
      ['Pore', 'pore'],
      ['ID', 'diameter'],
      ['Length', 'length'],
      ['Applications', 'applications']
    ];
    host.innerHTML = `
      <div class="compare-toolbar">
        <strong>${products.length} product${products.length === 1 ? '' : 's'} selected</strong>
        <button class="button ghost" type="button" onclick="clearCompare()">Clear compare</button>
      </div>
      <div class="table-wrap">
        <table class="product-table compare-products-table">
          <thead>
            <tr><th>Specification</th>${products.map((product) => `<th>${esc(product.code)}<br><button type="button" onclick="toggleCompareById('${product.id}')">Remove</button></th>`).join('')}</tr>
          </thead>
          <tbody>
            ${specs.map(([label, field]) => `<tr><th>${esc(label)}</th>${products.map((product) => `<td>${field === 'applications' ? badges(product) : esc(product[field] || '-')}</td>`).join('')}</tr>`).join('')}
            <tr><th>Action</th>${products.map((product) => `<td><button class="button primary" type="button" onclick="addToCartById('${product.id}')">Add to quote</button></td>`).join('')}</tr>
          </tbody>
        </table>
      </div>`;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.clearCompare = function clearCompare() {
    state.compare.clear();
    renderCompare();
    renderProducts();
  };
})();
