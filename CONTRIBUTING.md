# Contributing

## Workflow

1. Branch from `main`: `git checkout -b feature/short-description`.
2. Make focused commits using [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
3. Open a pull request describing **what** changed and **why**, with screenshots for UI work.

## Code style

- Backend is NestJS under `server/` (this deployment commits `server/dist/` for PM2).
- Frontend is the static SPA under `client/dist/`; All Requests page source lives in
  `scripts/fragments/all-requests-page.js` and is injected into `index-approval-v2.js`.
- User-facing text is English.
- Use the existing toast helpers (`toastification` / `se.success` / `se.error`) instead of snackbars or `alert()`.

## Git attribution

Commits must be authored as **jad.sakour** (`AhmadMkhlalati7@gmail.com`).
Do not add `Co-authored-by`, `Signed-off-by`, or tool attribution trailers.

## Never commit

- `.env` files, API keys, passwords, tokens, certificates
- Database dumps, backups, logs
- Invoice PDFs and employee uploads (`/uploads/`, `*.pdf`)

If a secret is committed by mistake, rotate it immediately — removing it from history is
not enough.
