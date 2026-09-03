package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.user.UserCreateRequest;
import com.xuancong.student_management.dto.user.UserResponse;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.entity.enums.UserStatus;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final Long DEFAULT_COMPANY_ID = 1L;

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

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

    public UserResponse updateStatus(UUID id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(UserStatus.valueOf(status.toUpperCase()));
        return toResponse(userRepository.save(user));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UserResponse toResponse(User u) {
        String initial = u.getName() != null && !u.getName().isEmpty()
                ? String.valueOf(u.getName().charAt(0)).toUpperCase()
                : "?";
        return new UserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole() != null ? u.getRole().name() : "USER",
                u.getStatus() != null ? u.getStatus().name() : "ACTIVE",
                initial
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
