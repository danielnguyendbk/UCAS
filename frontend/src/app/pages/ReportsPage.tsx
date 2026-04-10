import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";

const reports = [
  {
    id: 1,
    title: "Báo cáo sử dụng phòng theo tuần",
    description: "Phân tích chi tiết mức sử dụng phòng học trong tuần hiện tại",
    icon: TrendingUp,
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Tổng hợp xếp lịch theo tháng",
    description: "Tổng quan các lớp đã xếp lịch và phân phòng trong tháng",
    icon: Calendar,
    color: "bg-green-500",
  },
  {
    id: 3,
    title: "Báo cáo xử lý xung đột",
    description: "Danh sách xung đột lịch và lịch sử xử lý",
    icon: FileText,
    color: "bg-red-500",
  },
  {
    id: 4,
    title: "Phân tích tải giảng dạy giảng viên",
    description: "Số giờ dạy và phân bổ học phần theo từng giảng viên",
    icon: TrendingUp,
    color: "bg-purple-500",
  },
];

export const ReportsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Báo cáo</h1>
        <p className="text-gray-600 mt-1">Tạo và tải xuống các báo cáo hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Xem trước
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
