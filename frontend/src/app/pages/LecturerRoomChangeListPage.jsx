import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { getStatusConfig, loadRoomChangeRequests } from "@/utils/roomChangeRequests";

const CURRENT_LECTURER_ID = "GV001";

const LecturerRoomChangeListPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const refreshData = () => {
    const all = loadRoomChangeRequests();
    setRequests(
      all.filter(
        (item) => item.requesterRole === "lecturer" && item.lecturerId === CURRENT_LECTURER_ID
      )
    );
  };

  useEffect(() => {
    refreshData();
  }, []);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => (a.id < b.id ? 1 : -1));
  }, [requests]);

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trang thai don xin doi phong</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chi hien thi don cua giang vien hien tai ({CURRENT_LECTURER_ID})</p>
        </div>
        <Button variant="outline" className="text-sm" onClick={refreshData}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Lam moi
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sortedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-gray-500">Chua co don xin doi phong nao</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Ma yeu cau</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ma GV</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Lop hoc phan</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Mon hoc</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phong hien tai</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phong muon doi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ngay</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ca hoc</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Trang thai</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ngay tao</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.map((item) => {
                  const cfg = getStatusConfig(item.status);
                  const StatusIcon = cfg.icon;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-mono text-xs font-bold text-blue-700">{item.id}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.lecturerId}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900">{item.sectionCode}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.courseName}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.currentRoom}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.requestedRoom}</TableCell>
                      <TableCell className="text-xs text-gray-700 whitespace-nowrap">{item.date}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.slot}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${cfg.className} gap-1 text-[11px]`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{item.created}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => {
                            setSelectedRequest(item);
                            setShowDetailModal(true);
                          }}
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
                <p className="text-sm text-gray-800">{selectedRequest.requester}</p>
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

              {selectedRequest.status === "rejected" && !!selectedRequest.rejectReason && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Ly do tu choi</p>
                  <p className="text-sm text-red-600">{selectedRequest.rejectReason}</p>
                </div>
              )}

              {selectedRequest.status === "approved" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Thong tin phe duyet</p>
                  <p className="text-sm text-green-700">
                    {selectedRequest.approver || "-"}
                    {selectedRequest.processedAt ? ` - ${selectedRequest.processedAt}` : ""}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export { LecturerRoomChangeListPage };
