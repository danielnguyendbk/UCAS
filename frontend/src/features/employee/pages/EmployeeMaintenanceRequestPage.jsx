import { useState } from "react";
import { CheckCircle, Wrench, Send, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Button } from "../../../app/components/ui/button";
import { Input } from "../../../app/components/ui/input";
import { Label } from "../../../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../app/components/ui/select";

const EmployeeMaintenanceRequestPage = () => {
  const [form, setForm] = useState({ type: "", location: "", description: "", urgency: "normal" });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.type) errs.type = "Vui lòng chọn loại sự cố";
    if (!form.location.trim()) errs.location = "Vui lòng nhập vị trí/phòng";
    if (!form.description.trim()) errs.description = "Vui lòng nhập mô tả sự cố";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm({ type: "", location: "", description: "", urgency: "normal" });
      setAttachments([]);
    }, 1200);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }))]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Yêu cầu sửa chữa</h1>
        <p className="text-sm text-gray-500 mt-0.5">Báo cáo sự cố cơ sở vật chất cho đơn vị bảo trì</p>
      </div>

      {submitted && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Yêu cầu đã được gửi thành công!</p>
            <p className="text-xs text-green-700 mt-0.5">Mã yêu cầu: YC-EMP-501. Đội kỹ thuật sẽ tiếp nhận xử lý sớm.</p>
            <Button variant="outline" size="sm" className="mt-2 text-xs border-green-200 hover:bg-green-100" onClick={() => setSubmitted(false)}>Tạo yêu cầu mới</Button>
          </div>
        </div>
      )}

      <div className="max-w-2xl">
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              Mẫu yêu cầu sửa chữa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Loại sự cố <span className="text-red-500">*</span></Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger className={`h-9 text-sm ${errors.type ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Điện</SelectItem>
                      <SelectItem value="plumbing">Nước</SelectItem>
                      <SelectItem value="furniture">Nội thất</SelectItem>
                      <SelectItem value="equipment">Thiết bị</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Độ ưu tiên</Label>
                  <Select value={form.urgency} onValueChange={(v) => setForm((f) => ({ ...f, urgency: v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Bình thường</SelectItem>
                      <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      <SelectItem value="emergency">Cấp cứu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-700">Vị trí / Phòng <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="VD: A-201, Hành lang tòa B..."
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className={`h-9 text-sm ${errors.location ? "border-red-400" : ""}`}
                  />
                  {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Mô tả chi tiết <span className="text-red-500">*</span></Label>
                <textarea
                  placeholder="Mô tả sự cố để kỹ thuật viên nắm bắt thông tin..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">Minh chứng ảnh/đối tượng</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Nhấp để tải tập tin lên</p>
                    </div>
                    <input type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,video/*" />
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map(a => (
                      <div key={a.id} className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-[10px] border border-gray-200">
                        <span className="truncate max-w-[120px]">{a.file.name}</span>
                        <button type="button" onClick={() => removeAttachment(a.id)} className="text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-sm gap-2" disabled={submitting}>
                  {submitting ? "Đang gửi..." : <><Send className="w-4 h-4" /> Gửi yêu cầu</>}
                </Button>
                <Button type="button" variant="outline" className="text-sm" onClick={() => setForm({ type: "", location: "", description: "", urgency: "normal" })}>
                  Xóa form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeMaintenanceRequestPage;
