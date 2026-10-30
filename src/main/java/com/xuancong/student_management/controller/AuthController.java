package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.auth.*;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.entity.enums.UserStatus;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.repository.CompanyRepository;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
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

        // Đảm bảo có Company (nếu DB hoàn toàn trống thì tự tạo Company đầu tiên)
        Company company = companyRepository.findAll().stream().findFirst().orElseGet(() -> {
            Company c = new Company();
            c.setName("Enterprise AI Assistant");
            return companyRepository.save(c);
        });

        long totalUsers = userRepository.count();
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        // Người dùng đầu tiên đăng ký trên DB trống sẽ nhận quyền ADMIN
        user.setRole(totalUsers == 0 ? UserRole.ADMIN : UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setCompany(company);

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

    @org.springframework.beans.factory.annotation.Value("${google.client-id:328719666150-q2jcea6fk54u1q71soo2puql4lgvbs8i.apps.googleusercontent.com}")
    private String googleClientId;

    @PostMapping("/google-login")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            idToken = body.get("credential");
        }
        String googleAccessToken = body.get("accessToken");

        String email = null;
        String name = null;
        String avatarUrl = null;

        if (idToken != null && !idToken.isBlank()) {
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim();
                Map<?, ?> googleUser = restTemplate.getForObject(url, Map.class);
                if (googleUser != null && googleUser.get("email") != null) {
                    email = (String) googleUser.get("email");
                    name = (String) googleUser.get("name");
                    avatarUrl = (String) googleUser.get("picture");
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } else if (googleAccessToken != null && !googleAccessToken.isBlank()) {
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setBearerAuth(googleAccessToken.trim());
                org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
                ResponseEntity<Map> response = restTemplate.exchange(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        org.springframework.http.HttpMethod.GET,
                        entity,
                        Map.class
                );
                Map<?, ?> googleUser = response.getBody();
                if (googleUser != null && googleUser.get("email") != null) {
                    email = (String) googleUser.get("email");
                    name = (String) googleUser.get("name");
                    avatarUrl = (String) googleUser.get("picture");
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } else {
            email = body.get("email");
            name = body.getOrDefault("name", "");
            avatarUrl = body.getOrDefault("avatarUrl", "");
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String normalizedEmail = email.trim().toLowerCase();
        final String resolvedName = (name != null && !name.isBlank()) ? name.trim() : normalizedEmail.split("@")[0];
        final String resolvedAvatarUrl = avatarUrl;

        User user = userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
            Company company = companyRepository.findAll().stream().findFirst().orElseGet(() -> {
                Company c = new Company();
                c.setName("Enterprise AI Assistant");
                return companyRepository.save(c);
            });

            User newUser = new User();
            newUser.setEmail(normalizedEmail);
            newUser.setName(resolvedName);
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(userRepository.count() == 0 ? UserRole.ADMIN : UserRole.USER);
            newUser.setStatus(UserStatus.ACTIVE);
            newUser.setCompany(company);
            if (resolvedAvatarUrl != null && !resolvedAvatarUrl.isBlank()) {
                newUser.setAvatarUrl(resolvedAvatarUrl);
            }
            return userRepository.save(newUser);
        });

        if (user.getStatus() == UserStatus.LOCKED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String accessToken = jwtService.createAccessToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());

        return ResponseEntity.ok(new AuthResponse(
                user.getId(), user.getName(), user.getEmail(),
                accessToken, refreshToken.getToken(),
                "ROLE_" + user.getRole().name()));
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

        User principalUser = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        User user = (principalUser != null && principalUser.getId() != null)
                ? userRepository.findById(principalUser.getId()).orElse(principalUser)
                : principalUser;

        String deptName = (user != null && user.getDepartment() != null) ? user.getDepartment().getName() : "";
        String roleName = (user != null && user.getRole() != null) ? user.getRole().name() : "";
        String userName = user != null ? user.getName() : "";
        String userEmail = user != null ? user.getEmail() : "";

        return ResponseEntity.ok(new AuthenticationInfo(
                new UserAuthenticationInfo(userName, userEmail, roleName, deptName),
                true));
    }
}
