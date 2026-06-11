# Technology Stack

## Core Technologies

### Frontend Framework
- **Next.js** (latest): React framework with App Router, Server Components, and Server Actions
- **React** (latest): UI library with latest features (hooks, suspense, transitions)
- **TypeScript** (5.7.3): Static typing and enhanced developer experience

### Styling & UI
- **Tailwind CSS** (3.4.17): Utility-first CSS framework
- **@tailwindcss/forms** (0.5.10): Form styling plugin
- **PostCSS** (8.5.1): CSS processing
- **Autoprefixer** (10.4.20): Vendor prefix automation
- **@heroicons/react** (2.2.0): Icon library
- **clsx** (2.1.1): Conditional className utility

### Database & Backend
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **@neondatabase/serverless** (1.1.0): Neon database driver
- **postgres** (3.4.6): PostgreSQL client library

### Authentication & Security
- **NextAuth** (5.0.0-beta.25): Authentication framework
- **bcrypt** (5.1.1): Password hashing
- **Zod** (3.25.17): Schema validation

### Utilities
- **use-debounce** (10.0.4): Debouncing for search and inputs

## Development Dependencies

### Type Definitions
- **@types/node** (22.10.7): Node.js type definitions
- **@types/react** (19.0.7): React type definitions
- **@types/react-dom** (19.0.3): React DOM type definitions
- **@types/bcrypt** (5.0.2): bcrypt type definitions

### Build Tools
- **baseline-browser-mapping** (2.10.20): Browser compatibility tooling

## TypeScript Configuration

### Compiler Options
- **Target**: ES2017
- **Module System**: ESNext with bundler resolution
- **JSX**: react-jsx
- **Strict Mode**: Enabled
- **Path Aliases**: `@/*` maps to project root
- **Incremental Compilation**: Enabled for faster builds

### Include Patterns
- All `.ts` and `.tsx` files
- Next.js type definitions
- App directory files

## Build System

### Package Manager
Supports multiple package managers:
- npm (package-lock.json present)
- pnpm (pnpm-lock.yaml present)

### Scripts
- `npm run dev`: Development server with Turbopack
- `npm run build`: Production build
- `npm run start`: Production server

### Build Optimizations
- **Turbopack**: Next-generation bundler for faster development
- **Incremental TypeScript**: Faster type checking with `.tsbuildinfo`
- **PNPM Dependencies**: Selective builds for bcrypt and sharp

## Database Setup

### Connection
- Neon serverless PostgreSQL via `@neondatabase/serverless`
- Connection string stored in `.env` files
- Edge-compatible queries

### Schema Management
- Seed routes: `/seed` and `/seed-vessels`
- Placeholder data in `lib/placeholder-data.ts`
- Database check endpoint: `/check-db`

## Deployment

### Platform
- **Vercel**: Optimized for Next.js deployment
- **Production URL**: https://ugd-nextjs.vercel.app
- Configuration in `vercel.json`

### Environment Variables
Required variables (see `.env.example`):
- Database connection strings
- NextAuth secret and configuration
- API keys for external services

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Database seeding (via API routes)
# Navigate to /seed or /seed-vessels endpoints
```

## Browser Support
- Modern browsers supporting ES2017
- DOM APIs (dom, dom.iterable, esnext)
- Baseline browser mapping for compatibility

## IDE Configuration
- TypeScript language service via Next.js plugin
- Path resolution for imports with `@/*` alias
- Strict type checking enabled
