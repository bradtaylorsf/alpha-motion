# Remotion Mood Board - Implementation Plan

> An AI-powered tool for generating, previewing, and organizing Remotion animation ideas

## Overview

A personal desktop tool that combines idea generation (Anthropic API), component creation (Claude Code CLI), and asset generation (Nano Bananas API) to create a mood board of reusable Remotion animations.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Vite + React + TypeScript | Fast dev experience, Remotion compatibility |
| Backend | Express.js | API server, CLI orchestration |
| Database | SQLite + Drizzle ORM | Component storage, metadata |
| AI (Ideas) | Anthropic API (Direct) | Fast idea generation and expansion |
| AI (Code) | Claude Code CLI | Component implementation |
| AI (Assets) | Nano Bananas API | Asset generation (Phase 2) |
| Preview | @remotion/player + Babel | Live component compilation & previews |
| Styling | Tailwind CSS | Rapid UI development |
| Skills | Remotion Skills System | Animation patterns & examples |

---

## Key Features

### CLAUDE.md Integration

The project includes a comprehensive `CLAUDE.md` file that provides Claude Code with:
- Remotion component generation rules
- Animation best practices (spring physics, interpolation, sequencing)
- Common pitfalls to avoid
- Database schema reference
- API endpoint documentation

### Skills System

Inspired by [remotion-dev/skills](https://github.com/remotion-dev/skills), the project includes:

**Guidance Skills** (markdown files with patterns):
- `typography.md` - Text animations, typewriter effects, kinetic text
- `charts.md` - Data visualizations, bar charts, line graphs
- `transitions.md` - Scene transitions, fades, slides, wipes
- `spring-physics.md` - Bouncy animations, elastic effects
- `sequencing.md` - Multi-part animations, timelines
- `social-media.md` - Instagram, TikTok, YouTube Shorts formats

**Example Skills** (working code):
- Typewriter effect
- Animated bar chart
- Text rotation
- Metric counters
- Logo reveal

Skills are automatically detected from user prompts and injected into the generation context.

### Preview System

Uses Babel standalone for browser-based TSX compilation:
1. User selects a component
2. Source code is fetched from database
3. Babel transforms TSX to JavaScript
4. Remotion imports are injected
5. Component renders in `@remotion/player`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vite + React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Idea Panel   │  │ Mood Board   │  │ Preview Player       │   │
│  │ - Random     │  │ - Grid View  │  │ - Remotion Player    │   │
│  │ - Expand     │  │ - Search     │  │ - Babel Compilation  │   │
│  └──────────────┘  └──────────────┘  │ - Code Viewer        │   │
│                                       └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Express)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ /api/ideas   │  │ /api/generate│  │ /api/components      │   │
│  │ Anthropic API│  │ Claude Code  │  │ SQLite CRUD          │   │
│  │              │  │ + Skills     │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ Anthropic│   │ Claude   │   │ SQLite DB    │
        │ API      │   │ Code CLI │   │              │
        └──────────┘   └──────────┘   └──────────────┘
