# Journal Application - Technical Documentation

## Project Overview

Full-stack journal application built with Next.js 16, React 19, Supabase, and AI-powered semantic search. The application enables users to create and manage journal entries with markdown support, automatic task extraction, and AI-driven related entry recommendations.

**Project Name:** Journal
**Version:** 0.1.0
**Last Updated:** December 2024
**Repository:** /Users/imi/Code/journal

---

## Tech Stack

### Frontend
- **Next.js 16.0.7** - React framework with App Router
- **React 19.2.0** - UI library
- **React Compiler** - Performance optimization (babel-plugin-react-compiler 1.0.0)
- **Tailwind CSS 4** - Utility-first CSS framework
- **TypeScript 5** - Type-safe development
- **react-markdown 9.1.0** - Markdown rendering with custom styling
- **date-fns 4.1.0** - Date manipulation and formatting

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth + Storage)
  - `@supabase/supabase-js 2.86.2` - Client library
  - `@supabase/ssr 0.8.0` - Server-side rendering support
- **PostgreSQL with pgvector** - Vector similarity search extension

### AI & Embeddings
- **Voyage AI API** - Text embeddings generation
  - Model: `voyage-3` (1024-dimensional embeddings)
  - Previously used: `voyage-3-lite` (512-dimensional, deprecated)
- **Anthropic SDK 0.71.1** - Claude AI integration (installed but not actively used in current features)

### Development Tools
- **ESLint 9** with `eslint-config-next`
- **tsx 4.21.0** - TypeScript execution for scripts
- **dotenv 17.2.3** - Environment variable management

---

## Core Features

### 1. Journal Entries
- **Create, Read, Update, Delete (CRUD)** operations for journal entries
- **Auto-dated titles** - Automatically populates with current date (format: "December 15, 2024")
- **Markdown support** - Full markdown rendering with custom styled components
- **Rich text rendering** - Headers, lists, code blocks, blockquotes, links, emphasis
- **Content preview** - 200-character preview on listing page
- **Inline editing** - Edit entries directly on detail pages
- **Soft delete** - Entries can be deleted with confirmation dialog

### 2. AI-Powered Related Entries
- **Semantic similarity search** using vector embeddings
- **Automatic embedding generation** when creating/updating entries
- **Cosine similarity matching** via PostgreSQL pgvector extension
- **Related entries display** on entry detail pages
- **Similarity scores** shown as percentage (e.g., "87% match")
- **Configurable threshold** (default: 0.5) and result count (default: 3)
- **Fallback handling** - Entries save successfully even if embedding generation fails

### 3. Todo/Task Management
- **Automatic task extraction** from journal entries using `[bracket]` syntax
  - **IMPORTANT:** The current system uses `[task description]` format, NOT `@task` format
  - Example: `[meditate]`, `[call mom]`, `[finish project report]`
- **Manual todo creation** via dedicated todo form
- **Todo states:** Active (not completed), Completed, Archived
- **Due dates** - Optional due date assignment
- **Overdue indicators** - Visual highlighting for overdue tasks
- **Entry linking** - Tasks link back to the journal entry they originated from
- **Optimistic UI updates** - Instant feedback with rollback on errors
- **Archive system** - Separate view for archived todos

### 4. Keyboard Shortcuts
- **Cmd+Enter (macOS) / Ctrl+Enter (Windows/Linux)** - Submit entry or todo forms
- Works in both title and content fields

### 5. User Experience Features
- **Auto-expanding textarea** - Grows with content, minimum 4 rows
- **Relative timestamps** - "2 hours ago", "3 days ago", etc.
- **Dark mode support** - Full dark theme implementation
- **Responsive design** - Mobile-friendly layout
- **Loading states** - Clear feedback during async operations
- **Error handling** - User-friendly error messages with recovery options
- **Empty states** - Helpful messages when no entries/todos exist

---

## Database Schema

