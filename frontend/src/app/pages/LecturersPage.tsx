import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Search, Plus, Mail, Phone } from "lucide-react";
import { useState } from "react";

const lecturers = [
  { id: 1, name: "TS. Sarah Johnson", department: "Công nghệ thông tin", email: "sjohnson@university.edu", phone: "+1 234-567-8901", courses: 3, status: "Đang hoạt động" },
  { id: 2, name: "PGS. Michael Chen", department: "Toán học", email: "mchen@university.edu", phone: "+1 234-567-8902", courses: 4, status: "Đang hoạt động" },
  { id: 3, name: "TS. Emily Brown", department: "Vật lý", email: "ebrown@university.edu", phone: "+1 234-567-8903", courses: 2, status: "Đang hoạt động" },
  { id: 4, name: "TS. Robert Lee", department: "Tiếng Anh", email: "rlee@university.edu", phone: "+1 234-567-8904", courses: 3, status: "Đang hoạt động" },
  { id: 5, name: "TS. Amanda White", department: "Sinh học", email: "awhite@university.edu", phone: "+1 234-567-8905", courses: 2, status: "Đang hoạt động" },
  { id: 6, name: "PGS. David Kim", department: "Hóa học", email: "dkim@university.edu", phone: "+1 234-567-8906", courses: 3, status: "Đang hoạt động" },
];

export const LecturersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLecturers = lecturers.filter(
    (lecturer) =>
      lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecturer.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Giảng viên</h1>
          <p className="text-gray-600 mt-1">Quản lý danh sách giảng viên và nhân sự giảng dạy</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Thêm giảng viên
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Tìm kiếm giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLecturers.map((lecturer) => (
          <Card key={lecturer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{lecturer.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{lecturer.department}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {lecturer.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{lecturer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{lecturer.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Học phần đang phụ trách</span>
                  <span className="text-lg font-semibold text-gray-900">{lecturer.courses}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Lịch dạy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
