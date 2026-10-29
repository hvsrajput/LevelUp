# LevelUp

> LevelUp your DSA preparation — An interview-explainable DSA problem tracker with RAG-assisted pattern discovery, study circles, and streak analytics.

---

## 🚀 Overview

**LevelUp** is a full-stack DSA (Data Structures & Algorithms) tracker and study companion. Unlike passive bookmarking tools, LevelUp focuses on active recall, algorithmic pattern recognition, and peer accountability:

- **Problem Tracking**: Full CRUD with topics, complexity tracking ($O(T)$ / $O(S)$), syntax-highlighted solutions, and test case edge cases.
- **RAG-Assisted Pattern Grounding**: Recommends algorithmic patterns (Sliding Window, Two Pointers, Monotonic Stack, etc.), candidate approaches, and progressive hints grounded strictly on a curated knowledge base.
- **Private Study Groups**: Create private circles with 8-character invite codes, live leaderboards, consecutive solve streaks, and shared member activity feeds.
- **Curated Problem Catalog & Roadmaps**: 60+ canonical foundational problems, personalized week-by-week learning roadmaps, next-question recommendations with explainability, and daily challenges with spaced repetition.

---

## 🏗 Architecture Diagram

```mermaid
flowchart TD
  subgraph Client["Frontend Layer (Next.js 16 App Router)"]
    UI_Problems["Problem Dashboard & Details (/problems)"]
    UI_Groups["Private Study Circles (/groups)"]
    UI_Roadmap["Interactive Roadmap & Syllabus (/roadmap)"]
    UI_Catalog["Curated Problem Catalog (/catalog)"]
    Widgets["Daily Question & Next Recommender Cards"]
  end

  subgraph AuthSecurity["Auth & Route Guarding"]
    NextAuth["Auth.js v5 (OAuth & Credentials)"]
    RBAC["Server-Side RBAC (Group & Problem Ownership)"]
    ZodValidation["Zod Validation Boundary"]
  end

  subgraph APIRoutes["API Route Handlers"]
    API_Problems["/api/problems & /api/problems/[id]"]
    API_Suggest["/api/problems/suggest (RAG)"]
    API_Groups["/api/groups & /api/groups/[id]"]
    API_Roadmap["/api/roadmap & items"]
    API_Daily["/api/daily-question & /api/recommendations/next"]
    API_Catalog["/api/catalog"]
  end

  subgraph CoreEngines["Core Subsystems"]
    RAG_Engine["RAG Grounding & Cosine Retrieval Engine"]
    Roadmap_Engine["Curriculum Builder (Pedagogy Rules)"]
    Spaced_Repetition["Spaced Repetition & Streak Calculator"]
  end

  subgraph DatabaseLayer["Data Persistence (PostgreSQL / Neon)"]
    PrismaORM["Prisma Client ORM"]
    DB_Problems[("Problems & Test Cases")]
    DB_Groups[("Groups & Members")]
    DB_Roadmaps[("Roadmaps & Syllabus Items")]
    DB_Patterns[("Curated DSA Patterns")]
    DB_Catalog[("Seeded Problem Catalog")]
  end

  Client --> AuthSecurity
  AuthSecurity --> ZodValidation
  ZodValidation --> APIRoutes
  APIRoutes --> CoreEngines
  CoreEngines --> PrismaORM
  APIRoutes --> PrismaORM
  PrismaORM --> DatabaseLayer
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5
- **Styling & UI**: Tailwind CSS v4, Base UI, Lucide Icons
- **Database & ORM**: PostgreSQL (Neon) with Prisma ORM & pgvector extension
- **Authentication**: Auth.js (NextAuth v5 beta)
- **Validation**: Zod schema validation across all route boundaries
- **Testing**: Vitest with unit & integration test suites
- **CI/CD**: GitHub Actions pipeline for automated lint, typecheck, tests, and build verification

---

## 📦 Implemented Phases

- [x] **Phase 1: Domain Models & Problem CRUD**
  - Upfront Prisma schema with `cuid()` IDs, human-friendly `shortCode` slugs, and LeetCode compatibility columns.
  - Auth.js authentication and full CRUD API routes with Zod validation.
- [x] **Phase 2: Topics, Submissions & Search**
  - Multi-language solution submission viewer with copy-to-clipboard.
  - "Examples & edge cases" tracker.
  - Advanced search, difficulty filters, topic filtering, and timeframe sorting.
- [x] **Phase 3: RAG Knowledge Base & Pattern Suggestions**
  - Curated DSA pattern knowledge base (15 canonical patterns with signals, approaches, and graded hints).
  - High-performance cosine similarity retrieval and deterministic grounded synthesis.
  - Interactive suggestion review panel in the problem editor.
- [x] **Phase 4: Private Groups with Join Codes**
  - Collision-resistant 8-character invite codes (`generateJoinCode()`).
  - Server-side RBAC protecting group data.
  - Real-time leaderboard with daily practice streaks and chronological member activity feed.
- [x] **Phase 5: Problem Catalog, Roadmap Generator & Spaced Repetition**
  - Seeded catalog of 63 foundational problems with topic and difficulty filters.
  - Customizable 4, 8, or 12-week roadmap generator with concept progress tracking.
  - Next-question recommendation engine with explicit explainability.
  - Daily challenge generator with spaced repetition revisits (~7, 14, 21-day cycles).
- [x] **Phase 6: Tests, CI & Deployment**
  - Automated GitHub Actions CI workflow running lint, typecheck, tests, and production build.
  - 100% route integration test coverage across all major endpoints.
  - Vercel deployment configuration with automated `prisma generate` postinstall hooks.

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (e.g. Neon, Supabase, or local Postgres)

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Database (PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:password@localhost:5432/levelup?schema=public"

# Auth.js / NextAuth
AUTH_SECRET="your-auth-secret-generate-with-openssl-rand-hex-32"
NEXTAUTH_URL="http://localhost:3000"

# Optional: LLM API key for live generative expansions (falls back to deterministic grounded synthesis)
GEMINI_API_KEY=""
```

### 3. Installation & Database Setup
```bash
# Install dependencies (runs prisma generate automatically)
npm install

# Run database migrations
npx prisma migrate dev

# Seed the curated DSA patterns knowledge base
npm run seed:patterns

# Seed the curated problem catalog (~63 canonical problems)
npm run seed:catalog
```

### 4. Development & Testing
```bash
# Start local development server
npm run dev

# Run unit and integration tests (100+ tests across all routes)
npm test

# Run ESLint & TypeScript verification
npm run lint
npm run build
```

---

## 🚀 Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the project into **Vercel**.
3. Configure Environment Variables in the Vercel Project Settings:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `AUTH_SECRET`: A secure 32-character hex secret (`openssl rand -hex 32`).
   - `NEXTAUTH_URL`: Your production Vercel URL (e.g. `https://levelup.vercel.app`).
4. Vercel will automatically run `prisma generate && next build` using the configured build settings.
