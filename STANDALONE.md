# e& Billing (RecTracking) — Standalone deployment

Separated from intranet to avoid code conflicts.

## Server layout

| Component | Path | Port |
|-----------|------|------|
| **UI (static)** | `/var/www/ebilling/rectracking/` | **5042** |
| **API (NestJS)** | `/home/negt/RecTracking/server/` | **5041** |

## URLs

| Network | UI | API |
|---------|----|-----|
| Internal LAN | http://172.1.0.14:5042/rectracking/ | http://172.1.0.14:5041 |
| Public IP | http://20.74.222.101:5042/rectracking/ | http://20.74.222.101:5041 |

## Intranet menu (HANA)

`BI_MENUGROUP` → **e& Billing** → `http://172.1.0.14:5042/rectracking/`

Opens in a new tab (no iframe, no intranet embed).

## Deploy UI

```bash
rsync -a --delete /home/negt/RecTracking/client/dist/ /var/www/ebilling/rectracking/
systemctl reload nginx
```

## Deploy API

```bash
cd /home/negt/RecTracking/server && npm run build
pm2 restart rectracking-api
```

## Nginx

Config: `/etc/nginx/sites-available/ebilling.conf`
