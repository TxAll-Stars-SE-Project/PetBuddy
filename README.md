# 🐾 PetBuddy

A full-stack monorepo web application built with **React 19**, **Vite**, **Express**, **Prisma**, and **TypeScript**.

---

## 📁 Project Architecture

This project is organized as an **npm Workspaces Monorepo**:

```
PetBuddy/
├── backend/                       # Express + Prisma + TypeScript API Server
│   ├── prisma/                    # Prisma schema & database configuration
│   ├── src/
│   │   ├── controllers/           # Route handler controllers
│   │   ├── middleware/            # Auth & error handling middleware
│   │   ├── routes/                # API & Swagger UI (/api-docs) routes
│   │   ├── services/              # Business logic (mail, slip verification, etc.)
│   │   ├── utils/                 # JWT, Prisma, and Supabase clients
│   │   ├── app.ts                 # Express app & middleware setup
│   │   └── server.ts              # Server bootstrap & port listener
│   ├── .env.example               # Backend environment variable template
│   ├── Dockerfile                 # Multi-stage backend container build
│   └── package.json
├── frontend/                      # Vite + React 19 + TypeScript Client
│   ├── src/                       # Pages, components, hooks, services, utils
│   ├── .env.example               # Frontend environment variable template
│   ├── Dockerfile                 # Multi-stage Vite build + Nginx server
│   ├── nginx.conf                 # Nginx reverse proxy (/api & /api-docs -> backend:5000)
│   └── package.json
├── docs/
│   └── openapi.yaml               # OpenAPI 3.0.3 specification (served at /api-docs)
├── docker-compose.yml             # Production container orchestration
└── package.json                   # Root workspace configuration
```

---

## 🔐 Environment Variables & Secrets Setup

