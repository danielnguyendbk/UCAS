import { useState, useEffect } from "react";
import { httpClient } from "@/services/httpClient";
import { getApiError } from "@/utils/apiError";

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
  const [workflow, setWorkflow] = useState(null);
  const [loadedSemesterId, setLoadedSemesterId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [runDoneMessage, setRunDoneMessage] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [dataError, setDataError] = useState(null);

  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigningRoomId, setAssigningRoomId] = useState(null);

  const isTimetableReadOnly = ["PUBLISHED", "LOCKED"].includes(
    workflow?.timetableStatus,
  );
  const readOnlyMessage =
    workflow?.timetableStatus === "LOCKED"
      ? "Thời khóa biểu đã khóa. Mọi thay đổi phải đi qua quy trình yêu cầu."
      : "Thời khóa biểu đã công bố. Không thể phân phòng lại trực tiếp.";

  const rejectReadOnlyMutation = () => {
    if (!isTimetableReadOnly) return false;
    setActionMessage({ tone: "error", text: readOnlyMessage });
    return true;
  };

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
    setDataError(null);
    try {
      const [conflictRes, allocRes, workflowRes] = await Promise.all([
        httpClient.get(
          `/api/staff/allocations/conflicts?semesterId=${semesterId}`,
        ),
        httpClient.get(`/api/staff/allocations?semesterId=${semesterId}`),
        httpClient.get(
          `/api/staff/timetable-workflow/status?semesterId=${semesterId}`,
        ),
      ]);
      setConflicts(conflictRes.data?.data || []);
      setAllocations(allocRes.data?.data || []);
      setWorkflow(workflowRes.data?.data ?? workflowRes.data ?? null);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
      setDataError(
        getApiError(error, "Không thể tải dữ liệu phân phòng và xung đột."),
      );
    } finally {
      setLoadedSemesterId(semesterId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterId]);

  const runAutoAssign = async () => {
    if (rejectReadOnlyMutation()) return;
    if (
      !window.confirm(
        "Hệ thống sẽ tự động phân phòng cho các lớp chưa có chỗ. Tiếp tục?",
      )
    )
      return;
    setIsRunning(true);
    setRunDoneMessage(null);
    setDataError(null);
    setActionMessage(null);
    try {
      const res = await httpClient.post(
        `/api/staff/allocations/auto-assign?semesterId=${semesterId}`,
      );
      await fetchData();
      setRunDoneMessage(res.data?.message || "Phân công tự động hoàn tất!");
    } catch (error) {
      const apiError = getApiError(
        error,
        "Không thể chạy phân phòng tự động.",
      );
      setActionMessage({
        tone: "error",
        errorCode: apiError.errorCode,
        text: apiError.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const validateAllocations = async () => {
    if (!semesterId) return;
    if (rejectReadOnlyMutation()) return;
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
      const apiError = getApiError(
        error,
        "Không thể cập nhật trạng thái validation.",
      );
      setActionMessage({
        tone: "error",
        errorCode: apiError.errorCode,
        text: apiError.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleOpenRoomSearch = (section) => {
    if (rejectReadOnlyMutation()) return;
    setActionMessage(null);
    setSelectedSection(section);
    setIsRoomSearchOpen(true);
  };

  const handleRoomSelect = async (classroomId, roomCode) => {
    if (!selectedSection?.scheduleId || isAssigning) return;
    setIsAssigning(true);
    setAssigningRoomId(classroomId);
    setActionMessage(null);
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
      await fetchData();
    } catch (error) {
      const apiError = getApiError(
        error,
        "Không thể phân phòng do xung đột hoặc ràng buộc phòng.",
      );
      setActionMessage({
        tone: "error",
        errorCode: apiError.errorCode,
        text: apiError.message,
      });
    } finally {
      setIsAssigning(false);
      setAssigningRoomId(null);
    }
  };

  const submitForApproval = async () => {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await httpClient.post(
        `/api/staff/timetable-workflow/submit?semesterId=${semesterId}`,
      );
      const updatedWorkflow = res.data?.data ?? res.data;
      setWorkflow(updatedWorkflow);
      setActionMessage({
        tone: "success",
        text: res.data?.message || "Đã gửi Admin duyệt thành công!",
      });
    } catch (error) {
      const apiError = getApiError(
        error,
        "Không thể gửi duyệt. Vui lòng kiểm tra lại xung đột.",
      );
      const failedWorkflow = apiError.details;
      if (failedWorkflow) setWorkflow(failedWorkflow);
      setActionMessage({
        tone: "error",
        errorCode: apiError.errorCode,
        text: apiError.message,
      });
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
    workflow,
    isTimetableReadOnly,
    loadedSemesterId,
    isLoading,
    isRunning,
    isValidating,
    runDoneMessage,
    actionMessage,
    setActionMessage,
    dataError,
    runAutoAssign,
    validateAllocations,
    isRoomSearchOpen,
    setIsRoomSearchOpen,
    selectedSection,
    handleOpenRoomSearch,
    handleRoomSelect,
    isAssigning,
    assigningRoomId,
    isSubmitting,
    submitForApproval,
    refreshData: fetchData,
  };
};
