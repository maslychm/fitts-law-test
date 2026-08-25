# Fitts Law Test

A frontend-only Angular app for UCF's Interaction Techniques class.

Requires Node.js 24.15.0 or newer in the Node 24 release line.

## Run locally

```bash
npm ci
npm start
```

Open <http://localhost:4200>.

## Build and deploy

```bash
npm run build
npm run build -- --base-href /icerc/isuelab/research/fitts-law/
```

Deploy the contents of `dist/fitts-law-test/browser`. No Node.js server or API is required. If arbitrary URLs must reach the app, configure the static host to fall back to `index.html`.

## TODO

- Replace `mobile-detect` with browser capability detection.
- Replace D3 with native SVG APIs or `d3-selection`.
