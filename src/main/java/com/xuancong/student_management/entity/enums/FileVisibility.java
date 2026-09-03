package com.xuancong.student_management.entity.enums;

public enum FileVisibility {
    PRIVATE,      // chỉ chủ sở hữu/người upload
    RESTRICTED,   // theo bảng file_permissions (department/role/user)
    COMPANY       // toàn bộ nhân viên công ty
}
