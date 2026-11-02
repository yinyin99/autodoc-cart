// Run: node test.js
const assert = require('assert');
const fs = require('fs');
const { SITES, DEFAULTS, parsePrice, siteOf, swapHost, loadSettings, transferTarget, compareTable, pool } = require('./autodoc-cart.user.js');

// parsePrice: European formats incl. the site's "27, 99 €" quirk, other currencies
assert.strictEqual(parsePrice('1 234,56 €'), 1234.56);
assert.strictEqual(parsePrice('1\u00a0234,56\u00a0€'), 1234.56);
assert.strictEqual(parsePrice('1\u202f234,56 €'), 1234.56);
assert.strictEqual(parsePrice('27, 99 €'), 27.99);
assert.strictEqual(parsePrice('0,99€'), 0.99);
assert.strictEqual(parsePrice('1.234,56'), 1234.56);
assert.strictEqual(parsePrice('1,234.56'), 1234.56);
assert.strictEqual(parsePrice('22.49'), 22.49);
assert.strictEqual(parsePrice('12,5'), 12.5);
assert.strictEqual(parsePrice('£22.49'), 22.49);
assert.strictEqual(parsePrice('CHF 1’234.50'), 1234.5);
assert.strictEqual(parsePrice("CHF 1'234.50"), 1234.5);
assert.strictEqual(parsePrice('R$ 1.234,56'), 1234.56);
assert.strictEqual(parsePrice('12 345 Ft'), 12345);
for (const [s, n] of [['58, 49 €', 58.49], ['€ 64, 99', 64.99], ['€55. 49', 55.49], ['CHF 60. 49', 60.49], ['£52. 49', 52.49],
  ['577, 99 kr.', 577.99], ['693, 99 kr', 693.99], ['282, 99 zł', 282.99], ['1502, 00 Kč', 1502], ['23 009 Ft', 23009],
  ['332, 99 lei', 332.99], ['R$426, 75', 426.75]]) assert.strictEqual(parsePrice(s), n, s);
assert.strictEqual(parsePrice('249,00 zł'), 249);
assert.ok(isNaN(parsePrice('')));
assert.ok(isNaN(parsePrice('n/a')));
assert.ok(isNaN(parsePrice(undefined)));

// SITES: unique hosts, labels, valid currency codes; header @match/@connect lists exactly the hosts
assert.strictEqual(new Set(SITES.map((s) => s.host)).size, SITES.length);
assert.strictEqual(new Set(SITES.map((s) => s.country)).size, SITES.length);
assert.ok(SITES.every((s) => /^www\.[a-z0-9.-]+$/.test(s.host) && /^[A-Z]{3}$/.test(s.cur) && s.country));
const header = fs.readFileSync(__dirname + '/autodoc-cart.user.js', 'utf8').split('==/UserScript==')[0];
const tag = (name) => [...header.matchAll(new RegExp(`@${name}\\s+(\\S+)`, 'g'))].map((m) => m[1]);
assert.deepStrictEqual(tag('match'), SITES.map((s) => `https://${s.host}/*`));
assert.deepStrictEqual(tag('connect'), SITES.map((s) => s.host));

// swapHost: any supported site to any other, path/query kept, unknown host rejected both ways
assert.strictEqual(swapHost('https://www.auto-doc.fr/ridex/16152230', 'www.autodoc.lu'), 'https://www.autodoc.lu/ridex/16152230');
assert.strictEqual(swapHost('https://www.autodoc.lu/ridex/16152230?a=1', 'www.auto-doc.fr'), 'https://www.auto-doc.fr/ridex/16152230?a=1');
assert.strictEqual(swapHost('https://www.autodoc.de/ridex/1', 'www.autopecas.br.com'), 'https://www.autopecas.br.com/ridex/1');
assert.strictEqual(swapHost('https://www.autodoc.co.uk/a/1', 'www.autodoc24.ch'), 'https://www.autodoc24.ch/a/1');
assert.throws(() => swapHost('https://example.com/x', 'www.autodoc.lu'), /unsupported host example\.com/);
assert.throws(() => swapHost('https://www.autodoc.lu/x', 'example.com'), /unsupported host example\.com/);

