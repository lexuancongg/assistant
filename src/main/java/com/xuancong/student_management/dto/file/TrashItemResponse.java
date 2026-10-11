package com.xuancong.student_management.dto.file;

public record TrashItemResponse(
        Long id,
        String name,
        String fileType,
        String deletedBy,    // tên người xóa
        String deletedAt,    // formatted string
        String size,
        Long folderId,
        String folderName,
        String originalLocation,
        String owner,
        String thumbnailPath
) {
    public TrashItemResponse(Long id, String name, String fileType, String deletedBy, String deletedAt, String size) {
        this(id, name, fileType, deletedBy, deletedAt, size, null, null, "Drive của tôi", deletedBy, null);
    }
}
