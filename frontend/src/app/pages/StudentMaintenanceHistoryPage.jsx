import MaintenanceHistoryPage from "../components/maintenance/MaintenanceHistoryPage";

const StudentMaintenanceHistoryPage = () => (
  <MaintenanceHistoryPage
    apiBasePath="/api/student/maintenance-requests"
    title="Lịch sử sửa chữa"
    subtitle="Theo dõi tiến độ xử lý các sự cố cơ sở vật chất bạn đã báo cáo"
  />
);

export { StudentMaintenanceHistoryPage };
export default StudentMaintenanceHistoryPage;