### Entries Table
```sql
create table public.entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  embedding vector(1024)  -- Voyage-3 embeddings
);

-- Row Level Security enabled
-- Policy: "Enable all operations for all users" (to be restricted in production)

-- Indexes
create index entries_embedding_idx
on public.entries
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

### Tasks Table
```sql
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  completed boolean default false not null,
  due_date date,
  archived boolean default false not null,
  entry_id uuid references public.entries(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index tasks_entry_id_idx on public.tasks(entry_id);
create index tasks_archived_idx on public.tasks(archived);

-- RLS Policies (require authentication)
-- - Users can view their own tasks
-- - Users can create their own tasks
-- - Users can update their own tasks
-- - Users can delete their own tasks

-- Trigger: auto-update updated_at timestamp
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();
```

### Database Functions

#### match_entries
```sql
create or replace function match_entries(
  query_embedding vector(1024),
  match_threshold float default 0.5,
  match_count int default 3,
  exclude_id uuid default null
)
returns table (
  id uuid,
  title text,
  content text,
  created_at timestamp with time zone,
  similarity float
)
```
Performs semantic similarity search using cosine distance. Returns entries with similarity score above threshold, ordered by relevance.

#### handle_updated_at
Automatically updates `updated_at` timestamp on tasks table when rows are modified.

---

## Application Architecture

### Directory Structure
```
/Users/imi/Code/journal/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home page (entry listing)
│   │   ├── layout.tsx               # Root layout
│   │   ├── actions.ts               # Entry CRUD server actions
│   │   ├── entries/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Entry detail page
│   │   │       └── not-found.tsx    # 404 page
│   │   └── todo/
│   │       ├── page.tsx             # Active todos
│   │       ├── actions.ts           # Todo CRUD server actions
│   │       └── archived/
│   │           └── page.tsx         # Archived todos
│   ├── components/
│   │   ├── entry-form.tsx           # New entry form
│   │   ├── entry-detail.tsx         # Entry display/edit
│   │   ├── todo-form.tsx            # New todo form
│   │   ├── todo-list.tsx            # Todo list with actions
│   │   ├── auto-textarea.tsx        # Auto-expanding textarea
│   │   ├── markdown.tsx             # Markdown renderer
│   │   └── relative-time.tsx        # Relative time display
│   └── lib/
│       ├── ai/
│       │   └── embeddings.ts        # Voyage AI integration
│       └── supabase/
│           ├── client.ts            # Client-side Supabase
│           ├── server.ts            # Server-side Supabase
│           ├── middleware.ts        # Auth middleware
│           ├── queries.ts           # Related entries query
│           └── types.ts             # TypeScript types
├── supabase/
│   ├── schema.sql                   # Entries table schema
│   ├── todo-table.sql               # Tasks table schema
│   ├── add-embeddings.sql           # Initial embedding setup (512-dim)
│   ├── upgrade-to-voyage-3.sql      # Upgrade to 1024-dim
│   └── match-entries-function.sql   # Similarity search function
├── scripts/
│   └── reembed-entries.ts           # Migration script for re-embedding
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                       # Environment variables (gitignored)
```

### Routing

| Route | Description | Type |
|-------|-------------|------|
| `/` | Home page with entry list | Server Component |
| `/entries/[id]` | Entry detail with related entries | Server Component |
| `/todo` | Active todos list | Server Component |
| `/todo/archived` | Archived todos | Server Component |

### Data Flow

#### Creating a Journal Entry
1. User fills out `EntryForm` (client component)
2. On submit, calls `addEntry` server action
3. Server action:
   - Generates embedding via Voyage AI API
   - Inserts entry into Supabase
   - Parses content for `[task]` patterns
   - Creates associated tasks
   - Revalidates `/` and `/todo` paths
4. Page automatically updates with new entry

#### Viewing Related Entries
1. Entry detail page loads (server component)
2. Calls `getRelatedEntries(entryId, 3)`
3. Fetches current entry's embedding from database
4. Executes `match_entries` RPC with cosine similarity
5. Returns top 3 most similar entries with similarity scores
6. Renders related entries with clickable links

#### Task Extraction from Entries
- **Pattern:** `\[([^\]]+)\]/g` (regex)
- **Example:** `Today I need to [call dentist] and [buy groceries]`
- **Result:** Creates two tasks: "call dentist" and "buy groceries"
- **Duplicate prevention:** Checks existing tasks for the entry to avoid duplicates
- **Case-insensitive matching:** "call dentist" == "Call Dentist"

---

## AI Integration Details

### Voyage AI Embeddings

#### API Configuration
- **Endpoint:** `https://api.voyageai.com/v1/embeddings`
- **Model:** `voyage-3`
- **Dimensions:** 1024
- **Input format:** `"{title}\n\n{content}"`
- **Rate limit:** 3 requests per minute (handled in reembed script)

