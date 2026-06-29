import RoomBookingRequestForm from "@/features/shared/components/RoomBookingRequestForm";

const STUDENT_GUIDELINES = [
  "Yêu cầu cần có mục đích học tập, sinh hoạt học thuật hoặc hoạt động ngoại khóa rõ ràng.",
  "Yêu cầu CLB chỉ được gửi bởi sinh viên đại diện CLB đang hoạt động.",
  "Phòng được chọn là phòng mong muốn, kết quả cuối cùng phụ thuộc phê duyệt của giáo vụ.",
  "Giữ gìn vệ sinh và tài sản của phòng học sau khi sử dụng.",
];

const StudentBookingPage = () => (
  <RoomBookingRequestForm
    role="student"
    title="Yêu cầu mượn phòng"
    subtitle="Gửi yêu cầu mượn phòng cho họp nhóm, hoạt động CLB, sự kiện hoặc nhu cầu khác."
    submitEndpoint="/api/student/room-borrow-requests"
    clubLookupEndpoint="/api/student/room-borrow-requests/clubs"
    accent="green"
    guidelines={STUDENT_GUIDELINES}
  />
);

export { StudentBookingPage };
export default StudentBookingPage;
