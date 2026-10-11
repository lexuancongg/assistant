package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.UserStarredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserStarredFileRepository extends JpaRepository<UserStarredFile, Long> {

    @Query("SELECT s.file.id FROM UserStarredFile s WHERE s.user.id = :userId")
    List<Long> findStarredFileIdsByUserId(@Param("userId") Long userId);

    Optional<UserStarredFile> findByUserIdAndFileId(Long userId, Long fileId);

    boolean existsByUserIdAndFileId(Long userId, Long fileId);

    @Modifying
    @Query("DELETE FROM UserStarredFile s WHERE s.user.id = :userId AND s.file.id = :fileId")
    void deleteByUserIdAndFileId(@Param("userId") Long userId, @Param("fileId") Long fileId);

    @Modifying
    @Query("DELETE FROM UserStarredFile s WHERE s.file.id = :fileId")
    void deleteByFileId(@Param("fileId") Long fileId);

    @Modifying
    @Query("DELETE FROM UserStarredFile s WHERE s.file.id IN :fileIds")
    void deleteByFileIdIn(@Param("fileIds") List<Long> fileIds);
}
