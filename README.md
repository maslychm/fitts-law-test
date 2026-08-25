# Fitts Law Test

A frontend-only Angular single-page application for running formal and demo Fitts' law pointing tasks. All participant details and results stay in browser memory. The application has no API, database, server-side storage, or session recovery.

## Requirements

- Node.js 24.15.0 or newer in the Node 24 release line. The required version is recorded in `.nvmrc` and `package.json`.
- npm, included with Node.js.
- Internet access for the initial dependency install. While running, the page also loads Bootstrap, Open Sans, and mobile-device detection from public CDNs.

Check the active versions:

```bash
node --version
npm --version
```

## Install

Install the exact dependency versions recorded in `package-lock.json`:

```bash
npm ci
```

Use `npm install` only when intentionally adding or updating dependencies.

## Run Locally

Start the Angular development server:

```bash
npm start
```

Open <http://localhost:4200>. Stop the development server with `Ctrl+C`.

There is no separate backend process and no second application port.

## Workflow and Results

The entire workflow stays at `/`. Home, participant information, the pointing task, completion, and Summary are in-memory stages of one Angular application.

A participant completes a practice run followed by either:

- One demo run, or
- The complete configured set of formal runs.

The completion screen links to Summary. Summary displays participant information, averages across all runs, and metrics for each actual run.

Refreshing the browser at any point starts a new workflow at Home and discards all participant details and results. The application does not use cookies, local storage, session storage, IndexedDB, an API, or a database.

### Summary CSV

**Download Summary CSV** is the application's only data export. It is available only on Summary and creates `<andrew-id>-summary.csv`.

The CSV contains one consistent header, one row for each actual demo or formal run, and a final `OVERALL` row. Participant and overall context is repeated as appropriate. Practice activity, individual clicks, timestamps, source indices, and click directions are not exported.

Headers include their units, such as `(ms)`, `(cm)`, `(in)`, `(count)`, and `(%)`; data cells remain unitless. Timing and percentage values are rounded to two decimal places. The `OVERALL` row leaves target diameter and distance blank because it combines multiple run configurations.

## Build and Deploy

Create the production bundle:

```bash
npm run build
```

Deploy only the static files under:

```text
dist/fitts-law-test/browser
```

Any static web host or CDN can serve the bundle. No Node.js process is required after the files have been built.

The application redirects non-root paths, query strings, and URL hashes to `/` once it loads. If the host should support requests such as `/anything`, configure it to serve `index.html` as the fallback document; otherwise the host may return its own 404 before Angular can perform the redirect.

## Validation

Before collecting real data:

1. Run `npm ci`.
2. Run `npm run build`.
3. Run `npm start` and complete one demo session in the browser.
4. Confirm completion offers only **View Summary**.
5. Download the Summary CSV and verify it contains one row per run plus one final `OVERALL` row, with no raw click data.
6. Complete a formal session and confirm all configured runs still transition correctly.

## TODO

- Replace the `mobile-detect` CDN dependency with browser capability detection while preserving the intended desktop, phone, and tablet test configurations.
- Replace the full D3 dependency with native SVG DOM APIs or the narrower `d3-selection` package.
