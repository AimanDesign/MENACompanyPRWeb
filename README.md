# MENA Company PR — website

Bilingual (English / Arabic) company website for **MENA Company PR**, built from the brand guidelines, the company profile and the brand strategy.

Static site: no build step and no backend. Deploys as-is on Vercel.

## Structure

```
index.html              page markup; English copy lives here
assets/css/style.css    brand tokens, layout, RTL rules, motion states
assets/js/i18n.js       Arabic copy and the strings JavaScript renders (map labels, form messages)
assets/js/main.js       motion (GSAP + ScrollTrigger + Lenis), language switch, maps, form
assets/js/map-data.js   dot map of the MENA region, generated from Natural Earth (public domain)
assets/img/             WebP photography, logo, social share image
favicon.svg
vercel.json             caching and security headers
```

## Signature interactions

- **Preloader.** The mark draws itself, "MENA" expands to the logo's Extra Expanded width, and the panel splits along the brand diagonal.
- **Hero map.** A live dot map of the region, with arcs flying out from Cairo (the anchor market). Dots light up around the cursor.
- **Expanding headlines.** Section titles grow along Anybody's variable width axis as they enter.
- **Scroll-scrubbed statement.** The About statement lights up word by word as you scroll.
- **Pinned services track.** The five service pillars scroll horizontally on desktop (in reverse in Arabic) and stack on mobile.
- **Corridor explorer.** Choose a corridor, or click a dot on the map, and the camera flies to it and highlights it.
- **Language switch.** EN ⇄ ع swaps the copy behind a red curtain, flips the whole layout to RTL, and translates the map labels.
- **Smaller touches.**
  - chevron cursor
  - magnetic buttons
  - tilt cards
  - a marquee that speeds up with scroll velocity
  - a footer wordmark that widens as you reach the end

Motion is on by default. The footer has a **Reduce motion** switch, and the visitor's choice is remembered.

## Before going live

- **Contact details are placeholders.** Change them in two places:
  - in `index.html`: the `#cEmail` and `#cPhone` links
  - at the top of `assets/js/main.js`: the `CONTACT` object, `{ email, whatsapp }`, where the WhatsApp number is digits only, e.g. `201xxxxxxxxx`

  Setting a WhatsApp number turns on the WhatsApp actions. Then delete the "provisional" notes: `ct.note` in the HTML and in `i18n.js`.
- **The contact form opens the visitor's email app** with the brief pre-filled. It does not store anything.
- **Imagery is illustrative** (AI-generated). Outlet names and media relationships are not listed on purpose: per the brand strategy, they're shared on request once verified.

## Edit copy

- **English:** edit the text in `index.html`.
- **Arabic:** edit the matching key in `assets/js/i18n.js`. Keys are the `data-i18n` attribute values.

## Local preview

```
python -m http.server 8000
```

Then open <http://localhost:8000>. Add `?lang=ar` to open in Arabic.

## Credits

- Fonts: Anybody, and IBM Plex Sans Arabic as the web fallback for the brand's SF Arabic (both via Google Fonts).
- Libraries: GSAP and ScrollTrigger, Lenis.
- Map data: Natural Earth.
