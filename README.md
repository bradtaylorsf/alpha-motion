# Remotion Moodboard

An AI-powered mood board for generating, previewing, and organizing Remotion animation components.

## Features

- **AI Idea Generation** - Generate random animation ideas or expand your rough concepts into detailed animation specs using Claude
- **AI Component Generation** - Automatically generate working Remotion components from ideas using Claude Code
- **AI Image Generation** - Generate images for your animations using Google Gemini (Nano Bananas)
- **Live Preview** - Preview generated animations in-browser with the Remotion Player
- **Asset Management** - Generate, organize, and link images to your animation components
- **Remix Workflow** - Edit pending ideas before generation, or remix completed animations to create variations
- **Component Library** - Browse, search, and manage your generated animation components

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + SQLite (better-sqlite3)
- **Animation**: Remotion 4.x
- **AI**: Anthropic Claude API (ideas) + Claude Code CLI (components) + Google Gemini (images)
- **UI**: Radix UI + Lucide Icons

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- [Claude Code CLI](https://github.com/anthropics/claude-code) installed and authenticated
- Anthropic API key
- Google Gemini API key (for image generation)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/the-answerai/remotion-moodboard.git
   cd remotion-moodboard
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key
   NANO_BANANAS_API_KEY=your_google_gemini_api_key
   ```

5. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

6. Create the generated assets directory:
   ```bash
   mkdir -p public/assets/generated
   ```

## Running Locally

Start both the API server and client dev server:

```bash
pnpm dev
```

This runs:
- **API Server** on `http://localhost:3001`
- **Client** on `http://localhost:3000`

### Other Commands

```bash
pnpm dev:server      # Start only the API server
pnpm dev:client      # Start only the Vite dev server
pnpm remotion:studio # Open Remotion Studio for testing components
pnpm db:studio       # Open Drizzle Studio to browse the database
pnpm build           # Build for production
pnpm typecheck       # Run TypeScript type checking
```

## Usage

### Generating Animation Ideas

1. **Random Ideas**: Click "Generate Ideas" to get AI-generated animation concepts
2. **Expand Your Idea**: Type a rough concept in the input field and submit to expand it into a full animation spec

### Working with Pending Ideas

- Generated ideas appear as "pending" cards on the board
- Click a pending idea to open the **Edit Modal** where you can:
  - Modify the title, description, style, colors, motion, and elements
  - Adjust video settings (duration, FPS, resolution)
  - Generate images using the **Assets** tab
  - Start generation when ready

### Generating Images

In the Edit Modal's Assets tab:
1. Enter a prompt describing the image you want
2. Select an asset type (Background, Icon, Texture, Character, Object)
3. Click "Generate" to create the image
4. Generated images are automatically linked to the animation

Asset types automatically set appropriate aspect ratios:
- **Background**: 16:9 (full-screen backgrounds)
- **Icon**: 1:1 (square icons and logos)
- **Texture**: 1:1 (tileable patterns)
- **Character**: 3:4 (people and avatars)
- **Object**: 1:1 (props and items)

### Generating Animations

1. Click "Generate" on a pending idea to start component generation
2. The card shows generation progress (queued → generating → complete)
3. Once complete, click to preview the animation

### Previewing & Remixing

- Click any completed component to open the **Preview Modal**
- View the live animation, source code, and linked assets
- Click **Remix** to create a variation with the same settings

## Project Structure

```
src/
├── client/              # React frontend
│   ├── components/      # UI components
│   ├── hooks/           # React hooks
│   ├── lib/             # API client and utilities
│   └── types/           # TypeScript types
├── server/              # Express backend
│   ├── db/              # Database schema and migrations
│   ├── routes/          # API routes
│   └── services/        # Business logic
├── remotion/            # Remotion compositions
│   └── generated/       # AI-generated components
└── skills/              # Animation guidance for AI
    ├── guidance/        # Pattern documentation
    └── examples/        # Working code examples
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ideas/random` | Generate random animation idea |
| POST | `/api/ideas/expand` | Expand user's rough idea |
| POST | `/api/generate` | Start component generation |
| GET | `/api/generate/:jobId/status` | Check generation status |
| GET | `/api/components` | List all components |
| GET | `/api/components/:id` | Get single component |
| DELETE | `/api/components/:id` | Delete component |
| POST | `/api/assets/generate` | Generate single image |
| POST | `/api/assets/generate/batch` | Generate multiple images |
| GET | `/api/assets` | List assets |
| GET | `/api/pending-ideas` | List pending ideas |
| POST | `/api/pending-ideas` | Create pending idea |
| PUT | `/api/pending-ideas/:id` | Update pending idea |
| DELETE | `/api/pending-ideas/:id` | Delete pending idea |

## License

MIT
