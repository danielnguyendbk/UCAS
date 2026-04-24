import { useState, useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Key, Lock, Clock, CheckCircle, AlertTriangle, X, History as HistoryIcon, List, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";

// const CURRENT_EMPLOYEE_ID = "EMP001"; // Removed hardcoded ID

// Mock Data
const initialSchedule = [
  { id: 1, time: "07:00", slot: "Tiết 1-3", room: "A-201", section: "SE101.L21", lecturer: "Nguyễn Văn A", status: "pending", note: "", assignee: "NV01" },
  { id: 2, time: "07:00", slot: "Tiết 1-3", room: "A-202", section: "SE102.L22", lecturer: "Trần Thị B", status: "pending", note: "", assignee: "NV01" },
  { id: 3, time: "09:45", slot: "Tiết 4-6", room: "A-301", section: "SE201.L23", lecturer: "Lê Văn C", status: "pending", note: "", assignee: "NV01" },
  { id: 4, time: "13:00", slot: "Tiết 7-9", room: "B-105", section: "SE304.L24", lecturer: "Phạm Thị D", status: "pending", note: "", assignee: "NV099" }, // Assigned to another
];

const initialHistory = [
  { id: 101, date: "2026-04-24", time: "06:45", room: "A-101", section: "SE101.L11", actionTime: "06:42", status: "opened", note: "", assignee: "NV01" },
  { id: 102, date: "2026-04-24", time: "06:45", room: "A-102", section: "SE102.L12", actionTime: "06:55", status: "late", note: "Kẹt cửa", assignee: "NV01" },
  { id: 103, date: "2026-03-15", time: "07:00", room: "A-201", section: "SE201.L13", actionTime: "06:50", status: "opened", note: "", assignee: "NV01" },
  { id: 104, date: "2026-04-24", time: "07:00", room: "C-101", section: "SE105.L11", actionTime: "06:40", status: "opened", note: "", assignee: "NV099" }, // Assigned to another
];

const statusConfig = {
  pending: { label: "Chưa mở", className: "bg-gray-100 text-gray-600 border-gray-200" },
  opened: { label: "Đã mở", className: "bg-green-100 text-green-700 border-green-200" },
  late: { label: "Mở trễ", className: "bg-orange-100 text-orange-700 border-orange-200" },
  closed: { label: "Đã đóng", className: "bg-blue-100 text-blue-700 border-blue-200" }
};

const EmployeeRoomUnlockPage = () => {
  const { user } = useAuth();
  const currentEmployeeCode = user?.code || "NV01";

  // State remains for schedule and history
  const [activeTab, setActiveTab] = useState("schedule");
  const [schedule, setSchedule] = useState(initialSchedule.filter(t => t.assignee === currentEmployeeCode));
  const [history, setHistory] = useState(initialHistory.filter(t => t.assignee === currentEmployeeCode));
  
  const [selectedMonth, setSelectedMonth] = useState("4"); // default to current month 4

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      if (!selectedMonth || selectedMonth === "all") return true;
      const recordMonth = new Date(record.date).getMonth() + 1;
      return recordMonth.toString() === selectedMonth;
    });
  }, [history, selectedMonth]);

  const handleAction = (id, actionType) => {
    const taskIndex = schedule.findIndex(t => t.id === id);
    if (taskIndex === -1) return;
    
    const task = schedule[taskIndex];
    let newStatus = actionType; // 'opened', 'late', or 'closed'
    
    // Update Schedule list
    const updatedSchedule = [...schedule];
    updatedSchedule[taskIndex] = { ...task, status: newStatus };
    setSchedule(updatedSchedule);

    // Add to History
    const now = new Date();
    const actionTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];
    
    const historyRecord = {
      id: Date.now(),
      date: todayStr,
      time: task.time,
      room: task.room,
      section: task.section,
      actionTime: actionTime,
      status: newStatus,
      note: task.note,
      assignee: currentEmployeeCode
    };
    
    setHistory([historyRecord, ...history]);
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600" />
            Xác nhận mở cửa phòng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi lịch học và xác nhận việc mở cửa phòng học đúng giờ.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700">Ngày hôm nay</p>
          <p className="text-xs text-gray-500">{new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === "schedule" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("schedule")}
        >
          <List className="w-4 h-4" />
          Lịch cần mở hôm nay
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("history")}
        >
          <HistoryIcon className="w-4 h-4" />
          Lịch sử xác nhận
        </button>
      </div>

      {activeTab === "schedule" && (
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-base font-semibold">Danh sách phòng cần mở</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-xs">Thời gian (Ca học)</TableHead>
                  <TableHead className="font-semibold text-xs">Phòng</TableHead>
                  <TableHead className="font-semibold text-xs">Mã lớp / Giảng viên</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Trạng thái</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((task) => (
                  <TableRow key={task.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{task.time}</p>
                          <p className="text-[10px] text-gray-500">{task.slot}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-blue-700">{task.room}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-semibold">{task.section}</p>
                      <p className="text-[10px] text-gray-500">{task.lecturer}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${statusConfig[task.status].className} px-2 py-0.5 text-[10px]`} variant="outline">
                        {statusConfig[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {task.status === "pending" ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                            onClick={() => handleAction(task.id, "late")}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            Mở trễ
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAction(task.id, "opened")}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Xác nhận mở
                          </Button>
                        </>
                      ) : task.status !== "closed" ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleAction(task.id, "closed")}
                          >
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Xác nhận đóng
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Đã đóng cửa</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardHeader className="border-b border-gray-50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Lịch sử xác nhận mở cửa</CardTitle>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="3">Tháng 3/2026</SelectItem>
                  <SelectItem value="4">Tháng 4/2026</SelectItem>
                  <SelectItem value="5">Tháng 5/2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-xs">Giờ mở thực tế</TableHead>
                  <TableHead className="font-semibold text-xs">Lịch học</TableHead>
                  <TableHead className="font-semibold text-xs">Phòng</TableHead>
                  <TableHead className="font-semibold text-xs">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <span className="font-bold text-gray-900">{record.actionTime}</span>
                      <p className="text-[10px] text-gray-500">{new Date(record.date).toLocaleDateString('vi-VN')}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{record.time}</p>
                      <p className="text-[10px] text-gray-500">{record.section}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-blue-700">{record.room}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[record.status].className} px-2 py-0.5 text-[10px]`} variant="outline">
                        {statusConfig[record.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">Chưa có lịch sử xác nhận nào hôm nay.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default EmployeeRoomUnlockPage;
