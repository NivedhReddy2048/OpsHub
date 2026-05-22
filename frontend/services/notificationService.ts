import api from "./api";
import type { Notification, ApiResponse } from "@/types";

export interface NotificationsResponse {
  results: Notification[];
  unread_count: number;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const { data } = await api.get<ApiResponse<NotificationsResponse>>("/notifications/");
    return data.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const { data } = await api.post<ApiResponse<Notification>>(`/notifications/${id}/read/`);
    return data.data;
  },

  markAllAsRead: async (): Promise<{ marked_count: number }> => {
    const { data } = await api.post<ApiResponse<{ marked_count: number }>>("/notifications/mark-all-read/");
    return data.data;
  },
};
