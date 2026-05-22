/**
 * services/ticketService.ts
 *
 * All ticket-domain API calls.
 * Mirrors the backend URL structure at /api/v1/tickets/
 */
import api from "./api";
import type {
  TicketListItem,
  TicketDetail,
  TicketCategory,
  TicketComment,
  TicketAttachment,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketFilters,
  TicketStatus,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

export const ticketService = {
  // ─── Tickets ───────────────────────────────────────────────────────────────

  async listTickets(
    filters: TicketFilters = {}
  ): Promise<PaginatedResponse<TicketListItem>> {
    const response = await api.get<ApiResponse<PaginatedResponse<TicketListItem>>>(
      "/tickets/",
      { params: filters }
    );
    return response.data.data;
  },

  async getTicket(id: number): Promise<TicketDetail> {
    const response = await api.get<ApiResponse<TicketDetail>>(`/tickets/${id}/`);
    return response.data.data;
  },

  async createTicket(payload: CreateTicketPayload): Promise<TicketDetail> {
    const response = await api.post<ApiResponse<TicketDetail>>("/tickets/", payload);
    return response.data.data;
  },

  async updateTicket(
    id: number,
    payload: UpdateTicketPayload
  ): Promise<TicketDetail> {
    const response = await api.patch<ApiResponse<TicketDetail>>(`/tickets/${id}/`, payload);
    return response.data.data;
  },

  async deleteTicket(id: number): Promise<void> {
    await api.delete(`/tickets/${id}/`);
  },

  async transitionStatus(
    id: number,
    newStatus: TicketStatus
  ): Promise<TicketDetail> {
    const response = await api.patch<ApiResponse<TicketDetail>>(
      `/tickets/${id}/transition/`,
      { status: newStatus }
    );
    return response.data.data;
  },

  async assignTicket(
    id: number,
    assigneeId: number
  ): Promise<TicketDetail> {
    const response = await api.post<ApiResponse<TicketDetail>>(`/tickets/${id}/assign/`, {
      assignee_id: assigneeId,
    });
    return response.data.data;
  },

  // ─── Comments ──────────────────────────────────────────────────────────────

  async listComments(ticketId: number): Promise<TicketComment[]> {
    const response = await api.get<ApiResponse<TicketComment[]>>(
      `/tickets/${ticketId}/comments/`
    );
    return response.data.data;
  },

  async addComment(
    ticketId: number,
    content: string,
    isInternal: boolean = false
  ): Promise<TicketComment> {
    const response = await api.post<ApiResponse<TicketComment>>(
      `/tickets/${ticketId}/comments/`,
      { content, is_internal: isInternal }
    );
    return response.data.data;
  },

  async deleteComment(ticketId: number, commentId: number): Promise<void> {
    await api.delete(`/tickets/${ticketId}/comments/${commentId}/`);
  },

  // ─── Attachments ───────────────────────────────────────────────────────────

  async uploadAttachment(
    ticketId: number,
    file: File
  ): Promise<TicketAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<TicketAttachment>>(
      `/tickets/${ticketId}/attachments/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data;
  },

  async deleteAttachment(
    ticketId: number,
    attachmentId: number
  ): Promise<void> {
    await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}/`);
  },

  // ─── Categories ────────────────────────────────────────────────────────────

  async listCategories(): Promise<TicketCategory[]> {
    const response = await api.get<ApiResponse<TicketCategory[]>>("/tickets/categories/");
    return response.data.data;
  },

  async createCategory(
    name: string,
    description?: string
  ): Promise<TicketCategory> {
    const response = await api.post<ApiResponse<TicketCategory>>("/tickets/categories/", {
      name,
      description,
    });
    return response.data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/tickets/categories/${id}/`);
  },
};
