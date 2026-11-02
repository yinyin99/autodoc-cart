// ==UserScript==
// @name         Autodoc cart transfer & price compare
// @namespace    https://github.com/yinyin99/autodoc-cart
// @version      0.2.4
// @author       yinyin99
// @description  Rebuild your Autodoc cart on another Autodoc country site and compare item prices across countries.
// @license      MIT
// @match        https://www.autodoc.de/*
// @match        https://www.auto-doc.at/*
// @match        https://www.auto-doc.ch/*
// @match        https://www.autodoc24.ch/*
// @match        https://www.autodoc.lu/*
// @match        https://www.autodoc.be/*
// @match        https://www.auto-doc.be/*
// @match        https://www.auto-doc.fr/*
// @match        https://www.autodoc24.fr/*
// @match        https://www.autodoc.nl/*
// @match        https://www.autodoc24.nl/*
// @match        https://www.auto-doc.it/*
// @match        https://www.autodoc24.it/*
// @match        https://www.autodoc.es/*
// @match        https://www.auto-doc.pt/*
// @match        https://www.autodoc.co.uk/*
// @match        https://www.auto-doc.ie/*
// @match        https://www.autodoc.dk/*
// @match        https://www.autodoc.co.no/*
// @match        https://www.autodoc.se/*
// @match        https://www.autodoc.fi/*
// @match        https://www.autodoc.pl/*
// @match        https://www.autodoc.cz/*
// @match        https://www.autodoc.sk/*
// @match        https://www.autodoc.si/*
// @match        https://www.autodoc.hu/*
// @match        https://www.autodoc24.ro/*
// @match        https://www.autodoc.bg/*
// @match        https://www.autodoc.gr/*
// @match        https://www.autodoc.ee/*
// @match        https://www.autodoc.lv/*
// @match        https://www.autodoc.lt/*
// @match        https://www.autodoc.parts/*
// @match        https://www.autopecas.br.com/*
// @noframes
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        unsafeWindow
// @connect      www.autodoc.de
// @connect      www.auto-doc.at
// @connect      www.auto-doc.ch
// @connect      www.autodoc24.ch
// @connect      www.autodoc.lu
// @connect      www.autodoc.be
// @connect      www.auto-doc.be
// @connect      www.auto-doc.fr
// @connect      www.autodoc24.fr
// @connect      www.autodoc.nl
// @connect      www.autodoc24.nl
// @connect      www.auto-doc.it
// @connect      www.autodoc24.it
// @connect      www.autodoc.es
// @connect      www.auto-doc.pt
// @connect      www.autodoc.co.uk
// @connect      www.auto-doc.ie
// @connect      www.autodoc.dk
// @connect      www.autodoc.co.no
// @connect      www.autodoc.se
// @connect      www.autodoc.fi
// @connect      www.autodoc.pl
// @connect      www.autodoc.cz
// @connect      www.autodoc.sk
// @connect      www.autodoc.si
// @connect      www.autodoc.hu
// @connect      www.autodoc24.ro
// @connect      www.autodoc.bg
// @connect      www.autodoc.gr
// @connect      www.autodoc.ee
// @connect      www.autodoc.lv
// @connect      www.autodoc.lt
// @connect      www.autodoc.parts
// @connect      www.autopecas.br.com
// @connect      api.frankfurter.dev
// @downloadURL  https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js
// @updateURL    https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---- Everything site-specific lives in this block ------------------------
  // The only place to add/remove a country. Keep the @match / @connect header lines in sync (test.js checks it).
  // cur = currency the site shows; compareTable converts to this site's currency with exchange rates when it has them.
  const SITES = [
    { country: 'Germany', host: 'www.autodoc.de', cur: 'EUR' },
    { country: 'Austria', host: 'www.auto-doc.at', cur: 'EUR' },
    { country: 'Switzerland (DE)', host: 'www.auto-doc.ch', cur: 'CHF' },
    { country: 'Switzerland (FR)', host: 'www.autodoc24.ch', cur: 'CHF' },
    { country: 'Luxembourg', host: 'www.autodoc.lu', cur: 'EUR' },
    { country: 'Belgium (NL)', host: 'www.autodoc.be', cur: 'EUR' },
    { country: 'Belgium (FR)', host: 'www.auto-doc.be', cur: 'EUR' },
    { country: 'France', host: 'www.auto-doc.fr', cur: 'EUR' },
    { country: 'France (EN)', host: 'www.autodoc24.fr', cur: 'EUR' },
    { country: 'Netherlands', host: 'www.autodoc.nl', cur: 'EUR' },
    { country: 'Netherlands (EN)', host: 'www.autodoc24.nl', cur: 'EUR' },
    { country: 'Italy', host: 'www.auto-doc.it', cur: 'EUR' },
    { country: 'Italy (EN)', host: 'www.autodoc24.it', cur: 'EUR' },
    { country: 'Spain', host: 'www.autodoc.es', cur: 'EUR' },
    { country: 'Portugal', host: 'www.auto-doc.pt', cur: 'EUR' },
    { country: 'United Kingdom', host: 'www.autodoc.co.uk', cur: 'GBP' },
    { country: 'Ireland', host: 'www.auto-doc.ie', cur: 'EUR' },
    { country: 'Denmark', host: 'www.autodoc.dk', cur: 'DKK' },
    { country: 'Norway', host: 'www.autodoc.co.no', cur: 'NOK' },
    { country: 'Sweden', host: 'www.autodoc.se', cur: 'SEK' },
    { country: 'Finland', host: 'www.autodoc.fi', cur: 'EUR' },
    { country: 'Poland', host: 'www.autodoc.pl', cur: 'PLN' },
    { country: 'Czech Republic', host: 'www.autodoc.cz', cur: 'CZK' },
    { country: 'Slovakia', host: 'www.autodoc.sk', cur: 'EUR' },
    { country: 'Slovenia', host: 'www.autodoc.si', cur: 'EUR' },
    { country: 'Hungary', host: 'www.autodoc.hu', cur: 'HUF' },
    { country: 'Romania', host: 'www.autodoc24.ro', cur: 'RON' },
    { country: 'Bulgaria', host: 'www.autodoc.bg', cur: 'EUR' },
    { country: 'Greece', host: 'www.autodoc.gr', cur: 'EUR' },
    { country: 'Estonia', host: 'www.autodoc.ee', cur: 'EUR' },
    { country: 'Latvia', host: 'www.autodoc.lv', cur: 'EUR' },
    { country: 'Lithuania', host: 'www.autodoc.lt', cur: 'EUR' },
    { country: 'International (EN)', host: 'www.autodoc.parts', cur: 'EUR' },
    { country: 'Brazil', host: 'www.autopecas.br.com', cur: 'BRL' },
  ];
  const DEFAULTS = {
    target: 'www.autodoc.lu', // where "Transfer cart" sends the cart
    home: 'www.auto-doc.fr', // where it goes instead when you are already on the target site
    compare: ['www.auto-doc.fr', 'www.autodoc.lu'], // few countries by default: every one costs one request per article
    clear: true, // empty the target cart before adding (the target cart is the one being rebuilt)
  };
  const CART_PATH = /^\/basket(\.html)?\/?$/;
  // Same-origin POST the site's own "Buy" button uses. Quantity is ADDED to the cart,
  // or SET with set=true (quantity 0 = remove the line: what the legacy cart's delete button sends).
  const CART_UPDATE = '/ajax/cart/update';
  // Same-origin GET: current cart as JSON ({cart: {products: [...]}}), no change.
  const CART_STATE = '/ajax/cart/mini-basket';
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
  const SETTINGS = 'adcs_settings';
  const QUEUE_TTL = 15 * 60e3;
  const ADD_TIMEOUT = 60e3; // the site's fetch waits for Cloudflare Turnstile before sending
  const PARALLEL = 4; // max price-comparison reads in flight at once (cart adds stay sequential)
  const RATES = 'adcs_rates';
  const RATES_TTL = 24 * 3600e3; // exchange rates are fetched at most once a day
  const RATES_HOST = 'api.frankfurter.dev'; // Frankfurter: ECB reference rates, per 1 EUR; one call returns every currency of SITES
  const RATES_URL = `https://${RATES_HOST}/v2/rates?base=EUR&quotes=${[...new Set(SITES.map((s) => s.cur))].filter((c) => c !== 'EUR').join(',')}`;

  // ---- Pure helpers (unit-tested in test.js) -------------------------------
  // "1 234,56 €", "27, 99 €" (the site really renders a space after the comma), "22.49", "1.234,56", "CHF 1’234.50".
  // shortcut: a lone "1.234" reads as 1.234, not 1234; fine for prices shown with cents.
  const parsePrice = (s) => {
    const m = String(s ?? '').replace(/[\s\u00a0\u202f'\u2019]/g, '').match(/\d[\d.,]*/);
    if (!m) return NaN;
    const n = m[0], c = n.lastIndexOf(','), d = n.lastIndexOf('.');
    return parseFloat(c > d ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, ''));
  };

  const siteOf = (host) => SITES.find((s) => s.host === host);

  // Same path/query on another supported site.
  const swapHost = (href, host) => {
    const u = new URL(href);
    if (!siteOf(u.hostname) || !siteOf(host)) throw new Error('unsupported host ' + (siteOf(host) ? u.hostname : host));
    u.hostname = host;
    return u.href;
  };

  // Stored settings -> valid settings (unknown hosts, e.g. after the list changed, fall back / drop out).
  const loadSettings = (raw) => {
    const r = { ...DEFAULTS, ...raw };
    const known = (h, d) => (siteOf(h) ? h : d);
    return {
      target: known(r.target, DEFAULTS.target),
      home: known(r.home, DEFAULTS.home),
      compare: (Array.isArray(r.compare) ? r.compare : DEFAULTS.compare).filter((h) => siteOf(h)),
      clear: !!r.clear,
    };
  };

  // Where "Transfer cart" goes from `host`; null if that would be the same site.
  const transferTarget = (host, s) => {
    const to = host === s.target ? s.home : s.target;
    return to === host ? null : to;
  };

  // Frankfurter v2 rows [{date, base, quote, rate}] -> {date (oldest row), rates: {CUR: units per 1 EUR}}.
  const parseRates = (rows) => {
    if (!Array.isArray(rows) || !rows.length || !rows.every((r) => r.base === 'EUR' && r.rate > 0)) throw new Error('unexpected rates response');
    return { date: rows.map((r) => r.date).sort()[0], rates: Object.fromEntries(rows.map((r) => [r.quote, r.rate])) };
  };

  // items: [{qty}]; cols: [{host, cur, prices}], cols[0] = this site; prices[i] = unit price of cart line i (NaN = unknown).
  // rates (optional): {CUR: units per 1 EUR}. A column whose currency and cols[0]'s both have a rate (EUR = 1) is converted to
  // cols[0]'s currency (conv, tcur) and compared with all such columns. Without rates, or for a currency missing in them, a column
  // stays in its own currency and only same-currency columns are compared. A column's total only covers the lines priced on
  // every column of its group. best = cheapest total of a group with 2+ columns; diffs/totalDiff are vs cols[0], same group only (else NaN).
  const compareTable = (items, cols, rates) => {
    const r2 = (n) => Math.round(n * 100) / 100;
    const rate = (cur) => (cur === 'EUR' ? 1 : rates?.[cur]);
    const tcur = (c) => (rate(c.cur) && rate(cols[0].cur) ? cols[0].cur : c.cur);
    const out = cols.map((c) => {
      const g = tcur(c), f = g === c.cur ? 1 : rate(g) / rate(c.cur);
      const conv = c.prices.map((p) => p * f);
      const peers = cols.filter((o) => tcur(o) === g);
      const used = items.map((_, i) => peers.every((p) => !isNaN(p.prices[i])));
      const total = r2(items.reduce((s, it, i) => s + (used[i] ? it.qty * conv[i] : 0), 0));
      return { ...c, tcur: g, conv, used, total, diffs: conv.map((p, i) => (g === cols[0].cur ? p - cols[0].prices[i] : NaN)) };
    });
    for (const c of out) {
      const t = out.filter((o) => o.tcur === c.tcur).map((o) => o.total);
      c.best = c.total === Math.min(...t) && Math.min(...t) < Math.max(...t);
      c.totalDiff = c.tcur === out[0].tcur ? r2(c.total - out[0].total) : NaN;
    }
    return out;
  };

  // Runs fn over items with at most n calls in flight; results keep item order. Once `signal` (AbortSignal) aborts, no new call starts.
  const pool = async (items, n, fn, signal) => {
    const out = new Array(items.length);
    let next = 0;
    const worker = async () => { while (next < items.length && !signal?.aborted) { const i = next++; out[i] = await fn(items[i], i); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
    return out;
  };

  if (typeof module !== 'undefined') {
    module.exports = { SITES, DEFAULTS, RATES_HOST, RATES_URL, parsePrice, siteOf, swapHost, loadSettings, transferTarget, parseRates, compareTable, pool };
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
  const money = (n, cur) => (isNaN(n) ? 'n/a' : n.toLocaleString('fr-FR', { style: 'currency', currency: cur }));
  const label = (s) => `${s.country} (${s.host.replace(/^www\./, '')})`;
  const absUrl = (path) => new URL(path, location.href).href;
  const settings = () => loadSettings(GM_getValue(SETTINGS));

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
    return el;
  };
  let cmp; // AbortController of the comparison in progress; closing or replacing its popup aborts it
  // `run` = the comparison's own controller: its progress must not re-open a popup the user closed or replaced.
  const overlay = (title, html, run) => {
    if (run?.signal.aborted) return;
    if (!run) cmp?.abort(); // any other popup replaces the comparison's
    const o = document.getElementById('adcs-overlay')?.style;
    const keep = o?.width ? `width:${o.width};height:${o.height};top:${o.top};left:${o.left};` : ''; // inline size = the user resized it: keep size and place
    // top/left, no transform: the resize handle then follows the mouse. Sticky header keeps × reachable while scrolling.
    const el = put('adcs-overlay', 'top:0;left:0;box-sizing:border-box;padding:0;overflow:auto;resize:both;min-height:80px;min-width:min(280px,calc(100vw - 16px));' +
      `max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);${keep}`,
      '<div style="position:sticky;top:0;left:0;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:8px 12px;background:#fff;border-bottom:1px solid #ddd">' +
      `<b>${esc(title)}</b><button data-adcs="close">×</button></div><div style="padding:8px 12px 12px">${html}</div>`);
    // shortcut: centered when the content changes, not when the window is resized.
    if (!keep) { el.style.left = Math.max(8, (innerWidth - el.offsetWidth) / 2) + 'px'; el.style.top = Math.max(8, (innerHeight - el.offsetHeight) / 2) + 'px'; }
  };
  const bar = () => {
    const to = siteOf(transferTarget(location.hostname, settings()));
    put('adcs-bar', 'bottom:16px;left:16px;',
      `<button data-adcs="transfer">Transfer cart → ${esc(to?.country ?? '?')}</button> ` +
      '<button data-adcs="compare">Compare prices</button> <button data-adcs="settings">Settings</button>');
  };

  // ---- Settings (saved on every change) ------------------------------------
  const setAll = (on) => {
    const f = document.getElementById('adcs-form');
    f.querySelectorAll('input[name=compare]').forEach((i) => { i.checked = on; });
    f.dispatchEvent(new Event('change', { bubbles: true })); // runs the save listener below
  };
  const showSettings = () => {
    const s = settings();
    const options = (sel) => SITES.map((x) => `<option value="${x.host}"${x.host === sel ? ' selected' : ''}>${esc(label(x))}</option>`).join('');
    overlay('Settings',
      `<form id="adcs-form">` +
      `<p><label>Transfer cart to <select name="target">${options(s.target)}</select></label></p>` +
      `<p><label>When already on that site, transfer to <select name="home">${options(s.home)}</select></label></p>` +
      `<p><label><input type="checkbox" name="clear"${s.clear ? ' checked' : ''}> Empty the target cart before adding (deletes what is in it)</label></p>` +
      '<p>Compare prices with <small>(one request per article and country)</small>: ' +
      '<button type="button" data-adcs="selectAll">Select all</button> <button type="button" data-adcs="deselectAll">Deselect all</button></p>' +
      '<div style="max-height:35vh;overflow:auto">' +
      SITES.map((x) => `<label style="display:block"><input type="checkbox" name="compare" value="${x.host}"${s.compare.includes(x.host) ? ' checked' : ''}> ${esc(label(x))} <small>${x.cur}</small></label>`).join('') +
      '</div><p><small>Changes are saved automatically.</small></p></form>');
  };
  document.addEventListener('change', (e) => {
    const f = e.target.closest?.('#adcs-form');
    if (!f) return;
    GM_setValue(SETTINGS, loadSettings({
      target: f.elements.target.value,
      home: f.elements.home.value,
      clear: f.elements.clear.checked,
      compare: [...f.querySelectorAll('input[name=compare]:checked')].map((i) => i.value),
    }));
    bar();
  });

  // ---- Source side: queue the cart, open the other site -------------------
  const transfer = () => {
    const s = settings(), to = transferTarget(location.hostname, s), items = scrapeCart();
    if (!to) return overlay('Transfer cart', 'This is the transfer target: choose a different "when already on that site" country in Settings.');
    if (!items.length) return overlay('Transfer cart', 'Cart is empty.');
    GM_setValue(QUEUE, { to, items, clear: s.clear, t: Date.now() });
    // Land on a product page: only those load the site's add-to-cart code + Turnstile check.
    GM_openInTab(swapHost(absUrl(items[0].path), to), { active: true });
    overlay('Transfer cart', `Opened ${esc(siteOf(to).country)} in a new tab to rebuild ${items.length} article(s) there` +
      `${s.clear ? ' (its cart is emptied first)' : ''}.`);
  };

  // ---- Target side: cart requests with the site's own fetch ----------------
  // Runs in the page: its fetch attaches the Turnstile token the server demands on POSTs.
  // params = POST form fields; none = GET. Resolves to the cart's lines after the call.
  const cartCall = async (url, params) => {
    const w = unsafeWindow, s = w.document.vars.siteSettings;
    const res = await withTimeout(w.fetch(url, {
      method: params ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': w.csrfToken,
        'Translation-Current-Route': s.route,
        'Translation-Current-Page': s.currentPage,
      },
      body: params && new URLSearchParams({ ...params, route: s.route }).toString(),
    }), ADD_TIMEOUT);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const cart = (await res.json()).cart;
    if (!cart) throw new Error('unexpected response');
    return Object.values(cart.products || {});
  };

  const addToCart = async (it) => {
    const lines = await cartCall(CART_UPDATE, { id: it.id, quantity: it.qty, 'head-cart': 'true' });
    if (!lines.some((p) => String(p.articleId) === it.id)) throw new Error('not in cart afterwards');
  };

  // shortcut: no rollback if a removal fails midway; the caller aborts and the cart stays partly emptied.
  const clearCart = async () => {
    for (const p of await cartCall(CART_STATE)) await cartCall(CART_UPDATE, { id: p.articleId, quantity: 0, set: 'true' });
    const left = await cartCall(CART_STATE); // verify with a fresh read, not the update responses
    if (left.length) throw new Error(`${left.length} article(s) still in the cart`);
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
    if (q.clear) {
      overlay('Rebuilding cart', 'Emptying the cart first…');
      try { await clearCart(); } catch (e) {
        return overlay('Cart transfer stopped',
          `Could not empty this cart (${esc(e.message)}). Nothing was added; the cart may be partly emptied.<br><a href="/basket">Open cart</a>`);
      }
    }
    const failed = [];
    // Sequential on purpose: parallel cart updates race server-side and silently drop articles (seen live).
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

  // ---- Compare: read the other sites' product pages -------------------------
  // Aborting `signal` aborts the request and rejects, so the pool's worker ends instead of hanging.
  const gmGet = (url, signal) => {
    let stop;
    return new Promise((ok, fail) => {
      const req = GM_xmlhttpRequest({ method: 'GET', url, timeout: 20000, onload: ok,
        onerror: () => fail(new Error('network error')), ontimeout: () => fail(new Error('timeout')) });
      stop = () => { req.abort(); fail(new Error('cancelled')); };
      signal.addEventListener('abort', stop);
    }).finally(() => signal.removeEventListener('abort', stop));
  };

  const otherPrice = async (it, host, signal) => {
    const url = swapHost(absUrl(it.path), host);
    const r = await gmGet(url, signal);
    if (r.status !== 200) throw new Error('HTTP ' + r.status); // 403 = Cloudflare check, open that site once
    if (!(r.finalUrl || url).includes(it.id)) throw new Error('not sold there'); // redirected to home/category
    const doc = new DOMParser().parseFromString(r.responseText, 'text/html');
    const p = parsePrice(doc.querySelector(SEL.priceText)?.textContent ?? doc.querySelector(SEL.buyButton(it.id))?.dataset.price);
    if (isNaN(p)) throw new Error('price not found');
    return p;
  };

  // Cached for 24 h in GM storage. A failed refresh falls back to the stale cache (or nothing); never throws.
  const getRates = async (signal) => {
    const c = GM_getValue(RATES);
    if (c && Date.now() - c.t < RATES_TTL) return c;
    try {
      const r = await gmGet(RATES_URL, signal);
      if (r.status !== 200) throw new Error('HTTP ' + r.status);
      const fresh = { t: Date.now(), ...parseRates(JSON.parse(r.responseText)) };
      GM_setValue(RATES, fresh);
      return fresh;
    } catch { return c && { ...c, stale: true }; }
  };

  const compare = async () => {
    const here = siteOf(location.hostname), items = scrapeCart();
    const others = SITES.filter((x) => settings().compare.includes(x.host) && x.host !== here.host);
    if (!others.length) return overlay('Compare prices', 'Tick at least one other country in Settings.');
    cmp?.abort(); // a second click replaces the comparison still running
    const run = (cmp = new AbortController());
    // One flat job list so up to PARALLEL reads run at once across all countries.
    const jobs = others.flatMap((o, k) => items.map((it, i) => ({ it, i, k, host: o.host })));
    const prices = others.map(() => []), e = others.map(() => []);
    let done = 0;
    overlay('Compare prices', `Fetching 0/${jobs.length}…`, run);
    // Rates only matter when the columns have different currencies; started now so it runs alongside the price reads.
    const ratesP = new Set([here, ...others].map((s) => s.cur)).size > 1 ? getRates(run.signal) : null;
    await pool(jobs, PARALLEL, async ({ it, i, k, host }) => {
      try { prices[k][i] = await otherPrice(it, host, run.signal); e[k][i] = ''; } catch (err) { prices[k][i] = NaN; e[k][i] = err.message; }
      overlay('Compare prices', `Fetched ${++done}/${jobs.length}…`, run);
    }, run.signal);
    const cols = [{ ...here, prices: items.map((it) => it.price) }, ...others.map((o, k) => ({ ...o, prices: prices[k] }))];
    const errs = [[], ...e];
    const fx = await ratesP;
    const t = compareTable(items, cols, fx?.rates);
    const sign = (d, cur) => (isNaN(d) ? '' : `<br><small style="${d < 0 ? 'color:#0a7d2c' : d > 0 ? 'color:#b00020' : ''}">${d > 0 ? '+' : ''}${money(d, cur)}</small>`);
    const td = (extra = '') => `style="padding:2px 8px;text-align:right;${extra}"`;
    const rows = items.map((it, i) =>
      `<tr><td style="padding:2px 8px">${esc(it.name)}</td><td ${td()}>${it.qty}</td>` +
      t.map((c, k) => `<td ${td()} title="${esc(errs[k][i])}">${money(c.prices[i], c.cur)}` +
        `${c.tcur !== c.cur && !isNaN(c.conv[i]) ? `<br><small>≈ ${money(c.conv[i], c.tcur)}</small>` : ''}${k ? sign(c.diffs[i], c.tcur) : ''}</td>`).join('') + '</tr>').join('');
    const converted = t.some((c) => c.tcur !== c.cur), mixed = t.some((c) => c.tcur !== t[0].tcur), short = t.some((c) => c.used.includes(false));
    overlay('Compare prices (unit prices, VAT included)',
      '<table><tr><th>Article</th><th>Qty</th>' +
      t.map((c) => `<th title="${esc(c.host)}">${esc(c.country)}<br><small>${c.cur}</small></th>`).join('') + '</tr>' + rows +
      `<tr><td><b>Total</b></td><td></td>${t.map((c, k) => `<td ${td(c.best ? 'background:#d8f5de;' : '')}><b>${c.tcur !== c.cur ? '≈ ' : ''}${money(c.total, c.tcur)}</b>${k ? sign(c.totalDiff, c.tcur) : ''}</td>`).join('')}</tr></table>` +
      '<p><small>Green background = cheapest total among the columns that can be compared.</small></p>' +
      (short ? '<p>Articles without a price on a country are left out of the totals of every column compared with it (hover "n/a" for the reason).</p>' : '') +
      (converted ? `<p><small>≈ = converted to ${t[0].cur}. Rates: Frankfurter (ECB), ${esc(fx.date)}${fx.stale ? ' (could not refresh, cached rates used)' : ''}. Approximate: each shop charges in its own currency.</small></p>` : '') +
      (mixed ? '<p><small>Columns in another currency are not converted or compared: exchange rates unavailable.</small></p>' : '') +
      '<p><small>Item prices only. Shipping and VAT rules differ per country and are not included.</small></p>', run);
  };

  const ACTIONS = {
    transfer, compare, settings: showSettings,
    selectAll: () => setAll(true),
    deselectAll: () => setAll(false),
    close: () => { cmp?.abort(); document.getElementById('adcs-overlay')?.remove(); },
    cancel: () => { GM_deleteValue(QUEUE); ACTIONS.close(); },
  };
  document.addEventListener('click', (e) => ACTIONS[e.target.dataset?.adcs]?.());

  consume();
  if (CART_PATH.test(location.pathname))
    // The cart renders client-side; inject only once lines exist (avoids React hydration clashes).
    waitFor(() => scrapeCart().length, 30000).then((ok) => ok && bar());
})();
