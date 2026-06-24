# Timetable import samples

- `01_import_unassigned_new_schedules.xlsx`: apply bằng `MERGE_ONLY`. File không chỉ định phòng nên schedule mới được tạo ở trạng thái `UNASSIGNED`.
- `02_import_change_time_sync_scope.xlsx`: apply sau file 01 bằng `SYNC_FILE_SCOPE`. File dùng cùng học phần nhưng đổi ngày/tiết; schedule cũ được soft-cancel và schedule mới không phòng được tạo ở trạng thái `UNASSIGNED`.

Cả hai file dùng dữ liệu seed `HK2-2025-2026`, môn `INT101`, giảng viên `GV001`. Sau apply, kiểm tra `/admin/sections`; Staff xử lý lịch chưa phân phòng tại `/staff/auto-assignment?tab=pending`.

Không dùng file 02 với `MERGE_ONLY` nếu mục tiêu là thay thế lịch cũ, vì chế độ đó chủ động giữ mọi lịch không có trong file.
