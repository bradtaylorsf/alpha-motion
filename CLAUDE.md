# Answer Motion - Claude Code Instructions

This project is an AI-powered motion design tool for generating, previewing, and organizing Remotion animation components.

## Project Overview

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express.js with SQLite (Drizzle ORM)
- **Animation**: Remotion for video/motion graphics
- **AI**: Anthropic API (idea generation) + Claude Code CLI (component generation)

## Development Commands

```bash
npm run dev          # Start Express server (port 3001)
npm run dev:client   # Start Vite dev server (port 3000)
npm run remotion:studio  # Open Remotion Studio for testing
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio
```

## Directory Structure

```
src/
├── client/          # React frontend
├── server/          # Express backend
├── remotion/        # Remotion compositions
│   └── generated/   # AI-generated components go here
└── skills/          # Animation guidance and examples
    ├── guidance/    # Markdown files with patterns
    └── examples/    # Working code examples
```

---

# Remotion Component Generation Rules

When generating Remotion components, follow these patterns strictly:

## Core Principles

1. **Constants-first design**: All customizable values (colors, text, timing, positions) MUST be defined as named constants at the top of the component
2. **Self-contained**: Components must not import external assets unless explicitly provided
3. **Smooth animations**: Use `spring()` for organic motion, `interpolate()` for linear transitions
4. **Frame-based timing**: All timing is in frames, not seconds (fps is typically 30)

## Component Template

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// ===== CUSTOMIZABLE CONSTANTS =====
const BACKGROUND_COLOR = '#0a0a0a';
const PRIMARY_COLOR = '#3b82f6';
const TEXT_COLOR = '#ffffff';
const FONT_SIZE = 64;
const ANIMATION_START_FRAME = 0;
const ANIMATION_DURATION = 30;

export const MyAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Animation calculations
  const opacity = interpolate(
    frame,
    [ANIMATION_START_FRAME, ANIMATION_START_FRAME + ANIMATION_DURATION],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const scale = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: TEXT_COLOR,
          fontSize: FONT_SIZE,
        }}
      >
        Animation Content
      </div>
    </AbsoluteFill>
  );
};

export default MyAnimation;
```

## Animation Best Practices

### Use `spring()` for organic motion
```tsx
// Good - natural feeling
const scale = spring({ frame, fps, config: { damping: 200 } });

// Avoid - mechanical feeling
const scale = interpolate(frame, [0, 30], [0, 1]);
```

### Always clamp interpolations
```tsx
// Good - prevents values outside range
interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

// Bad - can produce unexpected values
interpolate(frame, [0, 30], [0, 1]);
```

### Use `Sequence` for timing
```tsx
import { Sequence } from 'remotion';

<Sequence from={0} durationInFrames={60}>
  <FirstPart />
</Sequence>
<Sequence from={60} durationInFrames={60}>
  <SecondPart />
</Sequence>
```

### Typography animations
```tsx
// Typewriter effect
const text = "Hello World";
const charsShown = Math.floor(interpolate(frame, [0, 60], [0, text.length], { extrapolateRight: 'clamp' }));
const visibleText = text.slice(0, charsShown);

// Word-by-word reveal
const words = text.split(' ');
const wordIndex = Math.floor(interpolate(frame, [0, 90], [0, words.length], { extrapolateRight: 'clamp' }));
```

### Staggered animations
```tsx
const items = ['A', 'B', 'C', 'D'];
const STAGGER_DELAY = 5; // frames between each item

{items.map((item, i) => {
  const itemFrame = frame - (i * STAGGER_DELAY);
  const opacity = interpolate(itemFrame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div key={i} style={{ opacity }}>{item}</div>;
})}
```

## Runtime Harness (CRITICAL)

Generated components are compiled **in-browser** via Babel and executed with `new Function()`.
Import statements are stripped automatically and dependencies are injected by the preview harness.

**Only these are available at runtime:**
- `React` (full library, injected as a global)
- From `remotion`: `AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `Sequence`, `Series`, `Easing`, `Img`, `Audio`, `Video`, `staticFile`, `delayRender`, `continueRender`

```tsx
// ONLY import from 'react' and 'remotion' — these are the only packages available
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { interpolate, spring, Easing, Img } from 'remotion';
```

**DO NOT import from these packages** (they are NOT available in the runtime):
- `@remotion/shapes`
- `@remotion/google-fonts`
- `@remotion/three`
- `@remotion/transitions`
- `@remotion/lottie`

For custom fonts, use a `<style>` tag with `@import url(...)` from Google Fonts CDN, or use web-safe fonts.

## What NOT to do

1. **Never use `setTimeout` or `setInterval`** - use frame-based timing
2. **Never use CSS animations** - use Remotion's interpolate/spring
3. **Never hardcode fps** - use `useVideoConfig()` to get it
4. **Never use `Math.random()` without seed** - animations must be deterministic
5. **Never import external images/videos** unless paths are provided
6. **Never use `useEffect` for animations** - derive everything from `frame`
7. **Never import from `@remotion/shapes`, `@remotion/google-fonts`, `@remotion/three`, etc.** - only `react` and `remotion` core are available in the browser harness

## Skill Categories

When generating components, consider which skill category applies:

- **typography**: Text animations, typewriter, word reveals, kinetic text
- **charts**: Data visualizations, bar charts, line graphs, pie charts
- **transitions**: Scene transitions, fades, slides, wipes
- **3d**: Three.js integrations, 3D objects, camera movements
- **spring-physics**: Bouncy animations, elastic effects, natural motion
- **sequencing**: Multi-part animations, timelines, orchestration
- **social-media**: Stories, reels, TikTok-style content

---

# Database Schema

Components are stored in SQLite with this schema:

```sql
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt_used TEXT,
  idea_json TEXT,
  source_code TEXT,
  tags TEXT,  -- JSON array
  duration_frames INTEGER DEFAULT 150,
  fps INTEGER DEFAULT 30,
  width INTEGER DEFAULT 1920,
  height INTEGER DEFAULT 1080,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

# API Routes

- `POST /api/ideas/random` - Generate random animation idea
- `POST /api/ideas/expand` - Expand user's rough idea
- `POST /api/generate` - Start component generation job
- `GET /api/generate/:jobId/status` - Check generation status
- `GET /api/components` - List all components
- `GET /api/components/:id` - Get single component
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component
- `GET /api/components/:id/source` - Get source code for preview

---

# Preview System

Components are dynamically compiled in the browser using Babel standalone and rendered with `@remotion/player`. The compilation process:

1. Receive component source code
2. Transform JSX/TypeScript with Babel
3. Inject Remotion imports
4. Create blob URL and dynamic import
5. Render with `<Player>` component

Error boundaries catch invalid components and display helpful error messages.
