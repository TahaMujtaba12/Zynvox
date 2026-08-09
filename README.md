# Zynvox
Official website for Zynvox — AI automation infrastructure.

## Development

The site is static — `index.html` and `Demo.html` can be opened through any static
server. `Demo.html` loads its behaviour from ES modules in `src/demo/`, so it must be
served over HTTP (e.g. `python3 -m http.server`) rather than opened via `file://`.

## Tests

```bash
npm install
npm test          # unit tests
npm run coverage  # unit tests + coverage report
```

Unit tests live in `tests/` and cover the demo modules in `src/demo/` with Vitest + jsdom.
