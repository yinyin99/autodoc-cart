# Development

The whole project is one file, `autodoc-cart.user.js`, with no build step and no dependencies.

## Tests

```
node --check autodoc-cart.user.js
node test.js
```

`test.js` runs assert-based checks on:

- the pure functions: price parser, host swap, settings, transfer target, exchange-rate parsing, comparison across countries and currencies with and without rates, and the request pool;
- the script header: `@match` and `@connect` match `SITES` (plus the rates host), `@version` is semver, `@downloadURL` and `@updateURL` point at `main`, and the `@grant` list equals what the code uses.

The script exports its helpers only when loaded by Node (`typeof module !== 'undefined'`). In the browser it runs normally.

## CI

`.github/workflows/test.yml` runs both commands above on every push and pull request.

## Adding a country

1. Add it to `SITES` at the top of the script (country, host, currency). This is the only list to edit.
2. Add the same host to the `@match` and `@connect` lines in the header. `api.frankfurter.dev` stays in `@connect` for the exchange rates.
3. Run `node test.js`: it checks that the header and `SITES` agree.
4. Add the country to [countries.md](countries.md).

## Releasing

1. Bump `@version` in the script header. Tampermonkey only offers an update when it is higher.
2. Run the tests.
3. Merge to `main`. Users get the update from the raw `@downloadURL`.

To publish the repository without exposing your identity, see [publishing.md](publishing.md).