#### Embedding Generation
```typescript
// src/lib/ai/embeddings.ts
export async function generateEntryEmbedding(
  title: string,
  content: string
): Promise<number[]> {
  const text = `${title}\n\n${content}`
  return generateEmbedding(text)
}
```

#### Error Handling
- If embedding generation fails, entry still saves without embedding
- Related entries feature gracefully degrades (shows no related entries)
- Errors logged to console for debugging

### Migration from voyage-3-lite to voyage-3
The project was upgraded from 512-dimensional to 1024-dimensional embeddings:
1. Ran `supabase/upgrade-to-voyage-3.sql` to alter schema
2. Executed `npm run reembed` to regenerate all embeddings
3. Script includes 25-second delays to respect rate limits
4. Updated `match_entries` function signature

---

## Server Actions

### Entry Actions (`src/app/actions.ts`)

#### addEntry(formData: FormData)
- Validates title and content
- Generates embedding
- Inserts entry into database
- Extracts and creates tasks from content
- Revalidates paths: `/`, `/todo`
- Returns: `{ success: true }` or `{ error: string }`

#### updateEntry(id: string, formData: FormData)
- Similar to addEntry but updates existing entry
- Regenerates embedding
- Extracts new tasks (prevents duplicates)
- Revalidates paths: `/entries/[id]`, `/`, `/todo`

#### deleteEntry(id: string)
- Soft deletes entry by ID
- Associated tasks have entry_id set to null (ON DELETE SET NULL)
- Revalidates path: `/`

### Todo Actions (`src/app/todo/actions.ts`)

#### addTodo(formData: FormData)
- Creates standalone todo (not linked to entry)
- Optional due_date field
- Sets completed=false, archived=false
- Revalidates path: `/todo`

#### toggleTodo(todoId: string, completed: boolean)
- Updates completed status
- Updates updated_at timestamp
- Revalidates path: `/todo`

#### archiveTodo(todoId: string)
- Sets archived=true
- Updates updated_at timestamp
- Revalidates path: `/todo`

---

## Key Components

### EntryForm (`src/components/entry-form.tsx`)
**Type:** Client Component
**Features:**
- Auto-populated title with current date
- Auto-expanding textarea for content
- Keyboard shortcut support (Cmd/Ctrl+Enter)
- Form state management with useState
- Optimistic UI updates
- Error handling with visual feedback
- Form reset after successful submission

**State:**
- `isSubmitting: boolean`
- `error: string | null`
- `content: string`
- `title: string` (initialized with formatted current date)

### TodoList (`src/components/todo-list.tsx`)
**Type:** Client Component
**Features:**
- Optimistic UI updates for toggling and archiving
- Checkbox for completion status
- Due date display with overdue highlighting
- Link to source entry (if applicable)
- Archive button
- Rollback on server errors

**State:**
- `optimisticTodos: Todo[]` (synced with server data)

### Markdown (`src/components/markdown.tsx`)
**Type:** Server Component
**Features:**
- Custom styled components for all markdown elements
- Syntax highlighting preparation (code blocks)
- External link handling (target="_blank", rel="noopener noreferrer")
- Dark mode support
- Semantic HTML output

### AutoTextarea (`src/components/auto-textarea.tsx`)
**Type:** Client Component
**Features:**
- Automatically adjusts height based on content
- Minimum row configuration (default: 4)
- Disabled resize handle (overflow: hidden)
- TypeScript-safe props spreading

---

## Environment Variables

