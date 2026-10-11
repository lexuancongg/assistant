package com.xuancong.student_management.dto.file;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import java.util.List;
import java.util.UUID;
public record FilePermissionUpdateRequest(String visibility, List<FilePermissionItemRequest> permissions) { public record FilePermissionItemRequest(PermissionSubjectType subjectType, Long subjectId, PermissionLevel level) {} }
