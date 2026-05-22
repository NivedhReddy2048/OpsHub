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
    console.log("[authService.login] Request payload:", {
      email: credentials.email,
      password: credentials.password ? "[HIDDEN]" : "undefined"
    });
    
    try {
      const response = await api.post<any>("/auth/token/", credentials);
      console.log("[authService.login] API response:", response);

      const responseData = response.data;
      if (!responseData) {
        throw new Error("Empty response received from authentication service.");
      }

      // 4. Ensure login success condition is correct
      // Should validate: response.data.success === true OR response.data.data.access exists
      const isSuccess = responseData.success === true || !!(responseData.data && responseData.data.access);
      if (!isSuccess) {
        throw new Error(responseData.message || "Login failed according to server response.");
      }

      // 2. Verify frontend correctly parses backend response
      // Current backend response structure:
      // response.data.data.access
      // response.data.data.refresh
      // Let's handle various structures just in case (e.g. response.data.data or response.data)
      const dataObj = responseData.data || responseData;
      const access = dataObj.access || dataObj.accessToken || responseData.access || responseData.token;
      const refresh = dataObj.refresh || dataObj.refreshToken || responseData.refresh;

      console.log("[authService.login] Parsed tokens:", {
        access: access ? `${access.substring(0, 10)}...` : "missing",
        refresh: refresh ? `${refresh.substring(0, 10)}...` : "missing"
      });

      if (!access || !refresh) {
        throw new Error("Failed to parse valid access or refresh tokens from backend response.");
      }

      return {
        access,
        refresh,
      };
    } catch (err) {
      console.error("[authService.login] Error occurred during API call:", err);
      throw err;
    }
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
