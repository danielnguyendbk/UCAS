import MaintenanceRequestPage from "../components/maintenance/MaintenanceRequestPage";
import { APP_ROUTES } from "@/constants/routes";

const LecturerMaintenanceRequestPage = () => (
  <MaintenanceRequestPage
    apiBasePath="/api/lecturer/maintenance-requests"
    title="Yêu cầu sửa chữa"
    subtitle="Báo cáo sự cố cơ sở vật chất trong phòng học"
    cardTitle="Thông tin sự cố phòng học"
    historyPath={APP_ROUTES.lecturerMaintenanceHistory}
    accent="orange"
  />
);

export { LecturerMaintenanceRequestPage };
export default LecturerMaintenanceRequestPage;
