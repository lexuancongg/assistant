package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.department.*;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.Department;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.repository.DepartmentRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentManagementService {

    private static final Long DEFAULT_COMPANY_ID = 1L;

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public List<DepartmentResponse> getAll() {
        List<Department> departments = departmentRepository.findByCompanyId(DEFAULT_COMPANY_ID);
        // Với mỗi department, lấy danh sách user thuộc phòng ban đó
        List<User> allUsers = userRepository.findAll();
        return departments.stream()
                .map(dept -> toResponse(dept, allUsers))
                .toList();
    }

    public DepartmentResponse create(DepartmentCreateRequest request) {
        Company company = new Company();
        company.setId(DEFAULT_COMPANY_ID);

        Department dept = new Department();
        dept.setName(request.name().trim());
        dept.setCompany(company);

        return toResponse(departmentRepository.save(dept), List.of());
    }

    public DepartmentResponse addMember(UUID deptId, DepartmentAddMemberRequest request) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setDepartment(dept);
        userRepository.save(user);

        List<User> members = userRepository.findAll().stream()
                .filter(u -> dept.getId().equals(u.getDepartment() != null ? u.getDepartment().getId() : null))
                .toList();
        return toResponse(dept, members);
    }

    public void removeMember(UUID deptId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getDepartment() != null && deptId.equals(user.getDepartment().getId())) {
            user.setDepartment(null);
            userRepository.save(user);
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private DepartmentResponse toResponse(Department dept, List<User> allUsers) {
        List<DepartmentMemberResponse> members = allUsers.stream()
                .filter(u -> u.getDepartment() != null && dept.getId().equals(u.getDepartment().getId()))
                .map(u -> new DepartmentMemberResponse(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole() != null && u.getRole().name().equals("MANAGER") ? "Trưởng phòng" : "Thành viên"
                ))
                .toList();
        return new DepartmentResponse(dept.getId(), dept.getName(), members);
    }
}
