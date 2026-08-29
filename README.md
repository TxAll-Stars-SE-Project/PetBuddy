# 🐾 PetBuddy

A full-stack monorepo web application built with **React 19**, **Vite**, **Express**, and **TypeScript**.

---

## 📁 Project Architecture

This project is organized as an **npm Workspaces Monorepo**:

```
PetBuddy/
├── backend/                       # Express + TypeScript API Server
│   ├── src/
│   │   ├── controllers/           # Route handler controllers
│   │   │   └── health.controller.ts
│   │   ├── routes/                # API route definitions
│   │   │   └── index.ts
│   │   ├── app.ts                 # Express middleware configuration
│   │   └── server.ts              # Server bootstrap and port listener
│   ├── .env.example               # Backend environment variable template
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # Vite + React 19 + TypeScript Client
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── assets/                # Images and vector icons
│   │   ├── App.tsx                # Main application component
│   │   ├── App.css                # Component styling
│   │   ├── index.css              # Global styles
│   │   ├── main.tsx               # React DOM root mounting
│   │   └── vite-env.d.ts          # Vite client types
│   ├── eslint.config.js           # ESLint 9 configuration
│   ├── index.html                 # Single page application entry
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts             # Vite bundler configuration
├── .gitignore                     # Global git ignore configuration
└── package.json                   # Root workspace configuration
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.0.0` or later (`v22+` recommended)
- **npm**: `v10.0.0` or later

### 2. Installation
Clone the repository and install all dependencies for both frontend and backend with a single command:

```bash
git clone git@github.com:tanravikorn/PetBuddy.git
cd PetBuddy
npm install
```

### 3. Environment Setup

Configure the backend environment:
```bash
cp backend/.env.example backend/.env
```

---

## 💻 Available Scripts

Run all commands directly from the project root:

| Command | Description | Local URL |
|---|---|---|
| `npm run dev:frontend` | Starts Vite frontend with Hot Module Replacement (HMR) | [http://localhost:5173](http://localhost:5173) |
| `npm run dev:backend` | Starts Express backend with live TypeScript reload (`tsx`) | [http://localhost:5000](http://localhost:5000) |
| `npm run build` | Builds both frontend and backend for production | Generates `dist/` folders |
| `npm run lint` | Runs ESLint across workspaces | — |

---

## 🌿 Team Git Workflow (Branching, Features & Rebasing)

Follow this workflow when developing a new feature or fix:

### 1. Update your local `main` branch
Always start from the latest version of `main`:
```bash
git checkout main
git pull origin main
```

### 2. Create a new branch
Use descriptive prefixes like `feature/`, `fix/`, or `refactor/`:
```bash
git checkout -b feature/user-authentication
```

### 3. Sync with `main` while working (Rebase)
If teammates merged new commits into `main` while you are working on your feature branch, keep your branch updated with `rebase`:
```bash
# 1. Fetch latest changes from remote
git fetch origin

# 2. Rebase your current branch on top of origin/main
git rebase origin/main

# 3. If there are conflicts: resolve them in your editor, then:
git add .
git rebase --continue
```
> **Why rebase?** Rebase places your feature commits cleanly on top of the latest `main`, keeping a linear, clean commit history without messy merge commits.

### 4. Develop & Verify Locally
Verify that the project builds and lints cleanly before committing:
```bash
npm run lint
npm run build
```

### 5. Stage and Commit
Write clear, conventional commit messages:
```bash
git add .
git commit -m "feat: add user login API and auth form"
```

### 6. Push to GitHub
Push your branch to GitHub:
```bash
# First-time push:
git push -u origin feature/user-authentication

# If you previously pushed and then rebased, update remote with force-with-lease:
git push --force-with-lease
```

### 7. Open a Pull Request (PR)
1. Go to the repository on GitHub: [https://github.com/tanravikorn/PetBuddy](https://github.com/tanravikorn/PetBuddy).
2. Click **Compare & pull request**.
3. Set base to `main` and provide a summary of your changes.
4. GitHub Actions CI will validate the build and the **Antigravity AI Agent** will review the PR.
5. After approval, merge into `main`!
