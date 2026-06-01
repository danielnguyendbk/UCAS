import MaintenanceRequestForm from "@/features/shared/components/MaintenanceRequestForm";
import { APP_ROUTES } from "@/constants/routes";

const StudentMaintenanceRequestPage = () => (
  <MaintenanceRequestForm
    apiBasePath="/api/student/maintenance-requests"
    title="Yêu cầu sửa chữa"
    subtitle="Báo cáo hư hỏng thiết bị, phòng học hoặc cơ sở vật chất"
    cardTitle="Thông tin sự cố"
    historyPath={APP_ROUTES.studentMaintenanceHistory}
    accent="blue"
  />
);

export { StudentMaintenanceRequestPage };
export default StudentMaintenanceRequestPage;
