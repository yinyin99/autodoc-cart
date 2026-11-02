// Run: node test.js
const assert = require('assert');
const fs = require('fs');
const { SITES, DEFAULTS, RATES_HOST, RATES_URL, parsePrice, siteOf, swapHost, loadSettings, transferTarget, parseRates, compareTable, pool } = require('./autodoc-cart.user.js');

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
assert.deepStrictEqual(tag('connect'), [...SITES.map((s) => s.host), RATES_HOST]); // the shops + the exchange-rate API
assert.strictEqual(new URL(RATES_URL).hostname, RATES_HOST);
assert.deepStrictEqual(new URL(RATES_URL).searchParams.get('quotes').split(',').sort(), [...new Set(SITES.map((s) => s.cur))].filter((c) => c !== 'EUR').sort());

// swapHost: any supported site to any other, path/query kept, unknown host rejected both ways
assert.strictEqual(swapHost('https://www.auto-doc.fr/ridex/16152230', 'www.autodoc.lu'), 'https://www.autodoc.lu/ridex/16152230');
assert.strictEqual(swapHost('https://www.autodoc.lu/ridex/16152230?a=1', 'www.auto-doc.fr'), 'https://www.auto-doc.fr/ridex/16152230?a=1');
assert.strictEqual(swapHost('https://www.autodoc.de/ridex/1', 'www.autopecas.br.com'), 'https://www.autopecas.br.com/ridex/1');
assert.strictEqual(swapHost('https://www.autodoc.co.uk/a/1', 'www.autodoc24.ch'), 'https://www.autodoc24.ch/a/1');
assert.throws(() => swapHost('https://example.com/x', 'www.autodoc.lu'), /unsupported host example\.com/);
assert.throws(() => swapHost('https://www.autodoc.lu/x', 'example.com'), /unsupported host example\.com/);

// loadSettings: defaults, valid stored values kept, unknown hosts dropped/replaced
assert.deepStrictEqual(loadSettings(undefined), DEFAULTS);
assert.deepStrictEqual(DEFAULTS, { target: 'www.autodoc.lu', home: 'www.auto-doc.fr', compare: ['www.auto-doc.fr', 'www.autodoc.lu'], clear: true, resize: false });
assert.ok(siteOf(DEFAULTS.target) && siteOf(DEFAULTS.home) && DEFAULTS.compare.every(siteOf));
const s1 = loadSettings({ target: 'www.autodoc.de', compare: ['www.autodoc.de', 'gone.example', 'www.autodoc.co.uk'], clear: false, resize: 1 });
assert.deepStrictEqual(s1, { target: 'www.autodoc.de', home: 'www.auto-doc.fr', compare: ['www.autodoc.de', 'www.autodoc.co.uk'], clear: false, resize: true });
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

// parseRates: Frankfurter v2 rows; oldest date kept; anything unexpected throws
assert.deepStrictEqual(parseRates([{ date: '2026-11-02', base: 'EUR', quote: 'CHF', rate: 0.92 }, { date: '2026-10-30', base: 'EUR', quote: 'GBP', rate: 0.83 }]),
  { date: '2026-10-30', rates: { CHF: 0.92, GBP: 0.83 } });
for (const bad of [null, {}, [], [{ date: 'd', base: 'USD', quote: 'CHF', rate: 1 }], [{ date: 'd', base: 'EUR', quote: 'CHF', rate: 0 }]])
  assert.throws(() => parseRates(bad), /unexpected rates response/);

