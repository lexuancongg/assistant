package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.AiTokenUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface AiTokenUsageRepository extends JpaRepository<AiTokenUsage, Long> {

    void deleteByMessage_IdIn(Collection<Long> messageIds);
    @Query("SELECT COALESCE(SUM(u.totalTokens), 0) FROM AiTokenUsage u WHERE u.company.id = :companyId")
    long sumTotalTokensByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT COALESCE(SUM(u.costUsd), 0) FROM AiTokenUsage u WHERE u.company.id = :companyId")
    BigDecimal sumCostUsdByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT COALESCE(SUM(u.totalTokens), 0) FROM AiTokenUsage u WHERE u.company.id = :companyId AND u.createdAt >= :after")
    long sumTotalTokensByCompanyIdAndCreatedAtAfter(@Param("companyId") Long companyId, @Param("after") Instant after);
}
