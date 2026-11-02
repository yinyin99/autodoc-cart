# Countries and currencies

The script works on 34 Autodoc sites.

| Country | Site | Currency |
|---|---|---|
| Germany | www.autodoc.de | EUR |
| Austria | www.auto-doc.at | EUR |
| Switzerland (DE) | www.auto-doc.ch | CHF |
| Switzerland (FR) | www.autodoc24.ch | CHF |
| Luxembourg | www.autodoc.lu | EUR |
| Belgium (NL) | www.autodoc.be | EUR |
| Belgium (FR) | www.auto-doc.be | EUR |
| France | www.auto-doc.fr | EUR |
| France (EN) | www.autodoc24.fr | EUR |
| Netherlands | www.autodoc.nl | EUR |
| Netherlands (EN) | www.autodoc24.nl | EUR |
| Italy | www.auto-doc.it | EUR |
| Italy (EN) | www.autodoc24.it | EUR |
| Spain | www.autodoc.es | EUR |
| Portugal | www.auto-doc.pt | EUR |
| United Kingdom | www.autodoc.co.uk | GBP |
| Ireland | www.auto-doc.ie | EUR |
| Denmark | www.autodoc.dk | DKK |
| Norway | www.autodoc.co.no | NOK |
| Sweden | www.autodoc.se | SEK |
| Finland | www.autodoc.fi | EUR |
| Poland | www.autodoc.pl | PLN |
| Czech Republic | www.autodoc.cz | CZK |
| Slovakia | www.autodoc.sk | EUR |
| Slovenia | www.autodoc.si | EUR |
| Hungary | www.autodoc.hu | HUF |
| Romania | www.autodoc24.ro | RON |
| Bulgaria | www.autodoc.bg | EUR |
| Greece | www.autodoc.gr | EUR |
| Estonia | www.autodoc.ee | EUR |
| Latvia | www.autodoc.lv | EUR |
| Lithuania | www.autodoc.lt | EUR |
| International (EN) | www.autodoc.parts | EUR |
| Brazil | www.autopecas.br.com | BRL |
|---|---|---|

## Currencies

Each column in the comparison shows the site's own price. If a column uses another currency than your site, the price is also converted into your site's currency (shown after "≈"). This lets totals, differences and the green "cheapest" highlight work across all countries.

- Rates come from [Frankfurter](https://frankfurter.dev) (ECB reference rates), in one call for all currencies.
- They are fetched at most once a day and cached for 24 hours. The popup shows the rate date.
- They are only requested when a comparison involves more than one currency.
- Rates are approximate. Each shop charges in its own currency, and card or bank fees are not included.
- If the rates cannot be fetched, older cached rates are used and the popup says so.
- With no cached rates at all, nothing is converted. Only columns in the same currency are compared (all euro sites together, the two Swiss sites together, and so on). A column in another currency shows its own total without a difference to your site.
- If an article has no price in a country, it is left out of the totals of every column compared with it, so the columns stay comparable. Hover "n/a" to see why.
