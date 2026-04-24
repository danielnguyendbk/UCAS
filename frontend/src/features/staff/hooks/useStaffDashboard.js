import { useEffect, useState } from "react";
import { staffDashboardService } from "../services/staffDashboardService";
const useStaffDashboard = () => {
  const [stats, setStats] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [recentSections, setRecentSections] = useState([]);
  useEffect(() => {
    const loadData = async () => {
      const [statsData, quickActionsData, recentSectionsData] = await Promise.all([
        staffDashboardService.getStats(),
        staffDashboardService.getQuickActions(),
        staffDashboardService.getRecentSections()
      ]);
      setStats(statsData);
      setQuickActions(quickActionsData);
      setRecentSections(recentSectionsData);
    };
    void loadData();
  }, []);
  return {
    stats,
    quickActions,
    recentSections
  };
};
export {
  useStaffDashboard
};
