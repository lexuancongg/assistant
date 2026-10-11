package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"department", "company"})
    Optional<User> findByEmail(String email);

    @Override
    @EntityGraph(attributePaths = {"department", "company"})
    Optional<User> findById(Long id);

    List<User> findByDepartmentId(Long departmentId);
}