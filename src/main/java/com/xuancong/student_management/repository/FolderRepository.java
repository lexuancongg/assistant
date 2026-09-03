package com.xuancong.student_management.repository;


import com.xuancong.student_management.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FolderRepository extends JpaRepository<Folder, Long> {
}