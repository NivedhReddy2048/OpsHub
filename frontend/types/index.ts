/**
 * types/index.ts
 *
 * Shared TypeScript types for OpsHub frontend.
 * Mirrors the backend model structure — extend per phase.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "support_agent" | "team_member";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  organization: number | null;
  organization_name: string | null;
  avatar: string | null;
  is_active: boolean;
  date_joined: string;
}

// ─── Organization ─────────────────────────────────────────────────────────────
export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  success: false;
  error: {
    status_code: number;
    detail: Record<string, string[]> | string;
  };
}

// ─── Ticket Domain (Phase 3) ──────────────────────────────────────────────────
export type TicketStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface TicketCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface UserMini {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface TicketAttachment {
  id: number;
  file_url: string | null;
  original_filename: string;
  file_size: number;
  uploaded_by: UserMini;
  uploaded_at: string;
}

export interface TicketComment {
  id: number;
  content: string;
  is_internal: boolean;
  author: UserMini;
  created_at: string;
  updated_at: string;
}

export interface TicketListItem {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: UserMini;
  assigned_to: UserMini | null;
  category: Pick<TicketCategory, "id" | "name" | "slug"> | null;
  is_sla_breached: boolean;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
}

export interface TicketDetail extends TicketListItem {
  description: string;
  organization: number;
  resolved_at: string | null;
  closed_at: string | null;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  allowed_transitions: TicketStatus[];
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  priority?: TicketPriority;
  category_id?: number | null;
  assigned_to_id?: number | null;
  due_at?: string | null;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  category_id?: number | null;
  assigned_to_id?: number | null;
  due_at?: string | null;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: number;
  category?: number;
  is_sla_breached?: boolean;
  unassigned?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ─── Task Domain (Phase 4) ────────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface ProjectMini {
  id: number;
  name: string;
  slug: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_by: UserMini;
  task_count: number;
  completed_task_count: number;
  completion_pct: number;
  created_at: string;
  updated_at: string;
}

export interface LinkedTicket {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
}

export interface TaskComment {
  id: number;
  content: string;
  author: UserMini;
  created_at: string;
  updated_at: string;
}

export interface TaskListItem {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: ProjectMini | null;
  assigned_to: UserMini | null;
  created_by: UserMini;
  is_overdue: boolean;
  due_date: string | null;
  completed_at: string | null;
  linked_ticket_id: number | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDetail extends TaskListItem {
  description: string;
  organization: number;
  linked_ticket: LinkedTicket | null;
  comments: TaskComment[];
  allowed_transitions: TaskStatus[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  project_id?: number | null;
  assigned_to_id?: number | null;
  due_date?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  project_id?: number | null;
  assigned_to_id?: number | null;
  due_date?: string | null;
}

export interface ConvertTicketPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority | null;
  project_id?: number | null;
  assigned_to_id?: number | null;
  due_date?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: number;
  project?: number;
  is_overdue?: boolean;
  has_linked_ticket?: boolean;
  unassigned?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface ProjectFilters {
  is_active?: boolean;
  search?: string;
}

// ─── Analytics, Audit & Notifications (Phase 5) ───────────────────────────────

export interface DashboardMetrics {
  total_open_tickets: number;
  breached_slas: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  ticket_status_breakdown: { status: string; count: number }[];
  ticket_priority_breakdown: { priority: string; count: number }[];
  task_status_breakdown: { status: string; count: number }[];
  project_completion_summary: {
    id: number;
    name: string;
    total_tasks: number;
    completed_tasks: number;
    completion_pct: number;
  }[];
}

export interface AuditLog {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  actor_email: string;
  actor_name: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_object_type: string;
  related_object_id: number | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
