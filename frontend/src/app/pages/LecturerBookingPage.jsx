import RoomBookingRequestForm from "@/features/shared/components/RoomBookingRequestForm";

const LECTURER_GUIDELINES = [
  "Học bù cần chọn đúng học phần được phân công trong học kỳ đã chọn.",
  "Yêu cầu CLB chỉ hợp lệ khi giảng viên là cố vấn của CLB đang hoạt động.",
  "Phòng được chọn là phòng mong muốn, kết quả cuối cùng phụ thuộc phê duyệt của giáo vụ.",
  "Nếu cần xử lý gấp trong ngày, vui lòng liên hệ trực tiếp phòng Đào tạo sau khi gửi yêu cầu.",
];

const LecturerBookingPage = () => (
  <RoomBookingRequestForm
    role="lecturer"
    title="Yêu cầu đặt phòng học"
    subtitle="Gửi yêu cầu đặt phòng cho hoạt động CLB, học bù, seminar, workshop, họp chuyên môn hoặc sự kiện."
    submitEndpoint="/api/lecturer/room-borrow-requests"
    clubLookupEndpoint="/api/lecturer/room-borrow-requests/clubs"
    sectionLookupEndpoint="/api/lecturer/room-borrow-requests/sections/lookup"
    accent="blue"
    guidelines={LECTURER_GUIDELINES}
  />
);

export { LecturerBookingPage };
export default LecturerBookingPage;