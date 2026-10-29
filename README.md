# LevelUp

> LevelUp your DSA preparation — An interview-explainable DSA problem tracker with RAG-assisted pattern discovery, study circles, and streak analytics.

---

## 🚀 Overview

**LevelUp** is a full-stack DSA (Data Structures & Algorithms) tracker and study companion. Unlike passive bookmarking tools, LevelUp focuses on active recall, algorithmic pattern recognition, and peer accountability:

- **Problem Tracking**: Full CRUD with topics, complexity tracking ($O(T)$ / $O(S)$), syntax-highlighted solutions, and test case edge cases.
- **RAG-Assisted Pattern Grounding**: Recommends algorithmic patterns (Sliding Window, Two Pointers, Monotonic Stack, etc.), candidate approaches, and progressive hints grounded strictly on a curated knowledge base.
- **Private Study Groups**: Create private circles with 8-character invite codes, live leaderboards, consecutive solve streaks, and shared member activity feeds.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5
- **Styling & UI**: Tailwind CSS v4, Base UI, Lucide Icons
- **Database & ORM**: PostgreSQL (Neon) with Prisma ORM & pgvector extension
- **Authentication**: Auth.js (NextAuth v5 beta)
- **Validation**: Zod schema validation across all route boundaries
- **Testing**: Vitest with unit & integration test suites

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
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed the curated DSA patterns knowledge base
npm run seed:patterns
```

### 4. Development & Testing
```bash
# Start local development server
npm run dev

# Run unit and integration tests (56 tests)
npm test

# Run ESLint & TypeScript verification
npm run lint
npm run build
```

---

## 🔒 Security & Architecture
- **Server-Side Enforcement**: All group access and problem mutations enforce authorization at the Route Handler layer.
- **Zero API Key Leakage**: LLM and database credentials remain strictly server-side.
- **Resilient RAG**: Suggestion service gracefully synthesizes responses directly from curated pattern chunks when external model APIs are unreachable or unconfigured.
