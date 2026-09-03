package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.auth.*;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.entity.enums.UserStatus;
import com.xuancong.student_management.repository.UserRepository;
import com.xuancong.student_management.security.CustomUserDetails;
import com.xuancong.student_management.security.JwtService;
import com.xuancong.student_management.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (userRepository.findByEmail(request.email().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        // Lấy companyId = 1L mặc định cho MVP (company đầu tiên trong hệ thống)
        var companyRef = new com.xuancong.student_management.entity.Company();
        companyRef.setId(1L);

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setCompany(companyRef);

        user = userRepository.save(user);

        String accessToken = jwtService.createAccessToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new AuthResponse(user.getId(), user.getName(), user.getEmail(),
                        accessToken, refreshToken.getToken(),
                        "ROLE_" + user.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        String identifier = request.getLoginIdentifier();
        if (identifier == null || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            identifier,
                            request.password()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();

            String accessToken = jwtService.createAccessToken(user);
            var refreshToken = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());

            return ResponseEntity.ok(new AuthResponse(
                    user.getId(), user.getName(), user.getEmail(),
                    accessToken, refreshToken.getToken(),
                    "ROLE_" + user.getRole().name()));

        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails cd) {
            refreshTokenService.deleteByUser(cd.getUser());
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest request) {
        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        var tokenOpt = refreshTokenService.findByToken(request.refreshToken())
                .filter(t -> !Boolean.TRUE.equals(t.getRevoked()))
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()));

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var token = tokenOpt.get();
        User user = token.getUser();

        refreshTokenService.revoke(token);
        var newRefresh = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());
        String accessToken = jwtService.createAccessToken(user);

        return ResponseEntity.ok(new AuthResponse(
                user.getId(), user.getName(), user.getEmail(),
                accessToken, newRefresh.getToken(),
                "ROLE_" + user.getRole().name()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthenticationInfo> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof CustomUserDetails;

        if (!isAuthenticated) {
            return ResponseEntity.ok(new AuthenticationInfo(null, false));
        }

        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        return ResponseEntity.ok(new AuthenticationInfo(
                new UserAuthenticationInfo(user.getName(), user.getEmail()),
                true));
    }
}
