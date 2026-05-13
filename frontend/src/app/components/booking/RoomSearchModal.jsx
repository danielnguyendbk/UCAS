import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { httpClient } from "../../../services/httpClient";

export default function RoomSearchModal({
  open,
  onOpenChange,
  onSelect,
  semesterId,
  date,
  slot,
  expectedAttendees,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchAvailableRooms();
    } else {
      setRooms([]);
      setError("");
    }
  }, [open]);

  const fetchAvailableRooms = async () => {
    if (!semesterId || !date || !slot || !expectedAttendees) {
      setError(
        "Vui lòng nhập đủ: Học kỳ, Ngày, Ca học và Số người dự kiến ở form bên ngoài trước khi tìm phòng.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await httpClient.get(
        "/api/staff/emergency-room-bookings/available-rooms",
        {
          params: {
            semesterId,
            bookingDate: date,
            slot,
            expectedAttendees,
          },
        },
      );

      setRooms(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Phòng không khả dụng hoặc Ngày không nằm trong Học kỳ đã chọn.",
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
            Tìm kiếm phòng trống để cấp phát khẩn cấp
          </DialogDescription>
        </DialogHeader>

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
                <TableHeader className="bg-gray-50">
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
                  {rooms.map((r) => (
                    <TableRow key={r.classroomId}>
                      <TableCell className="font-bold text-blue-700 whitespace-normal break-words">
                        {r.roomCode}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[11px] whitespace-normal break-words"
                        >
                          {r.roomTypeText}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center font-medium">
                        {r.capacity}
                      </TableCell>

                      <TableCell className="text-xs text-gray-600 whitespace-normal break-words leading-relaxed">
                        {r.mainEquipment}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => onSelect(r.classroomId, r.roomCode)}
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
