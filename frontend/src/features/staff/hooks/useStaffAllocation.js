import { useEffect, useState } from "react";
import { staffAllocationService } from "../services/staffAllocationService";
const useStaffAllocation = () => {
  const [activeTab, setActiveTab] = useState("allocation");
  const [isRunning, setIsRunning] = useState(false);
  const [runDone, setRunDone] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  useEffect(() => {
    const loadData = async () => {
      const [allocationData, conflictData] = await Promise.all([
        staffAllocationService.getAllocationList(),
        staffAllocationService.getConflicts()
      ]);
      setAllocations(allocationData);
      setConflicts(conflictData);
    };
    void loadData();
  }, []);
  const runAutoAssign = () => {
    setIsRunning(true);
    setRunDone(false);
    window.setTimeout(() => {
      setIsRunning(false);
      setRunDone(true);
    }, 2e3);
  };
  return {
    activeTab,
    setActiveTab,
    isRunning,
    runDone,
    allocations,
    conflicts,
    runAutoAssign
  };
};
export {
  useStaffAllocation
};
