import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle, Eye, X, AlertTriangle, ShieldCheck, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const STORAGE_KEY = "staff_bookings";

const MOCK_BOOKINGS = [
  {
    id: "REQ001",
    requester: "Nguyễn Văn An",
    room: "A101",
    purpose: "Học bù cho lớp D21CQCN01-N",
    date: "24/04/2026",
    slot: "Tiết 1 - 3",
    created: "23/04/2026",
    status: "pending",
    rejectReason: "",
  },
  {
    id: "REQ002",
    requester: "Trần Thị Bình",
    room: "B203",
    purpose: "Sinh hoạt Câu lạc bộ IT",
    date: "25/04/2026",
    slot: "Tiết 4 - 6",
    created: "23/04/2026",
    status: "approved",
    rejectReason: "",
  },
  {
    id: "REQ003",
    requester: "Lê Minh Châu",
    room: "C305",
    purpose: "Tổ chức seminar môn Cơ sở dữ liệu",
    date: "26/04/2026",
    slot: "Tiết 7 - 9",
    created: "22/04/2026",
    status: "rejected",
    rejectReason: "Phòng đã được xếp cho lớp học phần khác.",
  },
  {
    id: "REQ004",
    requester: "Phạm Quốc Dũng",
    room: "A205",
    purpose: "Ôn tập cuối kỳ cho sinh viên",
    date: "27/04/2026",
    slot: "Tiết 10 - 12",
    created: "23/04/2026",
    status: "pending",
    rejectReason: "",
  },
  {
    id: "REQ005",
    requester: "Nguyễn Hải Yến",
    room: "D402",
    purpose: "Báo cáo đồ án nhóm",
    date: "28/04/2026",
    slot: "Tiết 13 - 15",
    created: "23/04/2026",
    status: "approved",
    rejectReason: "",
  },
];

const getStatusConfig = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Đã duyệt",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: CheckCircle,
      };
    case "rejected":
      return {
        label: "Từ chối",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: XCircle,
      };
    default:
      return {
        label: "Chờ duyệt",
        className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        icon: Clock,
      };
  }
};