```

---

## Project Structure

```
remotion-moodboard/
├── CLAUDE.md                         # Claude Code instructions
├── IMPLEMENTATION_PLAN.md            # This file
├── package.json
├── tsconfig.json
├── vite.config.ts
├── remotion.config.ts
├── drizzle.config.ts
├── tailwind.config.js
├── index.html
│
├── src/
│   ├── client/                       # Vite React Frontend
│   │   ├── components/
│   │   │   ├── ideas/
│   │   │   │   ├── IdeaPanel.tsx     # Main idea generation UI
│   │   │   │   └── IdeaCard.tsx      # Idea display component
│   │   │   ├── board/
│   │   │   │   ├── MoodBoard.tsx     # Main grid view
│   │   │   │   └── ComponentCard.tsx # Component thumbnail card
│   │   │   └── preview/
│   │   │       ├── PreviewModal.tsx  # Full preview dialog
│   │   │       ├── RemotionPreview.tsx # Remotion player wrapper
│   │   │       └── CodeViewer.tsx    # Source code display
│   │   ├── hooks/
│   │   │   ├── useIdeas.ts           # Idea generation state
│   │   │   ├── useComponents.ts      # Component CRUD
│   │   │   └── useGeneration.ts      # Generation job polling
│   │   ├── lib/
│   │   │   ├── api.ts                # API client
│   │   │   └── utils.ts              # Utilities
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── server/                       # Express Backend
│   │   ├── routes/
│   │   │   ├── ideas.ts              # /api/ideas endpoints
│   │   │   ├── generate.ts           # /api/generate endpoints
│   │   │   └── components.ts         # /api/components endpoints
│   │   ├── services/
│   │   │   ├── anthropic.ts          # Anthropic API client
│   │   │   ├── claude-code.ts        # CLI spawning + skills
│   │   │   └── component-store.ts    # SQLite operations
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle client
│   │   │   ├── schema.ts             # Database schema
│   │   │   └── migrate.ts            # Migration script
│   │   └── index.ts                  # Express app
│   │
│   ├── skills/                       # Animation Skills System
│   │   ├── index.ts                  # Skill detection & retrieval
│   │   ├── guidance/                 # Markdown pattern guides
│   │   │   ├── typography.md
│   │   │   ├── charts.md
│   │   │   ├── transitions.md
│   │   │   ├── spring-physics.md
│   │   │   ├── sequencing.md
│   │   │   └── social-media.md
│   │   └── examples/                 # Working code examples
│   │       ├── typewriter.ts
│   │       ├── bar-chart.ts
│   │       ├── text-rotation.ts
│   │       ├── counter.ts
│   │       └── logo-reveal.ts
│   │
│   └── remotion/                     # Remotion Project
│       ├── Root.tsx
│       ├── DynamicComponent.tsx
│       ├── index.ts
│       └── generated/                # AI-generated components
│           └── .gitkeep
│
├── public/
│   └── assets/                       # User uploaded assets
│
└── data/                             # SQLite database
    └── moodboard.db
```

---

## Database Schema

```sql
-- Components table
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt_used TEXT,
  idea_json TEXT,           -- Original idea object
  source_code TEXT,         -- Generated TSX
  tags TEXT,                -- JSON array
  duration_frames INTEGER DEFAULT 150,
  fps INTEGER DEFAULT 30,
  width INTEGER DEFAULT 1920,
  height INTEGER DEFAULT 1080,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Assets table (Phase 2)
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  component_id TEXT REFERENCES components(id),
  name TEXT NOT NULL,
  type TEXT,                -- 'generated' | 'uploaded'
  source TEXT,              -- 'nano-bananas' | 'local'
  file_path TEXT,
  prompt_used TEXT,
  metadata TEXT,            -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Collections table (for organizing mood board)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_components (
  collection_id TEXT REFERENCES collections(id),
  component_id TEXT REFERENCES components(id),
  position INTEGER,
  PRIMARY KEY (collection_id, component_id)
);
```

---

## API Endpoints

### Ideas (Anthropic API Direct)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ideas/random` | Generate random animation concept |
| POST | `/api/ideas/expand` | Expand user's rough idea |

### Generation (Claude Code CLI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate Remotion component from idea |
| GET | `/api/generate/:jobId/status` | Check generation status |

### Components (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/components` | List all components |
| GET | `/api/components/:id` | Get single component |
| PUT | `/api/components/:id` | Update component metadata |
| DELETE | `/api/components/:id` | Delete component |
| GET | `/api/components/:id/source` | Get raw source for preview |

---

## Implementation Phases

### Phase 1: Foundation (MVP) ✅ SCAFFOLDED

#### 1.1 Project Setup ✅
- [x] Initialize Vite + React + TypeScript project
- [x] Add Express server configuration
- [x] Configure Tailwind CSS
- [x] Set up SQLite with Drizzle ORM
- [x] Create database schema and migration script
- [x] Configure Remotion
- [x] Create CLAUDE.md with generation rules
- [x] Implement Skills system

