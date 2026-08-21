# Fitts Law Test

A browser-based Fitts' law pointing task for formal and demo sessions. The Angular frontend runs the task, the local Express server stores completed sessions in JSON Lines format, and participants can download their latest results as JSON or CSV.

## Requirements

- Node.js 24.15.0 or newer in the Node 24 release line. The required version is recorded in `.nvmrc` and `package.json`.
- npm, included with Node.js.
- Internet access for the initial dependency install. While the app is running, it also loads Bootstrap, Open Sans, and mobile-device detection from public CDNs.

Check the active versions before installing:

```bash
node --version
npm --version
```

## Install

For a fresh checkout, install the exact versions in `package-lock.json`:

```bash
npm ci
```

Use `npm install` instead when intentionally adding or updating dependencies.

## Start the Application

Build the production Angular bundle and start the Express server:

```bash
npm start
```

Open <http://127.0.0.1:3000>. Keep the terminal running for the duration of the experiment and stop it with `Ctrl+C`.

`npm start` performs these two commands in order:

```bash
npm run build
npm run server
```

The build is written to `dist/fitts-law-test/browser`. The Express process serves that directory, handles Angular route fallbacks, and exposes the results API under `/api`.

To confirm that the API is running, open <http://127.0.0.1:3000/api/health>. It should return:

```json
{"status":"ok"}
```

No Google account, OAuth credentials, spreadsheet, database, GitHub configuration, or environment file is required.

## Development Mode

Run the API and Angular development server together:

```bash
npm run dev
```

Open <http://localhost:4200>. Angular provides hot reload on port 4200 and proxies `/api` requests to the Express server on `127.0.0.1:3000` using `proxy.conf.json`.

The individual development processes are also available:

```bash
npm run server
npm run client
```

Run them in separate terminals when starting them individually.

## Session Flow and Results

Both `/test` and `/demo` use the same test flow. A participant completes a practice run, the configured formal runs or one demo run, and then reaches the completion screen. Results are shown after selecting **View Summary**.

When a formal or demo session finishes, the frontend sends it to `POST /api/sessions`. The server validates the payload and appends one JSON object to:

```text
data/results.jsonl
```

The `data/` directory is created automatically and ignored by Git. Each line is an independent session with participant and device information, timestamps, separately labeled practice clicks, formal or demo clicks, per-run averages, and the overall average. API request bodies are limited to 10 MB.

Do not edit `results.jsonl` while a session is being saved. Stop the application before copying, moving, or analyzing the file. Back up this file separately when the results matter.

The completion and summary screens also provide JSON and CSV downloads. If the server cannot write the results file, the UI reports the error while keeping the results in memory so they can still be downloaded during that browser session.

## Deployment Model

The current repository is designed for local or self-hosted collection with the Angular frontend and Express API deployed together. It is not a static-only deployment: hosting only the files under `dist/` removes automatic session persistence because `/api/sessions` is unavailable.

For a production-style installation on a machine:

```bash
npm ci
npm run build
npm run server
```

After the build has been created, later server restarts only require `npm run server` unless the frontend source or dependencies changed.

The server:

- Binds to `127.0.0.1` only.
- Uses port `3000` by default.
- Accepts a different port through the `PORT` environment variable.
- Resolves `data/results.jsonl` relative to the directory from which the server is started.

Example port override in PowerShell:

```powershell
$env:PORT = "8080"
npm run server
```

Example on macOS or Linux:

```bash
PORT=8080 npm run server
```

Because the host is fixed to loopback, the server is not directly reachable from other computers. If remote access is required, run a reverse proxy on the same machine and proxy to `127.0.0.1:<PORT>`. The deployment must also provide persistent storage and backups for the working directory's `data/` folder; ephemeral hosting will lose collected results.

## Validation

Build the production frontend:

```bash
npm run build
```

Run the Angular transition and route-guard tests:

```bash
npm test
```

Run the Express API tests:

```bash
npm run test:server
```

Before collecting real data, run all three commands and complete one demo session in the browser.

## Operational Checklist

1. Confirm Node 24.15.0 or newer in the Node 24 release line.
2. Run `npm ci` after a fresh checkout or whenever `package-lock.json` changes.
3. Run `npm start` and verify `/api/health` before beginning a session.
4. Enter participant and device details, including the physical screen diagonal.
5. Keep the terminal and browser open until the completion screen confirms that the session was saved.
6. Stop the server before copying or analyzing `data/results.jsonl`.

If Google credentials previously committed to this repository are still active and belong to you, revoke them in Google Cloud. Removing credentials from the current source does not remove them from Git history.
