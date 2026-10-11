package com.xuancong.student_management.entity.enums;

public enum FileVisibility {
    INHERIT,      // Kế thừa quyền từ thư mục cha (mặc định)
    RESTRICTED,   // Giới hạn riêng (ngắt kế thừa, chỉ theo bảng file_permissions)
    PRIVATE,      // Chỉ chủ sở hữu/người upload
    COMPANY       // Toàn bộ nhân viên công ty
}
