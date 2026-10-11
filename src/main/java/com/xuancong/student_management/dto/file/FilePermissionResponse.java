package com.xuancong.student_management.dto.file;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import java.time.Instant;
import java.util.UUID;
public record FilePermissionResponse(Long id, Long fileId, PermissionSubjectType subjectType, Long subjectId, String subjectName, String subjectDetail, PermissionLevel level, Instant createdAt) {}
