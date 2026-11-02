# autodoc-cart

A Tampermonkey userscript for people who shop on **auto-doc.fr** and want to check **autodoc.lu** (often cheaper) without re-adding every article by hand.

On the cart page (`/basket`) of either site it adds two buttons (bottom-left):

- **Transfer cart →** rebuilds the same cart (same articles, same quantities) on the other site.
- **Compare prices** shows, per article and in total, the price on both sites and the difference.

No build step, no dependencies: one `.user.js` file.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Brave, Opera; Firefox is untested, see Limitations).
2. Click [**Install**](https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js), then click **Install** in the Tampermonkey page that opens:
   [`https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js`](https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js)
3. Tampermonkey asks to allow cross-site requests to `www.auto-doc.fr` and `www.autodoc.lu`. Allow them (needed for the price comparison).

## Usage

1. Fill your cart on one site and open its cart page.
2. **Transfer cart**: a new tab opens on the other site at the product page of your first article. The script adds each article through the site's own add-to-cart request, shows progress, lists anything that could not be added, then opens the cart.
3. **Compare prices**: the script reads each product page on the other site and shows a table (price on this site, price on the other, difference, totals). Green = cheaper on the other site.

## How it works (and why)

- Both sites use the same product URLs (`/brand/<article id>`) and the same article ids, so the "other site" URL is the same path on the other domain.
- Adding to the cart is `POST /ajax/cart/update` (`id`, `quantity`, CSRF header). The server rejects it unless the page has passed a Cloudflare Turnstile check, so the script does **not** call it from a userscript request. It runs the call inside the target site's product page using the page's own `fetch`, which attaches the Turnstile token. That is why the transfer lands on a product page and not directly on the cart (the cart page does not load that code).
- The queued cart is passed between the two domains with `GM_setValue` (local to your browser) and is deleted as soon as it is consumed, because the add request is additive: running it twice would double the quantities.
- All selectors and URLs are in one block at the top of the script, so a site redesign should be a small fix.

## Limitations

- **Quantities are added** to whatever is already in the target cart. Empty the target cart first if you want an exact copy.
- Only the articles and quantities are copied. Vehicle selection, "Commande Sécurisée" and other services, coupons, and addresses are not.
- An article that does not exist on the other site is reported as not added; it is not substituted.
- **Prices are shown VAT included and per country**: France 20 %, Luxembourg 17 % at the time of writing. Shipping is **not** compared (it depends on destination, weight and cart total). Check the final total on the cart page before ordering.
- Price comparison uses the product page of the other site. If Cloudflare answers the userscript request with a challenge (HTTP 403 shown on hover over "n/a"), open the other site once in the same browser, then retry.
- Needs a browser with CSS `:has()` (Chrome/Edge 105+). Written for Tampermonkey on Chromium, where `unsafeWindow` shares the page's JavaScript context; Firefox and other managers are untested.
- The sites change their markup without notice; if buttons stop appearing, check the selectors at the top of the script.

## Development

```
node test.js
```

Runs assert-based checks of the pure functions (price parser, domain swap, comparison totals). The userscript exports them only when loaded by Node (`typeof module !== 'undefined'`); in the browser it runs normally.

## Disclaimer

This project is **not affiliated with, endorsed by, or connected to Autodoc** (AUTODOC SE or any of its sites). It is provided as is, without warranty. You are responsible for checking your order, prices and your use of the sites' terms.

## Privacy

The script stores nothing except a short-lived copy of your cart (article ids, quantities, displayed prices, product paths) in Tampermonkey storage on your machine while a transfer is pending. It sends no data anywhere except to `www.auto-doc.fr` and `www.autodoc.lu` (the product pages it reads and the add-to-cart requests the sites' own code would make). No analytics, no third-party servers.

## License

MIT, see [LICENSE](LICENSE).
