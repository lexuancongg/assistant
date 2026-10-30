package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.user.ChangePasswordRequest;
import com.xuancong.student_management.dto.user.UpdateProfileRequest;
import com.xuancong.student_management.dto.user.UserCreateRequest;
import com.xuancong.student_management.dto.user.UserResponse;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.entity.enums.UserStatus;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final Long DEFAULT_COMPANY_ID = 1L;

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3FileService s3FileService;

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse create(UserCreateRequest request) {
        if (userRepository.findByEmail(request.email().trim().toLowerCase()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại");
        }

        Company company = companyRepository.findById(DEFAULT_COMPANY_ID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCompany(company);
        user.setRole(parseRole(request.role()));
        user.setStatus(UserStatus.ACTIVE);

        return toResponse(userRepository.save(user));
    }

    public UserResponse updateStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(UserStatus.valueOf(status.toUpperCase()));
        return toResponse(userRepository.save(user));
    }

    public UserResponse getProfile(User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
        return toResponse(user);
    }

    public UserResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }

        return toResponse(userRepository.save(user));
    }

    public String uploadAvatar(User currentUser, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tệp tải lên không được để trống");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        String avatarUrl;
        try {
            avatarUrl = s3FileService.uploadFile(file);
        } catch (Exception e) {
            log.warn("S3 upload failed for avatar, fallback to base64 data URI: {}", e.getMessage());
            try {
                String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
                String base64 = Base64.getEncoder().encodeToString(file.getBytes());
                avatarUrl = "data:" + contentType + ";base64," + base64;
            } catch (IOException ioException) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đọc tệp hình ảnh");
            }
        }

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }

    public void changePassword(User currentUser, ChangePasswordRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        if (request.currentPassword() == null || request.currentPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mật khẩu hiện tại");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác");
        }

        if (request.newPassword() == null || request.newPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu xác nhận không khớp với mật khẩu mới");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UserResponse toResponse(User u) {
        String initial = u.getName() != null && !u.getName().isEmpty()
                ? String.valueOf(u.getName().charAt(0)).toUpperCase()
                : "?";
        String departmentName = u.getDepartment() != null ? u.getDepartment().getName() : null;
        return new UserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole() != null ? u.getRole().name() : "USER",
                u.getStatus() != null ? u.getStatus().name() : "ACTIVE",
                initial,
                u.getAvatarUrl(),
                departmentName
        );
    }

    private UserRole parseRole(String role) {
        if (role == null) return UserRole.USER;
        try {
            return UserRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UserRole.USER;
        }
    }
}
