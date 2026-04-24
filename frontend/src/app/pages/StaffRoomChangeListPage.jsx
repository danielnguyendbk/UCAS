import { useEffect, useMemo, useState } from "react";
import { Eye, X, Calendar, Layers, Clock, Search, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  getStatusConfig,
  loadRoomChangeRequests,
  saveRoomChangeRequests,
  toDateTimeVN
} from "@/utils/roomChangeRequests";

const StaffRoomChangeListPage = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState(null); // null, 'valid', 'conflict'
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectRequestId, setRejectRequestId] = useState(null);

  useEffect(() => {
    setRequests(loadRoomChangeRequests());
  }, []);

  useEffect(() => {
    if (requests.length > 0) {
      saveRoomChangeRequests(requests);
    }
  }, [requests]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === "pending"),
    [requests]
  );

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
    setConflictResult(null);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectRequestId(null);
    setRejectReason("");
    setRejectError("");
  };

  const handleApprove = (requestId) => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "approved",
              rejectReason: "",
              approver: "STAFF",
              processedAt: toDateTimeVN()
            }
          : item
      )
    );

    closeRejectModal();
    closeDetailModal();
  };

  const handleReject = (requestId) => {
    setRejectRequestId(requestId);
    setRejectReason("");
    setRejectError("");
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError("Vui long nhap ly do tu choi");
      return;
    }

    setRequests((prev) =>
      prev.map((item) =>
        item.id === rejectRequestId
          ? {
              ...item,
              status: "rejected",
              rejectReason: rejectReason.trim(),
              approver: "STAFF",
              processedAt: toDateTimeVN()
            }
          : item
      )
    );

    closeRejectModal();
    closeDetailModal();
  };

  const showDetails = (item) => {
    setSelectedRequest(item);
    setShowDetailModal(true);
    setConflictResult(null);
  };

  const handleCheckConflict = () => {
    setCheckingConflict(true);
    setConflictResult(null);
    setTimeout(() => {
      setCheckingConflict(false);
      // Simulate conflict check across the scope
      // Example: RCR-2026-001 has conflict
      setConflictResult(selectedRequest.id === 'RCR-2026-001' ? 'conflict' : 'valid');
    }, 1800);
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Danh sach don xin doi phong</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quan ly va phe duyet don xin doi phong cua giang vien</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { key: "list", label: `Danh sach don doi phong (${requests.length})` },
          { key: "approve", label: `Duyet yeu cau (${pendingRequests.length})` }
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
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-500">Chua co don xin doi phong</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Ma yeu cau</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Nguoi gui</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Vai tro</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ma GV</TableHead>
                     <TableHead className="text-xs font-semibold text-gray-600">Lop HP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phạm vi</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phong hien tai</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phong muon doi</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Thời gian</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Trang thai</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Thao tac</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {requests.map((item) => {
                    const cfg = getStatusConfig(item.status);
                    const StatusIcon = cfg.icon;

                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="font-mono text-xs font-bold text-blue-700">{item.id}</TableCell>
                        <TableCell className="text-xs text-gray-700">{item.requester}</TableCell>
                        <TableCell className="text-xs text-gray-700 uppercase">{item.requesterRole}</TableCell>
                        <TableCell className="text-xs text-gray-700">{item.lecturerId}</TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900">{item.sectionCode}</TableCell>
                        <TableCell className="text-center">
                          {item.scope === 'session' && <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> Buổi</Badge>}
                          {item.scope === 'weeks' && <Badge variant="outline" className="text-[10px] gap-1 border-blue-200 text-blue-700 bg-blue-50"><Calendar className="w-3 h-3" /> Tuần</Badge>}
                          {item.scope === 'semester' && <Badge variant="outline" className="text-[10px] gap-1 border-purple-200 text-purple-700 bg-purple-50"><Layers className="w-3 h-3" /> Kì</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-700">{item.currentRoom}</TableCell>
                        <TableCell className="text-xs text-gray-700">{item.requestedRoom}</TableCell>
                        <TableCell className="text-xs text-gray-700 whitespace-nowrap">
                          {item.scope === 'session' ? `${item.date} (${item.slot})` : `Tuần ${item.fromWeek} - ${item.toWeek || 'Hết học kỳ'}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${cfg.className} gap-1 text-[11px]`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => showDetails(item)}
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
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-500">Khong co don cho duyet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Ma yeu cau</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Nguoi gui</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Lop HP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phạm vi</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phong hien tai</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phong muon doi</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Thời gian</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Thao tac</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pendingRequests.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-mono text-xs font-bold text-blue-700">{item.id}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.requester}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900">{item.sectionCode}</TableCell>
                      <TableCell className="text-center">
                        {item.scope === 'session' && <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> Buổi</Badge>}
                        {item.scope === 'weeks' && <Badge variant="outline" className="text-[10px] gap-1 border-blue-200 text-blue-700 bg-blue-50"><Calendar className="w-3 h-3" /> Tuần</Badge>}
                        {item.scope === 'semester' && <Badge variant="outline" className="text-[10px] gap-1 border-purple-200 text-purple-700 bg-purple-50"><Layers className="w-3 h-3" /> Kì</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{item.currentRoom}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.requestedRoom}</TableCell>
                      <TableCell className="text-xs text-gray-700 whitespace-nowrap">
                        {item.scope === 'session' ? `${item.date} (${item.slot})` : `Tuần ${item.fromWeek} - ${item.toWeek || 'Hết học kỳ'}`}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs flex items-center gap-1"
                            onClick={() => showDetails(item)}
                          >
                            <Search className="w-3 h-3" /> Kiểm tra
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            className="h-7 px-3 bg-green-600 hover:bg-green-700 text-xs"
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReject(item.id)}
                            variant="destructive"
                            className="h-7 px-3 text-xs"
                          >
                            Tu choi
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

      {showDetailModal && selectedRequest && (
        <Dialog
          open={showDetailModal}
          onOpenChange={(open) => {
            if (!open) closeDetailModal();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Chi tiet don <span className="text-blue-600">{selectedRequest.id}</span>
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
                <p className="text-xs font-semibold text-gray-500 uppercase">Nguoi gui</p>
                <p className="text-sm text-gray-800">{selectedRequest.requester} ({selectedRequest.lecturerId})</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Lop hoc phan / Mon hoc</p>
                <p className="text-sm text-gray-800">{selectedRequest.sectionCode} - {selectedRequest.courseName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Doi phong</p>
                <p className="text-sm text-gray-800">{selectedRequest.currentRoom} {"->"} {selectedRequest.requestedRoom}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ngay / Ca hoc</p>
                <p className="text-sm text-gray-800">{selectedRequest.date} - {selectedRequest.slot}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ly do</p>
                <p className="text-sm text-gray-800">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.status === "rejected" && selectedRequest.rejectReason && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Ly do tu choi</p>
                  <p className="text-sm text-red-600">{selectedRequest.rejectReason}</p>
                </div>
              )}

              {selectedRequest.status === "approved" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Thong tin duyet</p>
                  <p className="text-sm text-green-700">
                    {selectedRequest.approver || "-"}
                    {selectedRequest.processedAt ? ` - ${selectedRequest.processedAt}` : ""}
                  </p>
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
                  {checkingConflict ? "Đang rà soát phòng trên toàn bộ phạm vi..." : "Kiểm tra xung đột lịch"}
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
                        {conflictResult === 'valid' ? "PHÒNG TRỐNG TOÀN THỜI GIAN" : "CÓ XUNG ĐỘT LỊCH"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {conflictResult === 'valid' 
                          ? "Yêu cầu hợp lệ. Phòng này trống trong tất cả các mốc thời gian thuộc phạm vi áp dụng."
                          : "Phát hiện xung đột lịch tại một hoặc một số tuần trong phạm vi đã chọn."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeTab === "approve" && selectedRequest.status === "pending" && (
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                >
                  Phe duyet
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest.id)}
                  variant="destructive"
                  className="flex-1 text-sm"
                >
                  Tu choi
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
              <DialogTitle>Nhap ly do tu choi</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">
                  Ly do tu choi <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                  placeholder="Nhap ly do tu choi yeu cau nay..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
                {rejectError && <p className="text-xs text-red-600">{rejectError}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={closeRejectModal}>
                  Huy
                </Button>
                <Button variant="destructive" className="flex-1" onClick={confirmReject}>
                  Xac nhan tu choi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export { StaffRoomChangeListPage };