const StaffBookingListPage = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState(null); // null, 'valid', 'conflict'
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectBookingId, setRejectBookingId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookings(Array.isArray(parsed) ? parsed : MOCK_BOOKINGS);
      } catch {
        setBookings(MOCK_BOOKINGS);
      }
    } else {
      setBookings(MOCK_BOOKINGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_BOOKINGS));
    }
  }, []);

  useEffect(() => {
    if (bookings.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  }, [bookings]);

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
    setConflictResult(null);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectBookingId(null);
    setRejectReason("");
    setRejectError("");
  };

  const handleApprove = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: "approved", rejectReason: "" }
          : b
      )
    );
    closeRejectModal();
    closeDetailModal();
  };

  const handleReject = (bookingId) => {
    setRejectBookingId(bookingId);
    setRejectReason("");
    setRejectError("");
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối");
      return;
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === rejectBookingId
          ? {
              ...b,
              status: "rejected",
              rejectReason: rejectReason.trim(),
            }
          : b
      )
    );

    closeRejectModal();
    closeDetailModal();
  };

  const viewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
    setConflictResult(null);
  };

  const handleCheckConflict = () => {
    setCheckingConflict(true);
    setConflictResult(null);
    setTimeout(() => {
      setCheckingConflict(false);
      // Simulate conflict for REQ006 (just an example)
      setConflictResult(selectedBooking.id === 'REQ006' ? 'conflict' : 'valid');
    }, 1500);
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đặt phòng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đặt phòng khẩn cấp và quản lý danh sách đặt phòng
          </p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { key: "list", label: `Danh sách đặt phòng (${bookings.length})` },
          { key: "approve", label: `Duyệt yêu cầu (${pendingBookings.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                Chưa có yêu cầu đặt phòng
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Loại</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Mục đích</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ngày sử dụng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ca học</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ngày tạo</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {bookings.map((b) => {
                    const cfg = getStatusConfig(b.status);
                    const StatusIcon = cfg.icon;

                    return (
                      <TableRow key={b.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="text-center">
                          {b.category === "emergency" ? (
                            <Badge className="bg-red-50 text-red-700 border-red-100 text-[10px] gap-1">
                              <AlertTriangle className="w-3 h-3" /> Khẩn
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] gap-1">
                              Thường
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900">{b.room}</TableCell>
                        <TableCell className="text-xs text-gray-700 max-w-[220px]">
                          <div className="truncate" title={b.purpose}>
                            {b.purpose}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-700 whitespace-nowrap">{b.date}</TableCell>
                        <TableCell className="text-xs text-gray-600">{b.slot}</TableCell>
                        <TableCell className="text-xs text-gray-500">{b.created}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${cfg.className} gap-1 text-[11px]`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => viewDetails(b)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 mx-auto"
                          >
                            <Eye className="w-3 h-3" />
                            Xem
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === "approve" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {pendingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                Không có yêu cầu chờ duyệt
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Loại</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Yêu cầu từ</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Mục đích</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ngày sử dụng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pendingBookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="text-center">
                        {b.category === "emergency" ? (
                          <Badge className="bg-red-50 text-red-700 border-red-100 text-[10px] gap-1">
                            <AlertTriangle className="w-3 h-3" /> Khẩn
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] gap-1">
                            Thường
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{b.requester}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900">{b.room}</TableCell>
                      <TableCell className="text-xs text-gray-700">{b.purpose}</TableCell>
                      <TableCell className="text-xs text-gray-700 whitespace-nowrap">{b.date}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {b.category === "emergency" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs flex items-center gap-1"
                              onClick={() => viewDetails(b)}
                            >
                              <Search className="w-3 h-3" /> Kiểm tra
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleApprove(b.id)}
                            className="h-7 px-3 bg-green-600 hover:bg-green-700 text-xs"
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReject(b.id)}
                            variant="destructive"
                            className="h-7 px-3 text-xs"
                          >
                            Từ chối
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {showDetailModal && selectedBooking && (
        <Dialog
          open={showDetailModal}
          onOpenChange={(open) => {
            if (!open) closeDetailModal();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Chi tiết yêu cầu <span className="text-blue-600">{selectedBooking.id}</span>
              </DialogTitle>
              <button
                onClick={closeDetailModal}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Phòng</p>
                <p className="text-sm font-bold text-gray-900">{selectedBooking.room}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Mục đích</p>
                <p className="text-sm text-gray-700">{selectedBooking.purpose}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ngày sử dụng</p>
                <p className="text-sm text-gray-700">{selectedBooking.date}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ca học</p>
                <p className="text-sm text-gray-700">{selectedBooking.slot}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Yêu cầu từ</p>
                <p className="text-sm text-gray-700">{selectedBooking.requester}</p>
              </div>

              {selectedBooking.status === "rejected" && selectedBooking.rejectReason && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Lý do từ chối</p>
                  <p className="text-sm text-red-600">{selectedBooking.rejectReason}</p>
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-dashed border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center gap-2 h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={handleCheckConflict}
                  disabled={checkingConflict}
                >
                  {checkingConflict ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  {checkingConflict ? "Đang kiểm tra lịch thực tế..." : "Kiểm tra xung đột lịch"}
                </Button>

                {conflictResult && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                    conflictResult === 'valid' ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                  }`}>
                    {conflictResult === 'valid' ? (
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`text-xs font-bold ${conflictResult === 'valid' ? "text-green-800" : "text-red-800"}`}>
                        {conflictResult === 'valid' ? "PHÒNG CÒN TRỐNG" : "PHÒNG ĐÃ CÓ LỊCH"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {conflictResult === 'valid' 
                          ? "Yêu cầu hợp lệ, không phát hiện xung đột lịch tại thời điểm này."
                          : "Phòng này đã được xếp lịch cho một lớp học phần khác cùng thời gian."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeTab === "approve" && selectedBooking.status === "pending" && (
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  onClick={() => handleApprove(selectedBooking.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                >
                  Phê duyệt
                </Button>
                <Button
                  onClick={() => handleReject(selectedBooking.id)}
                  variant="destructive"
                  className="flex-1 text-sm"
                >
                  Từ chối
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {showRejectModal && (
        <Dialog
          open={showRejectModal}
          onOpenChange={(open) => {
            if (!open) closeRejectModal();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nhập lý do từ chối</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">
                  Lý do từ chối <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                  placeholder="Nhập lý do từ chối yêu cầu này..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
                {rejectError && (
                  <p className="text-xs text-red-600">{rejectError}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeRejectModal}
                >
                  Huỷ
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmReject}
                >
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export { StaffBookingListPage };