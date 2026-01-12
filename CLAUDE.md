# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CC-Agent Frontend is a Next.js 15 web application providing a management interface for the Claude Code automation task execution system. It connects to a FastAPI backend at `~/Github/cc-agent`.

## Commands

```bash
npm run dev          # Development server on localhost:3000
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint

# Backend (required for frontend to work)
cd ~/Github/cc-agent && ./start_api_server.sh
```

**Note**: No test framework is configured.

## Tech Stack

- **Framework**: Next.js 15 with App Router, React 19, TypeScript (strict mode)
- **State**: React Query v5 (server state) + Zustand v5 (client state, minimal usage)
- **API**: Axios with interceptors (`src/lib/api-client.ts`)
- **Real-time**: Socket.io-client for WebSocket
- **Styling**: Tailwind CSS v4 + Radix UI primitives + Lucide icons
- **Path alias**: `@/*` maps to `./src/*`

## Architecture

```
src/
├── app/           # Next.js App Router pages + /api/cli route
├── components/    # React components (ui/ for reusables)
├── hooks/         # React Query hooks wrapping services
├── services/      # API service layers (static methods)
├── types/         # TypeScript definitions (enums, interfaces)
├── lib/           # API client, React Query provider, utils
└── stores/        # Zustand stores (minimal usage)
```

### Data Flow Pattern

```
Component → Hook (React Query) → Service → API Client → Backend
```

When adding features:
1. Define types in `src/types/index.ts`
2. Create service in `src/services/`
3. Wrap with React Query hook in `src/hooks/`
4. Build component with error handling

### React Query Configuration

- Query keys are hierarchical: `['tasks', 'list', params]`, `['tasks', 'detail', id]`
- Refetch intervals: tasks list (1min), task details (30s), logs (5s)
- Stale time: 10-60 seconds depending on data volatility

### Key Types

```typescript
// Task states: PENDING, PROCESSING, PAUSED, WAITING_UNBAN, RETRYING, COMPLETED, FAILED, NEEDS_HUMAN_REVIEW, AWAITING_CONFIRMATION
// Task types: LIGHTWEIGHT, MEDIUM_CONTEXT, HEAVY_CONTEXT
// Priorities: LOW, NORMAL, HIGH, URGENT
// API responses wrap data in ApiResponse<T> or PaginatedResponse<T>
```

## Backend Integration

- **Fixed backend path**: `~/Github/cc-agent` (hardcoded in `/api/cli` route)
- **CLI route**: `/app/api/cli/route.ts` executes `taskctl.py` commands only (security-restricted)
- **Auth**: JWT tokens stored in localStorage as `auth_token`, auto-injected in request headers

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Routes

- `/` - Dashboard
- `/tasks` - Task list, create, detail views
- `/templates` - Task templates
- `/workers` - Worker monitoring
- `/monitoring` - System metrics and alerts
- `/security` - Audit logs and permissions
- `/settings` - Configuration

## WebSocket Events

- `task_updated` - Task state changes
- `worker_status` - Worker performance updates
- `system_alert` - System notifications
- `log_update` - Real-time log streaming
