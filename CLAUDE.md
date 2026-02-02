# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CC-Agent Frontend is a Next.js 15 web application providing a management interface for the Claude Code automation task execution system. It interacts with the backend CLI tool (`taskctl.py`) through Next.js API routes.

**Important**: This app uses basePath `/cc` - all routes are prefixed (e.g., `http://localhost:3000/cc/tasks`).

## Commands

```bash
npm run dev          # Development server on localhost:3000/cc
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

**Note**: No test framework is configured.

## Tech Stack

- **Framework**: Next.js 15 with App Router, React 19, TypeScript (strict mode)
- **State**: React Query v5 (server state) + Zustand v5 (client state, minimal usage)
- **CLI Integration**: Next.js API routes calling `taskctl.py` via child process
- **Styling**: Tailwind CSS v4 + shadcn/ui + Radix UI primitives + Lucide icons
- **Auth**: JWT with jose library, bcryptjs for password hashing
- **Path alias**: `@/*` maps to `./src/*`

## Architecture

```
src/
├── app/           # Next.js App Router pages + /api routes
├── components/    # React components (ui/ for shadcn components)
├── hooks/         # React Query hooks wrapping services
├── services/      # CLI service layers (static methods)
├── types/         # TypeScript definitions (enums, interfaces)
├── lib/           # React Query provider, utils
├── stores/        # Zustand stores (minimal usage)
└── middleware.ts  # JWT auth middleware (Edge Runtime)
```

### Data Flow Pattern

```
Component → Hook (React Query) → CLI Service → /api/cli → taskctl.py → JSON response
```

When adding features:
1. Define types in `src/types/index.ts`
2. Create or update service in `src/services/cli.ts`
3. Wrap with React Query hook in `src/hooks/`
4. Build component with error handling

### React Query Configuration

- Query keys are hierarchical: `['tasks', 'list', params]`, `['tasks', 'detail', id]`
- Refetch intervals: tasks list (1min), task details (30s), logs (5s)
- Stale time: 10-60 seconds depending on data volatility
- Default retry: 3 times (skips 4xx errors)

### Key Types

```typescript
// Task states: PENDING, PROCESSING, PAUSED, WAITING_UNBAN, RETRYING, COMPLETED, FAILED, NEEDS_HUMAN_REVIEW, AWAITING_CONFIRMATION
// Task types: LIGHTWEIGHT, MEDIUM_CONTEXT, HEAVY_CONTEXT
// Priorities: LOW, NORMAL, HIGH, URGENT
// API responses wrap data in ApiResponse<T> or PaginatedResponse<T>
```

## CLI Integration

The frontend communicates with the backend exclusively through CLI commands:

- **CLI route**: `src/app/api/cli/route.ts` executes `taskctl.py` commands
- **CLI service**: `src/services/cli.ts` wraps CLI calls with type-safe methods
- **Security**: Only `taskctl.py` commands are allowed (whitelist approach)
- **Backend path**: Configured via `CC_AGENT_PATH` env var (default: `~/Github/cc-agent`)

### Available CLI Commands

```bash
taskctl.py list              # List tasks with filters
taskctl.py get <id>          # Get task details
taskctl.py create            # Create new task
taskctl.py pause <id>        # Pause task
taskctl.py resume <id>       # Resume task
taskctl.py cancel <id>       # Cancel task
taskctl.py logs <id>         # Get task logs
```

## Authentication

- Middleware (`src/middleware.ts`) protects all routes except `/login`, `/api/auth/login`, `/api/templates`
- JWT verified using `jose` library with `AUTH_JWT_SECRET` env var
- Token stored in both localStorage and cookie (24h expiry)
- User credentials in `config/auth.json` (bcrypt hashed passwords)

## Environment Variables

```bash
AUTH_JWT_SECRET=<your-secret>        # Required for JWT signing
CC_AGENT_PATH=~/Github/cc-agent      # Backend path for CLI route
PYTHON_CMD=python3.11                # Python command for CLI (optional)
```

## Routes

All routes are prefixed with `/cc` (basePath):
- `/` - Dashboard
- `/tasks` - Task list, create, detail views
- `/templates` - Task templates
- `/workers` - Worker monitoring
- `/monitoring` - System metrics and alerts
- `/security` - Audit logs and permissions
- `/settings` - Configuration
- `/login` - Authentication (public)

## UI Component Patterns (shadcn/ui)

The project uses shadcn/ui components with Radix UI primitives. Key patterns:

### Toast Notifications
```tsx
import { toast } from '@/components/ui/sonner'

toast.success('操作成功')
toast.error('操作失败')
```

### Dialog/Modal
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
    <DialogFooter>
      <Button>操作</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Semantic Colors
Use semantic color classes instead of hardcoded colors:
- `text-success`, `bg-success/20` - 成功状态 (绿色)
- `text-warning`, `bg-warning/20` - 警告状态 (黄色)
- `text-info`, `bg-info/20` - 信息状态 (蓝色)
- `text-destructive`, `bg-destructive/20` - 错误/危险状态 (红色)
- `text-muted-foreground`, `bg-muted` - 禁用/低优先级状态

### Available UI Components
Located in `src/components/ui/`:
- `button`, `input`, `textarea` - 表单控件
- `card` - 卡片容器
- `badge` - 标签/徽章
- `dialog`, `alert-dialog` - 弹窗
- `select` - 下拉选择 (Radix UI)
- `dropdown-menu` - 下拉菜单
- `tabs` - 选项卡
- `tooltip` - 提示框
- `progress` - 进度条
- `skeleton` - 骨架屏加载
- `label`, `separator` - 表单辅助
- `switch` - 开关
- `sonner` (Toaster) - Toast通知

## Utility Functions

Key utilities in `src/lib/utils.ts`:
- `cn()` - Tailwind class merging (clsx + tailwind-merge)
- `formatDateTime()`, `formatBeijingDateTime()` - Date formatting (GMT+8)
- `formatRelativeTime()` - Relative time display
- `getTaskStateColor()`, `getPriorityColor()` - Status color helpers
- `copyToClipboard()`, `debounce()`, `throttle()` - Common utilities
