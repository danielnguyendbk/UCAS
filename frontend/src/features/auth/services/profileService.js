import { httpClient } from "../../../services/httpClient";

export const profileService = {
  async getMyProfile() {
    const response = await httpClient.get("/api/auth/me");
    return response.data?.data;
  },

  async updateMyProfile(payload) {
    const response = await httpClient.put("/api/auth/me", payload);
    return response.data?.data;
  },

  async changePassword(payload) {
    const response = await httpClient.post("/api/auth/change-password", payload);
    return response.data;
  },
};
