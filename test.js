// Run: node test.js
const assert = require('assert');
const { parsePrice, swapDomain, compareRows } = require('./autodoc-cart.user.js');

// parsePrice: European formats incl. the site's "27, 99 €" quirk
assert.strictEqual(parsePrice('1 234,56 €'), 1234.56);
assert.strictEqual(parsePrice('1\u00a0234,56\u00a0€'), 1234.56);
assert.strictEqual(parsePrice('1\u202f234,56 €'), 1234.56);
assert.strictEqual(parsePrice('27, 99 €'), 27.99);
assert.strictEqual(parsePrice('0,99€'), 0.99);
assert.strictEqual(parsePrice('1.234,56'), 1234.56);
assert.strictEqual(parsePrice('1,234.56'), 1234.56);
assert.strictEqual(parsePrice('22.49'), 22.49);
assert.strictEqual(parsePrice('12,5'), 12.5);
assert.ok(isNaN(parsePrice('')));
assert.ok(isNaN(parsePrice('n/a')));
assert.ok(isNaN(parsePrice(undefined)));

// swapDomain: both directions, path/query kept, unknown host rejected
assert.strictEqual(swapDomain('https://www.auto-doc.fr/ridex/16152230'), 'https://www.autodoc.lu/ridex/16152230');
assert.strictEqual(swapDomain('https://www.autodoc.lu/ridex/16152230?a=1'), 'https://www.auto-doc.fr/ridex/16152230?a=1');
assert.throws(() => swapDomain('https://example.com/x'), /unsupported host/);

// compareRows: totals only over items priced on both sites
const c = compareRows(
  [{ name: 'A', qty: 2, price: 27.99 }, { name: 'B', qty: 1, price: 10 }, { name: 'C', qty: 1, price: 5 }],
  [22.49, 11, NaN],
);
assert.strictEqual(c.here, 65.98);
assert.strictEqual(c.there, 55.98);
assert.strictEqual(c.diff, -10);
assert.strictEqual(c.missing, 1);
assert.strictEqual(c.rows[0].diff, 22.49 - 27.99);

console.log('all checks passed');
