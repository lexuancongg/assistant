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
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Nghiệp vụ Enterprise: Nếu hệ thống đã khởi tạo Admin thì vô hiệu hóa tự do đăng ký
        if (userRepository.count() > 0) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Đăng ký công khai đã bị vô hiệu hóa. Tài khoản phải do Quản trị viên cấp trong hệ thống."
            ));
        }
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Họ tên không được để trống."));
        }
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống."));
        }
        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu không được để trống."));
        }

        if (userRepository.findByEmail(request.email().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email đã tồn tại trong hệ thống."));
        }

        // Đảm bảo có Company (nếu DB hoàn toàn trống thì tự tạo Company đầu tiên)
        Company company = companyRepository.findAll().stream().findFirst().orElseGet(() -> {
            Company c = new Company();
            c.setName("Enterprise AI Assistant");
            return companyRepository.save(c);
        });

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        // Người dùng đầu tiên đăng ký trên DB trống sẽ nhận quyền ADMIN
        user.setRole(UserRole.ADMIN);
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
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String identifier = request.getLoginIdentifier();
        if (identifier == null || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập tài khoản và mật khẩu."));
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

            if (user.getStatus() == UserStatus.LOCKED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ."
                ));
            }

            String accessToken = jwtService.createAccessToken(user);
            var refreshToken = refreshTokenService.createRefreshToken(user, jwtService.calculateRefreshTokenExpiry());

            return ResponseEntity.ok(new AuthResponse(
                    user.getId(), user.getName(), user.getEmail(),
                    accessToken, refreshToken.getToken(),
                    "ROLE_" + user.getRole().name()));

        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Tài khoản hoặc mật khẩu không chính xác."
            ));
        }
    }

    private static final org.springframework.web.client.RestTemplate GOOGLE_REST_TEMPLATE = new org.springframework.web.client.RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${google.client-id:328719666150-q2jcea6fk54u1q71soo2puql4lgvbs8i.apps.googleusercontent.com}")
    private String googleClientId;

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
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
                String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim();
                Map<?, ?> googleUser = GOOGLE_REST_TEMPLATE.getForObject(url, Map.class);
                if (googleUser != null && googleUser.get("email") != null) {
                    email = (String) googleUser.get("email");
                    name = (String) googleUser.get("name");
                    avatarUrl = (String) googleUser.get("picture");
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "Xác thực token Google không thành công hoặc phiên đăng nhập đã hết hạn."
                ));
            }
        } else if (googleAccessToken != null && !googleAccessToken.isBlank()) {
            try {
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setBearerAuth(googleAccessToken.trim());
                org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
                ResponseEntity<Map> response = GOOGLE_REST_TEMPLATE.exchange(
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
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "Không thể lấy thông tin người dùng từ Google API."
                ));
            }
        } else {
            // Không chấp nhận request nếu không có token xác thực từ Google
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", "Thiếu Google Token để xác thực danh tính."
            ));
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Không tìm thấy thông tin email từ Google."
            ));
        }

        String normalizedEmail = email.trim().toLowerCase();
        final String resolvedName = (name != null && !name.isBlank()) ? name.trim() : normalizedEmail.split("@")[0];
        final String resolvedAvatarUrl = avatarUrl;

        java.util.Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            // Nếu có avatar từ Google và hồ sơ hiện tại chưa có thì cập nhật
            if (resolvedAvatarUrl != null && !resolvedAvatarUrl.isBlank() &&
                    (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(resolvedAvatarUrl);
                user = userRepository.save(user);
            }
        } else {
            // Trường hợp DB hoàn toàn trống (setup lần đầu): Cho phép tài khoản Google đầu tiên làm ADMIN khởi tạo
            if (userRepository.count() == 0) {
                Company company = companyRepository.findAll().stream().findFirst().orElseGet(() -> {
                    Company c = new Company();
                    c.setName("Enterprise AI Assistant");
                    return companyRepository.save(c);
                });

                User newUser = new User();
                newUser.setEmail(normalizedEmail);
                newUser.setName(resolvedName);
                newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                newUser.setRole(UserRole.ADMIN);
                newUser.setStatus(UserStatus.ACTIVE);
                newUser.setCompany(company);
                if (resolvedAvatarUrl != null && !resolvedAvatarUrl.isBlank()) {
                    newUser.setAvatarUrl(resolvedAvatarUrl);
                }
                user = userRepository.save(newUser);
            } else {
                // CHUẨN NGHIỆP VỤ DOANH NGHIỆP: Email chưa được Quản trị viên cấp trong hệ thống -> Từ chối 403
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Tài khoản Google (" + normalizedEmail + ") chưa được Quản trị viên cấp quyền trong hệ thống. Vui lòng liên hệ Admin để được cấp tài khoản."
                ));
            }
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ."
            ));
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
