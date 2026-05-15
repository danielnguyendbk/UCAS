import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";

const severityConfig = {
  HIGH: {
    label: "Nghiêm trọng",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  MEDIUM: {
    label: "Trung bình",
    className: "bg-orange-100 text-orange-700",
    icon: AlertTriangle,
  },
  LOW: {
    label: "Thấp",
    className: "bg-yellow-100 text-yellow-700",
    icon: Info,
  },
};

const typeConfig = {
  ROOM_CONFLICT: {
    label: "Trùng phòng",
    color: "bg-red-50 text-red-600 border-red-200",
  },
  LECTURER_CONFLICT: {
    label: "Trùng GV",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  CAPACITY_EXCEEDED: {
    label: "Quá sức chứa",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  UNASSIGNED: {
    label: "Chưa phân phòng",
    color: "bg-gray-100 text-gray-600 border-gray-300",
  },
};

export const ConflictList = ({ conflicts, isLoading }) => {
  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
        <p className="font-semibold text-gray-700">Không phát hiện xung đột</p>
        <p className="text-sm text-gray-400 mt-1">
          Toàn bộ lịch phân phòng hợp lệ hoặc chưa được phân.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conflicts.map((c, index) => {
        const sev = severityConfig[c.severity] || severityConfig.MEDIUM;
        const SevIcon = sev.icon;
        const typeInfo = typeConfig[c.conflictType] || typeConfig.UNASSIGNED;

        return (
          <Card
            key={index}
            className={`shadow-sm border ring-1 ${c.severity === "HIGH" ? "ring-red-200" : "ring-orange-200"}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.severity === "HIGH" ? "bg-red-100" : "bg-orange-100"}`}
                >
                  <SevIcon
                    className={`w-5 h-5 ${c.severity === "HIGH" ? "text-red-600" : "text-orange-600"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge
                      className={`${sev.className} hover:${sev.className} text-xs`}
                    >
                      {sev.label}
                    </Badge>
                    <span
                      className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {c.dayOfWeek} · Ca {c.slotNumber}
                    </span>
                    {c.roomCode && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Phòng {c.roomCode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{c.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-100">
                      <span className="font-semibold text-gray-800">
                        Lớp bị ảnh hưởng:
                      </span>{" "}
                      {c.sectionCode} - {c.courseName}
                    </div>
                    {c.conflictingWith && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-100">
                        <span className="font-semibold text-gray-800">
                          Xung đột với:
                        </span>{" "}
                        {c.conflictingWith}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
