const STORAGE_KEY = "csms_user";
const resolveUserFromEmail = (email) => {
  const e = email.toLowerCase();
  if (e.includes("admin01")) {
    return { role: "Admin", name: "Quản trị viên 01", department: "Quản trị", code: "ADM01" };
  }
  if (e.includes("staff01") || e.includes("pgv01")) {
    return { role: "Staff", name: "Giáo vụ 01", department: "Phòng Đào tạo", code: "PGV01" };
  }
  if (e.includes("lecturer01") || e.includes("gv01")) {
    return { role: "Lecturer", name: "Giảng viên 01", department: "Khoa CNTT", code: "GV01" };
  }
  if (e.includes("employee01") || e.includes("nv01")) {
    return { role: "Employee", name: "Nhân viên 01", department: "Phòng Thiết bị", code: "NV01" };
  }
  if (e.includes("student01") || e.includes("sv01")) {
    return { role: "Student", name: "Sinh viên 01", department: "Khoa CNTT", code: "SV01" };
  }

  // Fallback for previous logic
  if (e.includes("lecturer") || e.includes("gv")) {
    return { role: "Lecturer", name: "Giảng viên Test", department: "Khoa CNTT", code: "GV001" };
  }
  if (e.includes("employee") || e.includes("nv")) {
    return { role: "Employee", name: "Nhân viên Test", department: "Phòng Thiết bị", code: "NV01" };
  }
  if (e.includes("student") || e.includes("sv")) {
    return { role: "Student", name: "Sinh viên Test", department: "Khoa CNTT", code: "SV01" };
  }
  if (e.includes("staff")) {
    return { role: "Staff", name: "Giáo vụ Test", department: "Phòng Đào tạo", code: "PGV01" };
  }
  return { role: "Admin", name: "Admin Test", department: "Quản trị", code: "ADM01" };
};
const authService = {
  async login(payload) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const profile = resolveUserFromEmail(payload.email);
    return {
      id: "1",
      email: payload.email,
      ...profile
    };
  },
  persistUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },
  getPersistedUser() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};
export {
  authService
};
