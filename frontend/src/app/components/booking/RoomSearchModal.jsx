import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Filter } from "lucide-react";
import { httpClient } from "../../../services/httpClient";

export default function RoomSearchModal({
  open,
  onOpenChange,
  onSelect,
  semesterId,
  date,
  slot,
  expectedAttendees,
  isAllocationMode = false,
  dayOfWeek = "",
  isEmergencyChangeMode = false,
  scheduleId,
  changeScope = "SESSION",
  targetDate,
  fromWeek,
  toWeek,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomType, setRoomType] = useState("all");

  useEffect(() => {
    if (open) {
      fetchAvailableRooms();
    } else {
      setRooms([]);
      setError("");
      setRoomType("all");
    }
  }, [
    open,
    roomType,
    semesterId,
    date,
    slot,
    expectedAttendees,
    isAllocationMode,
    dayOfWeek,
    isEmergencyChangeMode,
    scheduleId,
    changeScope,
    targetDate,
    fromWeek,
    toWeek,
  ]);

  const fetchAvailableRooms = async () => {
    const effectiveTargetDate = targetDate || date;
    const normalizedChangeScope = (changeScope || "SESSION").toUpperCase();
    const missingChangeScope =
      isEmergencyChangeMode &&
      (!scheduleId ||
        (normalizedChangeScope === "SESSION" && !effectiveTargetDate) ||
        (normalizedChangeScope === "WEEK_RANGE" && (!fromWeek || !toWeek)) ||
        (normalizedChangeScope === "REST_OF_SEMESTER" && !fromWeek));

    if (
      !semesterId ||
      (!isEmergencyChangeMode && !slot) ||
      expectedAttendees === null ||
      expectedAttendees === undefined ||
      expectedAttendees === "" ||
      (isAllocationMode && !dayOfWeek) ||
      (!isAllocationMode && !isEmergencyChangeMode && !date) ||
      missingChangeScope
    ) {
      setError(
        `Không thể tìm phòng vì dữ liệu đang bị trống. Ca học: ${
          slot || "chưa có"
        }, số người: ${expectedAttendees ?? "chưa có"}.`,
      );
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
      } else if (isEmergencyChangeMode) {
        endpoint = "/api/staff/emergency-room-changes/available-rooms";
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
      } else {
        params.bookingDate = date;
      }

      const res = await httpClient.get(endpoint, { params });
      const roomData = res.data?.data || res.data || [];
      setRooms(roomData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không tìm thấy phòng khả dụng cho dữ liệu đã chọn.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[800px] sm:!max-w-[750px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Danh sách phòng khả dụng</DialogTitle>
          <DialogDescription className="hidden">
            Tìm kiếm phòng trống phù hợp với yêu cầu
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center px-1">
          <div className="relative w-56">
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
          ) : rooms.length === 0 ? (
            <p className="text-center py-10 text-gray-500">
              Không tìm thấy phòng trống nào đáp ứng yêu cầu.
            </p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden border rounded-lg shadow-sm">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[120px]">Mã phòng</TableHead>
                    <TableHead className="w-[130px]">Loại phòng</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Sức chứa
                    </TableHead>
                    <TableHead>Thiết bị</TableHead>
                    <TableHead className="w-[130px] text-center">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.classroomId}>
                      <TableCell className="font-bold text-blue-700 whitespace-normal break-words">
                        {room.roomCode}
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
                      <TableCell className="text-xs text-gray-600 whitespace-normal break-words leading-relaxed">
                        {room.mainEquipment}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() =>
                            onSelect(room.classroomId, room.roomCode, room)
                          }
                        >
                          Chọn phòng
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
