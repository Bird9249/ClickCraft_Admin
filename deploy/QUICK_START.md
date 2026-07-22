# Quick Start — ClickCraft Admin

## 1. แก้ config

### `deploy/inventory/hosts.ini`

```ini
[prod]
your.server.ip ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

### `deploy/group_vars/prod.yml`

- `local_repo`: path ราก Admin บนเครื่องคุณ
- `api_domain` / `ssl_email`: สำหรับ certbot + CORS
- `api_port`: พอร์ตภายใน (default `3005`)
- `app_name` / `app_root`: default `clickcraft-admin` + `/opt/clickcraft-admin`

## 2. เซิร์ฟเวอร์

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx rsync postgresql
sudo mkdir -p /opt/clickcraft-admin/{releases,shared/uploads}

# Runtime env
sudo cp /path/to/Admin/deploy/templates/env.example /etc/clickcraft-admin.env
sudo nano /etc/clickcraft-admin.env   # DATABASE_URL, secrets, CORS
sudo chmod 600 /etc/clickcraft-admin.env
```

## 3. Ansible

```bash
cd Admin/deploy
ansible-playbook playbooks/setup.yml
ansible-playbook playbooks/deploy.yml
```

`deploy.yml` รัน `bun run build:all` ที่ `local_repo` แล้วส่ง `index.ts` + `out/` ขึ้นเซิร์ฟเวอร์

## 4. ตรวจสอบ

```bash
sudo systemctl status clickcraft-admin
sudo journalctl -u clickcraft-admin -f
curl -fsS https://admin.clickcraft.dev/api/health
curl -fsS https://admin.clickcraft.dev/
```

## 5. Rollback

```bash
./scripts/rollback.sh
```

## โครง release

```
/opt/clickcraft-admin/current/index.ts
/opt/clickcraft-admin/current/out/dist/
/opt/clickcraft-admin/current/out/server/main.js
```
