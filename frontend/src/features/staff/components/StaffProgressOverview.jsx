import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/common/Card";

const StaffProgressOverview = ({ progress, semesterName }) => {
  const total = progress?.total || 0;
  const assigned = progress?.assigned || 0;
  const pending = progress?.pending || 0;
  const conflicts = progress?.conflicts || 0;
  const percent = Math.min(Math.max(progress?.percent || 0, 0), 100);
  const displayPercent = Number.isInteger(percent) ? percent : percent.toFixed(1);

  return (
    <Card className="shadow-sm border-0 ring-1 ring-gray-200">
      <CardContent className="p-5">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">
              Tiến độ phân phòng {semesterName || "học kỳ active"}
            </span>
          </div>
          <span className="text-sm font-bold text-blue-700">
            {assigned} / {total} lớp ({displayPercent}%)
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Đã phân: {assigned}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
            Chờ phân: {pending}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            Xung đột: {conflicts}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export {
  StaffProgressOverview
};
