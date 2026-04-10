import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";

export const SettingsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý tùy chọn và cấu hình hệ thống</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
            <CardDescription>Cấu hình cơ bản của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">Tên trường đại học</Label>
              <Input id="university" defaultValue="Đại học Xuất sắc" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Học kỳ hiện tại</Label>
              <Input id="semester" defaultValue="Học kỳ Xuân 2026" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Múi giờ</Label>
              <Input id="timezone" defaultValue="UTC-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tùy chọn xếp lịch</CardTitle>
            <CardDescription>Cấu hình hành vi xếp lịch mặc định</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tự động phân phòng</Label>
                <p className="text-sm text-gray-500">Tự động phân các phòng còn trống</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo xung đột</Label>
                <p className="text-sm text-gray-500">Cảnh báo khi phát sinh xung đột lịch</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nhắc việc qua email</Label>
                <p className="text-sm text-gray-500">Gửi thông báo email cho giảng viên</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cấu hình khung giờ</CardTitle>
            <CardDescription>Thiết lập các khung giờ có thể xếp lịch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Giờ bắt đầu</Label>
                <Input id="start" type="time" defaultValue="08:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Giờ kết thúc</Label>
                <Input id="end" type="time" defaultValue="18:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Độ dài mỗi ca (phút)</Label>
              <Input id="duration" type="number" defaultValue="120" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt thông báo</CardTitle>
            <CardDescription>Quản lý tùy chọn thông báo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo trình duyệt</Label>
                <p className="text-sm text-gray-500">Hiển thị thông báo trên màn hình</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Âm thanh cảnh báo</Label>
                <p className="text-sm text-gray-500">Phát âm thanh cho sự kiện quan trọng</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Khôi phục mặc định</Button>
        <Button className="bg-blue-600 hover:bg-blue-700">Lưu thay đổi</Button>
      </div>
    </div>
  );
};
