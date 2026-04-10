import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Progress } from "../components/ui/progress";

export const AutoAssignmentPage = () => {
  const [algorithm, setAlgorithm] = useState("greedy");
  const [minimizeConflicts, setMinimizeConflicts] = useState(true);
  const [balanceUsage, setBalanceUsage] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleRunAssignment = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    setIsProcessing(false);
    setResults({
      totalAssigned: 142,
      totalConflicts: 3,
      processingTime: "2.4s",
      assignments: [
        { courseCode: "CS101", room: "A-301", status: "success" },
        { courseCode: "MATH201", room: "B-105", status: "success" },
        { courseCode: "PHY301", room: "C-201", status: "success" },
        { courseCode: "ENG102", room: "A-402", status: "conflict" },
        { courseCode: "BIO201", room: "D-103", status: "success" },
      ],
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Xếp phòng tự động</h1>
        <p className="text-gray-600 mt-1">Tự động phân phòng cho học phần bằng thuật toán tối ưu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Chọn thuật toán</Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greedy">Thuật toán tham lam</SelectItem>
                    <SelectItem value="heuristic">Tối ưu heuristic</SelectItem>
                    <SelectItem value="genetic">Thuật toán di truyền</SelectItem>
                    <SelectItem value="simulated">Luyện kim mô phỏng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Mục tiêu tối ưu</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conflicts"
                    checked={minimizeConflicts}
                    onCheckedChange={(checked) => setMinimizeConflicts(checked as boolean)}
                  />
                  <label
                    htmlFor="conflicts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Giảm thiểu xung đột
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="balance"
                    checked={balanceUsage}
                    onCheckedChange={(checked) => setBalanceUsage(checked as boolean)}
                  />
                  <label
                    htmlFor="balance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Cân bằng mức sử dụng phòng
                  </label>
                </div>
              </div>

              <Button
                onClick={handleRunAssignment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isProcessing ? "Đang xử lý..." : "Chạy xếp phòng tự động"}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Đang xử lý...</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả phân phòng</CardTitle>
            </CardHeader>
            <CardContent>
              {!results && !isProcessing && (
                <div className="text-center py-12 text-gray-500">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Chạy xếp phòng tự động để xem kết quả</p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 mt-4">Đang xử lý phân phòng...</p>
                </div>
              )}

              {results && !isProcessing && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">Tổng số đã phân</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{results.totalAssigned}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-700">Tổng số xung đột</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{results.totalConflicts}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-700">Thời gian xử lý</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{results.processingTime}</p>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Xem trước kết quả phân phòng</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Mã học phần
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Phòng được phân
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {results.assignments.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {item.courseCode}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.room}</td>
                              <td className="px-4 py-3 text-sm">
                                {item.status === "success" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Thành công
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Xung đột
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Áp dụng phân phòng
                    </Button>
                    <Button variant="outline">Xuất kết quả</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
