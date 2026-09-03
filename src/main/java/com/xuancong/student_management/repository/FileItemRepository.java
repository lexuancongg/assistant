package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.FileItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface FileItemRepository extends JpaRepository<FileItem, UUID> {

    List<FileItem> findByDeletedAtIsNull();

    List<FileItem> findByDeletedAtIsNotNull();

    long countByAiIndexedTrue();

    /** File active (chưa bị xóa mềm) */
    List<FileItem> findByCompanyIdAndDeletedAtIsNull(Long companyId);

    /** File trong thùng rác */
    List<FileItem> findByCompanyIdAndDeletedAtIsNotNull(Long companyId);

    /** Đếm file active */
    long countByCompanyIdAndDeletedAtIsNull(Long companyId);

    /** Tổng dung lượng file active */
    @Query("SELECT COALESCE(SUM(f.sizeBytes), 0) FROM FileItem f WHERE f.company.id = :companyId AND f.deletedAt IS NULL")
    long sumSizeByCompanyId(Long companyId);

    /** Đếm file đã AI index */
    long countByCompanyIdAndDeletedAtIsNullAndAiIndexed(Long companyId, boolean aiIndexed);
}
