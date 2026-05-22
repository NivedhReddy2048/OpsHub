/**
 * services/authService.ts
 *
 * All authentication-related API calls.
 * Keeps views/hooks free of raw axios calls.
 */
import api from "./api";
import type { User, LoginCredentials, AuthTokens, ApiResponse, UserRole } from "@/types";

export const authService = {
  /**
   * Exchange email + password for JWT token pair.
   * POST /api/v1/auth/token/
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>("/auth/token/", credentials);
    return response.data.data;
  },

  /**
   * Blacklist refresh token on the server.
   * POST /api/v1/auth/logout/
   */
  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout/", { refresh: refreshToken });
  },

  /**
   * Fetch the authenticated user's profile.
   * GET /api/v1/accounts/me/
   */
  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>("/accounts/me/");
    return response.data.data;
  },

  /**
   * Update the authenticated user's profile (full_name, username, avatar).
   * PATCH /api/v1/accounts/me/
   */
  async updateProfile(data: Partial<Pick<User, "full_name" | "username">>): Promise<User> {
    const response = await api.patch<ApiResponse<User>>("/accounts/me/", data);
    return response.data.data;
  },

  /**
   * Change the authenticated user's password.
   * POST /api/v1/accounts/me/change-password/
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<{ detail: string }> {
    const response = await api.post<ApiResponse<{ detail: string }>>(
      "/accounts/me/change-password/",
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      }
    );
    return response.data.data;
  },

  /**
   * List all users in the organization (admin only).
   * GET /api/v1/accounts/users/
   */
  async listUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>("/accounts/users/");
    return response.data.data;
  },

  /**
   * Create a new user in the organization (admin only).
   * POST /api/v1/accounts/users/
   */
  async createUser(data: {
    email: string;
    full_name: string;
    role: UserRole;
    username: string;
    password?: string;
    confirm_password?: string;
  }): Promise<User> {
    const response = await api.post<ApiResponse<User>>("/accounts/users/", data);
    return response.data.data;
  },
};
