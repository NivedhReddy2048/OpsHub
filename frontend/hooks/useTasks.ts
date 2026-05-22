"use client";

/**
 * hooks/useTasks.ts
 *
 * TanStack Query hooks for the task and project domains.
 * Normalized query keys, cache updates on mutation success.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/taskService";
import { authService } from "@/services/authService";
import type {
  TaskFilters,
  ProjectFilters,
  CreateTaskPayload,
  UpdateTaskPayload,
  ConvertTicketPayload,
  TaskStatus,
} from "@/types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  comments: (taskId: number) => [...taskKeys.detail(taskId), "comments"] as const,
};

// ─── Project Queries ──────────────────────────────────────────────────────────

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => taskService.listProjects(filters),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => taskService.getProject(id),
    enabled: !!id,
  });
}

// ─── Project Mutations ────────────────────────────────────────────────────────

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; is_active?: boolean }) =>
      taskService.createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}

export function useUpdateProject(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; is_active?: boolean }) =>
      taskService.updateProject(projectId, data),
    onSuccess: (updated) => {
      qc.setQueryData(projectKeys.detail(projectId), updated);
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskService.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}

// ─── Task Queries ─────────────────────────────────────────────────────────────

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskService.listTasks(filters),
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getTask(id),
    enabled: !!id,
  });
}

// ─── Task Mutations ───────────────────────────────────────────────────────────

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskService.createTask(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

export function useUpdateTask(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) =>
      taskService.updateTask(taskId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(taskKeys.detail(taskId), updated);
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useTransitionTask(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      taskService.transitionStatus(taskId, newStatus),
    onSuccess: (updated) => {
      qc.setQueryData(taskKeys.detail(taskId), updated);
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useAssignTask(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: number) =>
      taskService.assignTask(taskId, assigneeId),
    onSuccess: (updated) => {
      qc.setQueryData(taskKeys.detail(taskId), updated);
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

export function useConvertTicketToTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: number;
      payload: ConvertTicketPayload;
    }) => taskService.convertTicketToTask(ticketId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// ─── Comment Mutations ────────────────────────────────────────────────────────

export function useAddTaskComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => taskService.addComment(taskId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }),
  });
}

export function useDeleteTaskComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) =>
      taskService.deleteComment(taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }),
  });
}

// ─── User Queries ─────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ["users"] as const,
    queryFn: () => authService.listUsers(),
    retry: false,
  });
}