Copy the example files before running or building:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # Optional for local dev (defaults to http://localhost:5000/api)
```

### Backend (`backend/.env`)

| Variable | Required | Default / Example | Where to get it / Notes |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the Express API server (`docker-compose.yml` sets `"5000"`). |
| `NODE_ENV` | Yes | `development` / `production` | Controls dev/prod behavior (e.g., Swagger server fallback, demo/seed guards). |
| `JWT_SECRET` | **Yes** | Random 32+ char string | Generate locally, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | No | `1d` | Access token lifetime for normal login. |
| `JWT_EXPIRES_IN_REMEMBER_ME` | No | `30d` | Access token lifetime when "Remember me" is checked. |
| `FRONTEND_URL` | **Yes** | `http://localhost:5173` | Used in password reset & notification email links. In production, set to `http://<VM_IP_OR_DOMAIN>`. |
| `SWAGGER_SERVER_URL` | No | `""` (auto) | Optional explicit URL for Swagger UI. If unset, auto-uses `/` in `production` and `http://localhost:<PORT>` in `development`. |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | No | `15` | Expiration time (minutes) for password reset links. |
| `DATABASE_URL` | **Yes** | `postgresql://...6543/postgres?pgbouncer=true` | **Supabase Dashboard** -> *Project Settings* -> *Database* -> *Connection string (Transaction pooler, port 6543)*. |
| `DIRECT_URL` | **Yes** | `postgresql://...5432/postgres` | **Supabase Dashboard** -> *Project Settings* -> *Database* -> *Connection string (Session pooler / Direct, port 5432)* for Prisma CLI. |
| `SUPABASE_URL` | **Yes** | `https://<project-ref>.supabase.co` | **Supabase Dashboard** -> *Project Settings* -> *API* -> *Project URL*. |
| `SUPABASE_KEY` | **Yes** | `eyJ...` | **Supabase Dashboard** -> *Project Settings* -> *API* -> `service_role` key (recommended for backend storage uploads) or `anon` key. |
| `SUPABASE_STORAGE_BUCKET` | No | `petbuddy-images` | **Supabase Storage** bucket name for pet/user/report images. |
| `PAY_QR_STORAGE_BUCKET` | No | `Pay_Qr` | **Supabase Storage** bucket name for sitter PromptPay QR codes. |
| `THUNDER_API_KEY` | **Yes** (payments) | `your-thunder-api-key` | **Thunder Solution** ([developer.thunder.in.th](https://developer.thunder.in.th)) -> API Key for bank slip verification. |
| `THUNDER_API_URL` | No | `https://api.thunder.in.th/v2/verify/bank` | Thunder Slip Verification API v2 endpoint. |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host for sending emails. |
| `SMTP_PORT` | No | `587` | SMTP port (`587` for STARTTLS, `465` for SSL). |
| `SMTP_SECURE` | No | `false` | Set `true` only when using port `465`. |
| `SMTP_USER` | **Yes** (email) | `your-email@gmail.com` | Gmail address used to send transactional emails. |
| `SMTP_PASS` | **Yes** (email) | 16-char App Password | **Google Account** -> *Security* -> *2-Step Verification* -> *App passwords* (do not use your normal Gmail password). |
| `MAIL_FROM` | No | `"PetBuddy" <your-email@gmail.com>` | Sender name and email address shown to recipients. |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Used in local development. Docker builds automatically pass `VITE_API_URL=/api` and route via Nginx. |

> ⚠️ **Security:** Never commit `.env` files or secrets to Git. Only commit `.env.example`.

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.0.0` or later (`v22+` recommended)
- **npm**: `v10.0.0` or later

### 2. Install Dependencies
```bash
git clone https://github.com/TxAll-Stars-SE-Project/PetBuddy.git
cd PetBuddy
npm install
```

### 3. Generate Prisma Client (Required after clone or `git pull`)
```bash
cd backend
npx prisma generate
cd ..
```
*(Optional: if database tables were updated on Supabase, run `npx prisma db pull && npx prisma generate` inside `backend/`.)*

### 4. Run Dev Servers
Open two terminals at the repository root:

```bash
# Terminal 1 - Backend API + Swagger UI
npm run dev:backend

# Terminal 2 - Frontend Vite Dev Server
npm run dev:frontend
```

| Service | Local URL |
|---|---|
| **Frontend (Vite)** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://localhost:5000/api](http://localhost:5000/api) |
| **Swagger UI** | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) |

---

## 🐳 Production Build & Run (Docker Compose)

The repository includes `docker-compose.yml` for deploying both services behind Nginx:
- **Frontend container (`petbuddy-frontend`)**: Builds Vite with `VITE_API_URL=/api`, serves static assets on **Port `80`**, and reverse-proxies `/api/` and `/api-docs` to `backend:5000`.
- **Backend container (`petbuddy-backend`)**: Compiles TypeScript (`tsc`), runs Prisma generate, and starts Express on internal **Port `5000`** with `NODE_ENV=production`.

### 1. Configure `backend/.env` on the server
Make sure `backend/.env` exists and `FRONTEND_URL` points to your server's public IP or domain (e.g. `FRONTEND_URL="http://34.143.180.144"`). Leave `SWAGGER_SERVER_URL=""` so Swagger automatically uses the current origin (`/`).

### 2. Build and start containers
```bash
docker compose up -d --build
```

### 3. Useful Docker commands
```bash
# View container status & health
docker compose ps

# Follow logs
docker compose logs -f

# Rebuild only backend after API/OpenAPI changes
docker compose up -d --build backend

# Stop containers
docker compose down
```

Once running, access:
- **Web App**: `http://<YOUR_SERVER_IP>` (Port `80`)
- **Swagger UI**: `http://<YOUR_SERVER_IP>/api-docs`

---

## 🛠️ Available Scripts

Run from the project root:

| Command | Description |
|---|---|
| `npm run dev:frontend` | Starts Vite frontend with HMR (Port `5173`) |
| `npm run dev:backend` | Starts Express backend with `tsx watch` (Port `5000`) |
| `npm run build` | Builds both `frontend` and `backend` for production (`dist/`) |
| `npm run lint` | Runs ESLint across all workspaces |

Backend-specific scripts (`cd backend`):
- `npm test` — Run backend integration/API tests (`tsx --test`)
- `npm run test:unit` — Run Jest unit tests

---

## 🌿 Team Git Workflow (Branching & Rebasing)

1. **Always start from latest `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```
2. **Keep your branch updated with `rebase` (do not `git merge main`):**
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. **Verify before committing:**
   ```bash
   npm run lint
   npm run build
   ```
4. **Commit & push:**
   ```bash
   git add .
   git commit -m "feat: describe your change"
   git push -u origin feature/your-feature-name
   # After a rebase, use:
   git push --force-with-lease
   ```
5. **Open a Pull Request** targeting `main` on [TxAll-Stars-SE-Project/PetBuddy](https://github.com/TxAll-Stars-SE-Project/PetBuddy).
