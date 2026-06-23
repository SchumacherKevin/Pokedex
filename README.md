# Pokedex

A simple browser-based Pokédex built with vanilla HTML, CSS, and JavaScript. It fetches live data from the [PokéAPI](https://pokeapi.co/) and lets you browse, search, and inspect Pokémon without any build tools or frameworks.

## Features

- **Browse Pokémon** — loads Pokémon in pages of 20 via a "Load more" button.
- **Search** — type at least 3 characters to filter through all Pokémon names; a "Back" button restores the default browsing view.
- **Detail view** — click a card to open a dialog with official artwork, types, base stats (animated bars), and the full evolution chain.
- **Dialog navigation** — jump between Pokémon with next/previous buttons inside the detail dialog, loading more pages automatically when needed.
- **Caching** — previously fetched Pokémon are cached in memory to avoid redundant API calls.
- **Type-colored UI** — cards and badges are styled per Pokémon type.
- **Imprint page** — a basic legal/imprint page (`imprint_current.html`).

## Project structure

```
index.html              # App shell / markup
script.js               # App entry point: state, event wiring, pagination, dialog navigation
scripts/
  api.js                # PokéAPI requests + in-memory caching
  search.js             # Client-side search logic
  ui.js                 # DOM rendering, loading spinner, dialog/accordion behavior
  template.js           # HTML string generators for cards, detail view, stats, evolution
style.css                # Main layout/styling
styles/pokemontypes.css  # Per-type color classes
assets/                  # Icons (pokeball, search)
imprint_current.html     # Imprint page
```

## Tech stack

- Plain HTML/CSS/JavaScript (ES modules), no frameworks or build step
- [PokéAPI](https://pokeapi.co/) as the data source

## Getting started

Since the app uses ES modules, open it through a local web server rather than directly via `file://` (browsers block module imports from the filesystem).

```bash
# from the project root, e.g. with the VS Code "Live Server" extension
# or any static file server, for example:
npx serve .
```

Then open the served URL (e.g. `http://localhost:3000`) in your browser.

## Author

Kevin Schumacher
