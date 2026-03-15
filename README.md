# PLUGleads Landing + Portal

## Deploy To `plugleads.app` (GitHub Pages)

This repo now includes an automatic deploy workflow:

- [deploy-pages.yml](./.github/workflows/deploy-pages.yml)
- [CNAME](./public/CNAME) set to `plugleads.app`

### One-time GitHub setup

1. Open repository `Settings -> Pages`.
2. Set `Source` to `GitHub Actions`.
3. Push to `main` (or run the workflow manually from `Actions`).

Every push to `main` now builds and deploys automatically.

## Auto-Push Local Revisions To GitHub

Start a background watcher that commits/pushes local edits every few seconds:

```bash
npm run autopush:start
```

Stop it:

```bash
npm run autopush:stop
```

Watcher logs:

- `.autopush/watcher.out.log`
- `.autopush/watcher.err.log`