### Required Variables (`.env.local`)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://utghmptkmsupmwtstbqq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Voyage AI API Key
VOYAGE_API_KEY=pa-4nOwGIf6mMkBwQEC6EuWz-x-IeVxEhqy0pNwaQ7uzoB
```

**Note:** The `.env.local.example` file contains actual credentials for reference. In production, these should be rotated and secured.

---

## Setup Instructions

### Prerequisites
- Node.js 20+ (for React 19 support)
- npm, yarn, pnpm, or bun package manager
- Supabase account and project
- Voyage AI API key

### Installation Steps

1. **Clone the repository**
   ```bash
   cd /Users/imi/Code/journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Initialize Supabase database**
   ```bash
   # Run SQL files in Supabase SQL Editor in order:
   # 1. supabase/schema.sql
   # 2. supabase/todo-table.sql
   # 3. supabase/upgrade-to-voyage-3.sql (latest embedding setup)
   # 4. supabase/match-entries-function.sql
   ```

5. **Run development server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

6. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

### Database Migration (if upgrading from voyage-3-lite)
```bash
# 1. Run upgrade-to-voyage-3.sql in Supabase
# 2. Regenerate embeddings for all existing entries
npm run reembed
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run reembed` | Regenerate embeddings for all entries (uses `scripts/reembed-entries.ts`) |

### Reembedding Script (`scripts/reembed-entries.ts`)
- Fetches all entries from Supabase
- Generates new embeddings using current Voyage AI model
- Updates entries with new embeddings
- Includes 25-second delays between requests (3 RPM rate limit)
- Provides progress feedback and error reporting
- Success/failure summary on completion

**Usage:**
```bash
npm run reembed
```

**Expected output:**
```
Found 25 entries to re-embed

Processing: December 15, 2024
✓ Successfully re-embedded: December 15, 2024
Waiting 25 seconds before next request...

...

=== Re-embedding Complete ===
Successful: 25
Failed: 0
Total: 25
```

---

## Important Notes & Gotchas

### Task Extraction Syntax
**CRITICAL:** The application uses `[bracket]` syntax for task extraction, NOT `@mention` syntax.
- ✅ Correct: `[call dentist]`, `[buy groceries]`
- ❌ Incorrect: `@call dentist`, `@buy groceries`

If documentation or external references mention `@task` format, they are **outdated** and refer to a previous version.

### Embedding Dimension Changes
The project underwent a migration from 512-dimensional to 1024-dimensional embeddings:
- Old model: `voyage-3-lite` (512 dims)
- Current model: `voyage-3` (1024 dims)
- All SQL files reference the current schema
- If you see references to 512 dimensions, they are outdated

### Row Level Security (RLS)
Current RLS policies are permissive for development:
- Entries: "Enable all operations for all users"
- Tasks: Require `auth.uid() is not null` but no user-specific filtering

**For production:** Implement user-specific RLS policies to ensure data isolation.

### Rate Limiting
Voyage AI API has a 3 requests/minute limit on the free tier. The reembedding script handles this automatically, but be cautious when:
- Creating many entries in quick succession
- Running manual embedding operations
- Testing embedding functionality

### Optimistic UI Updates
TodoList uses optimistic updates for better UX. If you notice todos reverting after an action, check:
1. Network errors in browser console
2. Supabase connection
3. RLS policy configuration

### Dark Mode
Dark mode is implemented but requires system preference detection or manual toggle (not currently in UI). All components support dark mode via Tailwind's `dark:` modifier.

---

## Recent Commits & Changes

```
e85132c - Refactor tasks to todo and fix keyboard shortcut
f60db7e - Add keyboard shortcut to submit entries (Cmd+Enter / Ctrl+Enter)
ee1260e - Add todo list feature with task management
a1371b5 - Add journal app with Supabase integration and auto-dated entries
2cb99bc - Initial commit from Create Next App
```

### Key Refactoring: "tasks" → "todo"
The recent commit `e85132c` refactored terminology from "tasks" to "todo" in the UI layer:
- Database still uses `tasks` table name
- UI displays "Todo" instead of "Tasks"
- No schema changes required

---

## Future Enhancements & Considerations

