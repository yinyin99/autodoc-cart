// ==UserScript==
// @name         Autodoc cart (.fr <-> .lu)
// @namespace    https://github.com/yinyin99/autodoc-cart
// @version      0.1.1
// @author       yinyin99
// @description  Rebuild your auto-doc.fr cart on autodoc.lu (and back) and compare item prices.
// @license      MIT
// @match        https://www.auto-doc.fr/*
// @match        https://www.autodoc.lu/*
// @noframes
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        unsafeWindow
// @connect      www.auto-doc.fr
// @connect      www.autodoc.lu
// @downloadURL  https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js
// @updateURL    https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---- Everything site-specific lives in this block ------------------------
  const SITES = { 'www.auto-doc.fr': 'www.autodoc.lu', 'www.autodoc.lu': 'www.auto-doc.fr' };
  const CART_PATH = /^\/basket(\.html)?\/?$/;
  // Same-origin POST the site's own "Buy" button uses. Quantity is ADDED to the cart.
  const ADD_URL = '/ajax/cart/update';
  const SEL = {
    // The cart page is a React app with hashed CSS classes: only data-* hooks are stable.
    // Upsell tiles below the cart also carry data-product-id, but only real lines have a remove button.
    cartItem: '[data-product-id]:has([data-product-click="remove"])', // :has() needs Chrome 105+ / Firefox 121+
    itemLink: 'a[data-product-click="image"]',
    itemTitle: '[data-product-click="title"]',
    // Legacy (jQuery) product page
    priceText: '.product-card__price-wrap',
    buyButton: (id) => `[data-cart-button-add="${id}"]`,
  };
  const QUEUE = 'adcs_queue';
  const QUEUE_TTL = 15 * 60e3;
  const ADD_TIMEOUT = 60e3; // the site's fetch waits for Cloudflare Turnstile before sending

  // ---- Pure helpers (unit-tested in test.js) -------------------------------
  // "1 234,56 €", "27, 99 €" (the site really renders a space after the comma), "22.49", "1.234,56".
  // shortcut: a lone "1.234" reads as 1.234, not 1234; fine for prices shown with cents.
  const parsePrice = (s) => {
    const m = String(s ?? '').replace(/[\s\u00a0\u202f]/g, '').match(/\d[\d.,]*/);
    if (!m) return NaN;
    const n = m[0], c = n.lastIndexOf(','), d = n.lastIndexOf('.');
    return parseFloat(c > d ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, ''));
  };

  const swapDomain = (href) => {
    const u = new URL(href);
    if (!SITES[u.hostname]) throw new Error('unsupported host ' + u.hostname);
    u.hostname = SITES[u.hostname];
    return u.href;
  };

  // items: [{name, qty, price}] on this site; prices: price on the other site per item (NaN = unknown).
  // Totals only cover items priced on both sites so they stay comparable.
  const compareRows = (items, prices) => {
    const rows = items.map((it, i) => ({ ...it, other: prices[i], diff: prices[i] - it.price }));
    const ok = rows.filter((r) => !isNaN(r.other));
    const sum = (f) => Math.round(ok.reduce((s, r) => s + f(r) * r.qty, 0) * 100) / 100;
    const here = sum((r) => r.price), there = sum((r) => r.other);
    return { rows, here, there, diff: Math.round((there - here) * 100) / 100, missing: rows.length - ok.length };
  };

  if (typeof module !== 'undefined') {
    module.exports = { parsePrice, swapDomain, compareRows };
    return;
  }

  // ---- Browser-only code ---------------------------------------------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (cond, ms) => {
    for (let t = 0; t < ms; t += 250) { const v = cond(); if (v) return v; await sleep(250); }
  };
  const withTimeout = (p, ms) =>
    Promise.race([p, sleep(ms).then(() => { throw new Error('timeout (Cloudflare check pending?)'); })]);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = (n) => (isNaN(n) ? 'n/a' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }));
  const tld = (host) => '.' + host.split('.').pop();
  const absUrl = (path) => new URL(path, location.href).href;

  const scrapeCart = () =>
    [...document.querySelectorAll(SEL.cartItem)].map((el) => ({
      id: el.dataset.productId,
      qty: +el.dataset.qty,
      price: +el.dataset.price, // unit price, as displayed
      path: new URL(el.querySelector(SEL.itemLink)?.getAttribute('href') || '/', location.href).pathname,
      name: el.querySelector(SEL.itemTitle)?.textContent.trim() || el.dataset.productId,
    }));

  // ---- UI (plain DOM, no framework) ----------------------------------------
  const BOX = 'position:fixed;z-index:2147483647;font:14px/1.4 system-ui,sans-serif;color:#222;background:#fff;' +
    'border:1px solid #888;border-radius:8px;box-shadow:0 4px 20px #0006;padding:12px;';
  const put = (id, style, html) => {
    let el = document.getElementById(id);
    if (!el) { el = document.body.appendChild(document.createElement('div')); el.id = id; }
    el.style.cssText = BOX + style;
    el.innerHTML = html;
  };
  const overlay = (title, html) =>
    put('adcs-overlay', 'top:50%;left:50%;transform:translate(-50%,-50%);max-width:90vw;max-height:80vh;overflow:auto;min-width:280px;',
      `<b>${esc(title)}</b> <button data-adcs="close" style="float:right">×</button><div style="margin-top:8px">${html}</div>`);
  const bar = () => {
    const to = tld(SITES[location.hostname]), from = tld(location.hostname);
    put('adcs-bar', 'bottom:16px;left:16px;',
      `<button data-adcs="transfer">Transfer cart → ${to}</button> <button data-adcs="compare">Compare prices ${from} / ${to}</button>`);
  };

  // ---- Source side: queue the cart, open the other site -------------------
  const transfer = () => {
    const items = scrapeCart(), to = SITES[location.hostname];
    if (!items.length) return overlay('Transfer cart', 'Cart is empty.');
    GM_setValue(QUEUE, { to, items, t: Date.now() });
    // Land on a product page: only those load the site's add-to-cart code + Turnstile check.
    GM_openInTab(swapDomain(absUrl(items[0].path)), { active: true });
    overlay('Transfer cart', `Opened ${esc(to)} in a new tab to rebuild ${items.length} article(s) there.`);
  };

  // ---- Target side: add each queued item with the site's own request -------
  const addToCart = async (it) => {
    const w = unsafeWindow, s = w.document.vars.siteSettings;
    const res = await withTimeout(w.fetch(ADD_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': w.csrfToken,
        'Translation-Current-Route': s.route,
        'Translation-Current-Page': s.currentPage,
      },
      body: new URLSearchParams({ id: it.id, quantity: it.qty, 'head-cart': 'true', route: s.route }).toString(),
    }), ADD_TIMEOUT);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const products = (await res.json()).cart?.products || [];
    if (!products.some((p) => String(p.articleId) === it.id)) throw new Error('not in cart afterwards');
  };

  const consume = async () => {
    const q = GM_getValue(QUEUE);
    if (!q || q.to !== location.hostname) return;
    if (Date.now() - q.t > QUEUE_TTL) return GM_deleteValue(QUEUE);
    const w = unsafeWindow;
    if (!(await waitFor(() => w.csrfToken && w.document.vars?.siteSettings, 10000)))
      return overlay('Cart transfer pending',
        'This page cannot add to the cart. Open any product page on this site to continue.<br>' +
        '<button data-adcs="cancel">Cancel transfer</button>');
    GM_deleteValue(QUEUE); // adding is additive: never run a queue twice
    const failed = [];
    for (const [i, it] of q.items.entries()) {
      overlay('Rebuilding cart', `Adding ${i + 1}/${q.items.length}: ${esc(it.name)} × ${it.qty}…`);
      try { await addToCart(it); } catch (e) { failed.push(`${esc(it.name)} (${esc(e.message)})`); }
    }
    if (!failed.length) {
      overlay('Cart transferred', `${q.items.length} article(s) added. Opening cart…`);
      await sleep(1500);
      location.href = '/basket';
    } else {
      overlay('Cart partly transferred',
        `${q.items.length - failed.length}/${q.items.length} added. Not added:<ul>${failed.map((f) => `<li>${f}</li>`).join('')}</ul>` +
        '<a href="/basket">Open cart</a>');
    }
  };

  // ---- Compare: read the other site's product pages ------------------------
  const gmGet = (url) => new Promise((ok, fail) =>
    GM_xmlhttpRequest({ method: 'GET', url, timeout: 20000, onload: ok,
      onerror: () => fail(new Error('network error')), ontimeout: () => fail(new Error('timeout')) }));

  const otherPrice = async (it) => {
    const url = swapDomain(absUrl(it.path));
    const r = await gmGet(url);
    if (r.status !== 200) throw new Error('HTTP ' + r.status); // 403 = Cloudflare check, open the other site once
    if (!(r.finalUrl || url).includes(it.id)) throw new Error('not sold there'); // redirected to home/category
    const doc = new DOMParser().parseFromString(r.responseText, 'text/html');
    const p = parsePrice(doc.querySelector(SEL.priceText)?.textContent ?? doc.querySelector(SEL.buyButton(it.id))?.dataset.price);
    if (isNaN(p)) throw new Error('price not found');
    return p;
  };

  const compare = async () => {
    const items = scrapeCart(), prices = [], errs = [];
    for (const [i, it] of items.entries()) {
      overlay('Compare prices', `Fetching ${i + 1}/${items.length}…`);
      try { prices.push(await otherPrice(it)); errs.push(''); } catch (e) { prices.push(NaN); errs.push(e.message); }
    }
    const a = tld(location.hostname), b = tld(SITES[location.hostname]), c = compareRows(items, prices);
    const sign = (d) => (isNaN(d) ? 'n/a' : (d > 0 ? '+' : '') + eur(d));
    const col = (d) => (d < 0 ? 'color:#0a7d2c' : d > 0 ? 'color:#b00020' : '');
    const td = (extra = '') => `style="padding:2px 8px;text-align:right;${extra}"`;
    const rows = c.rows.map((r, i) =>
      `<tr><td style="padding:2px 8px">${esc(r.name)}</td><td ${td()}>${r.qty}</td><td ${td()}>${eur(r.price)}</td>` +
      `<td ${td()} title="${esc(errs[i])}">${eur(r.other)}</td><td ${td(col(r.diff))}>${sign(r.diff)}</td></tr>`).join('');
    overlay('Compare prices (unit prices, VAT included)',
      `<table><tr><th>Article</th><th>Qty</th><th>${a}</th><th>${b}</th><th>${b} − ${a}</th></tr>${rows}` +
      `<tr><td><b>Total</b></td><td></td><td ${td()}><b>${eur(c.here)}</b></td><td ${td()}><b>${eur(c.there)}</b></td>` +
      `<td ${td(col(c.diff))}><b>${sign(c.diff)}</b></td></tr></table>` +
      (c.missing ? `<p>${c.missing} article(s) without a price on ${b} are left out of the totals (hover "n/a" for the reason).</p>` : '') +
      '<p><small>Item prices only. Shipping and VAT rules differ per country and are not included.</small></p>');
  };

  const ACTIONS = {
    transfer, compare,
    close: () => document.getElementById('adcs-overlay')?.remove(),
    cancel: () => { GM_deleteValue(QUEUE); ACTIONS.close(); },
  };
  document.addEventListener('click', (e) => ACTIONS[e.target.dataset?.adcs]?.());

  consume();
  if (CART_PATH.test(location.pathname))
    // The cart renders client-side; inject only once lines exist (avoids React hydration clashes).
    waitFor(() => scrapeCart().length, 30000).then((ok) => ok && bar());
})();
