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
  const [runDoneMessage, setRunDoneMessage] = useState(null);

  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

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
      const [allocRes, conflictRes] = await Promise.all([
        httpClient.get(`/api/staff/allocations?semesterId=${semesterId}`),
        httpClient.get(
          `/api/staff/allocations/conflicts?semesterId=${semesterId}`,
        ),
      ]);
      setAllocations(allocRes.data?.data || []);
      setConflicts(conflictRes.data?.data || []);
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
    try {
      const res = await httpClient.post(
        `/api/staff/allocations/auto-assign?semesterId=${semesterId}`,
      );
      setRunDoneMessage(res.data?.message || "Phân công tự động hoàn tất!");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi chạy phân công tự động");
    } finally {
      setIsRunning(false);
    }
  };

  const handleOpenRoomSearch = (section) => {
    setSelectedSection(section);
    setIsRoomSearchOpen(true);
  };

  const handleRoomSelect = async (classroomId, roomCode) => {
    try {
      await httpClient.post("/api/staff/allocations/manual", {
        scheduleId: selectedSection.scheduleId,
        classroomId: classroomId,
      });
      alert(`Đã phân phòng ${roomCode} thành công!`);
      setIsRoomSearchOpen(false);
      fetchData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Phòng bị trùng lịch hoặc quá sức chứa!",
      );
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
    runDoneMessage,
    runAutoAssign,
    isRoomSearchOpen,
    setIsRoomSearchOpen,
    selectedSection,
    handleOpenRoomSearch,
    handleRoomSelect,
  };
};
