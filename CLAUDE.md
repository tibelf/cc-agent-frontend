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
- **Styling**: Tailwind CSS v4 + shadcn/ui + Radix UI primitives + Lucide icons
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
