package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.FileItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FileItemRepository extends JpaRepository<FileItem, Long> {

    List<FileItem> findByDeletedAtIsNull();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"uploadedBy", "folder", "ownerDepartment", "tags"})
    List<FileItem> findWithDetailsByDeletedAtIsNullOrderByCreatedAtDesc();

    List<FileItem> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<FileItem> findByDeletedAtIsNotNull();

    List<FileItem> findByFolderId(Long folderId);

    long countByAiIndexedTrue();

    /** Kiểm tra trùng tên file trong cùng thư mục (chưa bị xóa) */
    boolean existsByCompanyIdAndFolderIdAndNameIgnoreCaseAndDeletedAtIsNull(Long companyId, Long folderId, String name);

    /** Kiểm tra trùng tên file tại thư mục gốc (folder == null, chưa bị xóa) */
    boolean existsByCompanyIdAndFolderIsNullAndNameIgnoreCaseAndDeletedAtIsNull(Long companyId, String name);

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

    /** Lấy toàn bộ danh sách nhãn phân loại (tags) duy nhất từ các file active */
    @Query("SELECT DISTINCT t.tag FROM FileItem f JOIN f.tags t WHERE f.deletedAt IS NULL AND t.tag IS NOT NULL AND TRIM(t.tag) != '' ORDER BY t.tag ASC")
    List<String> findDistinctTags();
}