// compareTable with rates (units per 1 EUR): every column converted to this site's currency, native prices kept
const fx = { CHF: 0.5, GBP: 0.8 };
const e1 = compareTable([{ qty: 1 }, { qty: 2 }], [
  { host: 'fr', cur: 'EUR', prices: [10, 20] }, { host: 'ch', cur: 'CHF', prices: [4, 12] }, { host: 'uk', cur: 'GBP', prices: [8, 8] },
], fx);
assert.deepStrictEqual(e1.map((c) => c.tcur), ['EUR', 'EUR', 'EUR']);
assert.deepStrictEqual(e1[1].prices, [4, 12]); // native price untouched
assert.deepStrictEqual(e1[1].conv, [8, 24]);
assert.deepStrictEqual(e1.map((c) => c.total), [50, 56, 30]);
assert.deepStrictEqual(e1.map((c) => c.best), [false, false, true]); // cheapest across currencies
assert.deepStrictEqual(e1.map((c) => c.totalDiff), [0, 6, -20]);
assert.deepStrictEqual(e1[1].diffs, [-2, 4]);
// this site non-EUR: EUR->X and X->Y (via EUR) both work
const e2 = compareTable([{ qty: 1 }], [{ host: 'ch', cur: 'CHF', prices: [10] }, { host: 'fr', cur: 'EUR', prices: [4] }, { host: 'uk', cur: 'GBP', prices: [4] }], fx);
assert.deepStrictEqual(e2.map((c) => c.tcur), ['CHF', 'CHF', 'CHF']);
assert.deepStrictEqual(e2.map((c) => c.total), [10, 2, 2.5]);
assert.deepStrictEqual(e2.map((c) => c.best), [false, true, false]);
assert.deepStrictEqual(e2.map((c) => c.totalDiff), [0, -8, -7.5]);
// a currency without a rate stays in its own group, as without rates
const e3 = compareTable([{ qty: 1 }], [{ host: 'fr', cur: 'EUR', prices: [10] }, { host: 'ch', cur: 'CHF', prices: [4] }, { host: 'hu', cur: 'HUF', prices: [3000] }], { CHF: 0.5 });
assert.deepStrictEqual(e3.map((c) => c.tcur), ['EUR', 'EUR', 'HUF']);
assert.ok(isNaN(e3[2].totalDiff) && e3[2].best === false);
// rates missing => exactly the old behaviour (own-currency groups, no diffs across currencies)
const cols0 = [{ host: 'fr', cur: 'EUR', prices: [10] }, { host: 'ch', cur: 'CHF', prices: [4] }];
for (const none of [undefined, {}]) {
  const n = compareTable([{ qty: 1 }], cols0, none);
  assert.deepStrictEqual(n.map((c) => [c.tcur, c.total, c.best]), [['EUR', 10, false], ['CHF', 4, false]]);
  assert.ok(isNaN(n[1].totalDiff) && isNaN(n[1].diffs[0]));
}

// parsePrice edges: dotted thousands, several numbers (first wins), no digits
assert.strictEqual(parsePrice('1.234,00 €'), 1234);
assert.strictEqual(parsePrice('1.234.567,89'), 1234567.89);
assert.strictEqual(parsePrice('1 234 567,00'), 1234567);
assert.strictEqual(parsePrice('€ 12,50 / 2 Stk'), 12.5);
assert.strictEqual(parsePrice('0'), 0);
for (const junk of ['€', '-', 'abc', null, {}]) assert.ok(isNaN(parsePrice(junk)), String(junk));

// swapHost keeps path, query, hash and port; same host is a no-op; bare origin gets "/"; garbage URL throws
assert.strictEqual(swapHost('https://www.autodoc.de/a/b?x=1&y=2#frag', 'www.autodoc.lu'), 'https://www.autodoc.lu/a/b?x=1&y=2#frag');
assert.strictEqual(swapHost('https://www.autodoc.de:8443/a', 'www.autodoc.lu'), 'https://www.autodoc.lu:8443/a');
assert.strictEqual(swapHost('https://www.autodoc.de/a', 'www.autodoc.de'), 'https://www.autodoc.de/a');
assert.strictEqual(swapHost('https://www.autodoc.de', 'www.autodoc.lu'), 'https://www.autodoc.lu/');
assert.throws(() => swapHost('/relative/path', 'www.autodoc.lu'));

// loadSettings with corrupted storage: never throws, always valid
for (const bad of [null, 'garbage', 42, [], true]) assert.deepStrictEqual(loadSettings(bad), DEFAULTS, String(bad));
const wrong = loadSettings({ target: 5, home: {}, compare: [1, null, {}, 'www.autodoc.de'], clear: 0, resize: 'yes' });
assert.deepStrictEqual(wrong, { target: DEFAULTS.target, home: DEFAULTS.home, compare: ['www.autodoc.de'], clear: false, resize: true });
assert.strictEqual(loadSettings({ target: ['www.autodoc.de'] }).target, DEFAULTS.target); // an array is not a host
assert.deepStrictEqual(loadSettings({ compare: ['www.autodoc.de', 'www.autodoc.lu', 'www.autodoc.de'] }).compare, ['www.autodoc.de', 'www.autodoc.lu']); // no duplicate columns
assert.notStrictEqual(loadSettings({}).compare, DEFAULTS.compare); // callers may mutate the result

// transferTarget with target == home: from any other site go there, from it nowhere
const same = { ...DEFAULTS, target: 'www.autodoc.lu', home: 'www.autodoc.lu' };
assert.strictEqual(transferTarget('www.auto-doc.fr', same), 'www.autodoc.lu');
assert.strictEqual(transferTarget('www.autodoc.lu', same), null);

// parseRates: any bad row throws, row order irrelevant, oldest of several dates
for (const bad of [[{ date: 'd', base: 'EUR', quote: 'CHF', rate: 0.9 }, { date: 'd', base: 'USD', quote: 'GBP', rate: 0.8 }],
  [{ date: 'd', base: 'EUR', quote: 'CHF', rate: -1 }], [{ date: 'd', base: 'EUR', quote: 'CHF', rate: 'abc' }], [{ date: 'd', base: 'EUR', quote: 'CHF' }], 'x', [null]])
  assert.throws(() => parseRates(bad));
