import MaintenanceHistoryPage from "../components/maintenance/MaintenanceHistoryPage";

const LecturerMaintenanceHistoryPage = () => (
  <MaintenanceHistoryPage
    apiBasePath="/api/lecturer/maintenance-requests"
    title="Lịch sử sửa chữa"
    subtitle="Theo dõi trạng thái các yêu cầu sửa chữa cơ sở vật chất đã gửi"
  />
);

export { LecturerMaintenanceHistoryPage };
export default LecturerMaintenanceHistoryPage;
