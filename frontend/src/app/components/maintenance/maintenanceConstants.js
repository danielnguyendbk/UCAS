import { CheckCircle, Clock3, Wrench, XCircle, Zap } from "lucide-react";

const ISSUE_CATEGORIES = [
  { value: "PROJECTOR", label: "Máy chiếu" },
  { value: "AIR_CONDITIONER", label: "Điều hòa" },
  { value: "LIGHT", label: "Đèn" },
  { value: "FAN", label: "Quạt" },
  { value: "DOOR", label: "Cửa" },
  { value: "DESK_CHAIR", label: "Bàn ghế" },
  { value: "ELECTRICAL", label: "Điện" },
  { value: "NETWORK", label: "Mạng" },
  { value: "CLEANLINESS", label: "Vệ sinh" },
  { value: "OTHER", label: "Khác" },
];

const SEVERITY_LEVELS = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Bình thường" },
  { value: "HIGH", label: "Khẩn" },
  { value: "URGENT", label: "Rất khẩn" },
];

const STATUS_CONFIG = {
  PENDING: {
    label: "Chờ tiếp nhận",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock3,
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Zap,
  },
  RESOLVED: {
    label: "Đã hoàn thành",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

const DEFAULT_STATUS = {
  label: "Không rõ",
  className: "bg-gray-100 text-gray-700 border-gray-200",
  icon: Wrench,
};

const categoryLabel = (value) =>
  ISSUE_CATEGORIES.find((item) => item.value === value)?.label || value || "-";

const severityLabel = (value) =>
  SEVERITY_LEVELS.find((item) => item.value === value)?.label || value || "-";

const statusConfig = (value) => STATUS_CONFIG[value] || DEFAULT_STATUS;

export {
  ISSUE_CATEGORIES,
  SEVERITY_LEVELS,
  categoryLabel,
  severityLabel,
  statusConfig,
};
