# 🐾 PetBuddy

A modern, full-stack monorepo web application built with **React 19**, **Vite**, **Express**, **TypeScript**, and an automated **Antigravity AI Code Review Agent** powered by Google Gemini.

---

## 📁 Project Architecture

This project is organized as an **npm Workspaces Monorepo**:

```
PetBuddy/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Automated CI (linting, typechecks & builds)
│   │   └── ai-pr-reviewer.yml     # Antigravity AI Code Review Agent
│   └── scripts/
│       └── ai_reviewer.mjs        # AI Code Reviewer script (Gemini API)
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
├── package.json                   # Root workspace configuration
└── README.md                      # Project documentation
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.0.0` or later (`v22+` recommended)
- **npm**: `v10.0.0` or later

### 2. Installation
Clone the repository and install all dependencies for both frontend and backend in one command:

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

Run all commands directly from the project root without navigating into subfolders:

| Command | Description | Local URL |
|---|---|---|
| `npm run dev:frontend` | Starts Vite frontend with Hot Module Replacement (HMR) | [http://localhost:5173](http://localhost:5173) |
| `npm run dev:backend` | Starts Express backend with live TypeScript reload (`tsx`) | [http://localhost:5000](http://localhost:5000) |
| `npm run build` | Builds both frontend and backend for production | Generates `dist/` folders |
| `npm run lint` | Runs ESLint across workspaces | — |

---

## 🤖 CI/CD & Antigravity AI Code Review Agent

This repository is equipped with automated GitHub Actions pipelines:

### 1. Continuous Integration (`ci.yml`)
Runs automatically on pushes and Pull Requests to `main`:
- 📦 Installs dependencies cleanly.
- 🔍 Runs ESLint checks.
- 🛡️ Typechecks frontend and backend TypeScript (`tsc`).
- 🏗️ Validates production bundles for both frontend (`vite build`) and backend.

### 2. AI Code Review Agent (`ai-pr-reviewer.yml`)
Triggers automatically whenever team members push changes or open a Pull Request:
- 🧠 Extracts the Git diff and sends it to **Gemini API**.
- 🔍 Analyzes code quality, potential bugs, edge cases, and security risks.
- 💡 Provides actionable refactoring suggestions with code snippets.
- 💬 Automatically posts a structured review comment on the Pull Request.

### Enabling the AI Agent in GitHub:
1. Go to your GitHub repository **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Under **Repository secrets**, click **New repository secret**.
3. Name: `GEMINI_API_KEY` (or `ANTIGRAVITY_API_KEY`).
4. Value: Paste your Google Gemini API key.
5. *(Optional)* Under **Variables**, add `GEMINI_MODEL` (e.g. `gemini-2.5-flash` or `gemini-2.5-pro`).

---

## 🌿 Git & Team Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: describe your change"
   ```
3. Push to GitHub and open a Pull Request:
   ```bash
   git push -u origin feature/your-feature-name
   ```
4. GitHub CI will automatically validate the build and the **Antigravity AI Agent** will review your code!

---

## 📄 License
This project is open-source and available under the standard MIT License.
