# CC-Agent Frontend

CC-Agent Frontend 是一个基于 Next.js 15 的 Web 应用，为 Claude Code 自动化任务执行系统提供管理界面。

## 技术栈

- **框架**: Next.js 15 (App Router) + React 19 + TypeScript
- **状态管理**: React Query v5 (服务端状态) + Zustand v5 (客户端状态)
- **API 通信**: Axios + Socket.io-client (WebSocket)
- **样式**: Tailwind CSS v4 + Radix UI + Lucide Icons

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- cc-agent 后端服务 (位于 `~/Github/cc-agent`)

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local` 文件:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

### 启动后端服务

```bash
cd ~/Github/cc-agent && ./start_api_server.sh
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 可用脚本

```bash
npm run dev      # 启动开发服务器 (localhost:3000)
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint 检查
```

## 项目结构

```
src/
├── app/           # Next.js App Router 页面
├── components/    # React 组件 (ui/ 为可复用组件)
├── hooks/         # React Query hooks
├── services/      # API 服务层
├── types/         # TypeScript 类型定义
├── lib/           # API 客户端、工具函数
└── stores/        # Zustand 状态管理
```

## 主要功能

- **任务管理** (`/tasks`) - 创建、查看、管理 Claude 代码任务
- **模版管理** (`/templates`) - 任务模版的创建和使用
- **工作器监控** (`/workers`) - 监控执行工作器状态
- **系统监控** (`/monitoring`) - 系统指标和告警
- **安全管理** (`/security`) - 审计日志和权限管理
- **系统设置** (`/settings`) - 应用配置

## 开发指南

详细的开发指南请参阅 [CLAUDE.md](./CLAUDE.md)。
