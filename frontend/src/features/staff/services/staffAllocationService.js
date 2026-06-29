import { ALLOCATION_LIST, CONFLICT_LIST } from "../constants/allocation";
const staffAllocationService = {
  async getAllocationList() {
    return Promise.resolve(ALLOCATION_LIST);
  },
  async getConflicts() {
    return Promise.resolve(CONFLICT_LIST);
  }
};
export {
  staffAllocationService
};
