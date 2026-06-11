# Project Structure

## Directory Organization

### `/app` - Next.js App Router Structure
Core application following Next.js 15+ conventions with route-based organization.

#### Key Route Directories
- **`/admin`**: Administrative dashboard with nested routes for cargo, users, vessels, security, and live tracking
  - `/cargo-management`: Cargo CRUD operations
  - `/user-management`: User and crew administration
  - `/vessel-deployement`: Fleet deployment scheduling
  - `/security-accounts`: Account and security management
  - `/live-tracking`: Real-time vessel tracking interface
  - `/components`: Shared admin UI components

- **`/analytics`**: Analytics dashboard with data visualization
- **`/dashboard`**: Main operational dashboard for users
- **`/fleet`**: Fleet management and vessel status views
- **`/live-tracking`**: Public/customer vessel tracking interface
- **`/maintenance_vessels`**: Vessel maintenance scheduling and history
- **`/map`**: Map-based tracking visualization
- **`/profile`**: User profile management
- **`/profile_costumer`**: Customer-specific profile views

#### API Routes (`/api`)
RESTful endpoints organized by domain:
- `/admin`: Administrative operations
- `/auth`: Authentication handlers (NextAuth)
- `/checkout`: Payment/transaction processing
- `/customer-cargo`: Customer cargo queries
- `/customer-login`: Customer authentication
- `/maintenance-vessels`: Maintenance API
- `/track`: Package/cargo tracking endpoints
- `/vessel-deployment`: Vessel scheduling API

#### Shared Modules
- **`/lib`**: Business logic and utilities
  - `auth.ts`: Authentication helpers
  - `db.ts`: Database connection (Neon PostgreSQL)
  - `definitions.ts`: TypeScript type definitions
  - `data.ts`, `cargo.ts`: Data access layer
  - `admin-cargo.ts`, `admin-panels.ts`: Admin-specific logic
  - `placeholder-data.ts`: Seed data

- **`/ui`**: Reusable UI components
  - Component library (buttons, search, pagination)
  - `fonts.ts`: Typography configuration
  - `global.css`: Global styles
  - Domain-specific component folders (customers, dashboard, invoices)

- **`/context`**: React Context providers
  - `FleetContext.tsx`: Fleet state management
  - `MaintenanceContext.tsx`: Maintenance state management

### `/public` - Static Assets
- Images (vessels, company photos, icons)
- Customer avatars
- Favicon and branding assets

### Configuration Files
- `next.config.ts`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS customization
- `tsconfig.json`: TypeScript compiler options
- `postcss.config.js`: PostCSS configuration
- `.env*`: Environment variables (database, auth secrets)
- `vercel.json`: Deployment configuration

## Architectural Patterns

### Server-First Architecture
- Utilizes Next.js App Router with React Server Components
- Server Actions for mutations (`actions.ts` files)
- API routes for client-side data fetching
- Edge-compatible database queries with Neon serverless

### State Management Strategy
- React Context for global state (Fleet, Maintenance)
- Server Components for data fetching
- Client Components (`-client.tsx` suffix) for interactivity
- URL state management with Next.js routing

### Data Flow
1. **Server Components** fetch data directly from database
2. **Server Actions** handle form submissions and mutations
3. **API Routes** serve client-side requests and webhooks
4. **Context Providers** manage cross-cutting concerns

### Authentication Flow
- NextAuth 5 (beta) for session management
- Credential-based authentication with bcrypt
- Role-based access control (admin vs customer routes)
- Protected routes with middleware

## Component Relationships

### Layout Hierarchy
```
app/layout.tsx (root)
├── /admin/layout.tsx (admin shell)
├── /dashboard/layout.tsx (dashboard shell)
├── /fleet/layout.tsx (fleet shell)
└── /map/layout.tsx (map shell)
```

### Shared Dependencies
- All routes consume `/lib` utilities
- UI components from `/ui` used across features
- Context providers wrap specific route subtrees
- Fonts loaded globally via `ui/fonts.ts`

## Code Organization Principles
- **Route Colocation**: Actions, types, and components live alongside their routes
- **Separation of Concerns**: `/lib` for logic, `/ui` for presentation, `/api` for endpoints
- **Type Safety**: Centralized definitions in `lib/definitions.ts`
- **Modularity**: Feature-based organization within domain folders
