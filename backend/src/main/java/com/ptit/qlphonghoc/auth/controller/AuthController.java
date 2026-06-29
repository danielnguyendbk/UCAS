package com.ptit.qlphonghoc.auth.controller;

import com.ptit.qlphonghoc.auth.dto.ChangePasswordRequest;
import com.ptit.qlphonghoc.auth.dto.CurrentUserResponse;
import com.ptit.qlphonghoc.auth.dto.ForgotPasswordRequest;
import com.ptit.qlphonghoc.auth.dto.LoginRequest;
import com.ptit.qlphonghoc.auth.dto.LoginResponse;
import com.ptit.qlphonghoc.auth.dto.ResetPasswordRequest;
import com.ptit.qlphonghoc.auth.dto.UpdateProfileRequest;
import com.ptit.qlphonghoc.auth.dto.UserSummaryResponse;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.auth.service.AuthService;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                            HttpServletRequest httpRequest) {
        return ApiResponse.success("Đăng nhập thành công", authService.login(request, httpRequest));
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success("Người dùng hiện tại",
                authService.getCurrentUser(userDetails.getUsername()));
    }

    @PutMapping("/me")
    public ApiResponse<UserSummaryResponse> updateMe(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                     @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success("Cập nhật thông tin người dùng thành công",
                authService.updateCurrentUser(userDetails.getUsername(), request));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                            @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ApiResponse.success("Đổi mật khẩu thành công.", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.success("Link cập nhật mật khẩu đã gửi đến email người dùng.", null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }
}
