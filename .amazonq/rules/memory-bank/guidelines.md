# Development Guidelines

## Code Quality Standards

### File Naming Conventions
- Configuration files: Use kebab-case with appropriate extensions (e.g., `next.config.ts`, `postcss.config.js`, `tailwind.config.ts`)
- TypeScript files: Use PascalCase for components (e.g., `FleetContext.tsx`, `DashboardClient.tsx`)
- Library/utility files: Use kebab-case or camelCase (e.g., `db.ts`, `definitions.ts`, `admin-cargo.ts`)
- Page files: Use lowercase `page.tsx` for Next.js route pages
- Client components: Suffix with `-client.tsx` for client-side components

### Code Formatting
- **Indentation**: 2 spaces (consistent across all files)
- **Line Endings**: CRLF (Windows-style `\r\n`)
- **Semicolons**: Consistently used at end of statements
- **Quotes**: Single quotes for imports and strings, double quotes for JSX attributes
- **Trailing Commas**: Used in multiline objects and arrays

### TypeScript Standards
- Explicit type annotations for exported functions and complex types
- Use `type` keyword for type definitions (not `interface` for simple shapes)
- Export types separately from implementation code
- Leverage union types for string literals (e.g., `status: 'pending' | 'paid'`)
- Use generic types appropriately (e.g., `ReturnType<typeof postgres>`)

## Structural Conventions

### Component Architecture
- **Client Components**: Marked with `"use client"` directive at top of file
- **Server Components**: Default, no directive needed
- **Component Organization**: Extract reusable UI into separate components (e.g., `Navbar`, `ServiceCard`)
- **Props Typing**: Define interface for component props before component definition

### File Organization Patterns
- Configuration at root level (config files, env files)
- Application code in `/app` following Next.js App Router conventions
- Shared utilities in `/app/lib`
- UI components in `/app/ui`
- API routes in `/app/api`

### Import Patterns
```typescript
// External dependencies first
import { Inter, Space_Grotesk } from 'next/font/google';
import { Metadata } from 'next';

// Internal imports after
import './ui/global.css';
import { FleetProvider } from './context/FleetContext';
```

## Semantic Patterns

### Next.js App Router Patterns
1. **Font Loading**: Use `next/font/google` with `variable` option for CSS variables
```typescript
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});
```

2. **Metadata Export**: Export metadata object for SEO
```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
};
```

3. **Layout Components**: Wrap children with context providers
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

### Database Access Patterns
1. **Singleton Pattern**: Use singleton for database connection
```typescript
let sqlClient: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), { ssl: 'require' });
  }
  return sqlClient;
}
```

2. **Environment Variables**: Check multiple env var names with fallback
```typescript
const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
```

### State Management Patterns
1. **Multiple State Variables**: Group related state logically
```typescript
const [packageId, setPackageId] = useState<string>("");
const [activePkg, setActivePkg] = useState<TrackingPackage | null>(null);
const [trackingError, setTrackingError] = useState<string>("");
```

2. **Form State**: Use single object for form data
```typescript
const [formData, setFormData] = useState({
  pengirim: "", penerima: "", telepon: "", asal: "", tujuan: ""
});
```

3. **Generic Change Handlers**: Handle multiple inputs with single function
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

### Async/Await Patterns
1. **API Calls**: Always wrap in try-catch with user feedback
```typescript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const responseText = await response.text();
  
  if (!response.ok || responseText.startsWith("<!DOCTYPE")) {
    throw new Error('API error');
  }
  
  const data = JSON.parse(responseText);
} catch (err: any) {
  console.error(err);
  setError(err.message);
}
```

### Styling Patterns
1. **Tailwind Configuration**: Extend theme for custom values
```typescript
theme: {
  extend: {
    gridTemplateColumns: {
      '13': 'repeat(13, minmax(0, 1fr))',
    },
    colors: {
      blue: {
        400: '#2589FE',
        500: '#0070F3',
      },
    },
  },
}
```

2. **CSS Variables**: Use Tailwind CSS variables for fonts
```typescript
className={`${inter.variable} ${spaceGrotesk.variable}`}
```

3. **Conditional Classes**: Complex conditionals for validation states
```typescript
className={`base-classes ${
  submitAttempted && !value 
    ? 'border-red-500 focus:border-red-500' 
    : 'border-white/10 focus:border-cyan-500/50'
}`}
```

### Type Definition Patterns
1. **Data Models**: Define types matching database schema
```typescript
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};
```

2. **Union Types**: For restricted string values
```typescript
status: 'pending' | 'paid';
```

3. **Type Composition**: Use `Omit` and intersection types
```typescript
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};
```

## Common Code Idioms

### React Hooks Usage
1. **useEffect for Side Effects**: External script loading, cleanup
```typescript
useEffect(() => {
  if (typeof window === "undefined") return;
  
  // Setup code
  
  return () => {
    // Cleanup code
  };
}, [dependencies]);
```

2. **useRef for DOM Access**: Leaflet map, markers
```typescript
const mapContainerRef = useRef<HTMLDivElement>(null);
const leafletMap = useRef<any>(null);
```

3. **useRouter for Navigation**: Next.js navigation
```typescript
const router = useRouter();
router.push('/path');
```

### Form Handling
1. **Prevent Default**: Always in form submit handlers
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Handle submission
};
```

2. **Validation Before Submit**: Check required fields
```typescript
if (!formData.field1 || !formData.field2) {
  setError("Please fill all fields");
  return;
}
```

3. **Enter Key Support**: Add keyboard support
```typescript
onKeyDown={(e) => e.key === 'Enter' && handleAction()}
```

### Client-Side Storage
1. **localStorage for Session**: Store user session data
```typescript
localStorage.setItem("session_key", JSON.stringify(data));
const session = localStorage.getItem("session_key");
```

2. **sessionStorage for Temporary Data**: Security flags
```typescript
sessionStorage.setItem('flag', 'true');
sessionStorage.removeItem('flag');
```

## Best Practices

### Performance Optimization
- Use `next/image` for optimized images with priority flag for above-fold content
- Implement loading states for async operations
- Use debouncing for search inputs (via `use-debounce`)
- Clean up subscriptions and event listeners in useEffect cleanup

### Security Practices
- SSL required for database connections: `{ ssl: 'require' }`
- Password hashing with bcrypt before storage
- Validate user input before API calls
- Check response content type to prevent HTML injection
- Use environment variables for sensitive credentials

### Error Handling
- Always provide user feedback for errors
- Log errors to console for debugging
- Use generic error messages to avoid information leakage
- Handle both network and validation errors

### Accessibility
- Use semantic HTML elements
- Provide required field indicators with asterisks (*)
- Disable buttons during loading states
- Use proper label associations for inputs

### Code Documentation
- Inline comments for complex logic or workarounds
- Section comments to organize large components (e.g., `// --- HANDLER FUNCTIONS ---`)
- JSDoc comments for type definitions explaining purpose
