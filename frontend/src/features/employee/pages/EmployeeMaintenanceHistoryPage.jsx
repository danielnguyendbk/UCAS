import MaintenanceHistoryPage from "@/app/components/maintenance/MaintenanceHistoryPage";

const EmployeeMaintenanceHistoryPage = () => (
  <MaintenanceHistoryPage
    apiBasePath="/api/facility/maintenance-requests"
    title="Lịch sử sửa chữa"
    subtitle="Theo dõi tiến độ xử lý các yêu cầu sửa chữa đã gửi"
  />
);

export default EmployeeMaintenanceHistoryPage;
