package com.xuancong.student_management.listener;

import com.xuancong.student_management.model.BaseAuditEntity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.data.auditing.AuditingHandler;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
@Configurable
public class CustomAuditingListener extends AuditingEntityListener {
    public CustomAuditingListener(ObjectFactory<AuditingHandler> handler) {
        super.setAuditingHandler(handler);

    }
    @PrePersist
    public void prePersist(Object entity) {
        BaseAuditEntity baseAuditEntity= (BaseAuditEntity) entity;
        if(baseAuditEntity.getCreatedBy()==null){
            super.touchForCreate(baseAuditEntity);
        }else {
            if(baseAuditEntity.getLastUpdatedBy()== null){
                baseAuditEntity.setLastUpdatedBy(baseAuditEntity.getCreatedBy());
            }
        }
    }


    @PreUpdate
    public void touchForUpdate(Object target) {
        BaseAuditEntity baseAuditEntity = (BaseAuditEntity) target;
        if(baseAuditEntity.getLastUpdatedBy() == null){
            super.touchForUpdate(target);
        }


    }


}
