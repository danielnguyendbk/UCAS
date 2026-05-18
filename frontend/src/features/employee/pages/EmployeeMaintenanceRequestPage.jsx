import MaintenanceRequestPage from "@/app/components/maintenance/MaintenanceRequestPage";
import { APP_ROUTES } from "@/constants/routes";

const EmployeeMaintenanceRequestPage = () => (
  <MaintenanceRequestPage
    apiBasePath="/api/facility/maintenance-requests"
    title="Yêu cầu sửa chữa"
    subtitle="Báo cáo sự cố thiết bị hoặc cơ sở vật chất cần xử lý"
    cardTitle="Thông tin sự cố thiết bị"
    historyPath={APP_ROUTES.employeeMaintenanceHistory}
    accent="blue"
  />
);

export default EmployeeMaintenanceRequestPage;
