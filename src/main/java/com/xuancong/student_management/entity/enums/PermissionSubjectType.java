package com.xuancong.student_management.entity.enums;

/**
 * Đối tượng được cấp quyền truy cập 1 file/folder.
 * DEPARTMENT: mọi user thuộc phòng ban này đều có quyền (không cần liệt kê từng người)
 * ROLE: mọi user có vai trò này (VD: tất cả Manager)
 * USER: 1 người dùng cụ thể (dùng cho ngoại lệ)
 */
public enum PermissionSubjectType {
    DEPARTMENT,
    ROLE,
    USER
}
