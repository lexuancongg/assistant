package com.xuancong.student_management.model;

import com.xuancong.student_management.listener.CustomAuditingListener;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

    import java.time.ZonedDateTime;
    @MappedSuperclass
    @Getter
    @Setter
//    @EntityListeners(CustomAuditingListener.class)
    public class BaseAuditEntity {
        @CreationTimestamp
        private ZonedDateTime createdAt;

        @CreatedBy
        private String createdBy;

        @UpdateTimestamp
        private ZonedDateTime lastUpdatedAt;

        @LastModifiedBy
        private String lastUpdatedBy;
    }
