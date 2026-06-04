import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Send,
  Upload,
  Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import RoomSearchModal from "@/app/components/booking/RoomSearchModal";
import { ConflictActionTable } from "@/features/staff/components/ConflictActionTable";
import { RoomAssignmentSummaryCards } from "@/features/staff/components/RoomAssignmentSummaryCards";
import {
  AssignedScheduleTable,
  UnassignedScheduleTable,
} from "@/features/staff/components/RoomAssignmentTables";
import { useStaffAllocation } from "@/features/staff/hooks/useStaffAllocation";
import {
  isAssigned,
  isUnassigned,
} from "@/features/staff/utils/allocationHelpers";

const WORKFLOW_TABS = [
  { value: "import", label: "Import thời khóa biểu" },
  { value: "pending", label: "Chờ phân phòng" },
  { value: "assigned", label: "Đã phân phòng" },
  { value: "conflicts", label: "Xung đột" },
  { value: "submit", label: "Gửi duyệt" },
];

const VALID_TABS = new Set(WORKFLOW_TABS.map((tab) => tab.value));

const StaffAutoAssignmentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : "pending";

  const {
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
    isSubmitting,
    submitMessage,
    submitApiAvailable,
    submitForApproval,
    setActiveTab: setAllocationTab,
  } = useStaffAllocation();

  const pendingAssignment = location.state?.openRoomSearch ? location.state : null;

  const unassignedItems = useMemo(
    () => allocations.filter(isUnassigned),
    [allocations],
  );
  const assignedItems = useMemo(
    () => allocations.filter(isAssigned),
    [allocations],
  );

  const summary = useMemo(
    () => ({
      total: allocations.length,
      assigned: assignedItems.length,
      unassigned: unassignedItems.length,
      conflicts: conflicts.length,
      canSubmit: conflicts.length === 0 && allocations.length > 0,
    }),
    [allocations.length, assignedItems.length, unassignedItems.length, conflicts.length],
  );

  const setActiveTab = (value) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  useEffect(() => {
    if (!tabParam || !VALID_TABS.has(tabParam)) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [tabParam, activeTab, setSearchParams]);

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
      setActiveTab("conflicts");
      setAllocationTab("allocation");
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
    setAllocationTab,
    handleOpenRoomSearch,
    navigate,
    location.pathname,
  ]);

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân phòng học</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Import thời khóa biểu, phân phòng tự động, xử lý xung đột và gửi
            Admin duyệt
          </p>
          <div className="mt-3 w-64">
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger className="h-8 text-sm bg-white">
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

        {activeTab === "pending" && (
          <Button
            onClick={runAutoAssign}
            disabled={isRunning || !semesterId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            {isRunning ? "Đang xử lý..." : "Chạy phân phòng tự động"}
          </Button>
        )}
      </div>

      <RoomAssignmentSummaryCards {...summary} />

      {runDoneMessage && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Hoàn tất!</p>
            <p className="text-xs text-green-700 mt-0.5">{runDoneMessage}</p>
          </div>
        </div>
      )}

      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 h-auto flex-wrap w-full justify-start">
              {WORKFLOW_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs data-[state=active]:bg-white"
                >
                  {tab.value === "conflicts"
                    ? `${tab.label} (${conflicts.length})`
                    : tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="import" className="mt-4">
              <div className="flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                <Upload className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  Chức năng import thời khóa biểu đang phát triển
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-md">
                  API{" "}
                  <span className="font-mono">POST /api/staff/timetable/import</span>{" "}
                  chưa được triển khai trên backend.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <UnassignedScheduleTable
                items={unassignedItems}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="assigned" className="mt-4">
              <AssignedScheduleTable
                items={assignedItems}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="conflicts" className="mt-4">
              <ConflictActionTable
                conflicts={conflicts}
                allocations={allocations}
                isLoading={isLoading}
                onManualAssign={handleOpenRoomSearch}
              />
            </TabsContent>

            <TabsContent value="submit" className="mt-4">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Tổng lịch</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.total}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Đã phân phòng</p>
                      <p className="text-2xl font-bold text-green-700">
                        {summary.assigned}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Chưa phân phòng</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {summary.unassigned}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Xung đột</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summary.conflicts}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {summary.conflicts > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>
                      Còn xung đột, cần xử lý trước khi gửi duyệt.
                    </p>
                  </div>
                )}

                {!submitApiAvailable && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    Backend chưa hỗ trợ API gửi duyệt
                  </div>
                )}

                {submitMessage && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                    {submitMessage}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={submitForApproval}
                    disabled={
                      isSubmitting ||
                      !semesterId ||
                      summary.conflicts > 0 ||
                      !submitApiAvailable
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Gửi Admin duyệt
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

export default StaffAutoAssignmentPage;
