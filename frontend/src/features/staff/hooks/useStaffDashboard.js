import { useCallback, useEffect, useState } from "react";
import { staffDashboardService } from "../services/staffDashboardService";

const useStaffDashboard = () => {
  const [stats, setStats] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [recentSections, setRecentSections] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    assigned: 0,
    pending: 0,
    conflicts: 0,
    percent: 0,
  });
  const [activeSemester, setActiveSemester] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dashboardData = await staffDashboardService.getDashboardData();
      setStats(dashboardData.stats);
      setQuickActions(dashboardData.quickActions);
      setRecentSections(dashboardData.recentSections);
      setProgress(dashboardData.progress);
      setActiveSemester(dashboardData.activeSemester);
      setError(dashboardData.partialError);
      setLastUpdated(new Date());
    } catch (dashboardError) {
      console.error("Không tải được dữ liệu tổng quan staff:", dashboardError);
      setError("Không tải được dữ liệu tổng quan. Vui lòng thử làm mới.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    stats,
    quickActions,
    recentSections,
    progress,
    activeSemester,
    lastUpdated,
    loading,
    error,
    refresh: loadData
  };
};
export {
  useStaffDashboard
};
