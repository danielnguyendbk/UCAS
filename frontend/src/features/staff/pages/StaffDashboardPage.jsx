import { RefreshCw } from "lucide-react";
import { StaffProgressOverview } from "../components/StaffProgressOverview";
import { StaffQuickActions } from "../components/StaffQuickActions";
import { StaffRecentSectionsTable } from "../components/StaffRecentSectionsTable";
import { StaffStatCards } from "../components/StaffStatCards";
import { useStaffDashboard } from "../hooks/useStaffDashboard";

const formatUpdatedAt = (value) => {
  if (!value) return "Đang cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
};

const StaffDashboardPage = () => {
  const {
    stats,
    quickActions,
    recentSections,
    progress,
    activeSemester,
    lastUpdated,
    loading,
    error,
    refresh,
  } = useStaffDashboard();

  const semesterName = activeSemester?.name || "Chưa xác định học kỳ ACTIVE";

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Tổng quan - Phòng Đào tạo
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {semesterName} · Cập nhật lúc {formatUpdatedAt(lastUpdated)}
          </p>
          {error && (
            <p className="mt-1 text-xs font-medium text-orange-600">{error}</p>
          )}
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <StaffStatCards stats={stats} />
      <StaffProgressOverview progress={progress} semesterName={semesterName} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StaffQuickActions actions={quickActions} />
        <StaffRecentSectionsTable sections={recentSections} />
      </div>
    </div>
  );
};

export default StaffDashboardPage;
