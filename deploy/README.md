# Ansible — deploy ClickCraft Admin

รากโปรเจกต์: Admin SPA + Elysia API (Bun)

- Build โลคัล: `bun run build:all` → `out/dist/` (frontend) + `out/server/main.js` (API)
- Runtime บนเซิร์ฟเวอร์: `bun ./index.ts` (เสิร์ฟ SPA จาก `out/dist` + proxy `/api/*`)
- Nginx ทำ TLS แล้ว proxy ไปพอร์ตภายใน (`api_port`)

## Prerequisites

**เครื่อง dev**
- Ansible, Bun, rsync

**เซิร์ฟเวอร์**
- Bun ที่ `/root/.bun/bin/bun`
- PostgreSQL, Nginx, certbot, rsync
- ไฟล์ `/etc/clickcraft-admin.env` (จาก `templates/env.example`)

## Config

แก้ก่อนรัน:

- `inventory/hosts.ini` — IP/SSH
- `group_vars/prod.yml` — `local_repo`, `api_domain`, `ssl_email`, พอร์ต
- คัดลอก env บนเซิร์ฟเวอร์:

```bash
sudo cp deploy/templates/env.example /etc/clickcraft-admin.env
sudo nano /etc/clickcraft-admin.env
sudo chmod 600 /etc/clickcraft-admin.env
```

ค่าสำคัญ: `DATABASE_URL`, `BETTER_AUTH_*`, `CORS_ORIGIN` (ต้องมี URL เว็บไซต์ marketing ด้วยถ้าใช้ public leads)

## ใช้งาน

```bash
cd Admin/deploy
ansible-playbook playbooks/setup.yml    # ครั้งแรก: systemd + nginx + SSL
ansible-playbook playbooks/deploy.yml   # build + upload + restart
```

## Release layout

```
/opt/clickcraft-admin/
├── current -> releases/<id>/
├── releases/<id>/
│   ├── index.ts
│   ├── out/
│   │   ├── dist/          # SPA
│   │   └── server/main.js # API bundle
│   └── public -> ../../shared/uploads
└── shared/uploads/
```

## Rollback

```bash
./scripts/rollback.sh
```

## Migrations

ถ้ามีไฟล์ `.sql` ใน `src/server/platform/db/migrations` จะถูก sync แล้ว apply ตอน deploy  
หรือรัน drizzle โลคัลชี้ prod DB: `bun run db:migrate` (ระวัง)
