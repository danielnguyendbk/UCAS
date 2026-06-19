import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { httpClient } from "@/services/httpClient";

const reports = [
  {
    id: "weekly-room-utilization",
    title: "Báo cáo sử dụng phòng theo tuần",
    description: "Phân tích số buổi và số giờ sử dụng của từng phòng theo ngày trong tuần",
    icon: TrendingUp,
    color: "bg-blue-500",
  },
  {
    id: "monthly-scheduling-summary",
    title: "Tổng hợp lịch học",
    description: "Danh sách lớp học phần, phòng học, giảng viên, tiết học và tuần học đã xếp lịch",
    icon: Calendar,
    color: "bg-green-500",
  },
  {
    id: "conflict-resolution",
    title: "Báo cáo xung đột lịch phòng",
    description: "Phát hiện các lịch bị trùng phòng, trùng tiết và giao tuần học",
    icon: FileText,
    color: "bg-red-500",
  },
  {
    id: "lecturer-workload",
    title: "Báo cáo khối lượng giảng dạy",
    description: "Tổng hợp số lớp học phần, số buổi và số giờ giảng dạy của từng giảng viên",
    icon: TrendingUp,
    color: "bg-purple-500",
  },
];

const getPayload = (response) => response?.data?.data || response?.data || {};

const getFileNameFromHeader = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replaceAll('"', ""));
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return fallback;
};

const ReportsPage = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoadingId, setDownloadLoadingId] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePreview = async (report) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    setErrorMessage("");

    try {
      const response = await httpClient.get(
        `/api/admin/reports/${report.id}/preview`,
      );

      setPreviewData(getPayload(response));
    } catch (error) {
      console.error("Không tạo được preview báo cáo:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không tạo được preview báo cáo. Vui lòng kiểm tra backend.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (report) => {
    setDownloadLoadingId(report.id);
    setErrorMessage("");

    try {
      const response = await httpClient.get(
        `/api/admin/reports/${report.id}/download`,
        {
          responseType: "blob",
        },
      );

      const fallbackName = `${report.id}.csv`;
      const fileName = getFileNameFromHeader(
        response.headers?.["content-disposition"],
        fallbackName,
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Không tải được báo cáo:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không tải được báo cáo. Vui lòng kiểm tra backend.",
      );
    } finally {
      setDownloadLoadingId("");
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewData(null);
    setErrorMessage("");
  };

  const columns = previewData?.columns || [];
  const rows = previewData?.rows || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Báo cáo</h1>
        <p className="text-gray-600 mt-1">
          Xem trước và tải xuống các báo cáo hệ thống
        </p>
      </div>

      {errorMessage && !previewOpen && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloadLoadingId === report.id;

          return (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePreview(report)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Xem trước
                  </Button>

                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleDownload(report)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isDownloading ? "Đang tải..." : "Tải xuống"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {previewData?.title || "Xem trước báo cáo"}
                </h2>
                <p className="text-sm text-gray-500">
                  {previewData?.totalRows !== undefined
                    ? `Tổng số dòng: ${previewData.totalRows}`
                    : "Đang tải dữ liệu báo cáo"}
                </p>
              </div>

              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tạo preview báo cáo...
                </div>
              ) : errorMessage ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              ) : rows.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 bg-white">
                      {rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {columns.map((column) => (
                            <td
                              key={column.key}
                              className="whitespace-nowrap px-4 py-3 text-xs text-gray-700"
                            >
                              {row?.[column.key] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-sm text-gray-500">
                  Báo cáo này hiện chưa có dữ liệu.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ReportsPage };
export default ReportsPage;