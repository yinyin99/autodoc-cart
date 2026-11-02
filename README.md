# autodoc-cart

Shop on one Autodoc site, like auto-doc.fr, and want to see if another country is cheaper, like autodoc.lu? This script copies your cart to that country and compares prices for you. No need to add every article again by hand.

![Your Autodoc cart with three new buttons at the bottom-left](docs/cart-buttons.png)

## Install

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Click [**Install the script**](https://raw.githubusercontent.com/yinyin99/autodoc-cart/main/autodoc-cart.user.js) (Ctrl+click opens it in a new tab), then click **Install** on the page that opens.
3. When Tampermonkey asks to allow requests to the Autodoc sites, say yes. The price comparison needs it.

## How to use

Open your cart on an Autodoc site (for example `https://www.auto-doc.fr/basket`). After a few seconds, three buttons appear at the bottom-left. They only show when your cart has articles.

### Compare prices

Click **Compare prices** and wait a moment. You get a table with one row per article and one column per country, with your own site first. Green means cheaper, red means more expensive, and the cheapest total is highlighted.

![The price table comparing France, Germany, Switzerland and Luxembourg](docs/compare-prices.png)

### Settings

Pick the country to copy your cart to (Luxembourg by default) and the countries to compare. Changes are saved straight away.

![The Settings window](docs/settings.png)

All options are explained in [Settings](docs/settings.md).

### Transfer cart

Click **Transfer cart**. A new tab opens on a product page of the other site. Leave it open: it adds your articles one by one, then shows the new cart. Check the quantities and the total before you order.

## Good to know

- Transfer empties the cart on the other site first, so it ends up identical to yours. You can turn this off in Settings.
- Prices include VAT but not shipping. Check the final total in the cart.
- Prices in other currencies are converted, so they are only approximate.
- Only articles and quantities are copied. Coupons, addresses and extra services are not.
- It works best in Chrome and Edge.
- This project is not affiliated with Autodoc. Use it at your own risk.

## Privacy

The script has no tracking. It only talks to the Autodoc sites and, at most once a day, to the free [Frankfurter](https://frankfurter.dev) service to get exchange rates. Your cart is never sent to Frankfurter. Your settings stay in your browser.

## More help

- [Settings](docs/settings.md): every option and its default
- [Countries](docs/countries.md): the 34 supported sites and currencies
- [How it works](docs/how-it-works.md): details, limits and troubleshooting
- [Development](docs/development.md): tests, adding a country, releases
- [Publishing](docs/publishing.md): publishing the repo anonymously

## License

MIT, see [LICENSE](LICENSE).
