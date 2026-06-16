import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "../hooks/useAuth";
import { httpClient } from "@/services/httpClient";

const LOGIN_ERROR_STORAGE_KEY = "ucas_login_error";

const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    return sessionStorage.getItem(LOGIN_ERROR_STORAGE_KEY) || "";
  });

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const showLoginError = (message) => {
    setError(message);
    sessionStorage.setItem(LOGIN_ERROR_STORAGE_KEY, message);
  };

  const clearLoginError = () => {
    setError("");
    sessionStorage.removeItem(LOGIN_ERROR_STORAGE_KEY);
  };

  useEffect(() => {
    const tokenFromUrl = searchParams.get("resetToken");

    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setResetForm({
        newPassword: "",
        confirmPassword: "",
      });
      setResetError("");
      setResetSuccess("");
      setIsResetOpen(true);
    }
  }, [searchParams]);

  const getLoginErrorMessage = (loginError) => {
    const statusCode = loginError?.response?.status;
    const backendMessage = loginError?.response?.data?.message;

    if (statusCode === 403) {
      return (
        backendMessage ||
        "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ."
      );
    }

    if (statusCode === 401) {
      return backendMessage || "Sai tài khoản hoặc mật khẩu.";
    }

    if (statusCode === 400) {
      return backendMessage || "Vui lòng nhập đầy đủ thông tin đăng nhập.";
    }

    return (
      backendMessage ||
      "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearLoginError();

    if (!username.trim() || !password.trim()) {
      showLoginError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login(username.trim(), password.trim());

      clearLoginError();
      navigate(loggedInUser.redirectPath);
    } catch (loginError) {
      showLoginError(getLoginErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  const openForgotDialog = () => {
    setForgotEmail("");
    setForgotError("");
    setForgotSuccess("");
    setIsForgotOpen(true);
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập email tài khoản.");
      setForgotSuccess("");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const response = await httpClient.post("/api/auth/forgot-password", {
        email: forgotEmail.trim(),
      });

      setForgotSuccess(
        response?.data?.message ||
          "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.",
      );
    } catch (forgotErrorResponse) {
      setForgotError(
        forgotErrorResponse?.response?.data?.data ||
          forgotErrorResponse?.response?.data?.message ||
          "Không gửi được email đặt lại mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!resetToken) {
      setResetError("Token đặt lại mật khẩu không hợp lệ.");
      setResetSuccess("");
      return;
    }

    if (!resetForm.newPassword || !resetForm.confirmPassword) {
      setResetError("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");
      setResetSuccess("");
      return;
    }

    if (resetForm.newPassword.length < 6) {
      setResetError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setResetSuccess("");
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError("Xác nhận mật khẩu mới không khớp.");
      setResetSuccess("");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const response = await httpClient.post("/api/auth/reset-password", {
        token: resetToken,
        newPassword: resetForm.newPassword,
        confirmPassword: resetForm.confirmPassword,
      });

      setResetSuccess(
        response?.data?.message ||
          "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
      );

      setResetForm({
        newPassword: "",
        confirmPassword: "",
      });

      setSearchParams({});
    } catch (resetErrorResponse) {
      setResetError(
        resetErrorResponse?.response?.data?.message ||
          "Không đặt lại được mật khẩu. Liên kết có thể đã hết hạn.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetDialog = () => {
    setIsResetOpen(false);
    setResetToken("");
    setResetError("");
    setResetSuccess("");
    setResetForm({
      newPassword: "",
      confirmPassword: "",
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="w-full max-w-4xl relative flex gap-6">
        <div className="hidden lg:flex flex-col justify-center flex-1 text-white pr-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Hệ thống Quản lý</h1>
          <h2 className="text-2xl font-semibold text-blue-200 mb-4">
            Phòng học & Thời khóa biểu
          </h2>

          <p className="text-blue-200 leading-relaxed">
            Nền tảng quản lý phân công phòng học, thời khóa biểu và lịch học
            cho toàn bộ trường đại học, tích hợp đa vai trò, thời gian thực và
            thân thiện người dùng.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              "48 Phòng học",
              "156 Môn học",
              "892 Tiết học/tuần",
              "5 Vai trò",
            ].map((item) => (
              <div key={item} className="bg-white/10 rounded-xl p-3 backdrop-blur">
                <p className="text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-[420px] bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 lg:hidden">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-xl font-bold text-gray-900 text-center">
              Đăng nhập hệ thống
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              CSMS — University Scheduling System
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={clearLoginError}
                className="rounded p-0.5 text-red-400 hover:bg-red-100 hover:text-red-700"
                aria-label="Đóng thông báo lỗi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                }}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mật khẩu
              </label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                  className="h-11 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={openForgotDialog}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-medium"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>

      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Quên mật khẩu
                </h2>
                <p className="text-sm text-gray-500">
                  Nhập email tài khoản để nhận liên kết đặt lại mật khẩu
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4 px-6 py-5">
              {forgotError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => {
                      setForgotEmail(event.target.value);
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                    className="w-full rounded-xl border border-gray-200 px-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhập email tài khoản"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  disabled={forgotLoading}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Đang gửi..." : "Gửi link đặt lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Đặt lại mật khẩu
                </h2>
                <p className="text-sm text-gray-500">
                  Tạo mật khẩu mới cho tài khoản của bạn
                </p>
              </div>

              <button
                type="button"
                onClick={closeResetDialog}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 px-6 py-5">
              {resetError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(event) => {
                      setResetForm((previous) => ({
                        ...previous,
                        newPassword: event.target.value,
                      }));
                      setResetError("");
                    }}
                    className="w-full rounded-xl border border-gray-200 px-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(event) => {
                    setResetForm((previous) => ({
                      ...previous,
                      confirmPassword: event.target.value,
                    }));
                    setResetError("");
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeResetDialog}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  disabled={resetLoading}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Đang lưu..." : "Đặt lại mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { LoginPage };