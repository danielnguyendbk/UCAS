import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
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
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import RoomSearchModal from "@/app/components/booking/RoomSearchModal";
import { ConflictActionTable } from "@/features/staff/components/ConflictActionTable";
import { RoomAssignmentSummaryCards } from "@/features/staff/components/RoomAssignmentSummaryCards";
import {
  AssignedScheduleTable,
  UnassignedScheduleTable,
} from "@/features/staff/components/RoomAssignmentTables";
import { useStaffAllocation } from "@/features/staff/hooks/useStaffAllocation";
import {
  CONFLICT_TYPE_LABELS,
  getCourseCode,
  isAssigned,
  isUnassigned,
} from "@/features/staff/utils/allocationHelpers";

const PAGE_SIZE = 10;

const paginate = (items, page) =>
  items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

const ListPagination = ({ page, totalItems, onPageChange }) => {
  if (totalItems === 0) return null;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
      <span>
        Hiển thị {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, totalItems)} / {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </Button>
        <span>Trang {page}/{totalPages}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
};

const WORKFLOW_TABS = [
  { value: "import", label: "Import thời khóa biểu" },
  { value: "pending", label: "Chờ phân phòng" },
  { value: "assigned", label: "Đã phân phòng" },
  { value: "conflicts", label: "Xung đột" },
  { value: "submit", label: "Gửi duyệt" },
];

const VALID_TABS = new Set(WORKFLOW_TABS.map((tab) => tab.value));

const WORKFLOW_STATUS_LABELS = {
  DRAFT: "Bản nháp",
  VALIDATING: "Đang kiểm tra",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ Admin duyệt",
  APPROVED: "Đã duyệt",
  PUBLISHED: "Đã công bố",
  LOCKED: "Đã khóa",
};

const StaffAutoAssignmentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : "pending";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [conflictTypeFilter, setConflictTypeFilter] = useState("ALL");
  const [pages, setPages] = useState({ pending: 1, assigned: 1, conflicts: 1 });

  const {
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
    runAutoAssign,
    validateAllocations,
    isRoomSearchOpen,
    setIsRoomSearchOpen,
    selectedSection,
    handleOpenRoomSearch,
    handleRoomSelect,
    isSubmitting,
    submitForApproval,
    setActiveTab: setAllocationTab,
  } = useStaffAllocation();

  const pendingAssignment = location.state?.openRoomSearch ? location.state : null;

  const allUnassignedItems = useMemo(
    () => allocations.filter(isUnassigned),
    [allocations],
  );
  const allAssignedItems = useMemo(
    () => allocations.filter(isAssigned),
    [allocations],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const allocationMatchesFilters = (allocation) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        getCourseCode(allocation),
        allocation.sectionCode,
        allocation.courseName,
        allocation.assignedRoom,
      ].some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch),
      );
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "UNASSIGNED" && isUnassigned(allocation)) ||
      (statusFilter === "ASSIGNED" && isAssigned(allocation)) ||
      allocation.status === statusFilter;
    return matchesSearch && matchesStatus;
  };

  const filteredUnassignedItems = useMemo(
    () => allUnassignedItems.filter(allocationMatchesFilters),
    [allUnassignedItems, normalizedSearch, statusFilter],
  );
  const filteredAssignedItems = useMemo(
    () => allAssignedItems.filter(allocationMatchesFilters),
    [allAssignedItems, normalizedSearch, statusFilter],
  );
  const allocationByScheduleId = useMemo(
    () => new Map(allocations.map((item) => [Number(item.scheduleId), item])),
    [allocations],
  );
  const filteredConflicts = useMemo(
    () =>
      conflicts.filter((conflict) => {
        const allocation = allocationByScheduleId.get(Number(conflict.scheduleId));
        const matchesSearch =
          !normalizedSearch ||
          [
            getCourseCode(allocation || conflict),
            conflict.sectionCode,
            conflict.courseName,
            conflict.roomCode,
            conflict.description,
            allocation?.assignedRoom,
          ].some((value) =>
            String(value || "").toLowerCase().includes(normalizedSearch),
          );
        const matchesStatus =
          statusFilter === "ALL" ||
          (allocation && allocationMatchesFilters(allocation));
        const matchesType =
          conflictTypeFilter === "ALL" ||
          conflict.conflictType === conflictTypeFilter;
        return matchesSearch && matchesStatus && matchesType;
      }),
    [
      conflicts,
      allocationByScheduleId,
      normalizedSearch,
      statusFilter,
      conflictTypeFilter,
    ],
  );
  const conflictTypes = useMemo(
    () =>
      [...new Set(conflicts.map((item) => item.conflictType).filter(Boolean))].sort(),
    [conflicts],
  );

  const pageItems = useMemo(
    () => ({
      pending: paginate(filteredUnassignedItems, pages.pending),
      assigned: paginate(filteredAssignedItems, pages.assigned),
      conflicts: paginate(filteredConflicts, pages.conflicts),
    }),
    [filteredUnassignedItems, filteredAssignedItems, filteredConflicts, pages],
  );

  const summary = useMemo(
    () => ({
      total: allocations.length,
      assigned: allAssignedItems.length,
      unassigned: allUnassignedItems.length,
      conflicts: conflicts.length,
      canSubmit: conflicts.length === 0 && allocations.length > 0,
    }),
    [
      allocations.length,
      allAssignedItems.length,
      allUnassignedItems.length,
      conflicts.length,
    ],
  );

  const setActiveTab = (value) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const setListPage = (list, page) => {
    setPages((current) => ({ ...current, [list]: page }));
  };

  useEffect(() => {
    setPages({ pending: 1, assigned: 1, conflicts: 1 });
  }, [searchTerm, statusFilter, conflictTypeFilter, semesterId]);

  useEffect(() => {
    setPages((current) => ({
      pending: Math.min(
        current.pending,
        Math.max(1, Math.ceil(filteredUnassignedItems.length / PAGE_SIZE)),
      ),
      assigned: Math.min(
        current.assigned,
        Math.max(1, Math.ceil(filteredAssignedItems.length / PAGE_SIZE)),
      ),
      conflicts: Math.min(
        current.conflicts,
        Math.max(1, Math.ceil(filteredConflicts.length / PAGE_SIZE)),
      ),
    }));
  }, [
    filteredUnassignedItems.length,
    filteredAssignedItems.length,
    filteredConflicts.length,
  ]);

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
      setActionMessage({
        tone: "error",
        text: "Không tìm thấy lớp học phần trong danh sách phân phòng. Hãy kiểm tra lớp đã có lịch học hay chưa.",
      });
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
    setActionMessage,
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

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "pending" && (
            <Button
              onClick={runAutoAssign}
              disabled={isRunning || !semesterId || isTimetableReadOnly}
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
          <Button
            variant="outline"
            onClick={validateAllocations}
            disabled={isValidating || !semesterId || isTimetableReadOnly}
          >
            {isValidating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Kiểm tra & cập nhật trạng thái
          </Button>
        </div>
      </div>

      <RoomAssignmentSummaryCards {...summary} />

      {isTimetableReadOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>
            {workflow?.timetableStatus === "LOCKED"
              ? "Thời khóa biểu đã khóa. Mọi thay đổi phải đi qua quy trình yêu cầu."
              : "Thời khóa biểu đã công bố. Không thể phân phòng lại trực tiếp."}
          </p>
        </div>
      )}

      {runDoneMessage && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Hoàn tất!</p>
            <p className="text-xs text-green-700 mt-0.5">{runDoneMessage}</p>
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            actionMessage.tone === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {actionMessage.tone === "success" ? (
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          )}
          <p>{actionMessage.text}</p>
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

            {["pending", "assigned", "conflicts"].includes(activeTab) && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3 md:flex-row md:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm mã học phần, tên môn hoặc phòng..."
                    className="bg-white pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-white md:w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="UNASSIGNED">Chưa phân phòng</SelectItem>
                    <SelectItem value="VALID">Hợp lệ</SelectItem>
                    <SelectItem value="CONFLICT">Có xung đột</SelectItem>
                  </SelectContent>
                </Select>
                {activeTab === "conflicts" && (
                  <Select
                    value={conflictTypeFilter}
                    onValueChange={setConflictTypeFilter}
                  >
                    <SelectTrigger className="w-full bg-white md:w-64">
                      <SelectValue placeholder="Loại xung đột" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả loại xung đột</SelectItem>
                      {conflictTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CONFLICT_TYPE_LABELS[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

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
                items={pageItems.pending}
                isLoading={isLoading}
              />
              <ListPagination
                page={pages.pending}
                totalItems={filteredUnassignedItems.length}
                onPageChange={(page) => setListPage("pending", page)}
              />
            </TabsContent>

            <TabsContent value="assigned" className="mt-4">
              <AssignedScheduleTable
                items={pageItems.assigned}
                isLoading={isLoading}
              />
              <ListPagination
                page={pages.assigned}
                totalItems={filteredAssignedItems.length}
                onPageChange={(page) => setListPage("assigned", page)}
              />
            </TabsContent>

            <TabsContent value="conflicts" className="mt-4">
              <ConflictActionTable
                conflicts={pageItems.conflicts}
                allocations={allocations}
                isLoading={isLoading}
                onManualAssign={handleOpenRoomSearch}
                readOnly={isTimetableReadOnly}
              />
              <ListPagination
                page={pages.conflicts}
                totalItems={filteredConflicts.length}
                onPageChange={(page) => setListPage("conflicts", page)}
              />
            </TabsContent>

            <TabsContent value="submit" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div>
                    <p className="text-xs text-gray-500">Trạng thái thời khóa biểu</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {workflow?.semesterName || "Học kỳ đang chọn"}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {WORKFLOW_STATUS_LABELS[workflow?.timetableStatus] ||
                      workflow?.timetableStatus ||
                      "Đang tải"}
                  </Badge>
                </div>
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

                <div className="flex justify-end">
                  <Button
                    onClick={submitForApproval}
                    disabled={
                      isSubmitting ||
                      !semesterId ||
                      summary.conflicts > 0 ||
                      isTimetableReadOnly ||
                      !["DRAFT", "CONFLICT"].includes(workflow?.timetableStatus)
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
        scheduleId={selectedSection?.scheduleId}
      />
    </div>
  );
};

export default StaffAutoAssignmentPage;
