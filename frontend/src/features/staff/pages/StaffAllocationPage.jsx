import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  RefreshCw,
  Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import RoomSearchModal from "@/app/components/booking/RoomSearchModal";

import { AllocationTable } from "@/features/staff/components/AllocationTable";
import { ConflictActionTable } from "@/features/staff/components/ConflictActionTable";
import { useStaffAllocation } from "@/features/staff/hooks/useStaffAllocation";

const STAFF_ALLOCATION_TABS = [
  { key: "allocation", label: "Danh sách phân phòng", icon: Building2 },
  { key: "conflicts", label: "Xung đột lịch", icon: AlertTriangle },
];


const StaffAllocationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
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
    actionMessage,
    runAutoAssign,
    isRoomSearchOpen,
    setIsRoomSearchOpen,
    selectedSection,
    handleOpenRoomSearch,
    handleRoomSelect,
    saveScheduleNote,
  } = useStaffAllocation();
  const pendingAssignment = location.state?.openRoomSearch ? location.state : null;

  useEffect(() => {
    if (!pendingAssignment) return;

    const targetSemesterId = pendingAssignment.semesterId;
    if (targetSemesterId && semesterId !== targetSemesterId) {
      setSemesterId(targetSemesterId);
      return;
    }

    if (isLoading || (targetSemesterId && loadedSemesterId !== targetSemesterId)) {
      return;
    }

    const targetSectionId = Number(pendingAssignment.sectionId);
    const targetSlotNumber = Number(pendingAssignment.slotNumber);
    const targetMaxCapacity = Number(pendingAssignment.maxCapacity);
    const targetSection = allocations.find((item) => {
      if (Number.isFinite(targetSectionId) && Number(item.sectionId) === targetSectionId) {
        return true;
      }

      if (pendingAssignment.sectionCode && item.classCode === pendingAssignment.sectionCode) {
        return true;
      }

      const hasSameLegacySectionCode =
        pendingAssignment.sectionCode &&
        item.sectionCode &&
        pendingAssignment.sectionCode.endsWith(`.L${item.sectionCode}`);

      return (
        hasSameLegacySectionCode &&
        item.courseName === pendingAssignment.courseName &&
        Number(item.slotNumber) === targetSlotNumber &&
        Number(item.maxCapacity) === targetMaxCapacity
      );
    });

    if (targetSection) {
      setActiveTab("allocation");
      handleOpenRoomSearch(targetSection);
    } else {
      window.alert(
        "Không tìm thấy lớp học phần này trong danh sách phân phòng. Vui lòng kiểm tra lớp đã có lịch học hay chưa.",
      );
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [
    pendingAssignment,
    semesterId,
    setSemesterId,
    isLoading,
    loadedSemesterId,
    allocations,
    setActiveTab,
    handleOpenRoomSearch,
    navigate,
    location.pathname,
  ]);


  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Phân phòng & Kiểm tra xung đột
          </h1>
          <div className="mt-2 w-64">
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger className="h-8 bg-white text-sm">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                {semestersList.map((sem) => (
                  <SelectItem key={sem.id} value={sem.id.toString()}>
                    {sem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          onClick={runAutoAssign}
          disabled={isRunning || !semesterId}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {isRunning ? "Đang xử lý thuật toán..." : "Phân công tự động"}
        </button>
      </div>

      {runDoneMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-semibold">Hoàn tất!</p>
            <p className="mt-0.5 text-xs text-green-700">{runDoneMessage}</p>
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionMessage.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {STAFF_ALLOCATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.key === "conflicts"
                ? `${tab.label} (${conflicts.length})`
                : tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "allocation" ? (
        <AllocationTable
          items={allocations}
          isLoading={isLoading}
          onOpenRoomSearch={handleOpenRoomSearch}
        />
      ) : (
        <ConflictActionTable
          conflicts={conflicts}
          allocations={allocations}
          isLoading={isLoading}
          onManualAssign={handleOpenRoomSearch}
          onSaveNote={saveScheduleNote}
        />
      )}

      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={handleRoomSelect}
        semesterId={semesterId}
        slot={selectedSection?.slotNumber}
        expectedAttendees={selectedSection?.maxCapacity}
        isAllocationMode
        dayOfWeek={selectedSection?.dayOfWeek}
      />
    </div>
  );
};

export default StaffAllocationPage;
