package com.xuancong.student_management.repository;


import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    @Query("SELECT COUNT(f) > 0 FROM Folder f WHERE (:company IS NULL OR f.company = :company) AND f.parent = :parent AND LOWER(TRIM(f.name)) = LOWER(TRIM(:name))")
    boolean existsByCompanyAndParentAndNameIgnoreCase(@Param("company") Company company, @Param("parent") Folder parent, @Param("name") String name);

    @Query("SELECT COUNT(f) > 0 FROM Folder f WHERE (:company IS NULL OR f.company = :company) AND f.parent IS NULL AND LOWER(TRIM(f.name)) = LOWER(TRIM(:name))")
    boolean existsByCompanyAndParentIsNullAndNameIgnoreCase(@Param("company") Company company, @Param("name") String name);

    @Query("SELECT COUNT(f) > 0 FROM Folder f WHERE (:company IS NULL OR f.company = :company) AND f.parent = :parent AND LOWER(TRIM(f.name)) = LOWER(TRIM(:name)) AND f.id <> :excludeId")
    boolean existsByCompanyAndParentAndNameIgnoreCaseAndIdNot(@Param("company") Company company, @Param("parent") Folder parent, @Param("name") String name, @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(f) > 0 FROM Folder f WHERE (:company IS NULL OR f.company = :company) AND f.parent IS NULL AND LOWER(TRIM(f.name)) = LOWER(TRIM(:name)) AND f.id <> :excludeId")
    boolean existsByCompanyAndParentIsNullAndNameIgnoreCaseAndIdNot(@Param("company") Company company, @Param("name") String name, @Param("excludeId") Long excludeId);
}