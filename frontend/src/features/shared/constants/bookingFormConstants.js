const PURPOSE_OPTIONS = {
  student: [
    { value: "SELF_STUDY", label: "Tự học", requestType: "OTHER" },
    { value: "GROUP_STUDY", label: "Học nhóm", requestType: "MEETING" },
    { value: "CLUB_ACTIVITY", label: "Hoạt động CLB", requestType: "CLUB_ACTIVITY" },
    { value: "SEMINAR", label: "Seminar", requestType: "EVENT" },
    { value: "ACADEMIC_MEETING", label: "Họp học thuật", requestType: "MEETING" },
    { value: "OTHER", label: "Khác", requestType: "OTHER" },
  ],
  lecturer: [
    { value: "SELF_STUDY", label: "Tự học", requestType: "OTHER" },
    { value: "GROUP_STUDY", label: "Học nhóm", requestType: "MEETING" },
    { value: "CLUB_ACTIVITY", label: "Hoạt động CLB", requestType: "CLUB_ACTIVITY" },
    { value: "SEMINAR", label: "Seminar", requestType: "SEMINAR" },
    { value: "MAKEUP_CLASS", label: "Học bù", requestType: "MAKEUP_CLASS" },
    { value: "ACADEMIC_MEETING", label: "Họp học thuật", requestType: "MEETING" },
    { value: "OTHER", label: "Khác", requestType: "OTHER" },
  ],
};

const ROOM_TYPE_OPTIONS = [
  { value: "LECTURE", label: "Phòng lý thuyết" },
  { value: "LAB", label: "Phòng thực hành / Máy tính" },
  { value: "SEMINAR", label: "Phòng họp" },
  { value: "AUDITORIUM", label: "Hội trường" },
  { value: "OTHER", label: "Khác" },
];

const EQUIPMENT_OPTIONS = [
  { value: "PROJECTOR", label: "Máy chiếu" },
  { value: "MICROPHONE", label: "Microphone" },
  { value: "SPEAKER", label: "Loa" },
  { value: "COMPUTER", label: "Máy tính" },
  { value: "WHITEBOARD", label: "Bảng trắng" },
  { value: "OTHER", label: "Khác" },
];

export { PURPOSE_OPTIONS, ROOM_TYPE_OPTIONS, EQUIPMENT_OPTIONS };
