# eBilling — Etisalat SIM billing for employees

A web application for uploading **e& (Etisalat)** mobile invoices, matching them to the
employee SIM package, splitting **official / personal** excess, running a multi-level
approval matrix, and posting personal deductions to **Oracle HCM**.

> Internal product of **New East General Trading**. See [LICENSE](LICENSE).

Live UI: `https://ebilling.neweast.cloud/ebilling/`

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Monthly calendar](#monthly-calendar)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Production deployment](#production-deployment)
- [Access control](#access-control)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Features

**Invoices & SIM master**

- Upload Etisalat invoice PDFs (single or bulk). Amounts, phone, month and invoice code
  are extracted and matched to `sim_employees`.
- Package vs invoice comparison. Excess = invoice total − package total.
- Employee folder link to confirm the split: **Official + Personal = Excess**.

**Excess approval matrix**

- After the employee submits a personal amount, the request goes to Level 1 → Level N.
- One shared email to Level 1 (not one mail per approver). Approver actions stay in the
  queue / history views.
- **Reject** does not close the case: the employee is emailed a new split link. If they
  correct in time, the request starts again at Level 1.
- **All Requests** (read-only tracking): filters, bordered table, pagination, Excel export.
  If the employee never completed a correction, status is **Not submit by emp** and Levels
  stay empty.

**Payroll cut-off (Asia/Dubai)**

- Invoice confirmation stays open through the **17th 23:59**.
- **16th 00:00** — if the request was actually emailed and the employee did not submit
  (or did not correct after a reject) by the end of the 15th: full excess is charged as
  personal. Drafts and unsent invoices are skipped.
- **18th 00:00** — Oracle Other Deduction (UAE) is posted, then the Sona / Vinod payroll
  file is emailed. BCC includes sakour.

**Oracle HCM**

- `POST` to Fusion `elementEntries` using UAE **Other Deduction** element / input value IDs.
- Recovery log, deduction presence check (OD column), and a **Monthly Report** of split,
  matrix, Oracle status and remarks, with Excel download (including a **Month** column).

**Other**

- Dashboard, analysis, recovery log, user permissions, audit log.
- Microsoft sign-in (JWT).
- eBilling Flow page describing the monthly cycle.

---

## Architecture

```
┌──────────────────────────┐  HTTPS  ┌─────────┐  /api     ┌─────────────────────┐
│  Browser (static SPA)    │ ──────▶ │  nginx  │ ────────▶ │  NestJS API (Node)  │
│  client/dist             │ ◀────── │         │           │  port 5041 (PM2)    │
└──────────────────────────┘         └─────────┘           └──────────┬──────────┘
                                                                      │
                         ┌────────────────────────┬───────────────────┴────────┐
                         ▼                        ▼                            ▼
                   PostgreSQL              Oracle Fusion HCM              SMTP / Graph
                 (rectracking)            (Other Deduction UAE)           (employee + payroll mail)
```

- The SPA is static files. Production copies `client/dist/` to `/var/www/mis-dashboard/ebilling/`.
- The API runs from `server/dist/` (`pm2 rectracking-api`).
- Cron jobs use the `Asia/Dubai` timezone (unsplit deadline on the 16th, Oracle batch on the 18th).

---

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Static SPA (React bundle in `client/dist`), DM Sans, Tailwind-based shell CSS |
| Backend  | NestJS 11, Node.js |
| Database | PostgreSQL (`rectracking`) |
| Auth     | Microsoft Entra ID / JWT |
| Payroll  | Oracle Fusion HCM REST `elementEntries` |
| Mail     | SMTP / Graph, BCC to operations |
| Ops      | PM2, nginx |

---

## Repository layout

```
.
├── client/dist/            Production SPA (deployed as-is)
│   ├── assets/             JS/CSS bundles (`index-approval-v2.js`, `ebilling-shell.css`)
│   ├── monthly-report/     Monthly control report + Excel
│   ├── ebilling-flow/      Written monthly process
│   └── folder/             Public employee split page (`/folder/:token`)
├── server/                 NestJS API
│   ├── dist/               Running build (PM2)
│   ├── .env.example        Supported environment variables
│   └── package.json
├── scripts/                UI patch helpers and All Requests page fragment
├── docs/                   Business and system-flow notes
├── deploy/                 Host notes
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

This repository’s deploy model **commits `dist/`** so the host can copy files and restart PM2
without a separate frontend build pipeline.

---

## Monthly calendar

| When (Dubai) | What happens |
|--------------|----------------|
| After month invoices are loaded | Emails to employees who exceeded the package |
| Through 15th 23:59 | Employee submits or corrects official / personal split |
| 16th 00:00 | Unsplit / uncorrected (emailed) invoices: full excess → personal |
| Through 17th 23:59 | Confirmation window still open for in-flight work |
| 18th 00:00 | Oracle Other Deduction batch + payroll Excel to Sona / Vinod |

Matrix-approved personal amounts go on the Sona payroll file. Forced 16th charges still go to
Oracle when `approval_status` is `ready_for_recovery`, and appear on the Monthly Report.

---

## Quick start

### Prerequisites

- **Node.js ≥ 20** and npm
- **PostgreSQL** with a `rectracking` database
- Oracle HCM credentials (for recovery)
- SMTP / Microsoft mail credentials

### 1. Clone

```bash
git clone https://github.com/Neweast-General-Trading/ebilling.git
cd ebilling
```

### 2. API

```bash
cd server
cp .env.example .env          # fill DATABASE_URL, APP_JWT_SECRET, Oracle, SMTP, Azure
npm ci
node dist/main.js             # or: npx nest start
```

Default API port is **5041**.

### 3. UI

Serve `client/dist/` behind nginx (or any static host) and proxy `/api` (or the app’s API
base) to port 5041. Production copies:

```bash
rsync -a /home/negt/RecTracking/client/dist/ /var/www/mis-dashboard/ebilling/
```

---

## Configuration

All backend settings are environment variables. See [`server/.env.example`](server/.env.example).

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5041`) |
| `DATABASE_URL` | PostgreSQL connection |
| `APP_JWT_SECRET` | JWT signing (**required in production**) |
| `CLIENT_URL`, `EBILLING_PUBLIC_URL` | Public UI / folder-link base |
| `AZURE_*` | Microsoft sign-in |
| `ORACLE_*` | HCM workers + Other Deduction UAE IDs |
| `SMTP_*` / mail Graph settings | Employee, reject-resplit, and payroll emails |
| `EMAIL_EMPLOYEE_BCC` | Operations BCC (sakour) |

Never commit `.env`. Rotate any token that was pasted in chat or tickets.

---

## Production deployment

```bash
# API
cd /home/negt/RecTracking/server
# apply dist + migrations as needed
pm2 restart rectracking-api

# UI
rsync -a /home/negt/RecTracking/client/dist/ /var/www/mis-dashboard/ebilling/
# bump ?v= query on index HTML when JS/CSS change, then hard-refresh the browser
```

**Checklist**

- `APP_JWT_SECRET` is strong; `.env` is not in git.
- Oracle UAE Other Deduction IDs are set (`ORACLE_RECOVERY_ELEMENT_TYPE_ID`, `ORACLE_RECOVERY_INPUT_VALUE_ID`).
- PM2 process `rectracking-api` listens on 5041; nginx terminates TLS for `ebilling.neweast.cloud`.
- Cron timezone is `Asia/Dubai`.

---

## Access control

- **Super admin / HQ tracking** — All Requests, permissions, recovery tools, payroll send.
- **Matrix approvers** — queue and history for their level only.
- **Tab permissions** (`ebilling_user_permissions`) — dashboard, invoices, master, analysis,
  recovery log, users log, monthly report, eBilling Flow.
- Employees use the emailed `/folder/:token` link; they do not sign in to the admin SPA.

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/EBILLING_SYSTEM_FLOW.md](docs/EBILLING_SYSTEM_FLOW.md) | End-to-end flow (Arabic + English terms) |
| [docs/EBILLING_BUSINESS_GUIDE.md](docs/EBILLING_BUSINESS_GUIDE.md) | Business guide |
| [STANDALONE.md](STANDALONE.md) | Historical standalone host notes |
| UI **eBilling Flow** | `/ebilling/ebilling-flow/` — monthly cases in the product |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
