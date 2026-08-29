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
