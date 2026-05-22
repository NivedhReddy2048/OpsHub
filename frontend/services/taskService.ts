/**
 * services/taskService.ts
 *
 * All task and project API calls.
 * Mirrors /api/v1/tasks/ and /api/v1/projects/ backend endpoints.
 */
import api from "./api";
import type {
  Project,
  ProjectFilters,
  TaskListItem,
  TaskDetail,
  TaskComment,
  TaskFilters,
  TaskStatus,
  CreateTaskPayload,
  UpdateTaskPayload,
  ConvertTicketPayload,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

export const taskService = {
  // ─── Projects ──────────────────────────────────────────────────────────────

  async listProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    const response = await api.get<ApiResponse<Project[]>>("/projects/", { params: filters });
    return response.data.data;
  },

  async getProject(id: number): Promise<Project> {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}/`);
    return response.data.data;
  },

  async createProject(
    data: { name: string; description?: string; is_active?: boolean }
  ): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>("/projects/", data);
    return response.data.data;
  },

  async updateProject(
    id: number,
    data: { name?: string; description?: string; is_active?: boolean }
  ): Promise<Project> {
    const response = await api.patch<ApiResponse<Project>>(`/projects/${id}/`, data);
    return response.data.data;
  },

  async deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}/`);
  },

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  async listTasks(
    filters: TaskFilters = {}
  ): Promise<PaginatedResponse<TaskListItem>> {
    const response = await api.get<ApiResponse<PaginatedResponse<TaskListItem>>>("/tasks/", {
      params: filters,
    });
    return response.data.data;
  },

  async getTask(id: number): Promise<TaskDetail> {
    const response = await api.get<ApiResponse<TaskDetail>>(`/tasks/${id}/`);
    return response.data.data;
  },

  async createTask(payload: CreateTaskPayload): Promise<TaskDetail> {
    const response = await api.post<ApiResponse<TaskDetail>>("/tasks/", payload);
    return response.data.data;
  },

  async updateTask(id: number, payload: UpdateTaskPayload): Promise<TaskDetail> {
    const response = await api.patch<ApiResponse<TaskDetail>>(`/tasks/${id}/`, payload);
    return response.data.data;
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}/`);
  },

  async transitionStatus(id: number, newStatus: TaskStatus): Promise<TaskDetail> {
    const response = await api.patch<ApiResponse<TaskDetail>>(`/tasks/${id}/transition/`, {
      status: newStatus,
    });
    return response.data.data;
  },

  async assignTask(id: number, assigneeId: number): Promise<TaskDetail> {
    const response = await api.post<ApiResponse<TaskDetail>>(`/tasks/${id}/assign/`, {
      assignee_id: assigneeId,
    });
    return response.data.data;
  },

  async convertTicketToTask(
    ticketId: number,
    payload: ConvertTicketPayload
  ): Promise<TaskDetail> {
    const response = await api.post<ApiResponse<TaskDetail>>(
      `/tasks/from-ticket/${ticketId}/`,
      payload
    );
    return response.data.data;
  },

  // ─── Comments ──────────────────────────────────────────────────────────────

  async listComments(taskId: number): Promise<TaskComment[]> {
    const response = await api.get<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments/`);
    return response.data.data;
  },

  async addComment(taskId: number, content: string): Promise<TaskComment> {
    const response = await api.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments/`, {
      content,
    });
    return response.data.data;
  },

  async deleteComment(taskId: number, commentId: number): Promise<void> {
    await api.delete(`/tasks/${taskId}/comments/${commentId}/`);
  },
};