assert.strictEqual(parseRates([{ date: '2026-11-02', base: 'EUR', quote: 'A', rate: 1 }, { date: '2026-10-28', base: 'EUR', quote: 'B', rate: 1 }, { date: '2026-10-30', base: 'EUR', quote: 'C', rate: 1 }]).date, '2026-10-28');

// compareTable edges
const one = compareTable([{ qty: 2 }], [{ host: 'a', cur: 'EUR', prices: [5] }]); // single column: nothing to compare
assert.deepStrictEqual([one[0].best, one[0].totalDiff, one[0].diffs, one[0].total], [false, 0, [0], 10]);
const blank = compareTable([{ qty: 1 }], [{ host: 'a', cur: 'EUR', prices: [10] }, { host: 'b', cur: 'EUR', prices: [NaN] }]); // a column without any price
assert.deepStrictEqual(blank.map((c) => [c.used[0], c.total, c.best]), [[false, 0, false], [false, 0, false]]);
assert.ok(isNaN(blank[1].diffs[0]));
// totals are rounded to cents (no 0.30000000000000004), also after conversion
const cents = compareTable([{ qty: 3 }], [{ host: 'a', cur: 'EUR', prices: [0.1] }, { host: 'b', cur: 'EUR', prices: [0.2] }]);
assert.deepStrictEqual(cents.map((c) => c.total), [0.3, 0.6]);
assert.strictEqual(cents[1].totalDiff, 0.3);
assert.strictEqual(compareTable([{ qty: 1 }], [{ host: 'a', cur: 'EUR', prices: [1] }, { host: 'b', cur: 'CHF', prices: [9] }], { CHF: 0.9 })[1].total, 10);
// ties for the lowest total are all highlighted; the dearer one is not
assert.deepStrictEqual(compareTable([{ qty: 1 }], [5, 5, 7].map((p, k) => ({ host: 'h' + k, cur: 'EUR', prices: [p] }))).map((c) => c.best), [true, true, false]);
// this site's currency has no rate: every column keeps its own currency, no diffs across them
const norate = compareTable([{ qty: 1 }], [{ host: 'h', cur: 'HUF', prices: [3000] }, { host: 'f', cur: 'EUR', prices: [8] }, { host: 'c', cur: 'CHF', prices: [8] }], { CHF: 0.9 });
assert.deepStrictEqual(norate.map((c) => c.tcur), ['HUF', 'EUR', 'CHF']);
assert.ok(norate.slice(1).every((c) => isNaN(c.totalDiff) && !c.best));

// release header: semver, update URLs identical and pointing at main, @grant matches what the code uses
assert.match(tag('version')[0], /^\d+\.\d+\.\d+$/);
assert.strictEqual(tag('downloadURL')[0], 'https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js');
assert.strictEqual(tag('updateURL')[0], tag('downloadURL')[0]);
const used = [...new Set(fs.readFileSync(__dirname + '/autodoc-cart.user.js', 'utf8').split('==/UserScript==')[1].match(/\b(?:GM_\w+|unsafeWindow)\b/g))].sort();
assert.deepStrictEqual(tag('grant').sort(), used);

// pool: never more than n in flight, results in input order despite out-of-order completion; no new call once the signal aborts
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
  let started = 0;
  const ac = new AbortController();
  await pool([1, 2, 3, 4, 5, 6, 7, 8], 2, async () => { if (++started === 2) ac.abort(); await new Promise((r) => setTimeout(r, 5)); }, ac.signal);
  assert.strictEqual(started, 2); // the two in flight finish, nothing else starts
  // n larger than the input, and n = 1 runs strictly one after the other in order
  let peak2 = 0, live2 = 0;
  assert.deepStrictEqual(await pool([1, 2], 10, async (x) => { peak2 = Math.max(peak2, ++live2); await new Promise((r) => setTimeout(r, 2)); live2--; return x; }), [1, 2]);
  assert.strictEqual(peak2, 2);
  const order = [];
  await pool([10, 1, 5], 1, async (ms, i) => { order.push('s' + i); await new Promise((r) => setTimeout(r, ms)); order.push('e' + i); });
  assert.deepStrictEqual(order, ['s0', 'e0', 's1', 'e1', 's2', 'e2']);
  // a rejection propagates to the caller
  await assert.rejects(pool([1, 2, 3], 2, async (x) => { if (x === 2) throw new Error('boom'); return x; }), /boom/);
  // abort mid-run: finished calls keep their result, never-started items stay undefined
  const ac2 = new AbortController();
  const part = await pool([0, 1, 2, 3, 4], 1, async (x) => { if (x === 1) ac2.abort(); return x * 10; }, ac2.signal);
  assert.deepStrictEqual([...part], [0, 10, undefined, undefined, undefined]);
  started = 0;
  await pool([1, 2, 3], 2, async () => { started++; }, ac.signal);
  assert.strictEqual(started, 0); // already aborted
  console.log('all checks passed');
})();
