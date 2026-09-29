# ENLUX — Pain Made Me Timeless

Kard site for ENLUX, a fashion and lifestyle brand. Plain static HTML/CSS/JS with no build step. Deploy the folder as it is.

## Structure

```
index.html            single page: hero, brand, philosophy, collection, manifesto,
                      find your light, the codes, connect, footer
css/style.css         all styles (tokens at the top, responsive + reduced-motion at the end)
js/script.js          entrance, starfields, scroll scenes, menu, collection grid, copy button
js/collection.js      product data for the collection grid (empty = grid hidden)
assets/logo/          ENLUX logo cut from the supplied artwork, white on transparent
                      (enlux-logo-original.jpg is the untouched source)
assets/favicon/       favicons + app icons (EL monogram on black)
assets/og-image.jpg   1200x630 social share card
```

Fonts are loaded from Google Fonts: Cormorant (display serif), Archivo (sans, used expanded for labels) and Pinyon Script (used only for "timeless." and "light.").

## Adding products

Add entries to `window.ENLUX_COLLECTION` in `js/collection.js` (the format is documented in that file). The grid appears under the two collection chapters automatically. Each card gets an "Order" link that opens an email with the product name in the subject. Put photos in `images/collection/`, ideally 4:5 portrait, about 1000px wide, JPEG at ~80% quality.

## Contact details

The email and phone number are written directly in `index.html` (menu, collection, contact, footer, structured data) and in `data-email` on `#collection`. To change one, find-and-replace it across `index.html`.

## When the site has a domain

Add `<link rel="canonical">` and `og:url` in the `<head>`, and make `og:image` / `twitter:image` absolute URLs. A comment in `index.html` marks the spot.
