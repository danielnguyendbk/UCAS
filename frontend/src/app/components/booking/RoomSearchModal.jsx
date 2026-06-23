import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Filter, RefreshCw, Search } from "lucide-react";
import { httpClient } from "../../../services/httpClient";
import { getApiError } from "../../../utils/apiError";

const PAGE_SIZE = 8;

export default function RoomSearchModal({
  open,
  onOpenChange,
  onSelect,
  semesterId,
  date,
  slot,
  slotStartId,
  slotEndId,
  expectedAttendees,
  isAllocationMode = false,
  dayOfWeek = "",
  isEmergencyChangeMode = false,
  isLecturerChangeMode = false,
  isStudentBorrowMode = false,
  isLecturerBorrowMode = false,
  scheduleId,
  changeScope = "SESSION",
  targetDate,
  fromWeek,
  toWeek,
  isSelecting = false,
  selectingRoomId = null,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomType, setRoomType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredRooms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter((room) =>
      [
        room.roomCode,
        room.buildingCode,
        room.buildingName,
        room.roomTypeText,
        room.mainEquipment,
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [rooms, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const visibleRooms = useMemo(
    () => filteredRooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRooms, page],
  );

  useEffect(() => {
    if (open) {
      fetchAvailableRooms();
    } else {
      setRooms([]);
      setError("");
      setRoomType("all");
      setSearchTerm("");
      setPage(1);
    }
  }, [
    open,
    roomType,
    semesterId,
    date,
    slot,
    slotStartId,
    slotEndId,
    expectedAttendees,
    isAllocationMode,
    dayOfWeek,
    isEmergencyChangeMode,
    isLecturerChangeMode,
    isStudentBorrowMode,
    isLecturerBorrowMode,
    scheduleId,
    changeScope,
    targetDate,
    fromWeek,
    toWeek,
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roomType]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const fetchAvailableRooms = async () => {
    const effectiveTargetDate = targetDate || date;
    const normalizedChangeScope = (changeScope || "SESSION").toUpperCase();
    const missingChangeScope =
      isEmergencyChangeMode &&
      (!scheduleId ||
        (normalizedChangeScope === "SESSION" && !effectiveTargetDate) ||
        (normalizedChangeScope === "WEEK_RANGE" && (!fromWeek || !toWeek)) ||
        (normalizedChangeScope === "REST_OF_SEMESTER" && !fromWeek));
    const usesSlotRange =
      isStudentBorrowMode ||
      isLecturerBorrowMode ||
      (!isAllocationMode && !isEmergencyChangeMode && (slotStartId || slotEndId));
    const missingBorrowSlot = usesSlotRange
      ? !slotStartId || !slotEndId
      : !slot;

    if (
      !semesterId ||
      (!isEmergencyChangeMode && missingBorrowSlot) ||
      expectedAttendees === null ||
      expectedAttendees === undefined ||
      expectedAttendees === "" ||
      (isAllocationMode && !dayOfWeek) ||
      (!isAllocationMode && !isEmergencyChangeMode && !date) ||
      missingChangeScope
    ) {
      setError("Không thể tìm phòng vì dữ liệu đang bị trống.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let endpoint = "/api/staff/emergency-room-bookings/available-rooms";
      const params = {
        semesterId,
        slot,
        expectedAttendees,
        roomType: roomType === "all" ? "" : roomType,
      };

      if (isAllocationMode) {
        endpoint = "/api/staff/allocations/available-rooms";
        params.dayOfWeek = dayOfWeek;
        if (scheduleId) params.scheduleId = scheduleId;
      } else if (isEmergencyChangeMode) {
        endpoint = isLecturerChangeMode
          ? "/api/lecturer/room-change-requests/available-rooms"
          : "/api/staff/emergency-room-changes/available-rooms";
        params.scheduleId = scheduleId;
        params.scope = normalizedChangeScope;

        if (normalizedChangeScope === "SESSION") {
          params.targetDate = effectiveTargetDate;
        } else {
          params.fromWeek = fromWeek;
          if (normalizedChangeScope === "WEEK_RANGE") {
            params.toWeek = toWeek;
          }
        }
      } else if (isStudentBorrowMode || isLecturerBorrowMode) {
        endpoint = isLecturerBorrowMode
          ? "/api/lecturer/room-borrow-requests/available-rooms"
          : "/api/student/room-borrow-requests/available-rooms";
        params.bookingDate = date;
      } else {
        params.bookingDate = date;
      }

      if (usesSlotRange) {
        params.slotStartId = slotStartId;
        params.slotEndId = slotEndId;
        delete params.slot;
      }

      const res = await httpClient.get(endpoint, { params });
      const payload = res.data?.data ?? res.data;
      setRooms(Array.isArray(payload) ? payload : payload?.items || []);
    } catch (err) {
      setError(
        getApiError(
          err,
          "Không tìm thấy phòng khả dụng cho dữ liệu đã chọn.",
        ).message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[920px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Danh sách phòng khả dụng</DialogTitle>
          <DialogDescription className="hidden">
            Tìm kiếm phòng trống phù hợp với yêu cầu
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm mã phòng, tòa nhà hoặc thiết bị..."
              className="h-9 bg-white pl-9"
            />
          </div>
          <div className="relative w-full sm:w-56">
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger className="h-9 text-sm border-gray-300 bg-white">
                <Filter className="w-3.5 h-3.5 mr-2 text-gray-500" />
                <SelectValue placeholder="Lọc theo loại phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại phòng</SelectItem>
                <SelectItem value="LECTURE">Phòng học</SelectItem>
                <SelectItem value="LAB">Phòng máy</SelectItem>
                <SelectItem value="SEMINAR">Phòng seminar</SelectItem>
                <SelectItem value="AUDITORIUM">Hội trường nhỏ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="py-2">
          {error ? (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </p>
          ) : loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <p className="text-center py-10 text-gray-500">
              Không tìm thấy phòng trống nào đáp ứng yêu cầu.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-[440px] overflow-auto rounded-lg border border-gray-200">
              <Table className="min-w-[780px] table-fixed">
                <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[120px]">Mã phòng</TableHead>
                    <TableHead className="w-[145px]">Tòa nhà</TableHead>
                    <TableHead className="w-[130px]">Loại phòng</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Sức chứa
                    </TableHead>
                    <TableHead className="w-[105px] text-center">Phù hợp</TableHead>
                    <TableHead>Thiết bị</TableHead>
                    <TableHead className="w-[130px] text-center">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibleRooms.map((room) => (
                    <TableRow key={room.classroomId}>
                      <TableCell className="font-bold text-blue-700 whitespace-normal break-words">
                        {room.roomCode}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {room.buildingName || room.buildingCode || room.roomCode?.split("-")?.[0] || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[11px] whitespace-normal break-words"
                        >
                          {room.roomTypeText}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {room.capacity}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Phù hợp
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 whitespace-normal break-words leading-relaxed">
                        {room.mainEquipment}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          className="whitespace-nowrap"
                          disabled={isSelecting}
                          onClick={() =>
                            onSelect(room.classroomId, room.roomCode, room)
                          }
                        >
                          {isSelecting && Number(selectingRoomId) === Number(room.classroomId) ? (
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          {isSelecting && Number(selectingRoomId) === Number(room.classroomId)
                            ? "Đang chọn"
                            : "Chọn phòng"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredRooms.length)} / {filteredRooms.length} phòng
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Trước
                  </Button>
                  <span>Trang {page}/{totalPages}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
