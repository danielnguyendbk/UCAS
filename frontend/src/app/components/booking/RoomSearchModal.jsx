import { useState, useMemo } from "react";
import { Search, Filter, Check, Info, Users, Monitor, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

const mockRooms = [
  { id: "A-101", capacity: 40, type: "Phòng học", equipment: "Máy chiếu, Điều hòa", status: "Khả dụng" },
  { id: "A-201", capacity: 60, type: "Phòng học", equipment: "Tivi, Điều hòa", status: "Khả dụng" },
  { id: "B-105", capacity: 30, type: "Phòng máy", equipment: "30 Máy tính, Điều hòa", status: "Khả dụng" },
  { id: "C-201", capacity: 80, type: "Hội trường nhỏ", equipment: "Hệ thống âm thanh, Máy chiếu", status: "Khả dụng" },
  { id: "D-102", capacity: 45, type: "Phòng học", equipment: "Máy chiếu, Quạt", status: "Khả dụng" },
  { id: "A-301", capacity: 50, type: "Phòng học", equipment: "Máy chiếu, Điều hòa", status: "Khả dụng" },
];

const RoomSearchModal = ({ open, onOpenChange, onSelect, date, slot }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = useMemo(() => {
    return mockRooms.filter(room => 
      room.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.equipment.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Tìm phòng trống
          </DialogTitle>
          <DialogDescription>
            {date && slot 
              ? `Đang tìm phòng trống cho ngày ${date}, ${slot}`
              : "Tìm kiếm phòng học phù hợp với nhu cầu sử dụng của bạn."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm theo mã phòng, loại phòng hoặc thiết bị..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-auto border rounded-lg border-gray-100">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Mã phòng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Sức chứa</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Loại phòng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Thiết bị chính</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Trạng thái</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id} className="hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-bold text-blue-700 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      {room.id}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        {room.capacity}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{room.type}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3 h-3" />
                        {room.equipment}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100 transition-colors cursor-default text-[10px] px-2 py-0.5">
                        Khả dụng theo dữ liệu hiện tại
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs hover:bg-blue-600 hover:text-white border-blue-200 text-blue-600"
                        onClick={() => onSelect(room.id)}
                      >
                        Chọn phòng
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500 italic">
                      Không tìm thấy phòng phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              Danh sách phòng được cập nhật theo thời điểm tra cứu. Hệ thống sẽ kiểm tra lại tính khả dụng cuối cùng trước khi lưu yêu cầu của bạn.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-gray-100 mt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoomSearchModal;
