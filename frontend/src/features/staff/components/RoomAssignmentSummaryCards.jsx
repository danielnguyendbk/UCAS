import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";

const toneStyles = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
};

const SummaryCard = ({ label, value, icon: Icon, tone = "blue" }) => (
  <Card className="rounded-xl border-gray-200 shadow-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneStyles[tone]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export const RoomAssignmentSummaryCards = ({
  total,
  assigned,
  unassigned,
  conflicts,
  canSubmit,
}) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <SummaryCard
      label="Tổng lịch"
      value={total}
      icon={ClipboardList}
      tone="blue"
    />
    <SummaryCard
      label="Đã phân phòng"
      value={assigned}
      icon={CheckCircle2}
      tone="green"
    />
    <SummaryCard
      label="Chưa phân phòng"
      value={unassigned}
      icon={Building2}
      tone="orange"
    />
    <SummaryCard
      label="Xung đột"
      value={conflicts}
      icon={AlertTriangle}
      tone="red"
    />
    <SummaryCard
      label="Có thể gửi duyệt?"
      value={canSubmit ? "Có" : "Không"}
      icon={Send}
      tone={canSubmit ? "green" : "purple"}
    />
  </div>
);