// loadSettings: defaults, valid stored values kept, unknown hosts dropped/replaced
assert.deepStrictEqual(loadSettings(undefined), DEFAULTS);
assert.deepStrictEqual(DEFAULTS, { target: 'www.autodoc.lu', home: 'www.auto-doc.fr', compare: ['www.auto-doc.fr', 'www.autodoc.lu'], clear: true });
assert.ok(siteOf(DEFAULTS.target) && siteOf(DEFAULTS.home) && DEFAULTS.compare.every(siteOf));
const s1 = loadSettings({ target: 'www.autodoc.de', compare: ['www.autodoc.de', 'gone.example', 'www.autodoc.co.uk'], clear: false });
assert.deepStrictEqual(s1, { target: 'www.autodoc.de', home: 'www.auto-doc.fr', compare: ['www.autodoc.de', 'www.autodoc.co.uk'], clear: false });
assert.strictEqual(loadSettings({ target: 'gone.example', home: 'gone.example' }).target, DEFAULTS.target);
assert.deepStrictEqual(loadSettings({ compare: 'nope' }).compare, DEFAULTS.compare);
assert.deepStrictEqual(loadSettings({ compare: [] }).compare, []);

// transferTarget: to the target, back to home when already on the target, null if no different site
assert.strictEqual(transferTarget('www.auto-doc.fr', DEFAULTS), 'www.autodoc.lu');
assert.strictEqual(transferTarget('www.autodoc.de', DEFAULTS), 'www.autodoc.lu');
assert.strictEqual(transferTarget('www.autodoc.lu', DEFAULTS), 'www.auto-doc.fr');
assert.strictEqual(transferTarget('www.autodoc.lu', { ...DEFAULTS, home: 'www.autodoc.lu' }), null);

// compareTable: this site + 3 others (2 EUR, 1 CHF); totals per currency group over lines priced on all its columns
const items = [{ qty: 2 }, { qty: 1 }, { qty: 1 }];
const t = compareTable(items, [
  { host: 'fr', cur: 'EUR', prices: [27.99, 10, 5] },
  { host: 'lu', cur: 'EUR', prices: [22.49, 11, NaN] },
  { host: 'de', cur: 'EUR', prices: [24, 9, 6] },
  { host: 'ch', cur: 'CHF', prices: [20, NaN, NaN] },
]);
assert.deepStrictEqual(t.map((c) => c.total), [65.98, 55.98, 57, 40]); // EUR: line 3 left out (lu has no price); CHF: its own group
assert.deepStrictEqual(t.map((c) => c.best), [false, true, false, false]); // cheapest EUR column; lone CHF column never "best"
assert.deepStrictEqual(t.map((c) => c.totalDiff), [0, -10, -8.98, NaN]); // no diff across currencies
assert.deepStrictEqual(t[1].used, [true, true, false]);
assert.deepStrictEqual(t[3].used, [true, false, false]);
assert.strictEqual(t[1].diffs[0], 22.49 - 27.99);
assert.ok(isNaN(t[3].diffs[0]));
// this site non-EUR: EUR columns still compare among themselves, nothing is compared with this site
const u = compareTable([{ qty: 1 }], [
  { host: 'ch', cur: 'CHF', prices: [30] }, { host: 'fr', cur: 'EUR', prices: [28] }, { host: 'lu', cur: 'EUR', prices: [25] },
]);
assert.deepStrictEqual(u.map((c) => c.best), [false, false, true]);
assert.ok(u.slice(1).every((c) => isNaN(c.totalDiff)));
// equal totals: nothing highlighted
assert.ok(compareTable([{ qty: 1 }], [{ host: 'a', cur: 'EUR', prices: [5] }, { host: 'b', cur: 'EUR', prices: [5] }]).every((c) => !c.best));

// pool: never more than n in flight, results in input order despite out-of-order completion
(async () => {
  let live = 0, peak = 0;
  const out = await pool([30, 5, 20, 1, 10, 2], 4, async (ms, i) => {
    peak = Math.max(peak, ++live);
    await new Promise((r) => setTimeout(r, ms));
    live--;
    return i;
  });
  assert.deepStrictEqual(out, [0, 1, 2, 3, 4, 5]);
  assert.strictEqual(peak, 4);
  assert.deepStrictEqual(await pool([], 4, async () => 1), []);
  console.log('all checks passed');
})();
