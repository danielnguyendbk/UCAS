import { useRef, useState } from "react";
import {
  downloadClassroomImportTemplate,
  downloadCourseImportTemplate,
  downloadFacilityStaffImportTemplate,
  downloadLecturerImportTemplate,
  importClassroomsExcel,
  importCoursesExcel,
  importFacilityStaffExcel,
  importLecturersExcel,
} from "../services/personnelImportService";

const TYPE_CONFIG = {
  lecturer: {
    templateAction: downloadLecturerImportTemplate,
    importAction: importLecturersExcel,
    label: "giảng viên",
  },
  facilityStaff: {
    templateAction: downloadFacilityStaffImportTemplate,
    importAction: importFacilityStaffExcel,
    label: "nhân viên CSVC",
  },
  classroom: {
    templateAction: downloadClassroomImportTemplate,
    importAction: importClassroomsExcel,
    label: "phòng học",
  },
  course: {
    templateAction: downloadCourseImportTemplate,
    importAction: importCoursesExcel,
    label: "môn học",
  },
};

function buildResultText(result) {
  const data = result?.data || {};
  const importedCount = data.importedCount ?? 0;
  const errorCount = data.errorCount ?? 0;

  if (!errorCount) {
    return `Import thành công ${importedCount} dòng.`;
  }

  const firstErrors = (data.errors || [])
    .slice(0, 5)
    .map((item) => `Dòng ${item.row}: ${(item.errors || []).join(", ")}`)
    .join("\n");

  return `Import hoàn tất nhưng có lỗi. Thành công: ${importedCount}, lỗi: ${errorCount}.\n${firstErrors}`;
}

export default function ExcelImportActions({ type = "lecturer", onImported }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.lecturer;
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const handleDownloadTemplate = async () => {
    setLoading(true);
    clearFeedback();

    try {
      await config.templateAction();
      setMessage("Đã tải file mẫu Excel.");
    } catch (err) {
      setError(err?.message || "Không tải được file mẫu Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = () => {
    if (loading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setLoading(true);
    clearFeedback();

    try {
      const result = await config.importAction(file);
      const text = buildResultText(result);

      if (result?.success) {
        setMessage(text);
      } else {
        setError(text);
      }

      onImported?.(result);
    } catch (err) {
      setError(err?.message || "Import Excel thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          title={`Tải file mẫu import ${config.label}`}
        >
          {loading ? "Đang xử lý..." : "Tải file mẫu"}
        </button>

        <button
          type="button"
          onClick={handleSelectFile}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          title={`Import danh sách ${config.label} từ Excel`}
        >
          {loading ? "Đang xử lý..." : "Import Excel"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {message && (
        <div className="max-w-md rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 shadow-sm whitespace-pre-wrap">
          {message}
        </div>
      )}

      {error && (
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm whitespace-pre-wrap">
          {error}
        </div>
      )}
    </div>
  );
}