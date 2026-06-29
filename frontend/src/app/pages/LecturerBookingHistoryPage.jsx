import { RoomBorrowRequestHistory } from "../components/booking/RoomBorrowRequestHistory";

const LecturerBookingHistoryPage = () => (
  <RoomBorrowRequestHistory
    endpoint="/api/lecturer/room-borrow-requests"
    title="Danh sách yêu cầu đặt phòng"
    description="Chỉ hiển thị các yêu cầu đặt phòng do tài khoản giảng viên hiện tại gửi."
    emptyTitle="Bạn chưa gửi yêu cầu đặt phòng nào"
  />
);

export { LecturerBookingHistoryPage };
export default LecturerBookingHistoryPage;
