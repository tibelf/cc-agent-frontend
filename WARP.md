# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

CC-Agent Frontend is a Next.js 15 web application that provides a management interface for the Claude Code automation task execution system. It connects to a FastAPI backend service located at `~/Github/cc-agent` and serves as the primary interface for creating, monitoring, and managing automated Claude tasks.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **State Management**: Zustand + React Query (TanStack Query)
- **API Client**: Axios with custom interceptors
- **Real-time**: Socket.io-client for WebSocket connections
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/cli/           # Internal API route for CLI commands
│   ├── tasks/             # Task management pages
│   ├── workers/           # Worker monitoring pages
│   ├── monitoring/        # System monitoring dashboard
│   ├── security/          # Security management pages
│   └── settings/          # System configuration
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard.tsx     # Main dashboard component
│   └── sidebar.tsx       # Navigation sidebar
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── api-client.ts     # Centralized API client
│   ├── react-query.tsx   # React Query provider
│   └── utils.ts          # Utility functions
├── services/             # API service layers
├── types/                # TypeScript type definitions
```

### Backend Integration

**IMPORTANT**: The backend service for this frontend project is fixed and located at `~/Github/cc-agent`. This is a command-line service that provides the core functionality.

The frontend integrates with this Python-based backend service:

- **Location**: `~/Github/cc-agent` (fixed path)
- **Type**: Command-line service with FastAPI wrapper
- **API Server**: FastAPI running on `http://localhost:8000`
- **WebSocket**: Socket.io for real-time updates
- **CLI Integration**: Direct execution of `taskctl.py` commands via `/api/cli` route
- **Database**: SQLite (managed by backend)

This backend dependency is essential for the frontend to function - the frontend cannot operate without the cc-agent service running.

### Key Features Architecture

1. **Task Management**: Full CRUD operations with real-time status updates
2. **Worker Monitoring**: Live performance metrics and status tracking  
3. **Security Dashboard**: Audit logs, user management, API key handling
4. **Real-time Updates**: WebSocket integration for live data streaming
5. **CLI Bridge**: Direct backend CLI command execution through secure API

## Common Development Commands

### Development Server
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint (extends next/core-web-vitals, next/typescript)
```

### Testing
**Note**: No test framework is currently configured in this project. Check with project owner before adding tests.

### Backend Integration
```bash
# Start backend API server (required)
cd ~/Github/cc-agent
./start_api_server.sh

# Or manually:
cd ~/Github/cc-agent  
python api_server.py
```

### Full System Startup
```bash
# Terminal 1: Start backend
cd ~/Github/cc-agent && ./start_api_server.sh

# Terminal 2: Start frontend  
npm run dev
```

## Code Patterns & Conventions

### API Integration Pattern
- Use service classes in `src/services/` for API calls
- Wrap services with React Query hooks in `src/hooks/`
- Centralized error handling through `api-client.ts`
- Type-safe responses with `ApiResponse<T>` interface

### Component Structure
- UI components in `src/components/ui/` are reusable and unstyled
- Page components co-located with route files
- Custom hooks for complex state logic
- Error boundaries for resilient UI

### State Management
- React Query for server state (with optimistic updates)
  - Query keys structured hierarchically (e.g., `['tasks', 'list', params]`)
  - Automatic refetching: tasks list (1min), task details (30s), logs (5s)
  - Stale time configured per query type (10-60 seconds)
- Zustand for client-side state (minimal usage, stored in `src/stores/`)
- WebSocket integration through custom hooks

### Styling System
- Tailwind CSS with custom design tokens
- CSS variables for theming (`--primary`, `--background`, etc.)
- Responsive design with mobile-first approach
- Custom animations and transitions

### TypeScript Usage
- Strict mode enabled
- Comprehensive type definitions in `src/types/`
- API response typing with generics
- Enum usage for state management (TaskState, TaskType, etc.)
- Path alias: `@/*` maps to `./src/*`

## Key Implementation Details

### Real-time Data Flow
```
Frontend Component
↓ (React Query Hook)
Service Layer  
↓ (HTTP/WebSocket)
Backend API
↓ (CLI Execution)  
cc-agent System
```

### WebSocket Message Types
- `task_status`: Task state changes
- `worker_status`: Worker performance updates
- `system_metrics`: System health data
- `alert`: System notifications

### Environment Configuration
- `NEXT_PUBLIC_API_URL`: Backend API endpoint (default: http://localhost:8000)
- `NEXT_PUBLIC_WS_URL`: WebSocket endpoint (default: ws://localhost:8080)

### Security Considerations
- **Fixed Backend Service**: Frontend exclusively connects to `~/Github/cc-agent` - no other backend services are supported
- **CLI Route Protection**: `/app/api/cli/route.ts` only allows commands starting with `taskctl.py`
- **Hardcoded Backend Path**: CLI route uses fixed path `/Users/tibelf/Github/cc-agent`
- JWT token handling for API authentication (stored in localStorage as `auth_token`)
- CORS configuration for cross-origin requests
- Request/response logging and error tracking

## Testing & Debugging

### API Connection Issues
- Verify backend server is running on port 8000
- Check browser network panel for failed requests
- Review API server console for CORS errors

### CLI Integration Debugging  
- Test CLI health via GET `/api/cli`
- Verify `taskctl.py` permissions in backend project
- Check command execution logs in API server output

### Real-time Features
- WebSocket connection status available in browser dev tools
- Message debugging through WebSocket service logging
- Fallback to HTTP polling when WebSocket unavailable

## Development Workflow

When adding new features:

1. **Define Types**: Add TypeScript interfaces to `src/types/`
2. **Create Service**: Implement API calls in `src/services/`
3. **Add Hook**: Wrap service with React Query in `src/hooks/`
4. **Build Component**: Create UI component with proper error handling
5. **Integrate WebSocket**: Add real-time updates if needed
6. **Update Navigation**: Add routes to sidebar if creating new pages

This architecture enables efficient development of complex real-time applications while maintaining type safety and good separation of concerns.