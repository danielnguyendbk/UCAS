import { useState, useEffect } from "react";
import { httpClient } from "@/services/httpClient";

const getActiveSemesterId = (semesters) => {
  const activeSemester = semesters.find(
    (semester) => semester.status?.toUpperCase() === "ACTIVE",
  );
  return (activeSemester || semesters[0])?.id?.toString() || "";
};

export const useStaffAllocation = () => {
  const [activeTab, setActiveTab] = useState("allocation");
  const [semestersList, setSemestersList] = useState([]);
  const [semesterId, setSemesterId] = useState("");

  const [allocations, setAllocations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loadedSemesterId, setLoadedSemesterId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [runDoneMessage, setRunDoneMessage] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [submitApiAvailable, setSubmitApiAvailable] = useState(true);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await httpClient.get("/api/categories/semesters");
        const list = res.data?.data || [];
        setSemestersList(list);
        if (list.length > 0) {
          setSemesterId(getActiveSemesterId(list));
        }
      } catch (error) {
        console.error("Lỗi lấy học kỳ:", error);
      }
    };
    fetchSemesters();
  }, []);

  const fetchData = async () => {
    if (!semesterId) return;
    setIsLoading(true);
    setLoadedSemesterId("");
    setRunDoneMessage(null);
    try {
      const [conflictRes, allocRes] = await Promise.all([
        httpClient.get(
          `/api/staff/allocations/conflicts?semesterId=${semesterId}`,
        ),
        httpClient.get(`/api/staff/allocations?semesterId=${semesterId}`),
      ]);
      setConflicts(conflictRes.data?.data || []);
      setAllocations(allocRes.data?.data || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoadedSemesterId(semesterId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterId]);

  const runAutoAssign = async () => {
    if (
      !window.confirm(
        "Hệ thống sẽ tự động phân phòng cho các lớp chưa có chỗ. Tiếp tục?",
      )
    )
      return;
    setIsRunning(true);
    setRunDoneMessage(null);
    setActionMessage(null);
    try {
      const res = await httpClient.post(
        `/api/staff/allocations/auto-assign?semesterId=${semesterId}`,
      );
      setRunDoneMessage(res.data?.message || "Phân công tự động hoàn tất!");
      fetchData();
    } catch (error) {
      setActionMessage({
        tone: "error",
        text: error.response?.data?.message || "Không thể chạy phân phòng tự động.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const validateAllocations = async () => {
    if (!semesterId) return;
    setIsValidating(true);
    setActionMessage(null);
    try {
      const res = await httpClient.post(
        `/api/staff/allocations/validate?semesterId=${semesterId}`,
      );
      const summary = res.data;
      setActionMessage({
        tone: "success",
        text: `Đã kiểm tra ${summary.totalSchedules ?? 0} lịch: ${summary.validCount ?? 0} hợp lệ, ${summary.conflictCount ?? 0} có xung đột.`,
      });
      await fetchData();
    } catch (error) {
      setActionMessage({
        tone: "error",
        text:
          error.response?.data?.message ||
          "Không thể cập nhật trạng thái validation.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleOpenRoomSearch = (section) => {
    setActionMessage(null);
    setSelectedSection(section);
    setIsRoomSearchOpen(true);
  };

  const handleRoomSelect = async (classroomId, roomCode) => {
    try {
      await httpClient.post("/api/staff/allocations/manual", {
        scheduleId: selectedSection.scheduleId,
        classroomId: classroomId,
      });
      setActionMessage({
        tone: "success",
        text: `Đã phân phòng ${roomCode} thành công.`,
      });
      setIsRoomSearchOpen(false);
      fetchData();
    } catch (error) {
      setActionMessage({
        tone: "error",
        text:
          error.response?.data?.message ||
          "Không thể phân phòng do xung đột hoặc ràng buộc phòng.",
      });
    }
  };

  const submitForApproval = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await httpClient.post(
        `/api/staff/room-assignment/submit-for-approval?semesterId=${semesterId}`,
      );
      setSubmitMessage(res.data?.message || "Đã gửi Admin duyệt thành công!");
    } catch (error) {
      if (error.response?.status === 404) {
        setSubmitApiAvailable(false);
        setSubmitMessage("Backend chưa hỗ trợ API gửi duyệt");
      } else {
        setSubmitMessage(
          error.response?.data?.message || "Không thể gửi duyệt. Vui lòng thử lại.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    semestersList,
    semesterId,
    setSemesterId,
    allocations,
    conflicts,
    loadedSemesterId,
    isLoading,
    isRunning,
    isValidating,
    runDoneMessage,
    actionMessage,
    setActionMessage,
    runAutoAssign,
    validateAllocations,
    isRoomSearchOpen,
    setIsRoomSearchOpen,
    selectedSection,
    handleOpenRoomSearch,
    handleRoomSelect,
    isSubmitting,
    submitMessage,
    submitApiAvailable,
    submitForApproval,
    refreshData: fetchData,
  };
};
