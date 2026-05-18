import { RoomBorrowRequestHistory } from "../components/booking/RoomBorrowRequestHistory";

const StudentBookingHistoryPage = () => (
  <RoomBorrowRequestHistory
    endpoint="/api/student/room-borrow-requests"
    title="Danh sách yêu cầu đặt phòng"
    description="Chỉ hiển thị các yêu cầu đặt phòng do tài khoản sinh viên hiện tại gửi."
    emptyTitle="Bạn chưa gửi yêu cầu đặt phòng nào"
  />
);

export { StudentBookingHistoryPage };
export default StudentBookingHistoryPage;
