package com.ptit.qlphonghoc.auth.controller;

import com.ptit.qlphonghoc.auth.dto.CurrentUserResponse;
import com.ptit.qlphonghoc.auth.dto.LoginRequest;
import com.ptit.qlphonghoc.auth.dto.LoginResponse;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.auth.service.AuthService;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
        return ApiResponse.success("Login successful", authService.login(request, httpRequest));
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success("Current user fetched successfully",
                authService.getCurrentUser(userDetails.getUsername()));
    }
}
