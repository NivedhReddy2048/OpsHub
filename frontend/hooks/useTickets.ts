"use client";

/**
 * hooks/useTickets.ts
 *
 * TanStack Query hooks for the ticket domain.
 * All mutations invalidate relevant query keys on success.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { ticketService } from "@/services/ticketService";
import type {
  TicketFilters,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketStatus,
} from "@/types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
  categories: () => [...ticketKeys.all, "categories"] as const,
  comments: (ticketId: number) => [...ticketKeys.detail(ticketId), "comments"] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => ticketService.listTickets(filters),
  });
}

export function useTicket(id: number, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketService.getTicket(id),
    enabled: !!id,
    ...(options as object),
  });
}

export function useTicketCategories() {
  return useQuery({
    queryKey: ticketKeys.categories(),
    queryFn: () => ticketService.listCategories(),
    staleTime: 1000 * 60 * 10, // 10 min — categories change rarely
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketService.createTicket(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useUpdateTicket(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTicketPayload) =>
      ticketService.updateTicket(ticketId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(ticketKeys.detail(ticketId), updated);
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useTransitionTicket(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newStatus: TicketStatus) =>
      ticketService.transitionStatus(ticketId, newStatus),
    onSuccess: (updated) => {
      qc.setQueryData(ticketKeys.detail(ticketId), updated);
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAssignTicket(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: number) =>
      ticketService.assignTicket(ticketId, assigneeId),
    onSuccess: (updated) => {
      qc.setQueryData(ticketKeys.detail(ticketId), updated);
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ticketService.deleteTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAddComment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      content,
      isInternal,
    }: {
      content: string;
      isInternal: boolean;
    }) => ticketService.addComment(ticketId, content, isInternal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}

export function useDeleteComment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) =>
      ticketService.deleteComment(ticketId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}

export function useUploadAttachment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      ticketService.uploadAttachment(ticketId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}

export function useDeleteAttachment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: number) =>
      ticketService.deleteAttachment(ticketId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}
