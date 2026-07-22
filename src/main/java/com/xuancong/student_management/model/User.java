package com.xuancong.student_management.model;


import com.xuancong.student_management.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    private String password;
    private UserStatus status;
    private String email;
    private String phone;



    @ManyToOne
    private Role role;

}
