package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.auth.AuthResponse;
import com.xuancong.student_management.dto.auth.LoginRequest;
import com.xuancong.student_management.dto.auth.RegisterRequest;
import com.xuancong.student_management.dto.auth.RefreshTokenRequest;
import com.xuancong.student_management.enums.UserStatus;
import com.xuancong.student_management.model.Role;
import com.xuancong.student_management.model.User;
import com.xuancong.student_management.repository.RoleRepository;
import com.xuancong.student_management.repository.UserRepository;
import com.xuancong.student_management.security.JwtService;
import com.xuancong.student_management.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        if (request.username() == null || request.username().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (userRepository.findByUsername(request.username().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ROLE_USER")
                        .description("Default user role")
                        .build()));

        User user = User.builder()
                .username(request.username().trim())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .status(UserStatus.ACTIVE)
                .role(userRole)
                .build();

        user = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), null, null, user.getRole().getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        if (request.username() == null || request.username().isBlank() || request.password() == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username().trim(), request.password())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));

            String accessToken = jwtService.createAccessToken(user);
            var refreshToken = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());

            return ResponseEntity.ok(new AuthResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    accessToken,
                    refreshToken.getToken(),
                    user.getRole() != null ? user.getRole().getName() : "ROLE_USER"
            ));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            userRepository.findByUsername(authentication.getName()).ifPresent(refreshTokenService::deleteByUser);
        }

        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest request) {
        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            return ResponseEntity.badRequest().<AuthResponse>build();
        }

        var refreshTokenOptional = refreshTokenService.findByToken(request.refreshToken())
                .filter(token -> !Boolean.TRUE.equals(token.getRevoked()))
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()));

        if (refreshTokenOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build();
        }

        var token = refreshTokenOptional.get();
        User user = token.getUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build();
        }

        refreshTokenService.revoke(token);
        var newRefreshToken = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());
        String accessToken = jwtService.createAccessToken(user);

        return ResponseEntity.ok(new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                accessToken,
                newRefreshToken.getToken(),
                user.getRole() != null ? user.getRole().getName() : "ROLE_USER"
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));

        return ResponseEntity.ok(new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                null,
                null,
                user.getRole() != null ? user.getRole().getName() : "ROLE_USER"
        ));
    }
}
