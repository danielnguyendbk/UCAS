import { RECENT_SECTIONS, STAFF_QUICK_ACTIONS, STAFF_STATS } from "../constants/dashboard";
const staffDashboardService = {
  async getStats() {
    return Promise.resolve(STAFF_STATS);
  },
  async getQuickActions() {
    return Promise.resolve(STAFF_QUICK_ACTIONS);
  },
  async getRecentSections() {
    return Promise.resolve(RECENT_SECTIONS);
  }
};
export {
  staffDashboardService
};
