// 任务相关类型
export enum TaskState {
  PENDING = "pending",
  PROCESSING = "processing",
  PAUSED = "paused",
  WAITING_UNBAN = "waiting_unban",
  RETRYING = "retrying",
  COMPLETED = "completed",
  FAILED = "failed",
  NEEDS_HUMAN_REVIEW = "needs_human_review",
  AWAITING_CONFIRMATION = "awaiting_confirmation",
}

export enum TaskType {
  LIGHTWEIGHT = "lightweight",
  MEDIUM_CONTEXT = "medium_context", 
  HEAVY_CONTEXT = "heavy_context",
}

export enum TaskPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high", 
  URGENT = "urgent",
}

export enum ProcessState {
  SPAWNING = "spawning",
  RUNNING = "running",
  HUNG = "hung",
  TERMINATING = "terminating",
  KILLED = "killed",
  RESTARTING = "restarting",
}

export enum AlertLevel {
  P1 = "P1", // Business interruption
  P2 = "P2", // Recoverable failure
  P3 = "P3", // Minor issues
}

// 核心数据接口
export interface Task {
  id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  task_state: TaskState;
  process_state?: ProcessState;
  command: string;
  working_dir?: string;
  environment: Record<string, string>;
  auto_execute: boolean;
  confirmation_strategy: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  next_allowed_at?: string;
  tags: string[];
  assigned_worker?: string;
  last_error?: string;
  error_history: Array<{
    timestamp: string;
    type: string;
    message: string;
  }>;
  checkpoint_data: Record<string, unknown>;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  task_type?: TaskType;
  priority?: TaskPriority;
  auto_execute?: boolean;
  working_dir?: string;
  environment?: Record<string, string>;
  tags?: string[];
  // 定时任务相关字段
  is_scheduled?: boolean;
  cron_expression?: string;
}

export interface WorkerStatus {
  worker_id: string;
  process_id?: number;
  state: ProcessState;
  current_task_id?: string;
  last_heartbeat: string;
  cpu_usage?: number;
  memory_usage?: number;
  uptime_seconds: number;
  tasks_completed: number;
  tasks_failed: number;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  task_id?: string;
  worker_id?: string;
  created_at: string;
  resolved_at?: string;
  metadata: Record<string, unknown>;
}

export interface SystemMetrics {
  timestamp: string;
  disk_free_gb: number;
  memory_usage_percent: number;
  cpu_usage_percent: number;
  active_workers: number;
  pending_tasks: number;
  processing_tasks: number;
  failed_tasks: number;
  completed_tasks: number;
}

export interface SystemStatus {
  status: "healthy" | "warning" | "critical";
  active_workers: number;
  pending_tasks: number;
  processing_tasks: number;
  disk_space_gb: number;
  memory_usage_percent: number;
  uptime_seconds: number;
  last_updated: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// 任务模版相关类型
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  prompt_template: string; // 任务描述模板，支持变量替换
  variables: string[]; // 模板变量名数组，如 ["项目名称", "目标文件"]
  created_at: string;
  usage_count: number; // 使用次数统计
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  prompt_template: string;
  variables: string[];
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  id: string;
  usage_count?: number;
}

export interface ApplyTemplateRequest {
  template_id: string;
  variables: Record<string, string>; // 变量值映射
}

// WebSocket 消息类型
export interface WebSocketMessage {
  type: "task_updated" | "worker_status" | "system_alert" | "log_update";
  data: unknown;
  timestamp: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  worker_id?: string;
}