### Potential Features
1. **Search functionality** - Full-text search across entries
2. **Tag system** - Categorize entries with custom tags
3. **Entry templates** - Predefined formats (daily log, gratitude journal, etc.)
4. **Export functionality** - Export entries to PDF, Markdown, JSON
5. **Collaboration** - Share entries with other users
6. **Attachments** - Upload images, files to entries
7. **Reminders** - Notifications for todo due dates
8. **Analytics** - Writing streak tracking, word count stats
9. **Mobile app** - Native iOS/Android applications
10. **Voice input** - Speech-to-text entry creation

### Technical Debt
1. **Authentication** - Currently no auth flow implemented (RLS policies prepared but not utilized)
2. **User management** - Multi-user support not implemented
3. **API rate limiting** - No client-side rate limit handling
4. **Error boundaries** - No global error boundary for React errors
5. **Loading skeletons** - Could improve UX with loading placeholders
6. **Pagination** - Entries and todos load all at once (performance concern at scale)
7. **Caching** - No client-side caching strategy (could use React Query/SWR)
8. **Testing** - No unit, integration, or E2E tests
9. **Accessibility** - ARIA labels and keyboard navigation could be improved
10. **Dark mode toggle** - Currently follows system preference, no manual toggle

### Security Considerations
1. **Rotate API keys** - Current keys exposed in `.env.local.example`
2. **Implement user authentication** - Add Supabase Auth flow
3. **Restrict RLS policies** - Add user-specific data isolation
4. **Input sanitization** - Add XSS protection for user-generated content
5. **Rate limiting** - Implement server-side rate limiting
6. **CORS configuration** - Review and restrict allowed origins

### Performance Optimizations
1. **Implement pagination** - Limit entries/todos per page
2. **Lazy loading** - Code splitting for routes
3. **Image optimization** - If images are added, use Next.js Image component
4. **Database indexing** - Review query performance and add indexes
5. **Embedding caching** - Cache embeddings to reduce API calls
6. **Edge runtime** - Consider Edge runtime for faster response times

---

## Troubleshooting

### Common Issues

#### "VOYAGE_API_KEY is not set" error
- Verify `.env.local` exists and contains `VOYAGE_API_KEY`
- Restart development server after adding environment variables
- Check for typos in variable names

#### Related entries not showing
- Verify entry has an embedding (check database)
- Run `npm run reembed` to regenerate embeddings
- Check Voyage AI API key is valid
- Ensure `match_entries` function exists in Supabase

#### Tasks not extracting from entries
- Verify task content uses `[bracket]` syntax, NOT `@mention`
- Check browser console for errors
- Verify tasks table exists and RLS policies allow inserts
- Test with simple task like `[test task]`

#### Database connection errors
- Verify Supabase URL and anon key in `.env.local`
- Check Supabase project is active (not paused)
- Verify network connectivity
- Check Supabase dashboard for service status

#### Dark mode not working
- Dark mode follows system preference by default
- Ensure Tailwind dark mode is configured (it is)
- Check browser/OS dark mode settings

---

## API Reference

### Supabase Client Initialization

#### Client-side (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server-side (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Voyage AI Embeddings API

#### Request
```bash
POST https://api.voyageai.com/v1/embeddings
Authorization: Bearer {VOYAGE_API_KEY}
Content-Type: application/json

{
  "model": "voyage-3",
  "input": "{title}\n\n{content}"
}
```

#### Response
```json
{
  "data": [
    {
      "embedding": [0.123, -0.456, 0.789, ...],  // 1024 floats
      "index": 0
    }
  ],
  "model": "voyage-3",
  "usage": {
    "total_tokens": 42
  }
}
```

---

## Contact & Support

For questions about this project:
1. Check this documentation first
2. Review git commit history for recent changes
3. Check Supabase dashboard for database issues
4. Review browser console for client-side errors
5. Check server logs for API errors

---

## License & Credits

**Framework:** Next.js (MIT License)
**UI Library:** React (MIT License)
**Database:** Supabase (Apache 2.0 License)
**Embeddings:** Voyage AI
**Styling:** Tailwind CSS (MIT License)

---

**Document Version:** 1.0
**Last Updated:** December 15, 2024
**Author:** Technical Documentation for Journal Application