#### 1.2 Idea Generation ✅
- [x] Set up Anthropic API client
- [x] Create prompt templates for random generation
- [x] Create prompt templates for idea expansion
- [x] Build `/api/ideas/random` endpoint
- [x] Build `/api/ideas/expand` endpoint
- [x] Create IdeaPanel UI component
- [x] Create IdeaCard display component

#### 1.3 Claude Code Integration ✅
- [x] Create Claude Code CLI spawning service
- [x] Integrate Skills detection into prompts
- [x] Build `/api/generate` endpoint
- [x] Build `/api/generate/:jobId/status` endpoint
- [x] Handle generated code parsing and storage

#### 1.4 Component Storage ✅
- [x] Implement component CRUD operations
- [x] Build all `/api/components` endpoints

#### 1.5 Preview System ✅
- [x] Set up Babel-based dynamic component compilation
- [x] Integrate @remotion/player
- [x] Create PreviewModal with playback controls
- [x] Add error boundary for invalid components
- [x] Create CodeViewer for source inspection

#### 1.6 Mood Board UI ✅
- [x] Create ComponentGrid layout
- [x] Build ComponentCard with color preview
- [x] Add search functionality

---

### Phase 2: Asset Integration

#### 2.1 Nano Bananas Integration
- [ ] Set up Nano Bananas API client
- [ ] Create asset generation service
- [ ] Build `/api/assets/generate` endpoint
- [ ] Update idea generation to suggest assets
- [ ] Update component generation to include assets

#### 2.2 User Assets
- [ ] Create asset upload endpoint
- [ ] Build asset library UI
- [ ] Add asset browser to generation flow
- [ ] Support drag-drop asset assignment

---

### Phase 3: Polish & Extended Features

#### 3.1 Enhanced Preview
- [ ] Add timeline scrubbing
- [ ] Support different aspect ratios
- [ ] Add export to video (via Remotion render)

#### 3.2 Organization
- [ ] Filtering by tags
- [ ] Collection management UI
- [ ] Drag-and-drop reordering
- [ ] Favorites system

#### 3.3 Iteration
- [ ] "Regenerate" button with modifications
- [ ] Version history for components
- [ ] Fork/duplicate components
- [ ] Edit source code manually with Monaco Editor

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Set up database
npm run db:migrate

# Start development (run both in separate terminals)
npm run dev          # Express server on :3001
npm run dev:client   # Vite on :3000

# Or start Remotion studio for testing
npm run remotion:studio
```

---

## Environment Variables

```env
# .env
ANTHROPIC_API_KEY=sk-ant-...
NANO_BANANAS_API_KEY=...          # Phase 2
DATABASE_PATH=./data/moodboard.db
PORT=3001
NODE_ENV=development
```

---

## Success Metrics

- Generate a working Remotion component from a random idea in < 60 seconds
- Preview components without page reload using Babel compilation
- Store and retrieve 100+ components efficiently
- Export components ready to use in production Remotion projects
- Skills system improves generation quality for specific animation types

---

## Related Resources

- [Remotion Documentation](https://www.remotion.dev/docs/)
- [remotion-dev/skills](https://github.com/remotion-dev/skills) - Animation skills reference
- [remotion-dev/template-prompt-to-motion-graphics](https://github.com/remotion-dev/template-prompt-to-motion-graphics) - AI generation template
- [@remotion/player](https://www.remotion.dev/docs/player/) - Embedding player documentation

---

## Future Considerations

- **Collaboration**: Share mood boards with team members
- **Templates**: Pre-built component templates to modify
- **AI Iteration**: "Make it more energetic" style refinements
- **Render Pipeline**: Direct export to MP4/GIF from the app
- **Plugin System**: Custom asset sources beyond Nano Bananas
- **Monaco Editor**: Full code editing with IntelliSense
