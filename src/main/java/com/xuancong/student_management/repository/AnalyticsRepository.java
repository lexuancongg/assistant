package com.xuancong.student_management.repository;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Repository
public class AnalyticsRepository {

    @PersistenceContext
    private EntityManager em;

    public List<Object[]> findContractMonthlyTotals(LocalDate fromDate) {
        Instant fromInstant = fromDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        String sql = "SELECT to_char(created_at, 'YYYY-MM') as period, " +
                "COALESCE(SUM(size_bytes), 0) as total, " +
                "COUNT(*) as cnt " +
                "FROM files " +
                "WHERE deleted_at IS NULL AND created_at >= :fromInstant " +
                "GROUP BY to_char(created_at, 'YYYY-MM') " +
                "ORDER BY period";
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromInstant", fromInstant);
        @SuppressWarnings("unchecked")
        List<Object[]> result = q.getResultList();
        List<Object[]> out = new ArrayList<>();
        for (Object row : result) {
            if (row instanceof Object[] arr) {
                out.add(arr);
            }
        }
        return out;
    }
}
