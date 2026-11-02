# autodoc-cart

A Tampermonkey userscript for people who shop on one Autodoc country site (e.g. **auto-doc.fr**) and want to check another one (e.g. **autodoc.lu**, often cheaper) without re-adding every article by hand. It works on 34 Autodoc sites (see [Countries](#countries)).

On the cart page (`/basket`) of any supported site it adds three buttons (bottom-left):

- **Transfer cart →** rebuilds the same cart (same articles, same quantities) on another country's site, by default Luxembourg.
- **Compare prices** shows, per article and in total, the price on this site and on the countries you enabled in Settings.
- **Settings** picks the transfer target, the comparison countries and whether the target cart is emptied first.

No build step, no dependencies: one `.user.js` file.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Brave, Opera; Firefox is untested, see Limitations).
2. Click [**Install**](https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js) (Ctrl+click for a new tab), then click **Install** in the Tampermonkey page that opens:
   [`https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js`](https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js)
3. Tampermonkey asks to allow cross-site requests to the Autodoc sites listed in the script header. Allow them (needed for the price comparison).

## Usage

1. Fill your cart on one site and open its cart page.
2. **Transfer cart**: a new tab opens on the target site at the product page of your first article. The script (optionally empties that site's cart, then) adds each article through the site's own add-to-cart request, shows progress, lists anything that could not be added, then opens the cart.
3. **Compare prices**: the script reads each product page on the enabled countries and shows a table: one column per country (this site first), unit price per article with the difference to this site, and totals. The cheapest total gets a green background.

## Settings

Saved automatically (Tampermonkey storage, shared by all the sites); they apply to every site the script runs on.

| Setting | Default | Meaning |
|---|---|---|
| Transfer cart to | Luxembourg (`www.autodoc.lu`) | Target of **Transfer cart**. |
| When already on that site, transfer to | France (`www.auto-doc.fr`) | Where the transfer goes from the target site itself, so the same button also works the other way round. If it equals the site you are on, the button explains what to change. |
| Empty the target cart before adding | **on** | The target site's cart is emptied (all its articles are removed) before the articles are added, so the target ends up as an exact copy. Turn it **off** to add on top of what is already there. |
| Compare prices with | France + Luxembourg | Every ticked country costs one request per cart article, so only two are on by default. This site is always shown first, whether ticked or not. The **Select all** / **Deselect all** buttons above the list tick or untick every country at once. |

**Empty the target cart is on by default**: the target cart is the one being rebuilt, but whatever is in it when you press Transfer is deleted, not just overwritten. Only the articles are removed (coupons, "Commande Sécurisée" and addresses are left alone). If emptying fails, the transfer stops and adds nothing; the cart may then be partly emptied.

## Countries

Germany, Austria, Switzerland (DE, FR), Luxembourg, Belgium (NL, FR), France (+ EN), Netherlands (+ EN), Italy (+ EN), Spain, Portugal, United Kingdom, Ireland, Denmark, Norway, Sweden, Finland, Poland, Czech Republic, Slovakia, Slovenia, Hungary, Romania, Bulgaria, Greece, Estonia, Latvia, Lithuania, International (EN), Brazil.

The list (`SITES` at the top of the script: country, host, currency) is the only thing to edit to add or drop a site. The `@match` and `@connect` header lines must list the same hosts (Tampermonkey requires it); `node test.js` checks that.

**Currencies.** Prices are shown in each site's own currency and are **never converted**: the script calls no exchange-rate service. Totals, differences and the green "cheapest" highlight only compare columns in the same currency (all euro sites together, the two Swiss sites together, ...). A column in another currency than this site's shows its own total with no difference to this site. A country where an article has no price is left out of the totals of every column in that currency, so the columns stay comparable (hover "n/a" for the reason).

## How it works (and why)

- All sites use the same product URLs (`/brand/<article id>`) and the same article ids, so the "other site" URL is the same path on the other domain.
- Adding to the cart is `POST /ajax/cart/update` (`id`, `quantity`, CSRF header). The server rejects it unless the page has passed a Cloudflare Turnstile check, so the script does **not** call it from a userscript request. It runs the call inside the target site's product page using the page's own `fetch`, which attaches the Turnstile token. That is why the transfer lands on a product page and not directly on the cart (the cart page does not load that code).
- Emptying the cart uses the same page `fetch`: `GET /ajax/cart/mini-basket` lists the cart, then `POST /ajax/cart/update` with `quantity=0&set=true` removes each article (the call behind the legacy cart's delete button). The cart is read again afterwards and the transfer only goes on if it is empty. (The new React cart page uses a Next.js server action instead, whose id changes with every site release, so it is not used.)
- The queued cart is passed between the two domains with `GM_setValue` (local to your browser) and is deleted as soon as it is consumed, because the add request is additive: running it twice would double the quantities.
- All selectors and URLs are in one block at the top of the script, so a site redesign should be a small fix.

## Limitations

- With **Empty the target cart** off, quantities are **added** to whatever is already in the target cart.
- Only the articles and quantities are copied. Vehicle selection, "Commande Sécurisée" and other services, coupons, and addresses are not.
- An article that does not exist on the other site is reported as not added; it is not substituted. With emptying on, the old target cart is already gone by then.
- **Prices are shown VAT included and per country** (e.g. France 20 %, Luxembourg 17 % at the time of writing). Shipping is **not** compared (it depends on destination, weight and cart total). Check the final total on the cart page before ordering.
- Price comparison uses the product page of each other site. If Cloudflare answers the userscript request with a challenge (HTTP 403 shown on hover over "n/a"), open that site once in the same browser, then retry.
- Needs a browser with CSS `:has()` (Chrome/Edge 105+). Written for Tampermonkey on Chromium, where `unsafeWindow` shares the page's JavaScript context; Firefox and other managers are untested.
- The sites change their markup without notice; if buttons stop appearing, check the selectors at the top of the script.

## Development

```
node test.js
```

Runs assert-based checks of the pure functions (price parser, host swap, settings, transfer target, comparison across several countries and currencies, request pool) and that the header `@match`/`@connect` lists match `SITES`. The userscript exports them only when loaded by Node (`typeof module !== 'undefined'`); in the browser it runs normally.

## Disclaimer

This project is **not affiliated with, endorsed by, or connected to Autodoc** (AUTODOC SE or any of its sites). It is provided as is, without warranty. You are responsible for checking your order, prices and your use of the sites' terms.

## Privacy

The script stores in Tampermonkey storage on your machine: your settings, and, while a transfer is pending, a short-lived copy of your cart (article ids, quantities, displayed prices, product paths). It sends no data anywhere except to the Autodoc sites listed in the script (the product pages it reads for the countries you ticked, and the cart requests the sites' own code would make). No exchange-rate service, no analytics, no third-party servers.

## License

MIT, see [LICENSE](LICENSE).
